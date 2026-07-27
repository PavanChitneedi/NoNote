import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_ACCESS_SECRET = "test-access-secret";

vi.mock("../db/pool.js", () => ({ query: vi.fn() }));
vi.mock("../db/redis.js", () => ({
  default: { get: vi.fn().mockResolvedValue(null) },
  PREFIXES: { userSession: "us:" },
}));

const { query } = await import("../db/pool.js");
const { default: integrationsRouter } = await import("./integrations.js");

const app = express();
app.use(express.json());
app.use("/api/integrations", integrationsRouter);

const user = { id: "u1", email: "u1@x.com", display_name: "U1", role: "editor", is_active: true, avatar_color: "#fff" };
const token = jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
const mockAuthUser = () => query.mockResolvedValueOnce({ rows: [user] });

// These tests deliberately don't reach the actual proxy network calls
// (go() uses Node's raw https/http modules, not fetch — expensive to mock
// for comparatively low value here). What matters most is that every
// route rejects bad input BEFORE making any outbound request, which is
// exactly what's tested: the same isValidToken/isSafeUrl guards already
// unit-tested in integrations.test.js are actually wired into every route.

describe("POST /api/integrations/proxmox — validation gates", () => {
  it("requires both url and token", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/proxmox")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://192.168.1.10:8006" });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed token before contacting the host", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/proxmox")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://192.168.1.10:8006", token: "a\nb" }); // non-printable-ASCII
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid token format");
  });

  it("rejects an unsafe URL (loopback) before contacting the host", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/proxmox")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "http://127.0.0.1:8006", token: "valid-looking-token-1234" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid or disallowed URL");
  });
});

describe("POST /api/integrations/truenas — validation gates", () => {
  it("rejects a malformed token", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/truenas")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://192.168.1.20", token: "ab" }); // too short
    expect(res.status).toBe(400);
  });
});

describe("POST /api/integrations/unraid — validation gates", () => {
  it("rejects an unsafe URL", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/unraid")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "http://169.254.169.254/", token: "valid-looking-token-1234" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/integrations/esxi — validation gates", () => {
  it("requires url, username, AND password (no token concept here)", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/esxi")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://192.168.1.30", username: "admin" }); // missing password
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("password");
  });

  it("rejects an unsafe URL", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/esxi")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "http://backend:3001", username: "admin", password: "pw" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/integrations/probe — validation gates", () => {
  it("requires a url", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/probe")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("rejects an unsafe URL", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/integrations/probe")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "http://localhost/" });
    expect(res.status).toBe(400);
  });
});

describe("Auth requirement", () => {
  it("blocks unauthenticated requests to any integration route", async () => {
    const res = await request(app).post("/api/integrations/probe").send({ url: "https://example.com" });
    expect(res.status).toBe(401);
  });
});
