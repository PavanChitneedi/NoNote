import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({ query: vi.fn() }));
vi.mock("../db/redis.js", () => ({
  default: { get: vi.fn() },
  PREFIXES: { userSession: "us:" },
}));

const { query } = await import("../db/pool.js");
const { default: redis } = await import("../db/redis.js");
const { authenticate, requireRole, mapPermission } = await import("./auth.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = "test-secret";
});

describe("requireRole", () => {
  it("allows a role at or above the minimum", () => {
    const req = { user: { role: "owner" } };
    const res = mockRes();
    const next = vi.fn();
    requireRole("admin")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a role below the minimum", () => {
    const req = { user: { role: "viewer" } };
    const res = mockRes();
    const next = vi.fn();
    requireRole("editor")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("fails closed when req.user is missing", () => {
    const req = {};
    const res = mockRes();
    const next = vi.fn();
    requireRole("viewer")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("fails closed for an unrecognized minRole instead of silently passing", () => {
    // ROLE_HIERARCHY has no entry for a typo'd role — required defaults to 99,
    // so nobody should ever pass this check, not even an owner.
    const req = { user: { role: "owner" } };
    const res = mockRes();
    const next = vi.fn();
    requireRole("ovner")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("authenticate", () => {
  const signToken = (sub) => jwt.sign({ sub }, process.env.JWT_ACCESS_SECRET);

  it("rejects a request with no Authorization header", async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired token", async () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } };
    const res = mockRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });

  it("rejects a token that's been revoked (blocklisted in redis)", async () => {
    const token = signToken("user-1");
    redis.get.mockResolvedValue("1");
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token revoked" });
  });

  it("rejects a token for a disabled or missing user", async () => {
    const token = signToken("user-1");
    redis.get.mockResolvedValue(null);
    query.mockResolvedValue({ rows: [] });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found or disabled" });
  });

  it("attaches req.user and calls next() for a valid, active user", async () => {
    const token = signToken("user-1");
    redis.get.mockResolvedValue(null);
    query.mockResolvedValue({
      rows: [{ id: "user-1", email: "a@b.com", role: "editor", is_active: true }],
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(
      expect.objectContaining({ id: "user-1", role: "editor" })
    );
  });
});

describe("mapPermission", () => {
  it("lets owners/admins through without a DB check", async () => {
    const req = { user: { id: "u1", role: "admin" }, params: { mapId: "m1" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("editor");
    await fn(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("allows the map owner regardless of requested permission level", async () => {
    query.mockResolvedValue({ rows: [{ owner_id: "u1", permission: null }] });
    const req = { user: { id: "u1", role: "editor" }, params: { mapId: "m1" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("owner");
    await fn(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.mapPerm).toBe("owner");
  });

  it("allows a collaborator whose permission meets the requirement", async () => {
    query.mockResolvedValue({
      rows: [{ owner_id: "someone-else", permission: "editor" }],
    });
    const req = { user: { id: "u2", role: "editor" }, params: { mapId: "m1" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("viewer");
    await fn(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects a collaborator whose permission is below the requirement", async () => {
    query.mockResolvedValue({
      rows: [{ owner_id: "someone-else", permission: "viewer" }],
    });
    const req = { user: { id: "u2", role: "editor" }, params: { mapId: "m1" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("editor");
    await fn(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("falls back to is_public for viewer access when there's no explicit permission", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ owner_id: "someone-else", permission: null }] })
      .mockResolvedValueOnce({ rows: [{ is_public: true }] });
    const req = { user: { id: "u2", role: "editor" }, params: { mapId: "m1" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("viewer");
    await fn(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects access to a non-public map with no explicit permission", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ owner_id: "someone-else", permission: null }] })
      .mockResolvedValueOnce({ rows: [{ is_public: false }] });
    const req = { user: { id: "u2", role: "editor" }, params: { mapId: "m1" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("viewer");
    await fn(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 404 when the map doesn't exist", async () => {
    query.mockResolvedValue({ rows: [] });
    const req = { user: { id: "u2", role: "editor" }, params: { mapId: "missing" } };
    const res = mockRes();
    const next = vi.fn();
    const fn = await mapPermission("viewer");
    await fn(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
