import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.BCRYPT_ROUNDS = "4";

vi.mock("../db/pool.js", () => ({ query: vi.fn(), withTransaction: vi.fn() }));
vi.mock("../db/redis.js", () => ({
  default: { get: vi.fn().mockResolvedValue(null) },
  PREFIXES: { userSession: "us:" },
}));
vi.mock("../utils/logger.js", () => ({ appLog: vi.fn().mockResolvedValue() }));

const { query } = await import("../db/pool.js");
const { getEffectivePermissions, default: usersRouter } = await import("./users.js");

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

// authenticate() always does one query for the user row — queue it first,
// then whatever the route handler itself queries.
function mockAuthUser(user) {
  query.mockResolvedValueOnce({ rows: [user] });
}

const admin = { id: "admin1", email: "admin@x.com", display_name: "Admin", role: "admin", is_active: true, avatar_color: "#fff" };
const owner = { id: "owner1", email: "owner@x.com", display_name: "Owner", role: "owner", is_active: true, avatar_color: "#fff" };
const viewer = { id: "u1", email: "u1@x.com", display_name: "U1", role: "viewer", is_active: true, avatar_color: "#fff" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getEffectivePermissions", () => {
  it("gives owners the wildcard permission", async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // groups
      .mockResolvedValueOnce({ rows: [] }); // individual overrides
    const perms = await getEffectivePermissions("owner1", "owner");
    expect(perms).toEqual(["*"]);
  });

  it("starts from the role's base permission set", async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
    const perms = await getEffectivePermissions("u1", "viewer");
    expect(perms).toEqual(["maps.view"]);
  });

  it("adds permissions granted by group membership", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ permissions: { "llm.use": true } }] })
      .mockResolvedValueOnce({ rows: [] });
    const perms = await getEffectivePermissions("u1", "viewer");
    expect(perms).toContain("llm.use");
    expect(perms).toContain("maps.view");
  });

  it("lets a group permission REMOVE a role's base permission", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ permissions: { "maps.view": false } }] })
      .mockResolvedValueOnce({ rows: [] });
    const perms = await getEffectivePermissions("u1", "viewer");
    expect(perms).not.toContain("maps.view");
  });

  it("applies individual overrides after group permissions (last word wins)", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ permissions: { "llm.use": false } }] })
      .mockResolvedValueOnce({ rows: [{ permission: "llm.use", granted: true }] });
    const perms = await getEffectivePermissions("u1", "viewer");
    expect(perms).toContain("llm.use");
  });
});

