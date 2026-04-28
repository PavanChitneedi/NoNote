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
  // OpenAI
  openai:      { base_url: "https://api.openai.com/v1",                    chat_path: "/chat/completions",             auth: "bearer" },
  // Anthropic Claude
  anthropic:   { base_url: "https://api.anthropic.com/v1",                 chat_path: "/messages",                     auth: "x-api-key" },
  // Google Gemini
  gemini:      { base_url: "https://generativelanguage.googleapis.com/v1beta", chat_path: "/models/{model}:generateContent", auth: "query" },
  // Groq (ultra-fast inference — OpenAI-compat)
  groq:        { base_url: "https://api.groq.com/openai/v1",               chat_path: "/chat/completions",             auth: "bearer" },
  // Mistral AI
  mistral:     { base_url: "https://api.mistral.ai/v1",                    chat_path: "/chat/completions",             auth: "bearer" },
  // Perplexity AI
  perplexity:  { base_url: "https://api.perplexity.ai",                    chat_path: "/chat/completions",             auth: "bearer" },
  // xAI Grok
  xai:         { base_url: "https://api.x.ai/v1",                          chat_path: "/chat/completions",             auth: "bearer" },
  // DeepSeek
  deepseek:    { base_url: "https://api.deepseek.com/v1",                  chat_path: "/chat/completions",             auth: "bearer" },
  // Cohere
  cohere:      { base_url: "https://api.cohere.com/v2",                    chat_path: "/chat",                         auth: "bearer",  format: "cohere" },
  // Together AI
  together:    { base_url: "https://api.together.xyz/v1",                  chat_path: "/chat/completions",             auth: "bearer" },
  // Azure OpenAI (Copilot backend)
  azure:       { base_url: "https://{resource}.openai.azure.com/openai/deployments/{deployment}", chat_path: "/chat/completions?api-version=2024-10-21", auth: "azure" },
  // Hugging Face Inference
  huggingface: { base_url: "https://api-inference.huggingface.co/models",  chat_path: "/{model}",                      auth: "bearer",  format: "hf" },
  // Ollama (local)
  ollama:      { base_url: "http://localhost:11434/v1",                     chat_path: "/chat/completions",             auth: "none" },
  // LM Studio (local OpenAI-compat)
  lmstudio:    { base_url: "http://localhost:1234/v1",                      chat_path: "/chat/completions",             auth: "none" },
  // OpenRouter (gateway to 300+ models)
  openrouter:  { base_url: "https://openrouter.ai/api/v1",                 chat_path: "/chat/completions",             auth: "bearer" },
  // Custom / any OpenAI-compatible API
  custom:      { base_url: "",                                              chat_path: "/chat/completions",             auth: "bearer" },
};

// ── GET /api/llm/presets ──────────────────────────────────────
router.get("/presets", authenticate, (req, res) => {
  res.json({ presets: Object.keys(PROVIDER_PRESETS) });
});

