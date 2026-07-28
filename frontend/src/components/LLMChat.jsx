import { useState, useEffect, useRef } from "react";
import {
  getLLMProviders, getConversations, createConversation,
  deleteConversation, getMessages, sendMessage, probeLLMModels,
} from "../api/client.js";
import LLMSettings from "./LLMSettings.jsx";

const PROVIDER_ICONS = {
  openai: "🤖", anthropic: "🟣", gemini: "💎",
  groq: "⚡", mistral: "🌀", ollama: "🦙", custom: "🔧",
};

const AUTO_DISCOVER_PROVIDERS = new Set(["ollama", "lmstudio"]);

const SUGGESTED = [
  "Review this architecture for security issues",
  "What components am I missing?",
  "How does data flow through this system?",
  "Suggest scalability improvements",
  "Generate documentation for this map",
];

export default function LLMChat({ mapId, nodes, edges, mapTitle }) {
  const [providers, setProviders]         = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [showSettings, setShowSettings]   = useState(false);
  const [error, setError]                 = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel]     = useState("");
  const [probingModels, setProbingModels]      = useState(false);
  const [expanded, setExpanded]           = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const convListRef    = useRef(null);
  const abortRef       = useRef(null);   // AbortController for in-flight LLM request
  const loadMsgAbortRef = useRef(null);  // AbortController for getMessages (race condition)

  useEffect(() => {
    if (!mapId) return;
    getLLMProviders()
      .then(pData => {
        const provs = pData.providers || [];
        setProviders(provs);
        const def = provs.find(p => p.is_default) || provs[0];
        if (def) setSelectedProvider(def.id);
      })
      .catch(() => {});

    getConversations(mapId)
      .then(cData => {
        const convs = cData.conversations || [];
        setConversations(convs);
        if (convs.length > 0) openConversation(convs[0].id);
      })
      .catch(e => setError('Failed to load conversations: ' + e.message))
      .finally(() => setLoading(false));
  }, [mapId]);

  useEffect(() => {
    if (!selectedProvider || !providers.length) return;
    const prov = providers.find(p => p.id === selectedProvider);
    if (!prov || !AUTO_DISCOVER_PROVIDERS.has(prov.provider)) {
      setAvailableModels([]); setSelectedModel(""); return;
    }
    setProbingModels(true); setAvailableModels([]); setSelectedModel("");
    probeLLMModels(prov.base_url)
      .then(d => {
        const models = d.models || [];
        setAvailableModels(models);
        if (models.includes(prov.model)) setSelectedModel(prov.model);
        else if (models.length > 0) setSelectedModel(models[0]);
      })
      .catch(() => setAvailableModels([]))
      .finally(() => setProbingModels(false));
  }, [selectedProvider, providers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (id) => {
    // Cancel any in-flight message load (race condition fix)
    if (loadMsgAbortRef.current) loadMsgAbortRef.current.abort();
    const ctrl = new AbortController();
    loadMsgAbortRef.current = ctrl;

    setActiveConvId(id);
    setMessages([]);
    try {
      const d = await getMessages(id);
      if (!ctrl.signal.aborted) setMessages(d.messages || []);
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e.message);
    }
  };

  const startNewChat = async () => {
    if (!selectedProvider) { setError("Select a provider first."); return; }
    setError("");
    try {
      const prov = providers.find(p => p.id === selectedProvider);
      const model_override = (selectedModel && selectedModel !== prov?.model) ? selectedModel : null;
      const d = await createConversation(mapId, { provider_id: selectedProvider, title: "New Chat", model_override });
      setConversations(cs => [d.conversation, ...cs]);
      setActiveConvId(d.conversation.id);
      setMessages([]);
      setTimeout(() => convListRef.current?.scrollTo({ left: 0, behavior: "smooth" }), 50);
    } catch (e) { setError(e.message); }
  };

  const stopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSending(false);
    setError("");
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);
    setError("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }

    // Set up AbortController for this request
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const tempId = `temp_${Date.now()}`;
    setMessages(ms => [...ms, { id: tempId, role: "user", content: userMsg, created_at: new Date().toISOString() }]);

    try {
      const canvasContext = {
        mapTitle,
        nodes: nodes.map(n => ({
          id: n.id, type: n.type, title: n.title,
          properties: Object.fromEntries(
            Object.entries(n.properties || {}).filter(([,v]) => v && !Array.isArray(v) && typeof v !== 'object')
          ),
          notes: n.notes ? String(n.notes).slice(0, 150) : undefined,
        })),
        edges: edges.map(e => ({ from: e.from, to: e.to, label: e.label || undefined })),
      };
      const d = await sendMessage(activeConvId, { message: userMsg, canvas_context: canvasContext }, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setMessages(ms => [
        ...ms.filter(m => m.id !== tempId),
        { id: `u_${Date.now()}`,   role: "user",      content: userMsg,    created_at: new Date().toISOString() },
        { id: `a_${Date.now()}`,   role: "assistant", content: d.content,  tokens_used: d.tokens, created_at: new Date().toISOString() },
      ]);
      setConversations(cs => cs.map(c =>
        c.id === activeConvId && c.title === "New Chat"
          ? { ...c, title: userMsg.slice(0, 48), updated_at: new Date().toISOString() }
          : c
      ));
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages(ms => ms.filter(m => m.id !== tempId));
        return;
      }
      setMessages(ms => ms.filter(m => m.id !== tempId));
      setError(e.message);
    } finally {
      if (!ctrl.signal.aborted) {
        setSending(false);
        abortRef.current = null;
        textareaRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteConv = async (id, e) => {
    e.stopPropagation();
    await deleteConversation(id).catch(() => {});
    setConversations(cs => cs.filter(c => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  // Token total for active conversation
  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens_used || 0), 0);

  const chatContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", overflow: "hidden" }}>

        {/* ── Controls bar ── */}
        <div style={{
          padding: "8px 12px", borderBottom: "1px solid var(--border2)",
          background: "var(--bg2)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 7,
        }}>
          {/* Provider + New Chat */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {providers.length === 0 ? (
              <button onClick={() => setShowSettings(true)} style={{
                flex: 1, padding: "7px 10px", background: "var(--accent2)11",
                border: "1px dashed var(--accent2)", borderRadius: "var(--radius-sm)",
                color: "var(--accent)", cursor: "pointer", fontSize: 11, fontFamily: "var(--font-ui)",
              }}>+ Add LLM Provider</button>
            ) : (
              <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} style={{
                flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "6px 8px", color: "var(--text)",
                fontSize: 11, fontFamily: "var(--font-ui)", outline: "none", cursor: "pointer",
              }}>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {PROVIDER_ICONS[p.provider] || "🔌"} {p.name} · {p.model}
                  </option>
                ))}
              </select>
            )}
            <button onClick={startNewChat} disabled={!selectedProvider} style={{
              padding: "6px 12px", background: selectedProvider ? "var(--accent2)" : "var(--bg3)",
              border: "none", borderRadius: "var(--radius-sm)", color: selectedProvider ? "#fff" : "var(--text4)",
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, cursor: selectedProvider ? "pointer" : "default",
              fontFamily: "var(--font-ui)", flexShrink: 0, transition: "all .15s",
            }}>+ NEW</button>
            <button onClick={() => setShowSettings(true)} title="Manage AI providers" style={{
              width: 30, height: 30, flexShrink: 0, background: "var(--bg3)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              color: "var(--text3)", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>⚙</button>
            <button onClick={() => setExpanded(e => !e)} title={expanded ? "Collapse" : "Expand chat"} style={{
              width: 30, height: 30, flexShrink: 0, background: "var(--bg3)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              color: "var(--text3)", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{expanded ? "⊡" : "⊞"}</button>
          </div>

          {availableModels.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 9, color: "var(--text4)", fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>MODEL</span>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{
                flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "5px 8px", color: "var(--text)",
                fontSize: 11, fontFamily: "var(--font-ui)", outline: "none", cursor: "pointer",
              }}>
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          {probingModels && <div style={{ fontSize: 9, color: "var(--text4)" }}>Detecting models...</div>}

          {/* Conversation pills -- horizontal scroll */}
          {conversations.length > 0 && (
            <div ref={convListRef} style={{
              display: "flex", gap: 5, overflowX: "auto", paddingBottom: 1,
              scrollbarWidth: "none", msOverflowStyle: "none",
            }}>
              {conversations.map(c => {
                const active = c.id === activeConvId;
                return (
                  <div data-ui="llm-chat" data-component="LLMChat" data-page="canvas" data-role="panel" key={c.id}
                    onClick={() => openConversation(c.id)}
                    title={c.model_override ? `Model: ${c.model_override}` : `Model: ${c.model}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      padding: "3px 6px 3px 8px", borderRadius: 20, cursor: "pointer",
                      fontSize: 10, fontFamily: "var(--font-ui)", fontWeight: active ? 700 : 400,
                      background: "var(--bg)",
                      boxShadow: active ? "inset 2px 2px 5px var(--neu-shadow),inset -1px -1px 3px var(--neu-hilight)" : "2px 2px 4px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)",
                      color: active ? "#fff" : "var(--text3)",
                      border: `1px solid ${active ? "var(--accent2)" : "var(--border)"}`,
                      maxWidth: 150, transition: "all .12s",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {PROVIDER_ICONS[c.provider] || "💬"} {c.title}
                    </span>
                    <span
                      onClick={e => handleDeleteConv(c.id, e)}
                      style={{ color: active ? "#ffffff88" : "var(--text4)", fontSize: 14, lineHeight: 1, flexShrink: 0, cursor: "pointer" }}
                    >×</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Messages area ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>

          {error && (
            <div style={{
              background: "var(--danger)18", border: "1px solid var(--danger)33",
              borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 11, color: "var(--danger)",
            }}>{error}</div>
          )}

          {!activeConvId ? (
            /* Empty state */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center", padding: "0 8px" }}>
              <div style={{ fontSize: 36 }}>💬</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Chat with your architecture</div>
                <div style={{ fontSize: 11, color: "var(--text4)", lineHeight: 1.7, maxWidth: 300 }}>
                  The AI will have full context of your <strong style={{ color: "var(--accent)" }}>{mapTitle || "canvas"}</strong> — {nodes.length} nodes and {edges.length} connections.
                </div>
              </div>
              {providers.length === 0 ? (
                <button onClick={() => setShowSettings(true)} style={{
                  padding: "9px 18px", background: "var(--accent2)", border: "none",
                  borderRadius: "var(--radius-md)", color: "#fff", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: "var(--font-ui)",
                }}>+ Add your first LLM provider</button>
              ) : (
                <button onClick={startNewChat} disabled={!selectedProvider} style={{
                  padding: "9px 18px", background: "var(--accent2)", border: "none",
                  borderRadius: "var(--radius-md)", color: "#fff", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: "var(--font-ui)",
                }}>Start a chat</button>
              )}
            </div>
          ) : messages.length === 0 && !loading ? (
            /* New conversation -- suggested prompts */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>✨</div>
              <div style={{ fontSize: 11, color: "var(--text4)", lineHeight: 1.7, maxWidth: 300 }}>
                New conversation. Ask anything about your architecture.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                {SUGGESTED.map(p => (
                  <button key={p}
                    onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                    style={{
                      padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)", color: "var(--text3)", cursor: "pointer",
                      fontSize: 11, fontFamily: "var(--font-ui)", textAlign: "left",
                      transition: "border-color .12s, color .12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
                  >{p}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
          )}

          {/* Typing indicator */}
          {sending && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)18", border: "1px solid var(--accent)33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🤖</div>
              <div style={{ background: "var(--bg3)", borderRadius: "3px var(--radius-md) var(--radius-md) var(--radius-md)", padding: "10px 14px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 0.18, 0.36].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `llmPulse 1.1s ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div style={{
          padding: "10px 12px 12px", background: "var(--bg2)",
          borderTop: "1px solid var(--border2)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeConvId || sending}
              placeholder={activeConvId ? "Ask about your architecture… (Enter to send, Shift+Enter newline)" : "Start a new chat first"}
              rows={1}
              style={{
                flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "9px 12px",
                color: "var(--text)", fontSize: 12, fontFamily: "var(--font-ui)",
                resize: "none", outline: "none", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto", transition: "border-color .15s",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            {sending ? (
              <button
                onClick={stopGeneration}
                title="Stop generation"
                style={{
                  width: 38, height: 38, borderRadius: "var(--radius-md)", border: "none", flexShrink: 0,
                  background: "var(--danger)", color: "#fff",
                  cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .15s",
                }}
              >■</button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!activeConvId || !input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: "var(--radius-md)", border: "none", flexShrink: 0,
                  background: (activeConvId && input.trim()) ? "var(--accent2)" : "var(--bg3)",
                  color: (activeConvId && input.trim()) ? "#fff" : "var(--text4)",
                  cursor: (activeConvId && input.trim()) ? "pointer" : "default",
                  fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .15s",
                }}
              >↑</button>
            )}
          </div>
          <div style={{ fontSize: 9, color: "var(--text4)", marginTop: 5, display: "flex", justifyContent: "space-between" }}>
            <span>📌 {nodes.length} nodes · {edges.length} connections in context</span>
            {totalTokens > 0 && <span title="Total tokens used in this conversation">{totalTokens.toLocaleString()} tok</span>}
          </div>
        </div>
      </div>
  );

  return (
    <>
      {expanded ? (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={e => { if (e.target === e.currentTarget) setExpanded(false); }}>
          <div style={{
            width: "min(900px, 92vw)", height: "min(700px, 88vh)",
            background: "var(--bg)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border2)", display: "flex", flexDirection: "column",
            overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}>
            {/* Expanded header */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border2)", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>💬 AI Chat — {mapTitle || "Canvas"}</span>
              <button onClick={() => setExpanded(false)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>{chatContent}</div>
          </div>
        </div>
      ) : chatContent}

      {showSettings && (
        <LLMSettings onClose={() => {
          setShowSettings(false);
          getLLMProviders().then(d => {
            setProviders(d.providers || []);
            if (!selectedProvider && (d.providers || []).length > 0) {
              setSelectedProvider((d.providers.find(p => p.is_default) || d.providers[0]).id);
            }
          }).catch(() => {});
        }} />
      )}

      <style>{`
        @keyframes llmPulse { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const tokenLabel = message.tokens_used != null
    ? `${message.tokens_used} tok`
    : (message.role === "assistant" ? "N/A tok" : null);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
      {/* Avatar */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "var(--accent2)22" : "var(--accent)18",
        border: `1px solid ${isUser ? "var(--accent2)44" : "var(--accent)33"}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
      }}>{isUser ? "👤" : "🤖"}</div>

      {/* Bubble */}
      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 3, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser ? "var(--accent2)18" : "var(--bg3)",
          border: `1px solid ${isUser ? "var(--accent2)33" : "var(--border)"}`,
          borderRadius: isUser
            ? "var(--radius-md) 3px var(--radius-md) var(--radius-md)"
            : "3px var(--radius-md) var(--radius-md) var(--radius-md)",
          padding: "9px 13px", fontSize: 12, color: "var(--text)",
          lineHeight: 1.65, wordBreak: "break-word",
        }}>
          <FormattedContent content={message.content} />
        </div>
        <div style={{ fontSize: 9, color: "var(--text4)", paddingLeft: 2, paddingRight: 2 }}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {tokenLabel && ` · ${tokenLabel}`}
        </div>
      </div>
    </div>
  );
}

function inlineFormat(text, keyPrefix) {
  // Handle inline: **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    const k = `${keyPrefix}-${i}`;
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={k} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*"))
      return <em key={k}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={k} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xs)", padding: "1px 5px", fontSize: 11, color: "var(--accent)", fontFamily: "monospace" }}>{p.slice(1, -1)}</code>;
    return <span key={k}>{p}</span>;
  });
}

function FormattedContent({ content }) {
  if (!content) return null;

  // Split out fenced code blocks first
  const segments = content.split(/(```[\s\S]*?```)/g);

  const elements = [];
  let keyIdx = 0;

  segments.forEach((seg) => {
    if (seg.startsWith("```") && seg.endsWith("```")) {
      const inner = seg.slice(3, -3);
      const langMatch = inner.match(/^[a-zA-Z]+\n/);
      const lang = langMatch ? langMatch[0].trim() : "";
      const code = langMatch ? inner.slice(langMatch[0].length) : inner;
      elements.push(
        <pre key={keyIdx++} style={{
          background: "var(--bg)", border: "1px solid var(--border2)",
          borderRadius: "var(--radius-sm)", padding: "9px 11px", fontSize: 11,
          overflowX: "auto", margin: "8px 0", fontFamily: "monospace",
          color: "var(--accent)", lineHeight: 1.5, whiteSpace: "pre",
        }}>
          {lang && <div style={{ fontSize: 9, color: "var(--text4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{lang}</div>}
          {code.trimEnd()}
        </pre>
      );
      return;
    }

    // Process line by line
    const lines = seg.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        elements.push(<hr key={keyIdx++} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />);
        i++; continue;
      }

      // Headings
      const hMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (hMatch) {
        const level = hMatch[1].length;
        const sizes = { 1: 15, 2: 13, 3: 12 };
        elements.push(
          <div key={keyIdx++} style={{ fontWeight: 700, fontSize: sizes[level], color: "var(--text)", margin: `${level === 1 ? 10 : 7}px 0 4px` }}>
            {inlineFormat(hMatch[2], keyIdx)}
          </div>
        );
        i++; continue;
      }

      // Table: collect all consecutive table lines
      if (line.startsWith("|")) {
        const tableLines = [];
        while (i < lines.length && lines[i].startsWith("|")) {
          tableLines.push(lines[i]);
          i++;
        }
        const rows = tableLines.filter(l => !/^\|[-| :]+\|$/.test(l.trim()));
        const parsed = rows.map(r => r.split("|").slice(1, -1).map(c => c.trim()));
        if (parsed.length > 0) {
          elements.push(
            <div key={keyIdx++} style={{ overflowX: "auto", margin: "8px 0" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
                <thead>
                  <tr>{parsed[0].map((cell, ci) => (
                    <th key={ci} style={{ border: "1px solid var(--border2)", padding: "4px 8px", background: "var(--bg)", color: "var(--text)", textAlign: "left", fontWeight: 700 }}>
                      {inlineFormat(cell, `th-${keyIdx}-${ci}`)}
                    </th>
                  ))}</tr>
                </thead>
                <tbody>
                  {parsed.slice(1).map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "var(--bg)22" }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ border: "1px solid var(--border2)", padding: "4px 8px", color: "var(--text2)" }}>
                          {inlineFormat(cell, `td-${keyIdx}-${ri}-${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // Blockquote
      if (line.startsWith(">")) {
        elements.push(
          <div key={keyIdx++} style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 10, color: "var(--text3)", fontStyle: "italic", margin: "6px 0", fontSize: 11 }}>
            {inlineFormat(line.replace(/^>\s*/, ""), keyIdx)}
          </div>
        );
        i++; continue;
      }

      // Unordered list item
      if (/^[-*]\s/.test(line)) {
        const listItems = [];
        while (i < lines.length && /^[-*]\s/.test(lines[i])) {
          listItems.push(lines[i].replace(/^[-*]\s/, ""));
          i++;
        }
        elements.push(
          <ul key={keyIdx++} style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
            {listItems.map((item, li) => (
              <li key={li} style={{ color: "var(--text2)", marginBottom: 2, fontSize: 12, lineHeight: 1.6 }}>
                {inlineFormat(item, `ul-${keyIdx}-${li}`)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list item
      if (/^\d+\.\s/.test(line)) {
        const listItems = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+\.\s/, ""));
          i++;
        }
        elements.push(
          <ol key={keyIdx++} style={{ margin: "4px 0", paddingLeft: 18 }}>
            {listItems.map((item, li) => (
              <li key={li} style={{ color: "var(--text2)", marginBottom: 2, fontSize: 12, lineHeight: 1.6 }}>
                {inlineFormat(item, `ol-${keyIdx}-${li}`)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Empty line → spacing
      if (line.trim() === "") {
        elements.push(<div key={keyIdx++} style={{ height: 6 }} />);
        i++; continue;
      }

      // Normal paragraph line
      elements.push(
        <div key={keyIdx++} style={{ color: "var(--text2)", fontSize: 12, lineHeight: 1.65, marginBottom: 1 }}>
          {inlineFormat(line, keyIdx)}
        </div>
      );
      i++;
    }
  });

  return <div style={{ display: "flex", flexDirection: "column" }}>{elements}</div>;
}
