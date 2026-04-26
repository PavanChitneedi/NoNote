import { useState, useEffect, useRef, useCallback } from "react";
import {
  getLLMProviders, getConversations, createConversation,
  deleteConversation, getMessages, sendMessage,
} from "../api/client.js";
import LLMSettings from "./LLMSettings.jsx";

const PROVIDER_ICONS = {
  openai: "🤖", anthropic: "🟣", gemini: "💎",
  groq: "⚡", mistral: "🌀", ollama: "🦙", custom: "🔧",
};

const SUGGESTED = [
  "Review this architecture for security issues",
  "What components am I missing?",
  "How does data flow through this system?",
  "Suggest scalability improvements",
  "Generate documentation for this map",
];

export default function LLMChat({ mapId, nodes, edges, mapTitle, onClose }) {
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
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const convListRef    = useRef(null);

  useEffect(() => {
    if (!mapId) return;
    Promise.all([getLLMProviders(), getConversations(mapId)])
      .then(([pData, cData]) => {
        setProviders(pData.providers || []);
        setConversations(cData.conversations || []);
        const def = (pData.providers || []).find(p => p.is_default) || (pData.providers || [])[0];
        if (def) setSelectedProvider(def.id);
        if ((cData.conversations || []).length > 0) openConversation(cData.conversations[0].id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [mapId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (id) => {
    setActiveConvId(id);
    setMessages([]);
    try {
      const d = await getMessages(id);
      setMessages(d.messages || []);
    } catch (e) { setError(e.message); }
  };

  const startNewChat = async () => {
    if (!selectedProvider) { setError("Select a provider first."); return; }
    setError("");
    try {
      const d = await createConversation(mapId, { provider_id: selectedProvider, title: "New Chat" });
      setConversations(cs => [d.conversation, ...cs]);
      setActiveConvId(d.conversation.id);
      setMessages([]);
      setTimeout(() => convListRef.current?.scrollTo({ left: 0, behavior: "smooth" }), 50);
    } catch (e) { setError(e.message); }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);
    setError("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }

    const tempId = `temp_${Date.now()}`;
    setMessages(ms => [...ms, { id: tempId, role: "user", content: userMsg, created_at: new Date().toISOString() }]);

    try {
      const canvasContext = {
        mapTitle,
        nodes: nodes.map(n => ({ id: n.id, type: n.type, title: n.title, properties: n.properties, notes: n.notes })),
        edges: edges.map(e => ({ id: e.id, from: e.from, to: e.to, label: e.label, style: e.style })),
      };
      const d = await sendMessage(activeConvId, { message: userMsg, canvas_context: canvasContext });
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
      setMessages(ms => ms.filter(m => m.id !== tempId));
      setError(e.message);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
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

  const activeConv = conversations.find(c => c.id === activeConvId);

  // ── Shared styles using CSS vars ──────────────────────────────
  const iconBtn = {
    background: "none", border: "none", color: "var(--text4)", cursor: "pointer",
    fontSize: 16, lineHeight: 1, padding: "4px 6px", borderRadius: "var(--radius-sm)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "color .15s, background .15s",
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 14px", height: 44, flexShrink: 0,
          background: "var(--bg3)", borderBottom: "1px solid var(--border2)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: 1, flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeConv ? activeConv.title : "AI CHAT"}
          </span>
          {activeConv && (
            <span style={{ fontSize: 9, color: "var(--text4)", flexShrink: 0 }}>
              {PROVIDER_ICONS[activeConv.provider]} {activeConv.model}
            </span>
          )}
          <button
            onClick={() => setShowSettings(true)}
            title="Manage providers"
            style={iconBtn}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--bg)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text4)"; e.currentTarget.style.background = "none"; }}
          >⚙</button>
          {onClose && (
            <button onClick={onClose} title="Close" style={{ ...iconBtn, fontSize: 20 }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text4)"; }}
            >×</button>
          )}
        </div>

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
          </div>

          {/* Conversation pills — horizontal scroll */}
          {conversations.length > 0 && (
            <div ref={convListRef} style={{
              display: "flex", gap: 5, overflowX: "auto", paddingBottom: 1,
              scrollbarWidth: "none", msOverflowStyle: "none",
            }}>
              {conversations.map(c => {
                const active = c.id === activeConvId;
                return (
                  <div key={c.id}
                    onClick={() => openConversation(c.id)}
                    title={c.title}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      padding: "3px 6px 3px 8px", borderRadius: 20, cursor: "pointer",
                      fontSize: 10, fontFamily: "var(--font-ui)", fontWeight: active ? 700 : 400,
                      background: active ? "var(--accent2)" : "var(--bg3)",
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
            /* New conversation — suggested prompts */
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
              placeholder={activeConvId ? "Ask about your architecture… (Enter ↵ to send)" : "Start a new chat first"}
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
            <button
              onClick={handleSend}
              disabled={!activeConvId || !input.trim() || sending}
              style={{
                width: 38, height: 38, borderRadius: "var(--radius-md)", border: "none", flexShrink: 0,
                background: (activeConvId && input.trim() && !sending) ? "var(--accent2)" : "var(--bg3)",
                color: (activeConvId && input.trim() && !sending) ? "#fff" : "var(--text4)",
                cursor: (activeConvId && input.trim() && !sending) ? "pointer" : "default",
                fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
              }}
            >↑</button>
          </div>
          <div style={{ fontSize: 9, color: "var(--text4)", marginTop: 5 }}>
            📌 {nodes.length} nodes · {edges.length} connections in context · Shift+Enter for newline
          </div>
        </div>
      </div>

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
          {message.tokens_used && ` · ${message.tokens_used} tok`}
        </div>
      </div>
    </div>
  );
}

function FormattedContent({ content }) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const langMatch = inner.match(/^[a-z]+\n/);
          const code = langMatch ? inner.slice(langMatch[0].length) : inner;
          return (
            <pre key={i} style={{
              background: "var(--bg)", border: "1px solid var(--border2)",
              borderRadius: "var(--radius-sm)", padding: "9px 11px", fontSize: 11,
              overflowX: "auto", margin: "6px 0", fontFamily: "monospace",
              color: "var(--accent)", lineHeight: 1.5,
            }}>{code}</pre>
          );
        }
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xs)", padding: "1px 5px", fontSize: 11, color: "var(--accent)", fontFamily: "monospace" }}>{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} style={{ color: "var(--text)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