// ── GET /api/llm/probe-models — discover models from a local/remote provider
// Used for Ollama auto-discovery. Query: ?base_url=http://localhost:11434
router.get("/probe-models", authenticate, async (req, res) => {
  const { base_url } = req.query;
  if (!base_url) return res.status(400).json({ error: "base_url required" });
  try {
    // Ollama: GET /api/tags
    const ollamaUrl = base_url.replace(/\/v1\/?$/, "") + "/api/tags";
    const resp = await fetch(ollamaUrl, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error("Ollama not reachable");
    const data = await resp.json();
    const models = (data.models || []).map(m => m.name || m.model).filter(Boolean);
    return res.json({ models, source: "ollama" });
  } catch {
    try {
      // OpenAI-compatible: GET /models
      const openaiUrl = base_url.replace(/\/?$/, "") + "/models";
      const resp = await fetch(openaiUrl, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) throw new Error("Models endpoint not reachable");
      const data = await resp.json();
      const models = (data.data || data.models || []).map(m => m.id || m.name).filter(Boolean);
      return res.json({ models, source: "openai" });
    } catch {
      return res.status(503).json({ error: "Provider unreachable or does not expose model list" });
    }
  }
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
    body("provider").isIn(Object.keys(PROVIDER_PRESETS)).withMessage("Unknown provider"),
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
    const { node_id } = req.query;
    const { rows } = await query(
      `SELECT c.id, c.title, c.created_at, c.updated_at, c.node_id,
              p.name as provider_name, p.model, p.provider
       FROM llm_conversations c
       JOIN llm_providers p ON p.id = c.provider_id
       WHERE c.map_id=$1 AND c.user_id=$2
         AND ($3::text IS NULL OR c.node_id = $3)
       ORDER BY c.updated_at DESC`,
      [req.params.mapId, req.user.id, node_id || null]
    );
    res.json({ conversations: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ── POST /api/llm/maps/:mapId/conversations ───────────────────
router.post("/maps/:mapId/conversations", authenticate, async (req, res) => {
  try {
    const { provider_id, title = "New Chat", node_id = null } = req.body;
    // Verify provider belongs to user
    const p = await query(
      "SELECT id FROM llm_providers WHERE id=$1 AND user_id=$2",
      [provider_id, req.user.id]
    );
    if (!p.rows[0]) return res.status(404).json({ error: "Provider not found" });

    const { rows } = await query(
      `INSERT INTO llm_conversations (map_id, user_id, provider_id, title, node_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.mapId, req.user.id, provider_id, title, node_id]
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
  const { message, canvas_context, node_context } = req.body;
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

    // Load history — fetch generously then trim to fit context budget
    const histRes = await query(
      "SELECT role, content FROM llm_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 60",
      [req.params.id]
    );

    // Build system prompt with canvas context
    const systemPrompt = buildSystemPrompt(node_context ? { node_context, mapTitle: canvas_context?.mapTitle } : canvas_context);

    // ── Token budget: keep total under ~6000 words (~8k tokens) ──
    // Rough heuristic: 1 token ≈ 0.75 words. Reserve 2048 for response.
    const WORD_BUDGET = 6000;
    const countWords = (s) => (s || "").split(/\s+/).length;
    let usedWords = countWords(systemPrompt) + countWords(message);
    // Walk history newest-first, include as many messages as fit
    const histAll = histRes.rows;
    const history = [];
    for (let i = histAll.length - 1; i >= 0; i--) {
      const w = countWords(histAll[i].content);
      if (usedWords + w > WORD_BUDGET) break;
      history.unshift(histAll[i]);
      usedWords += w;
    }

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

  if (provider === "anthropic") return callAnthropic({ base_url, model, api_key, system, messages });
  if (provider === "gemini")    return callGemini({ base_url, model, api_key, system, messages });
  if (provider === "cohere")    return callCohere({ base_url, model, api_key, system, messages });
  if (provider === "azure")     return callAzure({ base_url, model, api_key, system, messages });
  if (provider === "huggingface") return callHuggingFace({ base_url, model, api_key, system, messages });
  // OpenAI-compatible: openai, groq, mistral, perplexity, xai, deepseek, together, openrouter, ollama, lmstudio, custom
  return callOpenAICompat({ base_url, model, api_key, system, messages, provider });
}

async function callOpenAICompat({ base_url, model, api_key, system, messages, provider="" }) {
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
  // OpenRouter requires site identification headers
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://nonote.app";
    headers["X-Title"] = "NoNote";
  }

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
  const url = `${base_url.replace(/\/$/, "")}/models/${model}:generateContent`;
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
    headers: {
      "Content-Type": "application/json",
      // Key in header instead of URL query param to avoid logging exposure
      "x-goog-api-key": api_key,
    },
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

// ── Cohere v2 format ──────────────────────────────────────────
async function callCohere({ base_url, model, api_key, system, messages }) {
  const url = `${base_url.replace(/\/$/, "")}/chat`;
  const chatHistory = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "CHATBOT" : "USER",
    message: m.content,
  }));
  const body = {
    model,
    message: messages[messages.length - 1]?.content || "",
    chat_history: chatHistory,
    preamble: system,
    max_tokens: 2048,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${api_key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cohere ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  return { content: data.message?.content?.[0]?.text || data.text || "", tokens: data.meta?.tokens?.output_tokens };
}

// ── Azure OpenAI (Copilot-compatible) ─────────────────────────
async function callAzure({ base_url, model, api_key, system, messages }) {
  const url = `${base_url.replace(/\/$/, "")}/chat/completions?api-version=2024-10-21`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": api_key },
    body: JSON.stringify({ model, messages: [{ role:"system", content:system }, ...messages], max_tokens:2048 }),
  });
  if (!res.ok) throw new Error(`Azure ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", tokens: data.usage?.total_tokens };
}

// ── Hugging Face Inference API ─────────────────────────────────
async function callHuggingFace({ base_url, model, api_key, system, messages }) {
  // HF Inference uses the full conversation as a single prompt
  const conversation = messages.map(m => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`).join("\n");
  const prompt = `${system}\n\n${conversation}\nAssistant:`;
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${api_key}` },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 1024, return_full_text: false } }),
  });
  if (!res.ok) throw new Error(`HuggingFace ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  const text = Array.isArray(data) ? (data[0]?.generated_text || "") : (data.generated_text || "");
  return { content: text.trim(), tokens: null };
}

// ── OpenAI-compatible with provider-specific headers ──────────
// (overrides the original simpler function — add OpenRouter/Perplexity specific headers)
async function callOpenAICompatOld() {} // keep reference

// ── System prompt builder — token-optimised ──────────────────
// Target: ~600-900 tokens for canvas context, never >1200
const MAX_NODES = 30;   // hard cap
const MAX_NOTES = 120;  // chars per node note
const MAX_PROPS = 6;    // properties per node

function buildSystemPrompt(ctx) {
  if (!ctx) return "You are a helpful assistant in NoNote, a mind-mapping and architecture tool.";

  // ── Node-level chat (single node context) ──────────────────
  if (ctx.node_context) {
    const n = ctx.node_context;
    const props = Object.entries(n.properties || {})
      .filter(([,v]) => v && !Array.isArray(v) && typeof v !== 'object')
      .slice(0, MAX_PROPS)
      .map(([k,v]) => `${k}: ${String(v).slice(0,80)}`).join(', ');
    const notes = n.notes ? String(n.notes).slice(0, MAX_NOTES) + (n.notes.length > MAX_NOTES ? '…' : '') : '';
    return `You are an expert assistant for NoNote. Focused discussion about one node.
Node: ${n.title || 'Untitled'} [${n.type}]${props ? ' | ' + props : ''}${notes ? ' | Notes: ' + notes : ''}
Map: ${ctx.mapTitle || 'Untitled'}
Be concise. Troubleshoot, document, or advise on this specific component only.`;
  }

  // ── Full canvas context ─────────────────────────────────────
  const { nodes = [], edges = [], mapTitle = "Untitled" } = ctx;
  const capped = nodes.slice(0, MAX_NODES);
  const extra  = nodes.length - capped.length;

  // Build node lines — only non-empty, non-array properties
  const nodeLines = capped.map(n => {
    const props = Object.entries(n.properties || {})
      .filter(([,v]) => v && typeof v === 'string' && v.trim())
      .slice(0, MAX_PROPS)
      .map(([k,v]) => `${k}:${v.trim().slice(0,60)}`).join(' ');
    const notes = n.notes ? ' note:' + String(n.notes).slice(0, MAX_NOTES).replace(/\n/g,' ') : '';
    return `${n.title}[${n.type}]${props ? ' ' + props : ''}${notes}`;
  });

  // Build edge lines — skip IDs, only named connections or arrows
  const edgeLines = edges.slice(0, 40).map(e => {
    const from = capped.find(n => n.id === e.from)?.title || '?';
    const to   = capped.find(n => n.id === e.to)?.title   || '?';
    return e.label ? `${from}→${to}:${e.label}` : `${from}→${to}`;
  });

  const lines = [
    `NoNote assistant. Map: "${mapTitle}" (${nodes.length} nodes${extra ? `, ${extra} omitted` : ''})`,
    `NODES: ${nodeLines.join(' | ')}`,
    edgeLines.length ? `EDGES: ${edgeLines.join(', ')}` : '',
    `Help analyze, improve, document, or extend this architecture. Be specific, concise.`,
  ].filter(Boolean);

  return lines.join('\n');
}

// ── POST /api/llm/export-interpret — one-shot LLM call for export ─────
// Uses the user's default provider or first available provider
router.post("/export-interpret", authenticate, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  try {
    const { rows } = await query(
      `SELECT provider, base_url, model, api_key_enc
       FROM llm_providers WHERE user_id=$1
       ORDER BY is_default DESC, created_at ASC LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "No LLM provider configured. Add one in Settings." });
    const p = rows[0];
    const api_key = p.api_key_enc ? decrypt(p.api_key_enc) : "";
    const result = await callLLM({
      provider: p.provider, base_url: p.base_url, model: p.model,
      api_key, system: "You are a technical documentation writer. Respond only with valid JSON as instructed.",
      history: [], message,
    });
    res.json({ response: result.content });
  } catch (err) {
    console.error("[llm] export-interpret error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
