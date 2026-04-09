import { Router } from "express";
import { body, validationResult } from "express-validator";
import { query, withTransaction } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const router = Router();

const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// ── Supported provider presets ────────────────────────────────
const PROVIDER_PRESETS = {
  openai:    { base_url: "https://api.openai.com/v1",               chat_path: "/chat/completions",  auth: "bearer" },
  anthropic: { base_url: "https://api.anthropic.com/v1",            chat_path: "/messages",          auth: "x-api-key" },
  gemini:    { base_url: "https://generativelanguage.googleapis.com/v1beta", chat_path: "/models/{model}:generateContent", auth: "query" },
  groq:      { base_url: "https://api.groq.com/openai/v1",          chat_path: "/chat/completions",  auth: "bearer" },
  mistral:   { base_url: "https://api.mistral.ai/v1",               chat_path: "/chat/completions",  auth: "bearer" },
  ollama:    { base_url: "http://localhost:11434/v1",                chat_path: "/chat/completions",  auth: "none" },
  custom:    { base_url: "",                                         chat_path: "/chat/completions",  auth: "bearer" },
};

// ── GET /api/llm/presets ──────────────────────────────────────
router.get("/presets", authenticate, (req, res) => {
  res.json({ presets: Object.keys(PROVIDER_PRESETS) });
});

// ── GET /api/llm/providers ────────────────────────────────────
router.get("/providers", authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, provider, base_url, model, is_default, created_at
       FROM llm_providers WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    // Never return api_key_enc
    res.json({ providers: rows });
  } catch (err) {
    console.error("[llm] list providers error:", err);
    res.status(500).json({ error: "Failed to fetch providers" });
  }
});

// ── POST /api/llm/providers ───────────────────────────────────
router.post(
  "/providers",
  authenticate,
  [
    body("name").trim().isLength({ min: 1, max: 80 }),
    body("provider").isIn(Object.keys(PROVIDER_PRESETS)),
    body("model").trim().isLength({ min: 1, max: 120 }),
    body("base_url").optional().trim(),
    body("api_key").optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, provider, model, api_key, is_default = false } = req.body;
      const preset  = PROVIDER_PRESETS[provider];
      const base_url = req.body.base_url || preset.base_url;
      const enc_key  = api_key ? encrypt(api_key) : null;

      await withTransaction(async (client) => {
        if (is_default) {
          await client.query(
            "UPDATE llm_providers SET is_default=false WHERE user_id=$1",
            [req.user.id]
          );
        }
        const { rows } = await client.query(
          `INSERT INTO llm_providers (user_id, name, provider, base_url, model, api_key_enc, is_default)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, provider, base_url, model, is_default`,
          [req.user.id, name, provider, base_url, model, enc_key, is_default]
        );
        res.status(201).json({ provider: rows[0] });
      });
    } catch (err) {
      console.error("[llm] create provider error:", err);
      res.status(500).json({ error: "Failed to create provider" });
    }
  }
);

// ── PATCH /api/llm/providers/:id ──────────────────────────────
router.patch("/providers/:id", authenticate, async (req, res) => {
  try {
    const { name, model, api_key, base_url, is_default } = req.body;

    await withTransaction(async (client) => {
      // Verify ownership
      const own = await client.query(
        "SELECT id FROM llm_providers WHERE id=$1 AND user_id=$2",
        [req.params.id, req.user.id]
      );
      if (!own.rows[0]) return res.status(404).json({ error: "Not found" });

      if (is_default) {
        await client.query(
          "UPDATE llm_providers SET is_default=false WHERE user_id=$1",
          [req.user.id]
        );
      }

      const enc_key = api_key ? encrypt(api_key) : undefined;

      await client.query(
        `UPDATE llm_providers SET
           name       = COALESCE($2, name),
           model      = COALESCE($3, model),
           base_url   = COALESCE($4, base_url),
           api_key_enc = COALESCE($5, api_key_enc),
           is_default = COALESCE($6, is_default)
         WHERE id=$1`,
        [req.params.id, name, model, base_url, enc_key, is_default]
      );

      const { rows } = await client.query(
        "SELECT id, name, provider, base_url, model, is_default FROM llm_providers WHERE id=$1",
        [req.params.id]
      );
      res.json({ provider: rows[0] });
    });
  } catch (err) {
    console.error("[llm] update provider error:", err);
    res.status(500).json({ error: "Failed to update provider" });
  }
});

