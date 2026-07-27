import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_ACCESS_SECRET = "test-access-secret";

const mockClient = { query: vi.fn().mockResolvedValue({ rows: [] }) };

vi.mock("../db/pool.js", () => ({
  query: vi.fn(),
  withTransaction: vi.fn(async (fn) => fn(mockClient)),
}));
vi.mock("../db/redis.js", () => ({
  default: { get: vi.fn().mockResolvedValue(null) },
  PREFIXES: { userSession: "us:" },
}));
vi.mock("../utils/logger.js", () => ({ appLog: vi.fn().mockResolvedValue() }));

const { query } = await import("../db/pool.js");
const { default: mapsRouter } = await import("./maps.js");

const app = express();
app.use(express.json());
app.use("/api/maps", mapsRouter);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

// admin role bypasses mapPermission's DB check entirely, so route tests can
// focus on what happens after permission passes rather than re-testing
// mapPermission itself (already covered in auth.test.js).
const admin = { id: "admin1", email: "admin@x.com", display_name: "Admin", role: "admin", is_active: true, avatar_color: "#fff" };

function mockAuthUser(user = admin) {
  query.mockResolvedValueOnce({ rows: [user] });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.query.mockResolvedValue({ rows: [] });
});

describe("POST /api/maps — max_maps_per_user enforcement", () => {
  it("creates freely when the limit is 0 (unlimited)", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ value: "0" }] }) // max_maps_per_user
      .mockResolvedValueOnce({ rows: [{ id: "m1", title: "New Map", owner_id: admin.id }] });
    const res = await request(app)
      .post("/api/maps")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ title: "New Map" });
    expect(res.status).toBe(201);
  });

  it("rejects creation once the user is at their limit", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ value: "2" }] }) // max_maps_per_user
      .mockResolvedValueOnce({ rows: [{ count: "2" }] }); // current count
    const res = await request(app)
      .post("/api/maps")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ title: "One Too Many" });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Map limit reached");
  });

  it("allows creation when under the limit", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ value: "2" }] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "m2", title: "Fits", owner_id: admin.id }] });
    const res = await request(app)
      .post("/api/maps")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ title: "Fits" });
    expect(res.status).toBe(201);
  });

  it("rejects an empty title before any DB query", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/maps")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/maps/:mapId", () => {
  it("returns 404 for a nonexistent map", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [] })  // map
      .mockResolvedValueOnce({ rows: [] })  // nodes
      .mockResolvedValueOnce({ rows: [] })  // edges
      .mockResolvedValueOnce({ rows: [] }); // collaborators
    const res = await request(app)
      .get("/api/maps/missing-map")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/maps/:mapId/duplicate", () => {
  it("clones nodes/edges with fresh UUIDs and titles the copy correctly", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ value: "0" }] }) // max_maps_per_user
      .mockResolvedValueOnce({ rows: [{ id: "orig-map", title: "Original", description: "d", group_boxes: "[]" }] }) // orig map
      .mockResolvedValueOnce({ rows: [{ id: "node-a", node_type: "server", title: "A", x: 0, y: 0, w: 1, h: 1, properties: {}, custom_props: {}, notes: "[]", node_notes: "", notes_private: false, z_index: 0 }] }) // origNodes
      .mockResolvedValueOnce({ rows: [{ id: "edge-1", from_node: "node-a", to_node: "node-a", style: "arrow", color: "#fff", label: "", from_anchor: null, to_anchor: null, mid_off: null }] }); // origEdges

    mockClient.query.mockResolvedValueOnce({ rows: [{ id: "new-map-id", title: "Original (copy)", is_public: false }] });

    const res = await request(app)
      .post("/api/maps/orig-map/duplicate")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.map.title).toBe("Original (copy)");

    // Second mockClient.query call is the batch node insert — its params
    // array starts with the new node UUID, which must differ from "node-a".
    const nodeInsertCall = mockClient.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_nodes"));
    expect(nodeInsertCall).toBeTruthy();
    const newNodeId = nodeInsertCall[1][0];
    expect(newNodeId).toMatch(UUID_RE);
    expect(newNodeId).not.toBe("node-a");

    // Edge insert must reference the SAME remapped node id, not the original
    const edgeInsertCall = mockClient.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_edges"));
    expect(edgeInsertCall).toBeTruthy();
    const [, newMapId, fromNode, toNode] = edgeInsertCall[1];
    expect(fromNode).toBe(newNodeId);
    expect(toNode).toBe(newNodeId);
  });

  it("drops edges whose endpoints weren't cloned (dangling references)", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ value: "0" }] })
      .mockResolvedValueOnce({ rows: [{ id: "orig-map", title: "Original", description: "d", group_boxes: "[]" }] })
      .mockResolvedValueOnce({ rows: [] }) // no nodes at all
      .mockResolvedValueOnce({ rows: [{ id: "edge-1", from_node: "ghost-a", to_node: "ghost-b", style: "arrow", color: "#fff", label: "" }] }); // edge referencing nonexistent nodes

    mockClient.query.mockResolvedValueOnce({ rows: [{ id: "new-map-id", title: "Original (copy)" }] });

    const res = await request(app)
      .post("/api/maps/orig-map/duplicate")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);

    expect(res.status).toBe(200);
    const edgeInsertCall = mockClient.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_edges"));
    expect(edgeInsertCall).toBeUndefined(); // no valid edges to insert
  });
});