describe("PATCH /api/users/me — setting-gated self-update", () => {
  it("rejects a display_name change when allow_username_change is off", async () => {
    mockAuthUser(viewer);
    query
      .mockResolvedValueOnce({ rows: [{ value: "false" }] }) // allow_username_change
      .mockResolvedValueOnce({ rows: [{ value: "false" }] }) // allow_email_change
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })  // allow_password_change
      .mockResolvedValueOnce({ rows: [{ value: "true" }] }); // allow_avatar_change
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${tokenFor(viewer.id)}`)
      .send({ display_name: "New Name" });
    expect(res.status).toBe(403);
  });

  it("allows a display_name change when the setting is on", async () => {
    mockAuthUser(viewer);
    query
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })
      .mockResolvedValueOnce({ rows: [{ value: "false" }] })
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })
      .mockResolvedValueOnce({ rows: [{ id: viewer.id, email: viewer.email, display_name: "New Name", role: "viewer", avatar_color: "#fff" }] });
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${tokenFor(viewer.id)}`)
      .send({ display_name: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.user.display_name).toBe("New Name");
  });

  it("rejects a password change with the wrong current_password", async () => {
    mockAuthUser(viewer);
    const bcrypt = (await import("bcryptjs")).default;
    const realHash = await bcrypt.hash("actual-password", 4);
    query
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })
      .mockResolvedValueOnce({ rows: [{ value: "false" }] })
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })
      .mockResolvedValueOnce({ rows: [{ value: "true" }] })
      .mockResolvedValueOnce({ rows: [{ password_hash: realHash }] });
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${tokenFor(viewer.id)}`)
      .send({ password: "new-password-123", current_password: "wrong-guess" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Current password is incorrect");
  });
});

describe("POST /api/users — admin create user", () => {
  it("lets an admin create an editor/viewer", async () => {
    mockAuthUser(admin);
    query.mockResolvedValueOnce({
      rows: [{ id: "new1", email: "new@x.com", display_name: "New", role: "editor", is_active: true, avatar_color: "#fff" }],
    });
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ email: "new@x.com", display_name: "New", password: "password123", role: "editor" });
    expect(res.status).toBe(201);
  });

  it("refuses a non-owner admin creating another admin", async () => {
    mockAuthUser(admin);
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ email: "new@x.com", display_name: "New", password: "password123", role: "admin" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Only owner can create admin users");
  });

  it("lets an owner create another admin", async () => {
    mockAuthUser(owner);
    query.mockResolvedValueOnce({
      rows: [{ id: "new2", email: "new2@x.com", display_name: "New2", role: "admin", is_active: true, avatar_color: "#fff" }],
    });
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${tokenFor(owner.id)}`)
      .send({ email: "new2@x.com", display_name: "New2", password: "password123", role: "admin" });
    expect(res.status).toBe(201);
  });

  it("is blocked entirely for a non-admin role (requireRole)", async () => {
    mockAuthUser(viewer);
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${tokenFor(viewer.id)}`)
      .send({ email: "new@x.com", display_name: "New", password: "password123", role: "viewer" });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/users/:id — role-assignment guard", () => {
  it("refuses a non-owner admin assigning the owner role", async () => {
    mockAuthUser(admin);
    const res = await request(app)
      .patch(`/api/users/${viewer.id}`)
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ role: "owner" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Only owner can assign owner role");
  });

  it("refuses a non-self, non-admin update entirely", async () => {
    mockAuthUser(viewer); // viewer trying to edit someone else
    const res = await request(app)
      .patch(`/api/users/some-other-user`)
      .set("Authorization", `Bearer ${tokenFor(viewer.id)}`)
      .send({ display_name: "Hacked" });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/users/:id", () => {
  it("refuses to let a user delete themselves", async () => {
    mockAuthUser(owner);
    const res = await request(app)
      .delete(`/api/users/${owner.id}`)
      .set("Authorization", `Bearer ${tokenFor(owner.id)}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cannot delete yourself");
  });

  it("requires owner role, not just admin", async () => {
    mockAuthUser(admin);
    const res = await request(app)
      .delete(`/api/users/${viewer.id}`)
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/users/settings/global — allowlist enforcement", () => {
  it("rejects an unrecognized setting key", async () => {
    mockAuthUser(admin);
    const res = await request(app)
      .patch("/api/users/settings/global")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ not_a_real_setting: "true" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not_a_real_setting");
    expect(query).toHaveBeenCalledTimes(1); // only the auth lookup — never reached the DB write
  });

  it("accepts a mix where every key is allowlisted", async () => {
    mockAuthUser(admin);
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch("/api/users/settings/global")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ max_maps_per_user: "10" });
    expect(res.status).toBe(200);
  });

  it("rejects the request if even one key in a mixed batch is unknown", async () => {
    mockAuthUser(admin);
    const res = await request(app)
      .patch("/api/users/settings/global")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ max_maps_per_user: "10", bogus_key: "x" });
    expect(res.status).toBe(400);
  });
});

describe("Groups CRUD (admin only)", () => {
  it("creates a group", async () => {
    mockAuthUser(admin);
    query.mockResolvedValueOnce({
      rows: [{ id: "g1", name: "Ops", description: "", color: "#6C63FF", permissions: {} }],
    });
    const res = await request(app)
      .post("/api/users/groups")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ name: "Ops" });
    expect(res.status).toBe(201);
    expect(res.body.group.name).toBe("Ops");
  });

  it("is blocked for non-admins", async () => {
    mockAuthUser(viewer);
    const res = await request(app)
      .post("/api/users/groups")
      .set("Authorization", `Bearer ${tokenFor(viewer.id)}`)
      .send({ name: "Ops" });
    expect(res.status).toBe(403);
  });
});
