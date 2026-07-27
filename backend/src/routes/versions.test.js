import { describe, it, expect, vi, beforeEach } from "vitest";
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
const { default: versionsRouter } = await import("./versions.js");

const app = express();
app.use(express.json());
app.use("/api/maps", versionsRouter);

const admin = { id: "admin1", email: "admin@x.com", display_name: "Admin", role: "admin", is_active: true, avatar_color: "#fff" };
const tokenFor = (id) => jwt.sign({ sub: id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
const mockAuthUser = (user = admin) => query.mockResolvedValueOnce({ rows: [user] });

beforeEach(() => vi.clearAllMocks());

describe("GET /api/maps/:mapId/versions", () => {
  it("lists versions newest first", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({
      rows: [{ id: "v1", label: "Snapshot", node_count: 3, edge_count: 2, created_at: "now", saved_by: "Admin" }],
    });
    const res = await request(app)
      .get("/api/maps/m1/versions")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(200);
    expect(res.body.versions).toHaveLength(1);
  });
});

describe("POST /api/maps/:mapId/versions", () => {
  it("saves a snapshot with correct node/edge counts, then prunes old versions", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({
        rows: [{ id: "v2", label: "My Save", node_count: 2, edge_count: 1, created_at: "now" }],
      })
      .mockResolvedValueOnce({ rows: [] }); // the pruning DELETE

    const res = await request(app)
      .post("/api/maps/m1/versions")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ nodes: [{ id: "n1" }, { id: "n2" }], edges: [{ id: "e1" }], label: "My Save" });

    expect(res.status).toBe(201);
    expect(res.body.version.node_count).toBe(2);
    expect(res.body.version.edge_count).toBe(1);

    // Verify the INSERT was actually called with counts matching the arrays sent
    const insertCall = query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_versions"));
    expect(insertCall[1]).toEqual(
      expect.arrayContaining(["m1", admin.id, "My Save", JSON.stringify([{ id: "n1" }, { id: "n2" }]), JSON.stringify([{ id: "e1" }]), 2, 1])
    );

    // Verify pruning keeps only the latest 50
    const pruneCall = query.mock.calls.find(([sql]) => sql.includes("LIMIT 50"));
    expect(pruneCall).toBeTruthy();
  });

  it("defaults to empty nodes/edges and an empty label when none are sent", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ id: "v3", label: "", node_count: 0, edge_count: 0, created_at: "now" }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/maps/m1/versions")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.version.node_count).toBe(0);
  });
});

describe("GET /api/maps/:mapId/versions/:versionId", () => {
  it("returns 404 for a missing version", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get("/api/maps/m1/versions/missing")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(404);
  });

  it("returns the version with its stored nodes/edges JSON", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({
      rows: [{ id: "v1", map_id: "m1", nodes_json: [{ id: "n1" }], edges_json: [], saved_by: "Admin" }],
    });
    const res = await request(app)
      .get("/api/maps/m1/versions/v1")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(200);
    expect(res.body.nodes).toEqual([{ id: "n1" }]);
  });

  it("scopes the lookup to both versionId AND mapId (can't fetch a version via the wrong map)", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rows: [] });
    await request(app)
      .get("/api/maps/wrong-map/versions/v1")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    const selectCall = query.mock.calls.find(([sql]) => sql.includes("SELECT v.*"));
    expect(selectCall[1]).toEqual(["v1", "wrong-map"]);
  });
});

describe("DELETE /api/maps/:mapId/versions/:versionId", () => {
  it("deletes scoped to both ids", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete("/api/maps/m1/versions/v1")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(200);
    const deleteCall = query.mock.calls.find(([sql]) => sql.includes("DELETE FROM map_versions"));
    expect(deleteCall[1]).toEqual(["v1", "m1"]);
  });
});