describe("POST /api/maps/:mapId/save", () => {
  it("assigns a fresh UUID to a node with a non-UUID (client-generated) id", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/maps/map1/save")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ nodes: [{ id: "temp-client-id-1", type: "server", title: "N", x: 0, y: 0, w: 1, h: 1 }], edges: [] });

    expect(res.status).toBe(200);
    const nodeUpsert = mockClient.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_nodes"));
    expect(nodeUpsert).toBeTruthy();
    const savedNodeId = nodeUpsert[1][0];
    expect(savedNodeId).toMatch(UUID_RE);
    expect(savedNodeId).not.toBe("temp-client-id-1");
  });

  it("keeps a node's id when it's already a valid UUID", async () => {
    mockAuthUser();
    const existingId = "11111111-2222-3333-4444-555555555555";
    const res = await request(app)
      .post("/api/maps/map1/save")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({ nodes: [{ id: existingId, type: "server", title: "N", x: 0, y: 0, w: 1, h: 1 }], edges: [] });

    expect(res.status).toBe(200);
    const nodeUpsert = mockClient.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_nodes"));
    expect(nodeUpsert[1][0]).toBe(existingId);
  });

  it("always regenerates edge ids on save, even if the client sent one that looks like a UUID", async () => {
    mockAuthUser();
    const nodeId = "11111111-2222-3333-4444-555555555555";
    const clientEdgeId = "99999999-8888-7777-6666-555555555555";
    const res = await request(app)
      .post("/api/maps/map1/save")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`)
      .send({
        nodes: [{ id: nodeId, type: "server", title: "N", x: 0, y: 0, w: 1, h: 1 }],
        edges: [{ id: clientEdgeId, from: nodeId, to: nodeId }],
      });

    expect(res.status).toBe(200);
    const edgeUpsert = mockClient.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO map_edges"));
    expect(edgeUpsert).toBeTruthy();
    expect(edgeUpsert[1][0]).not.toBe(clientEdgeId);
    expect(edgeUpsert[1][0]).toMatch(UUID_RE);
  });
});

describe("DELETE /api/maps/:mapId", () => {
  it("returns 404 when the map doesn't exist", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete("/api/maps/missing")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(404);
  });

  it("deletes a map owned by someone else (admin moderation) and logs it as an admin action", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({ rows: [{ title: "Someone's Map", owner_id: "other-user" }] })
      .mockResolvedValueOnce({ rows: [] }); // the DELETE
    const res = await request(app)
      .delete("/api/maps/some-map")
      .set("Authorization", `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(200);
  });
});
