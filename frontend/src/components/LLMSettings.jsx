import { useState, useEffect } from "react";
import { getLLMProviders, createLLMProvider, updateLLMProvider, deleteLLMProvider } from "../api/client.js";

const PRESETS = {
  openai:    { label: "OpenAI",         icon: "🤖", placeholder_model: "gpt-4o",              placeholder_url: "https://api.openai.com/v1",               needsKey: true },
  anthropic: { label: "Anthropic",      icon: "🟣", placeholder_model: "claude-sonnet-4-5", placeholder_url: "https://api.anthropic.com/v1",            needsKey: true },
  gemini:    { label: "Google Gemini",  icon: "💎", placeholder_model: "gemini-1.5-pro",      placeholder_url: "https://generativelanguage.googleapis.com/v1beta", needsKey: true },
  groq:      { label: "Groq",           icon: "⚡", placeholder_model: "llama-3.1-70b-versatile", placeholder_url: "https://api.groq.com/openai/v1",      needsKey: true },
  mistral:   { label: "Mistral",        icon: "🌀", placeholder_model: "mistral-large-latest", placeholder_url: "https://api.mistral.ai/v1",             needsKey: true },
  ollama:    { label: "Ollama (local)", icon: "🦙", placeholder_model: "llama3.2",             placeholder_url: "http://localhost:11434/v1",               needsKey: false },
  custom:    { label: "Custom / OpenAI-compatible", icon: "🔧", placeholder_model: "your-model", placeholder_url: "https://your-api.com/v1",             needsKey: true },
};

const PROVIDER_COLORS = {
  openai: "#10a37f", anthropic: "#6C63FF", gemini: "#4285F4",
  groq: "#f55036", mistral: "#FF7000", ollama: "#4CAF50", custom: "#9E9E9E",
};

