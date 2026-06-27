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
    background: "var(--bg)",
    boxShadow: active ? "inset 2px 2px 5px var(--neu-shadow),inset -1px -1px 3px var(--neu-hilight)" : "2px 2px 4px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)",
    color: active ? "var(--text)" : "var(--text3)",
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
          style={{ padding: "5px 10px", background: selectedProvider ? "var(--accent2)" : "var(--bg3)", border: "none", borderRadius: "var(--radius-xs)", color: selectedProvider ? "#fff" : "var(--text4)", fontSize: 10, fontWeight: 700, cursor: selectedProvider ? "pointer" : "default", fontFamily: "var(--font-ui)", flexShrink: 0 }}>
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
                    style={{ padding: "7px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", color: "var(--text3)", cursor: "pointer", fontSize: 10, fontFamily: "var(--font-ui)", textAlign: "left", transition: "border-color .12s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}>
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
            style={{ width: 32, height: 32, borderRadius: "var(--radius-xs)", border: "none", flexShrink: 0, background: canSend ? "var(--accent2)" : "var(--bg3)", color: canSend ? "#fff" : "var(--text4)", cursor: canSend ? "pointer" : "default", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>↑</button>
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
        <div style={{ background: isUser ? "var(--accent2)18" : "var(--bg3)", border: `1px solid ${isUser ? "var(--accent2)33" : "var(--border)"}`, borderRadius: isUser ? "var(--radius-sm) 3px var(--radius-sm) var(--radius-sm)" : "3px var(--radius-sm) var(--radius-sm) var(--radius-sm)", padding: "7px 10px", fontSize: 11, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
          {isUser ? msg.content : <FormattedContent content={msg.content} />}
        </div>
        <div style={{ fontSize: 8, color: "var(--text4)" }}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {msg.tokens_used && ` · ${msg.tokens_used}tok`}
        </div>
      </div>
    </div>
  );
}

function inlineFormat(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    const k = `${keyPrefix}-${i}`;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={k} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={k}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={k} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xs)", padding: "1px 5px", fontSize: 10, color: "var(--accent)", fontFamily: "monospace" }}>{p.slice(1, -1)}</code>;
    return <span key={k}>{p}</span>;
  });
}

function FormattedContent({ content }) {
  if (!content) return null;
  const segments = content.split(/(```[\s\S]*?```)/g);
  const elements = [];
  let keyIdx = 0;
  segments.forEach((seg) => {
    if (seg.startsWith("```") && seg.endsWith("```")) {
      const inner = seg.slice(3, -3);
      const langMatch = inner.match(/^[a-zA-Z]+\n/);
      const code = langMatch ? inner.slice(langMatch[0].length) : inner;
      elements.push(<pre key={keyIdx++} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)", padding: "7px 9px", fontSize: 10, overflowX: "auto", margin: "6px 0", fontFamily: "monospace", color: "var(--accent)", lineHeight: 1.5, whiteSpace: "pre" }}>{code.trimEnd()}</pre>);
      return;
    }
    const lines = seg.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^---+$/.test(line.trim())) { elements.push(<hr key={keyIdx++} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />); i++; continue; }
      const hMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (hMatch) { const sz = { 1: 13, 2: 12, 3: 11 }[hMatch[1].length]; elements.push(<div key={keyIdx++} style={{ fontWeight: 700, fontSize: sz, color: "var(--text)", margin: "7px 0 3px" }}>{inlineFormat(hMatch[2], keyIdx)}</div>); i++; continue; }
      if (line.startsWith("|")) {
        const tableLines = [];
        while (i < lines.length && lines[i].startsWith("|")) { tableLines.push(lines[i]); i++; }
        const rows = tableLines.filter(l => !/^\|[-| :]+\|$/.test(l.trim())).map(r => r.split("|").slice(1, -1).map(c => c.trim()));
        if (rows.length) elements.push(<div key={keyIdx++} style={{ overflowX: "auto", margin: "6px 0" }}><table style={{ borderCollapse: "collapse", fontSize: 10, width: "100%" }}><thead><tr>{rows[0].map((c, ci) => <th key={ci} style={{ border: "1px solid var(--border2)", padding: "3px 6px", background: "var(--bg)", color: "var(--text)", textAlign: "left", fontWeight: 700 }}>{inlineFormat(c, `th-${keyIdx}-${ci}`)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ border: "1px solid var(--border2)", padding: "3px 6px", color: "var(--text2)" }}>{inlineFormat(c, `td-${keyIdx}-${ri}-${ci}`)}</td>)}</tr>)}</tbody></table></div>);
        continue;
      }
      if (line.startsWith(">")) { elements.push(<div key={keyIdx++} style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 8, color: "var(--text3)", fontStyle: "italic", margin: "4px 0", fontSize: 11 }}>{inlineFormat(line.replace(/^>\s*/, ""), keyIdx)}</div>); i++; continue; }
      if (/^[-*]\s/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, "")); i++; }
        elements.push(<ul key={keyIdx++} style={{ margin: "3px 0", paddingLeft: 16, listStyle: "disc" }}>{items.map((it, li) => <li key={li} style={{ color: "var(--text2)", marginBottom: 1, fontSize: 11, lineHeight: 1.6 }}>{inlineFormat(it, `ul-${keyIdx}-${li}`)}</li>)}</ul>);
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
        elements.push(<ol key={keyIdx++} style={{ margin: "3px 0", paddingLeft: 16 }}>{items.map((it, li) => <li key={li} style={{ color: "var(--text2)", marginBottom: 1, fontSize: 11, lineHeight: 1.6 }}>{inlineFormat(it, `ol-${keyIdx}-${li}`)}</li>)}</ol>);
        continue;
      }
      if (line.trim() === "") { elements.push(<div key={keyIdx++} style={{ height: 4 }} />); i++; continue; }
      elements.push(<div key={keyIdx++} style={{ color: "var(--text2)", fontSize: 11, lineHeight: 1.6, marginBottom: 1 }}>{inlineFormat(line, keyIdx)}</div>);
      i++;
    }
  });
  return <div style={{ display: "flex", flexDirection: "column" }}>{elements}</div>;
}
