import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import bcrypt from "bcryptjs";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.BCRYPT_ROUNDS = "4"; // keep tests fast — ROUNDS is read at module load below

const mockClient = { query: vi.fn().mockResolvedValue({ rows: [] }) };

vi.mock("../db/pool.js", () => ({
  query: vi.fn(),
  withTransaction: vi.fn(async (fn) => fn(mockClient)),
}));
vi.mock("../db/redis.js", () => ({
  default: { get: vi.fn(), setex: vi.fn() },
  PREFIXES: { userSession: "us:" },
}));
vi.mock("../utils/logger.js", () => ({ appLog: vi.fn().mockResolvedValue() }));

const { query, withTransaction } = await import("../db/pool.js");
const { default: redis } = await import("../db/redis.js");
const { default: authRouter } = await import("./auth.js");

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.query.mockResolvedValue({ rows: [] });
});

describe("POST /api/auth/login", () => {
  it("rejects invalid request bodies before touching the DB", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an unknown email with a generic error (no user enumeration)", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("rejects a wrong password", async () => {
    const hash = await bcrypt.hash("correct-password", 4);
    query.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", display_name: "A", password_hash: hash, role: "viewer", is_active: true, avatar_color: "#fff" }],
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects a correct password for a deactivated account", async () => {
    const hash = await bcrypt.hash("correct-password", 4);
    query.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", display_name: "A", password_hash: hash, role: "viewer", is_active: false, avatar_color: "#fff" }],
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "correct-password" });
    expect(res.status).toBe(401);
  });

  it("logs in successfully and returns tokens + user, storing a refresh token", async () => {
    const hash = await bcrypt.hash("correct-password", 4);
    query.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", display_name: "A", password_hash: hash, role: "editor", is_active: true, avatar_color: "#fff" }],
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "correct-password" });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeTruthy();
    expect(res.body.refresh_token).toBeTruthy();
    expect(res.body.user).toEqual(
      expect.objectContaining({ id: "u1", email: "a@b.com", role: "editor" })
    );
    expect(withTransaction).toHaveBeenCalled();
    // refresh_tokens insert + last_login_at update, both via the transaction client
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO refresh_tokens"),
      expect.any(Array)
    );
  });

  it("returns a generic config-error message (not a stack trace) if JWT secrets are missing", async () => {
    const hash = await bcrypt.hash("correct-password", 4);
    query.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", display_name: "A", password_hash: hash, role: "viewer", is_active: true, avatar_color: "#fff" }],
    });
    const original = process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "correct-password" });
    process.env.JWT_ACCESS_SECRET = original;
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Server configuration error — contact admin");
  });
});

describe("POST /api/auth/register", () => {
  it("refuses registration when REGISTRATION_OPEN is not 'true'", async () => {
    delete process.env.REGISTRATION_OPEN;
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123", display_name: "New" });
    expect(res.status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });

  it("creates a new viewer-role user when registration is open", async () => {
    process.env.REGISTRATION_OPEN = "true";
    query.mockResolvedValueOnce({
      rows: [{ id: "u2", email: "new@example.com", display_name: "New", role: "viewer", avatar_color: "#6C63FF" }],
    });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123", display_name: "New" });
    delete process.env.REGISTRATION_OPEN;
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("viewer");
    expect(res.body.access_token).toBeTruthy();
  });

  it("returns 409 on a duplicate email (unique violation)", async () => {
    process.env.REGISTRATION_OPEN = "true";
    query.mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: "23505" }));
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dupe@example.com", password: "password123", display_name: "Dupe" });
    delete process.env.REGISTRATION_OPEN;
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/refresh", () => {
  it("rejects a missing refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a syntactically invalid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: "not-a-jwt" });
    expect(res.status).toBe(401);
  });

  it("rejects a valid-JWT refresh token with no matching stored hash", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ sub: "u1", jti: "x" }, process.env.JWT_REFRESH_SECRET);
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: token });
    expect(res.status).toBe(401);
  });

  it("rotates the token on a valid refresh (old revoked, new issued)", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ sub: "u1", jti: "x" }, process.env.JWT_REFRESH_SECRET);
    const storedHash = await bcrypt.hash(token, 4);
    query.mockResolvedValueOnce({
      rows: [{ id: "rt1", token_hash: storedHash, revoked_at: null, user_id: "u1", role: "editor", is_active: true }],
    });
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: token });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeTruthy();
    expect(res.body.refresh_token).toBeTruthy();
    expect(res.body.refresh_token).not.toBe(token);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("SET revoked_at=NOW()"),
      ["rt1"]
    );
  });

  it("rejects a refresh token belonging to a deactivated user", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ sub: "u1", jti: "x" }, process.env.JWT_REFRESH_SECRET);
    const storedHash = await bcrypt.hash(token, 4);
    query.mockResolvedValueOnce({
      rows: [{ id: "rt1", token_hash: storedHash, revoked_at: null, user_id: "u1", role: "editor", is_active: false }],
    });
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: token });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });

  it("blocklists the access token in redis and revokes refresh tokens", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const accessToken = jwt.sign({ sub: "u1" }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    redis.get.mockResolvedValue(null); // not blocklisted yet (authenticate's own check)
    query
      .mockResolvedValueOnce({ rows: [{ id: "u1", email: "a@b.com", display_name: "A", role: "editor", is_active: true, avatar_color: "#fff" }] }) // authenticate's user lookup
      .mockResolvedValueOnce({ rows: [] }); // the revoke UPDATE

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(redis.setex).toHaveBeenCalledWith(expect.stringContaining("blocked:"), expect.any(Number), "1");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE refresh_tokens SET revoked_at=NOW()"),
      ["u1"]
    );
  });
});

describe("GET /api/auth/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const accessToken = jwt.sign({ sub: "u1" }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    redis.get.mockResolvedValue(null);
    query.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", display_name: "A", role: "editor", is_active: true, avatar_color: "#fff" }],
    });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe("u1");
  });
});
