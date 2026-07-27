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

const { query } = await import("../db/pool.js");
const { isProbeUrlSafe, buildSystemPrompt, default: llmRouter } = await import("./llm.js");

const app = express();
app.use(express.json());
app.use("/api/llm", llmRouter);

const user = { id: "u1", email: "u1@x.com", display_name: "U1", role: "editor", is_active: true, avatar_color: "#fff" };
const tokenFor = (id) => jwt.sign({ sub: id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
const mockAuthUser = () => query.mockResolvedValueOnce({ rows: [user] });

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.query.mockResolvedValue({ rows: [] });
  vi.stubGlobal("fetch", vi.fn());
});

describe("isProbeUrlSafe", () => {
  it("blocks cloud metadata addresses", () => {
    expect(isProbeUrlSafe("http://169.254.169.254/")).toBe(false);
  });

  it("blocks named Docker-internal hosts", () => {
    expect(isProbeUrlSafe("http://backend:3001/")).toBe(false);
    expect(isProbeUrlSafe("http://postgres:5432/")).toBe(false);
  });

  it("blocks non-http(s) protocols", () => {
    expect(isProbeUrlSafe("file:///etc/passwd")).toBe(false);
  });

  it("allows localhost — this endpoint is specifically for probing local Ollama/LM Studio", () => {
    expect(isProbeUrlSafe("http://localhost:11434/")).toBe(true);
  });

  it("allows LAN and public addresses", () => {
    expect(isProbeUrlSafe("http://192.168.1.50:11434/")).toBe(true);
    expect(isProbeUrlSafe("https://api.openai.com/")).toBe(true);
  });

  it("rejects unparseable URLs", () => {
    expect(isProbeUrlSafe("not a url")).toBe(false);
  });
});

describe("buildSystemPrompt", () => {
  it("returns a generic prompt with no context", () => {
    expect(buildSystemPrompt(null)).toContain("helpful assistant");
  });

  it("builds a focused prompt for node-level chat", () => {
    const prompt = buildSystemPrompt({
      node_context: { title: "Router", type: "network-device", properties: { ip: "192.168.1.1" }, notes: "Main gateway" },
      mapTitle: "Home Lab",
    });
    expect(prompt).toContain("Router");
    expect(prompt).toContain("network-device");
    expect(prompt).toContain("Home Lab");
    expect(prompt).toContain("Main gateway");
  });

  it("truncates long node notes to MAX_NOTES (120 chars)", () => {
    const longNote = "x".repeat(500);
    const prompt = buildSystemPrompt({ node_context: { title: "N", type: "t", notes: longNote } });
    expect(prompt).toContain("x".repeat(120) + "...");
    expect(prompt).not.toContain("x".repeat(200));
  });

  it("caps full-canvas node lists to MAX_NODES (30) and reports the omitted count", () => {
    const nodes = Array.from({ length: 35 }, (_, i) => ({ id: `n${i}`, title: `Node ${i}`, type: "server" }));
    const prompt = buildSystemPrompt({ nodes, edges: [], mapTitle: "Big Map" });
    expect(prompt).toContain("35 nodes");
    expect(prompt).toContain("5 omitted");
    expect(prompt).not.toContain("Node 34"); // beyond the cap
  });

  it("includes edge labels when present", () => {
    const nodes = [{ id: "a", title: "A", type: "t" }, { id: "b", title: "B", type: "t" }];
    const prompt = buildSystemPrompt({ nodes, edges: [{ from: "a", to: "b", label: "VPN" }], mapTitle: "M" });
    expect(prompt).toContain("A->B:VPN");
  });
});

describe("GET /api/llm/presets", () => {
  it("lists provider preset keys", async () => {
    mockAuthUser();
    const res = await request(app).get("/api/llm/presets").set("Authorization", `Bearer ${tokenFor(user.id)}`);
    expect(res.status).toBe(200);
    expect(res.body.presets).toEqual(expect.arrayContaining(["openai", "anthropic", "ollama"]));
  });
});

describe("POST /api/llm/providers", () => {
  it("rejects an unknown provider key", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/llm/providers")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ name: "Test", provider: "not-a-real-provider", model: "x" });
    expect(res.status).toBe(400);
  });

  it("unsets other defaults before inserting a new default provider", async () => {
    mockAuthUser();
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // UPDATE ... is_default=false
      .mockResolvedValueOnce({ rows: [{ id: "p1", name: "Test", provider: "openai", base_url: "https://api.openai.com/v1", model: "gpt-4o", is_default: true }] });
    const res = await request(app)
      .post("/api/llm/providers")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ name: "Test", provider: "openai", model: "gpt-4o", is_default: true });
    expect(res.status).toBe(201);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("SET is_default=false"),
      [user.id]
    );
  });
});