export default function LLMSettings({ onClose }) {
  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editId, setEditId]         = useState(null);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const blank = { name: "", provider: "openai", model: "", base_url: "", api_key: "", is_default: false };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    getLLMProviders()
      .then(d => setProviders(d.providers))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const preset = PRESETS[form.provider] || PRESETS.custom;

  const resetForm = () => { setForm(blank); setShowAdd(false); setEditId(null); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const payload = {
        name:       form.name,
        provider:   form.provider,
        model:      form.model || preset.placeholder_model,
        base_url:   form.base_url || preset.placeholder_url,
        is_default: form.is_default,
        ...(form.api_key ? { api_key: form.api_key } : {}),
      };

      if (editId) {
        const d = await updateLLMProvider(editId, payload);
        setProviders(ps => ps.map(p => p.id === editId ? d.provider : p));
        setSuccess("Provider updated.");
      } else {
        const d = await createLLMProvider(payload);
        setProviders(ps => [d.provider, ...ps]);
        setSuccess("Provider added.");
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (p) => {
    setForm({ name: p.name, provider: p.provider, model: p.model, base_url: p.base_url, api_key: "", is_default: p.is_default });
    setEditId(p.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this provider?")) return;
    await deleteLLMProvider(id).catch(e => setError(e.message));
    setProviders(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔌</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3" }}>LLM Providers</div>
            <div style={{ fontSize: 10, color: "#484f58" }}>Add your AI providers — API keys are encrypted at rest</div>
          </div>
          <button onClick={onClose} style={xBtn}>×</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {error   && <Alert color="#f78166">{error}</Alert>}
          {success && <Alert color="#4CAF50">{success}</Alert>}

          {/* Add / Edit form */}
          {showAdd ? (
            <form onSubmit={handleSubmit} style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={sectionLbl}>{editId ? "EDIT PROVIDER" : "ADD PROVIDER"}</div>

              {/* Provider type grid */}
              {!editId && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <div key={key}
                      onClick={() => setForm(f => ({ ...f, provider: key, base_url: "", model: "" }))}
                      style={{
                        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${form.provider === key ? PROVIDER_COLORS[key] : "#21262d"}`,
                        background: form.provider === key ? `${PROVIDER_COLORS[key]}15` : "transparent",
                        display: "flex", alignItems: "center", gap: 8, transition: "all 0.12s",
                      }}>
                      <span style={{ fontSize: 16 }}>{p.icon}</span>
                      <span style={{ fontSize: 11, color: form.provider === key ? "#e6edf3" : "#7d8590", fontWeight: form.provider === key ? 700 : 400 }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <Label>DISPLAY NAME</Label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={`e.g. My ${preset.label}`} required style={inp} />
                </div>
                <div>
                  <Label>MODEL</Label>
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    placeholder={preset.placeholder_model} style={inp} />
                </div>
                <div>
                  <Label>BASE URL</Label>
                  <input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))}
                    placeholder={preset.placeholder_url} style={inp} />
                </div>
                {preset.needsKey && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <Label>{editId ? "API KEY (leave blank to keep existing)" : "API KEY"}</Label>
                    <input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                      placeholder={editId ? "••••••••" : "sk-..."} required={!editId} style={inp} />
                  </div>
                )}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#7d8590", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                Set as default provider
              </label>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" style={primBtn}>{editId ? "SAVE CHANGES" : "ADD PROVIDER"}</button>
                <button type="button" onClick={resetForm} style={ghostBtn}>CANCEL</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAdd(true)} style={{ ...primBtn, alignSelf: "flex-start" }}>+ ADD PROVIDER</button>
          )}

          {/* Provider list */}
          {loading ? (
            <div style={{ color: "#484f58", fontSize: 12, textAlign: "center", padding: 20 }}>Loading…</div>
          ) : providers.length === 0 ? (
            <div style={{ color: "#484f58", fontSize: 12, textAlign: "center", padding: 30, lineHeight: 2 }}>
              No providers yet. Add your first LLM to start chatting with your maps.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {providers.map(p => {
                const pr = PRESETS[p.provider] || PRESETS.custom;
                const col = PROVIDER_COLORS[p.provider] || "#9E9E9E";
                return (
                  <div key={p.id} style={{ background: "#0d1117", border: `1px solid ${col}30`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{pr.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3" }}>{p.name}</span>
                        {p.is_default && <span style={{ fontSize: 9, background: `${col}25`, color: col, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>DEFAULT</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
                        {pr.label} · {p.model}
                      </div>
                      <div style={{ fontSize: 9, color: "#3d4349", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.base_url}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => startEdit(p)} style={{ ...ghostBtn, padding: "4px 10px", fontSize: 9 }}>EDIT</button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "1px solid #f7816640", borderRadius: 6, color: "#f78166", cursor: "pointer", fontSize: 9, padding: "4px 10px", fontFamily: "inherit", fontWeight: 700 }}>REMOVE</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 10, color: "#3d4349", lineHeight: 1.6, borderTop: "1px solid #21262d", paddingTop: 12, marginTop: 4 }}>
            🔒 API keys are encrypted with AES-256-GCM before storage. They are never sent to the frontend — all LLM calls are proxied through the NodeMap backend.
          </div>
        </div>
      </div>
    </div>
  );
}

const Label = ({ children }) => <div style={sectionLbl}>{children}</div>;
const Alert = ({ color, children }) => (
  <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 8, padding: "9px 12px", fontSize: 12, color }}>{children}</div>
);

const sectionLbl = { fontSize: 9, fontWeight: 700, color: "#484f58", letterSpacing: 2, marginBottom: 4 };
const inp   = { width: "100%", background: "#161b22", border: "1px solid #30363d", borderRadius: 7, padding: "8px 10px", color: "#e6edf3", fontSize: 12, fontFamily: "inherit", outline: "none" };
const primBtn = { padding: "9px 18px", background: "#1f6feb", border: "none", borderRadius: 8, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: "pointer" };
const ghostBtn= { padding: "9px 18px", background: "#21262d", border: "none", borderRadius: 8, color: "#7d8590", fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: "pointer" };
const xBtn    = { background: "none", border: "none", color: "#7d8590", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 4px" };
