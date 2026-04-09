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

export default function LLMChat({ mapId, nodes, edges, mapTitle, onClose }) {
  const [providers, setProviders]       = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar]   = useState(true);
  const [error, setError]               = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Load providers + conversations on mount
  useEffect(() => {
    Promise.all([
      getLLMProviders(),
      getConversations(mapId),
    ])
      .then(([pData, cData]) => {
        setProviders(pData.providers);
        setConversations(cData.conversations);
        const def = pData.providers.find(p => p.is_default) || pData.providers[0];
        if (def) setSelectedProvider(def.id);
        if (cData.conversations.length > 0) {
          openConversation(cData.conversations[0].id);
        }
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
      setMessages(d.messages);
    } catch (e) {
      setError(e.message);
    }
  };

  const startNewChat = async () => {
    if (!selectedProvider) { setError("Select a provider first."); return; }
    setError("");
    try {
      const d = await createConversation(mapId, { provider_id: selectedProvider, title: "New Chat" });
      setConversations(cs => [d.conversation, ...cs]);
      setActiveConvId(d.conversation.id);
      setMessages([]);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);
    setError("");

    // Optimistic append
    const tempId = `temp_${Date.now()}`;
    setMessages(ms => [...ms, { id: tempId, role: "user", content: userMsg, created_at: new Date().toISOString() }]);

    try {
      // Build canvas context for system prompt
      const canvasContext = {
        mapTitle,
        nodes: nodes.map(n => ({
          id: n.id, type: n.type, title: n.title,
          properties: n.properties, notes: n.notes,
        })),
        edges: edges.map(e => ({ id: e.id, from: e.from, to: e.to, label: e.label, style: e.style })),
      };

      const d = await sendMessage(activeConvId, { message: userMsg, canvas_context: canvasContext });

      setMessages(ms => [
        ...ms.filter(m => m.id !== tempId),
        { id: `u_${Date.now()}`, role: "user",      content: userMsg, created_at: new Date().toISOString() },
        { id: `a_${Date.now()}`, role: "assistant", content: d.content, tokens_used: d.tokens, created_at: new Date().toISOString() },
      ]);

      // Update conversation title in sidebar
      setConversations(cs => cs.map(c =>
        c.id === activeConvId && c.title === "New Chat"
          ? { ...c, title: userMsg.slice(0, 50), updated_at: new Date().toISOString() }
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
  const isMobile = window.innerWidth < 768;

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 250,
        display: "flex", background: "#0d1117",
      }}>
        {/* Sidebar */}
        {(showSidebar || !isMobile) && (
          <div style={{
            width: isMobile ? "100%" : 240,
            background: "#161b22",
            borderRight: "1px solid #21262d",
            display: "flex", flexDirection: "column",
            flexShrink: 0,
            ...(isMobile ? { position: "absolute", inset: 0, zIndex: 10 } : {}),
          }}>
            {/* Sidebar header */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#58a6ff", flex: 1, letterSpacing: 0.5 }}>AI Chat</span>
              <button onClick={() => setShowSettings(true)} title="Manage providers"
                style={{ background: "none", border: "none", color: "#484f58", cursor: "pointer", fontSize: 15 }}>⚙</button>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#484f58", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            {/* Provider selector */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #21262d" }}>
              <div style={{ fontSize: 9, color: "#484f58", fontWeight: 700, letterSpacing: 2, marginBottom: 5 }}>PROVIDER</div>
              {providers.length === 0 ? (
                <button onClick={() => setShowSettings(true)}
                  style={{ width: "100%", padding: "8px 10px", background: "#1f6feb22", border: "1px dashed #1f6feb", borderRadius: 7, color: "#58a6ff", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                  + Add a provider
                </button>
              ) : (
                <select
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                  style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 7, padding: "7px 9px", color: "#e6edf3", fontSize: 11, fontFamily: "inherit", outline: "none" }}
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {PROVIDER_ICONS[p.provider] || "🔌"} {p.name} ({p.model})
                    </option>
                  ))}
                </select>
              )}
              <button onClick={startNewChat} disabled={!selectedProvider}
                style={{ marginTop: 8, width: "100%", padding: "7px", background: selectedProvider ? "#1f6feb" : "#21262d", border: "none", borderRadius: 7, color: selectedProvider ? "#fff" : "#484f58", fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: selectedProvider ? "pointer" : "default", fontFamily: "inherit" }}>
                + NEW CHAT
              </button>
            </div>

            {/* Conversation list */}
            <div style={{ flex: 1, overflow: "auto" }}>
              {conversations.length === 0 ? (
                <div style={{ padding: "20px 14px", fontSize: 11, color: "#484f58", textAlign: "center", lineHeight: 1.7 }}>
                  Start a chat to discuss<br/>your architecture with AI
                </div>
              ) : conversations.map(c => (
                <div key={c.id}
                  onClick={() => { openConversation(c.id); if (isMobile) setShowSidebar(false); }}
                  style={{
                    padding: "10px 14px", cursor: "pointer",
                    background: activeConvId === c.id ? "#1f6feb15" : "transparent",
                    borderLeft: `3px solid ${activeConvId === c.id ? "#1f6feb" : "transparent"}`,
                    transition: "all 0.12s",
                    display: "flex", alignItems: "flex-start", gap: 8,
                  }}
                  onMouseEnter={e => { if (activeConvId !== c.id) e.currentTarget.style.background = "#21262d"; }}
                  onMouseLeave={e => { if (activeConvId !== c.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{PROVIDER_ICONS[c.provider] || "💬"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#c9d1d9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: activeConvId === c.id ? 700 : 400 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 9, color: "#3d4349", marginTop: 2 }}>
                      {c.provider_name} · {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={e => handleDeleteConv(c.id, e)}
                    style={{ background: "none", border: "none", color: "#3d4349", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: "0 2px" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f78166"}
                    onMouseLeave={e => e.currentTarget.style.color = "#3d4349"}
                  >×</button>
                </div>
              ))}
            </div>

            {/* Canvas context badge */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid #21262d", fontSize: 9, color: "#3d4349", lineHeight: 1.6 }}>
              📌 Canvas context: {nodes.length} nodes, {edges.length} connections
            </div>
          </div>
        )}

        {/* Main chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ height: 48, background: "#161b22", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", color: "#7d8590", cursor: "pointer", fontSize: 18 }}>☰</button>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeConv ? activeConv.title : "Select or start a chat"}
            </span>
            {activeConv && (
              <span style={{ fontSize: 9, color: "#484f58" }}>
                {PROVIDER_ICONS[activeConv.provider]} {activeConv.provider_name} · {activeConv.model}
              </span>
            )}
            {!isMobile && (
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#484f58", cursor: "pointer", fontSize: 20 }}>×</button>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{ background: "#f7816618", border: "1px solid #f7816640", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#f78166" }}>{error}</div>
            )}

            {!activeConvId ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#484f58", textAlign: "center" }}>
                <div style={{ fontSize: 48 }}>💬</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#7d8590" }}>Chat with your architecture</div>
                <div style={{ fontSize: 12, maxWidth: 360, lineHeight: 1.7 }}>
                  Select a provider and start a new chat. The AI will have full context of your <strong style={{ color: "#58a6ff" }}>{mapTitle}</strong> canvas — {nodes.length} nodes and {edges.length} connections.
                </div>
                {providers.length === 0 && (
                  <button onClick={() => setShowSettings(true)}
                    style={{ padding: "10px 20px", background: "#1f6feb", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    + Add your first LLM provider
                  </button>
                )}
              </div>
            ) : messages.length === 0 && !loading ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#484f58" }}>
                <div style={{ fontSize: 32 }}>✨</div>
                <div style={{ fontSize: 12, textAlign: "center", lineHeight: 1.7, maxWidth: 340 }}>
                  New conversation started. Ask anything about your architecture — the AI knows your full canvas.
                </div>
                {/* Suggested prompts */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  {[
                    "Review this architecture for security issues",
                    "What components am I missing?",
                    "Explain how data flows through this system",
                    "Suggest scalability improvements",
                    "Generate documentation for this map",
                  ].map(prompt => (
                    <button key={prompt} onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                      style={{ padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", borderRadius: 20, color: "#7d8590", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#58a6ff"; e.currentTarget.style.color = "#58a6ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#7d8590"; }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
            )}

            {sending && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6C63FF22", border: "1px solid #6C63FF40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                <div style={{ background: "#21262d", borderRadius: "4px 12px 12px 12px", padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 0.2, 0.4].map(d => (
                      <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#58a6ff", animation: `pulse 1s ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", background: "#161b22", borderTop: "1px solid #21262d", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeConvId || sending}
              placeholder={activeConvId ? "Ask about your architecture… (Enter to send, Shift+Enter for newline)" : "Start a new chat first"}
              rows={1}
              style={{
                flex: 1, background: "#0d1117", border: "1px solid #30363d", borderRadius: 10,
                padding: "10px 12px", color: "#e6edf3", fontSize: 13, fontFamily: "inherit",
                resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!activeConvId || !input.trim() || sending}
              style={{
                width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0,
                background: (activeConvId && input.trim() && !sending) ? "#1f6feb" : "#21262d",
                color: (activeConvId && input.trim() && !sending) ? "#fff" : "#484f58",
                cursor: (activeConvId && input.trim() && !sending) ? "pointer" : "default",
                fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >↑</button>
          </div>
        </div>
      </div>

      {showSettings && (
        <LLMSettings
          onClose={() => {
            setShowSettings(false);
            // Reload providers
            getLLMProviders().then(d => {
              setProviders(d.providers);
              if (!selectedProvider && d.providers.length > 0) {
                setSelectedProvider(d.providers.find(p => p.is_default)?.id || d.providers[0].id);
              }
            }).catch(() => {});
          }}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:.2} 50%{opacity:1} }`}</style>
    </>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "#1f6feb22" : "#6C63FF22",
        border: `1px solid ${isUser ? "#1f6feb40" : "#6C63FF40"}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
      }}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser ? "#1f6feb22" : "#21262d",
          border: `1px solid ${isUser ? "#1f6feb30" : "#30363d"}`,
          borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
          padding: "10px 14px", fontSize: 13, color: "#e6edf3", lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          <FormattedContent content={message.content} />
        </div>
        <div style={{ fontSize: 9, color: "#3d4349", paddingLeft: 4 }}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {message.tokens_used && ` · ${message.tokens_used} tokens`}
        </div>
      </div>
    </div>
  );
}

// Simple markdown-ish renderer for code blocks and bold
function FormattedContent({ content }) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).replace(/^[a-z]+\n/, "");
          return (
            <pre key={i} style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, padding: "10px 12px", fontSize: 11, overflowX: "auto", margin: "6px 0", fontFamily: "monospace", color: "#79c0ff" }}>
              {code}
            </pre>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, padding: "1px 5px", fontSize: 11, color: "#79c0ff" }}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} style={{ color: "#e6edf3" }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