describe("PATCH /api/llm/providers/:id", () => {
  it("returns 404 for a provider not owned by the requester", async () => {
    mockAuthUser();
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // ownership check finds nothing
    const res = await request(app)
      .patch("/api/llm/providers/other-users-provider")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ name: "Hacked" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/llm/providers/:id", () => {
  it("returns 404 when nothing was deleted (not found or not owned)", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rowCount: 0 });
    const res = await request(app)
      .delete("/api/llm/providers/nonexistent")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`);
    expect(res.status).toBe(404);
  });

  it("succeeds when a row was deleted", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(app)
      .delete("/api/llm/providers/p1")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/llm/conversations/:id/chat", () => {
  it("rejects an empty message", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "   " });
    expect(res.status).toBe(400);
  });

  it("rejects a message over the length cap", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "x".repeat(12001) });
    expect(res.status).toBe(400);
  });

  it("rejects an oversized canvas_context", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "hi", canvas_context: { blob: "x".repeat(50001) } });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a conversation that doesn't exist or isn't the user's", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "hi" });
    expect(res.status).toBe(404);
  });

  it("returns 502 when the LLM provider call fails", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({
        rows: [{ id: "c1", provider: "openai", base_url: "https://api.openai.com/v1", model: "gpt-4o", api_key_enc: null, model_override: null }],
      })
      .mockResolvedValueOnce({ rows: [] }); // history
    fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => "server error" });
    const res = await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "hi" });
    expect(res.status).toBe(502);
  });

  it("on success, saves both messages and returns the assistant reply", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({
        rows: [{ id: "c1", provider: "openai", base_url: "https://api.openai.com/v1", model: "gpt-4o", api_key_enc: null, model_override: null }],
      })
      .mockResolvedValueOnce({ rows: [] }); // history
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Hello back!" } }], usage: { total_tokens: 42 } }),
    });

    const res = await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "hi" });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe("Hello back!");
    expect(res.body.tokens).toBe(42);
    const userMsgInsert = mockClient.query.mock.calls.find(([sql]) => sql.includes("'user'"));
    expect(userMsgInsert).toBeTruthy();
    const assistantMsgInsert = mockClient.query.mock.calls.find(([sql]) => sql.includes("'assistant'"));
    expect(assistantMsgInsert[1]).toEqual(["c1", "Hello back!", 42]);
  });

  it("respects the model_override when set", async () => {
    mockAuthUser();
    query
      .mockResolvedValueOnce({
        rows: [{ id: "c1", provider: "openai", base_url: "https://api.openai.com/v1", model: "gpt-3.5", api_key_enc: null, model_override: "gpt-4-turbo" }],
      })
      .mockResolvedValueOnce({ rows: [] });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: "ok" } }] }) });

    await request(app)
      .post("/api/llm/conversations/c1/chat")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "hi" });

    const [, options] = fetch.mock.calls[0];
    expect(JSON.parse(options.body).model).toBe("gpt-4-turbo");
  });
});

describe("POST /api/llm/export-interpret", () => {
  it("returns 404 when the user has no LLM provider configured", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/llm/export-interpret")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "interpret this" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/llm/workflow-audit", () => {
  it("rejects a message over the 16000-char cap", async () => {
    mockAuthUser();
    const res = await request(app)
      .post("/api/llm/workflow-audit")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "x".repeat(16001) });
    expect(res.status).toBe(400);
  });

  it("returns 502 when the LLM response isn't valid JSON", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({
      rows: [{ provider: "openai", base_url: "https://api.openai.com/v1", model: "gpt-4o", api_key_enc: null }],
    });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: "not json at all" } }] }) });
    const res = await request(app)
      .post("/api/llm/workflow-audit")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "audit my tasks" });
    expect(res.status).toBe(502);
  });

  it("parses valid JSON findings, stripping markdown fences", async () => {
    mockAuthUser();
    query.mockResolvedValueOnce({
      rows: [{ provider: "openai", base_url: "https://api.openai.com/v1", model: "gpt-4o", api_key_enc: null }],
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "```json\n{\"findings\":[{\"task\":\"backups\"}]}\n```" } }] }),
    });
    const res = await request(app)
      .post("/api/llm/workflow-audit")
      .set("Authorization", `Bearer ${tokenFor(user.id)}`)
      .send({ message: "audit my tasks" });
    expect(res.status).toBe(200);
    expect(res.body.findings).toEqual([{ task: "backups" }]);
  });
});
