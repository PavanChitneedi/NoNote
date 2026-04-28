// NodeAIChat — compact AI chat focused on a single node, for the InlineNodeEditor AI tab
import { useState, useEffect, useRef } from "react";
import { getLLMProviders, getConversations, createConversation, getMessages, sendMessage } from "../api/client.js";

const PICONS = { openai:"🤖", anthropic:"🟣", gemini:"💎", groq:"⚡", mistral:"🌀", ollama:"🦙", custom:"🔧" };

const NODE_PROMPTS = [
  "What is this component responsible for?",
  "What are common failure modes?",
  "How should I secure this?",
  "What monitoring should I set up?",
  "Generate documentation for this node",
];

export default function NodeAIChat({ node, mapId, mapTitle }) {
  const [providers, setProviders]         = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [error, setError]                 = useState("");
  const [loaded, setLoaded]               = useState(false);
  const endRef      = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!mapId || !node?.id) return;
    Promise.all([
      getLLMProviders(),
      getConversations(mapId, node.id),
    ]).then(([pd, cd]) => {
      const provs = pd.providers || [];
      const convs = cd.conversations || [];
      setProviders(provs);
      setConversations(convs);
      const def = provs.find(p => p.is_default) || provs[0];
      if (def) setSelectedProvider(def.id);
      if (convs.length > 0) loadConv(convs[0].id);
      setLoaded(true);
    }).catch(e => { setError(e.message); setLoaded(true); });
  }, [mapId, node?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadConv = async (id) => {
    setActiveConvId(id);
    setMessages([]);
    try {
      const d = await getMessages(id);
      setMessages(d.messages || []);
    } catch (e) { setError(e.message); }
  };

  const newConv = async () => {
    if (!selectedProvider) return;
    setError("");
    try {
      const d = await createConversation(mapId, {
        provider_id: selectedProvider,
        title: `${node.title || node.type} — Chat`,
        node_id: node.id,
      });
      setConversations(cs => [d.conversation, ...cs]);
      setActiveConvId(d.conversation.id);
      setMessages([]);
    } catch (e) { setError(e.message); }
  };

  const send = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const txt = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    setError("");
    const tempId = `t_${Date.now()}`;
    setMessages(ms => [...ms, { id: tempId, role: "user", content: txt, created_at: new Date().toISOString() }]);
    try {
      const nodeCtx = { title: node.title, type: node.type, properties: node.properties, notes: node.notes };
      const d = await sendMessage(activeConvId, { message: txt, node_context: nodeCtx, canvas_context: { mapTitle } });
      setMessages(ms => [
        ...ms.filter(m => m.id !== tempId),
        { id: `u${Date.now()}`, role: "user",      content: txt,       created_at: new Date().toISOString() },
        { id: `a${Date.now()}`, role: "assistant",  content: d.content, tokens_used: d.tokens, created_at: new Date().toISOString() },
      ]);
    } catch (e) {
      setMessages(ms => ms.filter(m => m.id !== tempId));
      setError(e.message);
    } finally { setSending(false); textareaRef.current?.focus(); }
  };

  const onKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  // ── Styles ──────────────────────────────────────────────────
  const pill = (active) => ({
    padding: "3px 10px", borderRadius: 20, cursor: "pointer", fontSize: 10,
    fontFamily: "var(--font-ui)", fontWeight: active ? 700 : 400,
    background: active ? "var(--accent2)" : "var(--bg3)",
    color: active ? "var(--on-accent)" : "var(--text3)",
    border: `1px solid ${active ? "var(--accent2)" : "var(--border)"}`,
    flexShrink: 0, whiteSpace: "nowrap", transition: "all .12s",
  });

  const canSend = activeConvId && input.trim() && !sending;

  if (!loaded) return <div style={{ padding: 16, fontSize: 11, color: "var(--text4)" }}>Loading…</div>;

  return (
    <div data-ui="node-ai-chat" data-component="NodeAIChat" data-page="canvas" data-role="panel" style={{ display: "flex", flexDirection: "column", height: 420, userSelect: "text", pointerEvents: "all" }}>

      {/* ── Top bar: provider + new ── */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
        {providers.length === 0 ? (
          <span style={{ fontSize: 10, color: "var(--text4)", flex: 1 }}>No LLM provider — add one in AI Chat panel</span>
        ) : (
          <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", padding: "5px 7px", color: "var(--text)", fontSize: 10, fontFamily: "var(--font-ui)", outline: "none" }}>
            {providers.map(p => <option key={p.id} value={p.id}>{PICONS[p.provider]||"🔌"} {p.name} · {p.model}</option>)}
          </select>
        )}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); newConv(); }}
          disabled={!selectedProvider}
          style={{ padding: "5px 10px", background: selectedProvider ? "var(--accent2)" : "var(--bg3)", border: "none", borderRadius: "var(--radius-xs)", color: selectedProvider ? "var(--on-accent)" : "var(--text4)", fontSize: 10, fontWeight: 700, cursor: selectedProvider ? "pointer" : "default", fontFamily: "var(--font-ui)", flexShrink: 0 }}>
          + NEW
        </button>
      </div>

      {/* ── Conversation pills ── */}
      {conversations.length > 0 && (
        <div style={{ display: "flex", gap: 5, overflowX: "auto", padding: "6px 12px", borderBottom: "1px solid var(--border2)", flexShrink: 0, scrollbarWidth: "none" }}>
          {conversations.map(c => (
            <button key={c.id} style={pill(c.id === activeConvId)}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); loadConv(c.id); }}>
              {PICONS[c.provider]||"💬"} {c.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && (
          <div style={{ fontSize: 10, color: "var(--danger)", background: "var(--danger)18", border: "1px solid var(--danger)33", borderRadius: "var(--radius-xs)", padding: "6px 10px" }}>{error}</div>
        )}

        {!activeConvId ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>🤖</div>
            <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 700 }}>Ask about this node</div>
            <div style={{ fontSize: 10, color: "var(--text4)", lineHeight: 1.6 }}>
              Focused chat for <strong style={{ color: "var(--accent)" }}>{node.title || node.type}</strong>.<br/>Context includes only this node's details.
            </div>
            {providers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
                {NODE_PROMPTS.map(p => (
                  <button key={p} onMouseDown={e => e.stopPropagation()}
                    onClick={async e => { e.stopPropagation(); await newConv(); setInput(p); textareaRef.current?.focus(); }}
                    style={{ padding: "7px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", color: "var(--text3)", cursor: "pointer", fontSize: 10, fontFamily: "var(--font-ui)", textAlign: "left", transition: "var(--transition-all)" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ fontSize: 20 }}>✨</div>
            <div style={{ fontSize: 10, color: "var(--text4)", textAlign: "center", lineHeight: 1.6 }}>New conversation. Ask anything about <strong style={{ color: "var(--accent)" }}>{node.title || node.type}</strong>.</div>
          </div>
        ) : (
          messages.map(m => <NodeMsg key={m.id} msg={m} />)
        )}

        {sending && (
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)18", border: "1px solid var(--accent)33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>🤖</div>
            <div style={{ background: "var(--bg3)", borderRadius: "3px var(--radius-sm) var(--radius-sm) var(--radius-sm)", padding: "8px 10px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {[0,.18,.36].map(d => <div key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", animation: `naiPulse 1.1s ${d}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border2)", background: "var(--bg2)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          <textarea ref={textareaRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            disabled={!activeConvId || sending}
            placeholder={activeConvId ? "Ask about this node…" : "Start a new chat first"}
            rows={1}
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", padding: "7px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--font-ui)", resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 80, overflowY: "auto" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }}
          />
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); send(); }} disabled={!canSend}
            style={{ width: 32, height: 32, borderRadius: "var(--radius-xs)", border: "none", flexShrink: 0, background: canSend ? "var(--accent2)" : "var(--bg3)", color: canSend ? "var(--on-accent)" : "var(--text4)", cursor: canSend ? "pointer" : "default", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>↑</button>
        </div>
      </div>

      <style>{`@keyframes naiPulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function NodeMsg({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: isUser ? "var(--accent2)22" : "var(--accent)18", border: `1px solid ${isUser ? "var(--accent2)44" : "var(--accent)33"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 2, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{ background: isUser ? "var(--accent2)18" : "var(--bg3)", border: `1px solid ${isUser ? "var(--accent2)33" : "var(--border)"}`, borderRadius: isUser ? "var(--radius-sm) 3px var(--radius-sm) var(--radius-sm)" : "3px var(--radius-sm) var(--radius-sm) var(--radius-sm)", padding: "7px 10px", fontSize: 11, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 8, color: "var(--text4)" }}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {msg.tokens_used && ` · ${msg.tokens_used}tok`}
        </div>
      </div>
    </div>
  );
}
