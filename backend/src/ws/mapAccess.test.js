import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/pool.js", () => ({ query: vi.fn() }));

const { query } = await import("../db/pool.js");
const { checkMapAccess } = await import("./mapAccess.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkMapAccess", () => {
  it("rejects a missing or inactive user", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const result = await checkMapAccess("u1", "m1");
    expect(result).toEqual({
      ok: false,
      message: "User not found or disabled",
      closeCode: 1008,
      closeReason: "Unauthorized",
    });
  });

  it("rejects a deactivated user even if the row exists", async () => {
    query.mockResolvedValueOnce({
      rows: [{ role: "editor", display_name: "A", is_active: false }],
    });
    const result = await checkMapAccess("u1", "m1");
    expect(result.ok).toBe(false);
    expect(result.message).toBe("User not found or disabled");
  });

  it("grants owner/admin global access without a map query", async () => {
    query.mockResolvedValueOnce({
      rows: [{ role: "admin", display_name: "Admin User", is_active: true }],
    });
    const result = await checkMapAccess("u1", "m1");
    expect(result).toEqual({ ok: true, userName: "Admin User" });
    expect(query).toHaveBeenCalledTimes(1); // no second query for owner/admin
  });

  it("falls back to 'User' when display_name is empty", async () => {
    query.mockResolvedValueOnce({
      rows: [{ role: "owner", display_name: null, is_active: true }],
    });
    const result = await checkMapAccess("u1", "m1");
    expect(result).toEqual({ ok: true, userName: "User" });
  });

  it("returns 'Map not found' when the map doesn't exist", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ role: "editor", display_name: "A", is_active: true }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await checkMapAccess("u1", "m1");
    expect(result).toEqual({
      ok: false,
      message: "Map not found",
      closeCode: 1008,
      closeReason: "Forbidden",
    });
  });

  it("allows the map owner", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ role: "editor", display_name: "A", is_active: true }] })
      .mockResolvedValueOnce({ rows: [{ owner_id: "u1", permission: null, is_public: false }] });
    const result = await checkMapAccess("u1", "m1");
    expect(result).toEqual({ ok: true, userName: "A" });
  });

  it("allows a collaborator with an explicit permission row", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ role: "editor", display_name: "A", is_active: true }] })
      .mockResolvedValueOnce({
        rows: [{ owner_id: "someone-else", permission: "viewer", is_public: false }],
      });
    const result = await checkMapAccess("u2", "m1");
    expect(result).toEqual({ ok: true, userName: "A" });
  });

  it("allows access to a public map with no explicit permission", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ role: "editor", display_name: "A", is_active: true }] })
      .mockResolvedValueOnce({
        rows: [{ owner_id: "someone-else", permission: null, is_public: true }],
      });
    const result = await checkMapAccess("u2", "m1");
    expect(result).toEqual({ ok: true, userName: "A" });
  });

  it("rejects a non-owner, non-collaborator on a private map", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ role: "editor", display_name: "A", is_active: true }] })
      .mockResolvedValueOnce({
        rows: [{ owner_id: "someone-else", permission: null, is_public: false }],
      });
    const result = await checkMapAccess("u2", "m1");
    expect(result).toEqual({
      ok: false,
      message: "No access to this map",
      closeCode: 1008,
      closeReason: "Forbidden",
    });
  });

  it("lets a DB error propagate rather than swallowing it", async () => {
    query.mockRejectedValueOnce(new Error("connection lost"));
    await expect(checkMapAccess("u1", "m1")).rejects.toThrow("connection lost");
  });
});