// ── DELETE /api/llm/providers/:id ────────────────────────────
router.delete("/providers/:id", authenticate, async (req, res) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM llm_providers WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete provider" });
  }
});

// ── GET /api/llm/maps/:mapId/conversations ────────────────────
router.get("/maps/:mapId/conversations", authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              p.name as provider_name, p.model, p.provider
       FROM llm_conversations c
       JOIN llm_providers p ON p.id = c.provider_id
       WHERE c.map_id=$1 AND c.user_id=$2
       ORDER BY c.updated_at DESC`,
      [req.params.mapId, req.user.id]
    );
    res.json({ conversations: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ── POST /api/llm/maps/:mapId/conversations ───────────────────
router.post("/maps/:mapId/conversations", authenticate, async (req, res) => {
  try {
    const { provider_id, title = "New Chat" } = req.body;
    // Verify provider belongs to user
    const p = await query(
      "SELECT id FROM llm_providers WHERE id=$1 AND user_id=$2",
      [provider_id, req.user.id]
    );
    if (!p.rows[0]) return res.status(404).json({ error: "Provider not found" });

    const { rows } = await query(
      `INSERT INTO llm_conversations (map_id, user_id, provider_id, title)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.mapId, req.user.id, provider_id, title]
    );
    res.status(201).json({ conversation: rows[0] });
  } catch (err) {
    console.error("[llm] create conv error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ── GET /api/llm/conversations/:id/messages ───────────────────
router.get("/conversations/:id/messages", authenticate, async (req, res) => {
  try {
    const conv = await query(
      "SELECT * FROM llm_conversations WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (!conv.rows[0]) return res.status(404).json({ error: "Not found" });

    const { rows } = await query(
      "SELECT id, role, content, tokens_used, created_at FROM llm_messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ── POST /api/llm/conversations/:id/chat ──────────────────────
// The key endpoint — proxies to the LLM, stores history
router.post("/conversations/:id/chat", authenticate, async (req, res) => {
  const { message, canvas_context } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });

  try {
    // Fetch conversation + provider (with key)
    const convRes = await query(
      `SELECT c.*, p.provider, p.base_url, p.model, p.api_key_enc
       FROM llm_conversations c
       JOIN llm_providers p ON p.id = c.provider_id
       WHERE c.id=$1 AND c.user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!convRes.rows[0]) return res.status(404).json({ error: "Conversation not found" });

    const conv = convRes.rows[0];
    const apiKey = conv.api_key_enc ? decrypt(conv.api_key_enc) : null;

    // Load history
    const histRes = await query(
      "SELECT role, content FROM llm_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 40",
      [req.params.id]
    );
    const history = histRes.rows;

    // Build system prompt with canvas context
    const systemPrompt = buildSystemPrompt(canvas_context);

    // Save user message
    await query(
      "INSERT INTO llm_messages (conversation_id, role, content) VALUES ($1,'user',$2)",
      [req.params.id, message]
    );

    // Proxy to LLM
    let assistantContent, tokensUsed;
    try {
      const result = await callLLM({
        provider:   conv.provider,
        base_url:   conv.base_url,
        model:      conv.model,
        api_key:    apiKey,
        system:     systemPrompt,
        history,
        message,
      });
      assistantContent = result.content;
      tokensUsed       = result.tokens;
    } catch (llmErr) {
      console.error("[llm] provider error:", llmErr.message);
      return res.status(502).json({ error: `LLM error: ${llmErr.message}` });
    }

    // Save assistant reply + update conversation timestamp
    await withTransaction(async (client) => {
      await client.query(
        "INSERT INTO llm_messages (conversation_id, role, content, tokens_used) VALUES ($1,'assistant',$2,$3)",
        [req.params.id, assistantContent, tokensUsed]
      );
      await client.query(
        "UPDATE llm_conversations SET updated_at=NOW(), title=COALESCE(NULLIF(title,'New Chat'),LEFT($2,60)) WHERE id=$1",
        [req.params.id, message]
      );
    });

    res.json({ content: assistantContent, tokens: tokensUsed });
  } catch (err) {
    console.error("[llm] chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// ── DELETE /api/llm/conversations/:id ────────────────────────
router.delete("/conversations/:id", authenticate, async (req, res) => {
  try {
    await query(
      "DELETE FROM llm_conversations WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// ── LLM proxy helper ──────────────────────────────────────────
async function callLLM({ provider, base_url, model, api_key, system, history, message }) {
  const messages = [
    ...history.filter(m => m.role !== "system"),
    { role: "user", content: message },
  ];

  // Anthropic uses a different message format
  if (provider === "anthropic") {
    return callAnthropic({ base_url, model, api_key, system, messages });
  }

  // Gemini has its own format
  if (provider === "gemini") {
    return callGemini({ base_url, model, api_key, system, messages });
  }

  // OpenAI-compatible (openai, groq, mistral, ollama, custom)
  return callOpenAICompat({ base_url, model, api_key, system, messages });
}

async function callOpenAICompat({ base_url, model, api_key, system, messages }) {
  const url  = `${base_url.replace(/\/$/, "")}/chat/completions`;
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      ...messages,
    ],
    max_tokens: 2048,
    temperature: 0.7,
  };

  const headers = { "Content-Type": "application/json" };
  if (api_key) headers["Authorization"] = `Bearer ${api_key}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    tokens:  data.usage?.total_tokens,
  };
}

async function callAnthropic({ base_url, model, api_key, system, messages }) {
  const url  = `${base_url.replace(/\/$/, "")}/messages`;
  const body = {
    model,
    max_tokens: 2048,
    system,
    messages: messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": api_key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    content: data.content?.[0]?.text || "",
    tokens:  data.usage?.input_tokens + data.usage?.output_tokens,
  };
}

async function callGemini({ base_url, model, api_key, system, messages }) {
  const url = `${base_url.replace(/\/$/, "")}/models/${model}:generateContent?key=${api_key}`;
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    tokens:  data.usageMetadata?.totalTokenCount,
  };
}

// ── System prompt builder ─────────────────────────────────────
function buildSystemPrompt(ctx) {
  if (!ctx) {
    return "You are a helpful assistant integrated with NodeMap, a mind mapping and architecture diagramming tool.";
  }

  const { nodes = [], edges = [], mapTitle = "Untitled Map" } = ctx;

  let prompt = `You are an expert assistant integrated with NodeMap — a mind mapping, architecture, and diagramming tool.

The user is currently working on a map called: "${mapTitle}"

## Current Canvas State

### Nodes (${nodes.length} total)\n`;

  // Group by category
  const groups = {};
  nodes.forEach(n => {
    const cat = n.category || n.type || "general";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(n);
  });

  Object.entries(groups).forEach(([cat, ns]) => {
    prompt += `\n**${cat.toUpperCase()}**\n`;
    ns.forEach(n => {
      prompt += `- **${n.title}** [${n.type}]`;
      const props = Object.entries(n.properties || {}).filter(([,v]) => v);
      if (props.length) {
        prompt += `: ${props.map(([k,v]) => `${k}=${v}`).join(", ")}`;
      }
      if (n.notes) prompt += ` | Notes: ${n.notes}`;
      prompt += "\n";
    });
  });

  if (edges.length > 0) {
    prompt += `\n### Relationships (${edges.length} connections)\n`;
    edges.forEach(e => {
      const from = nodes.find(n => n.id === e.from);
      const to   = nodes.find(n => n.id === e.to);
      if (from && to) {
        const rel = e.label ? `"${e.label}"` : e.style === "bidirectional" ? "communicates with" : "connects to";
        prompt += `- **${from.title}** → **${to.title}**: ${rel}\n`;
      }
    });
  }

  prompt += `\n## Your Role
Help the user understand, improve, and extend this architecture/map.
You can:
- Analyze the design and identify issues or improvements
- Suggest missing components or connections
- Answer questions about specific nodes
- Generate documentation or explanations
- Review security, scalability, or best practices
- Help plan the next steps

Be concise and specific. Reference node names directly when relevant.`;

  return prompt;
}

export default router;
