import { useState, useEffect, useRef } from "react";
import { getLLMProviders, createLLMProvider, updateLLMProvider, deleteLLMProvider, probeLLMModels } from "../api/client.js";

const PRESETS = {
  openai:      { label:"OpenAI (ChatGPT)",          icon:"🟢", group:"Frontier",
    models:["gpt-4o","gpt-4o-mini","gpt-4-turbo","gpt-3.5-turbo","o1","o1-mini","o3-mini"],
    placeholder_model:"gpt-4o", placeholder_url:"https://api.openai.com/v1", needsKey:true,
    note:"Powers ChatGPT. Best all-round." },
  anthropic:   { label:"Anthropic (Claude)",         icon:"🟣", group:"Frontier",
    models:["claude-opus-4-5","claude-sonnet-4-5","claude-haiku-4-5","claude-3-5-sonnet-20241022"],
    placeholder_model:"claude-sonnet-4-5", placeholder_url:"https://api.anthropic.com/v1", needsKey:true,
    note:"Claude models. Excellent for writing and analysis." },
  gemini:      { label:"Google Gemini",              icon:"💎", group:"Frontier",
    models:["gemini-2.0-flash","gemini-1.5-pro","gemini-1.5-flash"],
    placeholder_model:"gemini-2.0-flash", placeholder_url:"https://generativelanguage.googleapis.com/v1beta", needsKey:true,
    note:"Google's flagship models. Free tier available." },
  xai:         { label:"xAI (Grok)",                 icon:"✦",  group:"Frontier",
    models:["grok-3","grok-3-mini","grok-2","grok-beta"],
    placeholder_model:"grok-3", placeholder_url:"https://api.x.ai/v1", needsKey:true,
    note:"Elon Musk's Grok. Has real-time X/Twitter access." },
  groq:        { label:"Groq",                       icon:"⚡", group:"Fast",
    models:["llama-3.3-70b-versatile","llama-3.1-8b-instant","mixtral-8x7b-32768","gemma2-9b-it"],
    placeholder_model:"llama-3.3-70b-versatile", placeholder_url:"https://api.groq.com/openai/v1", needsKey:true,
    note:"Blazing fast inference. Llama & Mixtral models." },
  perplexity:  { label:"Perplexity AI",              icon:"🔵", group:"Fast",
    models:["sonar-pro","sonar","sonar-reasoning"],
    placeholder_model:"sonar-pro", placeholder_url:"https://api.perplexity.ai", needsKey:true,
    note:"Includes web search grounding in responses." },
  deepseek:    { label:"DeepSeek",                   icon:"🔍", group:"Fast",
    models:["deepseek-chat","deepseek-reasoner","deepseek-coder"],
    placeholder_model:"deepseek-chat", placeholder_url:"https://api.deepseek.com/v1", needsKey:true,
    note:"Strong reasoning model. Very affordable." },
  mistral:     { label:"Mistral AI",                 icon:"🌀", group:"Fast",
    models:["mistral-large-latest","mistral-small-latest","open-mixtral-8x22b","codestral-latest"],
    placeholder_model:"mistral-large-latest", placeholder_url:"https://api.mistral.ai/v1", needsKey:true,
    note:"French AI. Strong European data residency option." },
  cohere:      { label:"Cohere",                     icon:"🌊", group:"Specialist",
    models:["command-r-plus","command-r","command"],
    placeholder_model:"command-r-plus", placeholder_url:"https://api.cohere.com/v2", needsKey:true,
    note:"Excellent for enterprise RAG and document tasks." },
  together:    { label:"Together AI",                icon:"🤝", group:"Gateway",
    models:["meta-llama/Llama-3-70b-chat-hf","mistralai/Mixtral-8x22B-Instruct-v0.1","Qwen/Qwen2.5-72B-Instruct"],
    placeholder_model:"meta-llama/Llama-3-70b-chat-hf", placeholder_url:"https://api.together.xyz/v1", needsKey:true,
    note:"100+ open-source models. Pay-per-token." },
  openrouter:  { label:"OpenRouter",                 icon:"🌐", group:"Gateway",
    models:["openai/gpt-4o","anthropic/claude-3.5-sonnet","google/gemini-pro-1.5"],
    placeholder_model:"openai/gpt-4o", placeholder_url:"https://openrouter.ai/api/v1", needsKey:true,
    note:"Gateway to 300+ models. One API key for everything." },
  azure:       { label:"Azure OpenAI",               icon:"☁",  group:"Enterprise",
    models:["gpt-4o","gpt-4","gpt-35-turbo"],
    placeholder_model:"gpt-4o", placeholder_url:"https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT", needsKey:true,
    note:"Enterprise Azure OpenAI." },
  huggingface: { label:"Hugging Face",               icon:"🤗", group:"Open Source",
    models:["mistralai/Mistral-7B-Instruct-v0.3","meta-llama/Meta-Llama-3.1-8B-Instruct"],
    placeholder_model:"mistralai/Mistral-7B-Instruct-v0.3", placeholder_url:"https://api-inference.huggingface.co/models", needsKey:true,
    note:"Free tier for many models. Access 500k+ HF models." },
  ollama:      { label:"Ollama (local)",             icon:"🦙", group:"Local",
    models:[], // auto-discovered from running instance
    placeholder_model:"llama3.2", placeholder_url:"http://localhost:11434/v1", needsKey:false,
    note:"Run models locally. No API key needed. 100% private.", autoDiscover:true },
  lmstudio:    { label:"LM Studio (local)",          icon:"🏠", group:"Local",
    models:["local-model"],
    placeholder_model:"local-model", placeholder_url:"http://localhost:1234/v1", needsKey:false,
    note:"Easy local model runner with GUI. OpenAI-compatible.", autoDiscover:true },
  custom:      { label:"Custom (OpenAI-compatible)", icon:"🔧", group:"Other",
    models:[],
    placeholder_model:"your-model", placeholder_url:"https://your-api.com/v1", needsKey:true,
    note:"Any OpenAI-compatible API endpoint." },
};

const GROUPS = ["Frontier","Fast","Specialist","Gateway","Enterprise","Open Source","Local","Other"];

const COLORS = {
  openai:"#10a37f", anthropic:"#6C63FF", gemini:"#4285F4", xai:"#000000",
  groq:"#f55036", perplexity:"#1FB8CD", deepseek:"#4D6BFE", mistral:"#FF7000",
  cohere:"#39594D", together:"#2D5BE3", openrouter:"#6E42C1",
  azure:"#0078D4", huggingface:"#FFD21E",
  ollama:"#4CAF50", lmstudio:"#7B61FF", custom:"#9E9E9E",
};

const BLANK = { name:"", provider:"openai", model:"", base_url:"", api_key:"", is_default:false };

export default function LLMSettings({ onClose }) {
  const [providers, setProviders]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editId, setEditId]               = useState(null);   // null = no form, "new" = add form, uuid = edit form
  const [form, setForm]                   = useState(BLANK);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");
  const [saving, setSaving]               = useState(false);
  const [discoveredModels, setDiscovered] = useState([]);
  const [probing, setProbing]             = useState(false);
  const [probeError, setProbeError]       = useState("");
  const formRef = useRef(null);

  const preset = PRESETS[form.provider] || PRESETS.custom;
  const displayModels = discoveredModels.length > 0 ? discoveredModels : (preset.models || []);
  const isNew  = editId === "new";
  const isEdit = editId && editId !== "new";

  // Load providers on mount
  useEffect(() => {
    reload();
  }, []);

  // Auto-discover models when URL changes for auto-discover providers
  useEffect(() => {
    const url = form.base_url || preset.placeholder_url;
    if (!preset.autoDiscover || !url) return;
    const timer = setTimeout(() => discoverModels(url), 600);
    return () => clearTimeout(timer);
  }, [form.base_url, form.provider]);

  const reload = () => {
    setLoading(true);
    getLLMProviders()
      .then(d => setProviders(d.providers || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const discoverModels = async (url) => {
    setProbing(true); setProbeError(""); setDiscovered([]);
    try {
      const d = await probeLLMModels(url);
      setDiscovered(d.models || []);
      if (d.models?.length > 0 && !form.model) {
        setForm(f => ({ ...f, model: d.models[0] }));
      }
    } catch (e) {
      setProbeError(e.message === "Provider unreachable or does not expose model list"
        ? "Ollama not found at that URL — start Ollama or check the URL"
        : "Could not fetch models: " + e.message);
    } finally { setProbing(false); }
  };

  const openNew = () => {
    setForm(BLANK); setEditId("new"); setError(""); setSuccess("");
    setDiscovered([]); setProbeError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  };

  const openEdit = (p) => {
    setForm({ name:p.name, provider:p.provider, model:p.model, base_url:p.base_url, api_key:"", is_default:p.is_default });
    setEditId(p.id); setError(""); setSuccess("");
    setDiscovered([]); setProbeError("");
    // Auto-discover if editing an auto-discover provider
    const pr = PRESETS[p.provider];
    if (pr?.autoDiscover) discoverModels(p.base_url || pr.placeholder_url);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  };

  const cancelForm = () => {
    setEditId(null); setForm(BLANK); setError(""); setDiscovered([]); setProbeError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const payload = {
        name:       form.name.trim() || `My ${preset.label}`,
        provider:   form.provider,
        model:      form.model.trim() || preset.placeholder_model,
        base_url:   form.base_url.trim() || preset.placeholder_url,
        is_default: form.is_default,
        ...(form.api_key ? { api_key: form.api_key } : {}),
      };

      if (isEdit) {
        const d = await updateLLMProvider(editId, payload);
        setProviders(ps => ps.map(p => p.id === editId ? d.provider : p));
        setSuccess("Provider updated ✓");
      } else {
        const d = await createLLMProvider(payload);
        setProviders(ps => [d.provider, ...ps]);
        setSuccess("Provider added ✓");
      }
      cancelForm();
    } catch (err) {
      setError(err.message || "Failed to save provider");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this provider? This will also delete any conversations using it.")) return;
    try {
      await deleteLLMProvider(id);
      setProviders(ps => ps.filter(p => p.id !== id));
      if (editId === id) cancelForm();
    } catch (e) { setError(e.message); }
  };

  const changeProvider = (key) => {
    setForm(f => ({ ...f, provider:key, model:"", base_url:"" }));
    setDiscovered([]); setProbeError("");
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }}
      onClick={onClose}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16,
        width:"100%", maxWidth:640, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:18 }}>🔌</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>LLM Providers</div>
            <div style={{ fontSize:10, color:"var(--text4)" }}>API keys are encrypted at rest — never exposed to the frontend</div>
          </div>
          <button onClick={onClose} style={S.xBtn}>×</button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          {error   && <Alert type="danger">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          {/* ── Provider list — ALWAYS visible ── */}
          {loading ? (
            <div style={{ color:"var(--text4)", textAlign:"center", padding:24, fontSize:12 }}>Loading providers…</div>
          ) : providers.length === 0 && !editId ? (
            <div style={{ color:"var(--text4)", textAlign:"center", padding:30, fontSize:12, lineHeight:2 }}>
              No providers yet.<br/>Add your first LLM to start chatting with your maps.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {providers.map(p => {
                const pr  = PRESETS[p.provider] || PRESETS.custom;
                const col = COLORS[p.provider]  || "#9E9E9E";
                const isActiveEdit = editId === p.id;
                return (
                  <div key={p.id} style={{
                    background:"var(--bg)", border:`1px solid ${isActiveEdit ? col : col+'30'}`,
                    borderRadius:10, padding:"11px 14px", display:"flex", alignItems:"center", gap:12,
                    transition:"border-color .15s",
                  }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{pr.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{p.name}</span>
                        {p.is_default && <span style={{ fontSize:9, background:`${col}25`, color:col,
                          padding:"1px 6px", borderRadius:4, fontWeight:700 }}>DEFAULT</span>}
                      </div>
                      <div style={{ fontSize:10, color:"var(--text3)", marginTop:1 }}>
                        {pr.label} · <code style={{ fontFamily:"monospace", fontSize:9 }}>{p.model}</code>
                      </div>
                      <div style={{ fontSize:9, color:"var(--text4)", marginTop:1, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.base_url}</div>
                    </div>
                    <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                      <button onClick={() => isActiveEdit ? cancelForm() : openEdit(p)}
                        style={{ ...S.ghost, padding:"4px 10px", fontSize:9,
                          background: isActiveEdit ? "var(--accent2)22" : undefined,
                          color: isActiveEdit ? "var(--accent2)" : undefined }}>
                        {isActiveEdit ? "CANCEL" : "EDIT"}
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={S.danger}>REMOVE</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add / Edit Form ── */}
          {editId ? (
            <div ref={formRef}>
              <form onSubmit={handleSubmit} style={{ background:"var(--bg)", border:"1px solid var(--border)",
                borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text)", letterSpacing:1 }}>
                  {isEdit ? "✏ EDIT PROVIDER" : "＋ ADD PROVIDER"}
                </div>

                {/* Provider type grid — only shown when adding */}
                {isNew && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {GROUPS.filter(g => Object.values(PRESETS).some(p => p.group===g)).map(group => (
                      <div key={group}>
                        <div style={{ fontSize:8, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:4 }}>
                          {group.toUpperCase()}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(138px,1fr))", gap:5 }}>
                          {Object.entries(PRESETS).filter(([,p]) => p.group===group).map(([key,p]) => (
                            <div key={key} onClick={() => changeProvider(key)} title={p.note}
                              style={{ padding:"8px 10px", borderRadius:8, cursor:"pointer",
                                border:`2px solid ${form.provider===key ? COLORS[key]||"#888" : "var(--border)"}`,
                                background: form.provider===key ? `${COLORS[key]||"#888"}18` : "transparent",
                                display:"flex", alignItems:"center", gap:7, transition:"all .12s" }}>
                              <span style={{ fontSize:14 }}>{p.icon}</span>
                              <span style={{ fontSize:10, color:form.provider===key?"var(--text)":"var(--text3)",
                                fontWeight:form.provider===key?700:400, lineHeight:1.2 }}>{p.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {preset.note && (
                      <div style={{ fontSize:11, color:"var(--text3)", background:"var(--bg2)", borderRadius:6,
                        padding:"7px 11px", borderLeft:`3px solid ${COLORS[form.provider]||"#888"}`, lineHeight:1.4 }}>
                        {preset.icon} <strong style={{ color:"var(--text)" }}>{preset.label}:</strong> {preset.note}
                      </div>
                    )}
                  </div>
                )}

                {/* Form fields */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {/* Display name */}
                  <div style={{ gridColumn:"1/-1" }}>
                    <Lbl>DISPLAY NAME</Lbl>
                    <input value={form.name}
                      onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                      placeholder={`e.g. My ${preset.label}`} style={S.inp} />
                  </div>

                  {/* Model selection */}
                  <div>
                    <Lbl>
                      MODEL
                      {preset.autoDiscover && (
                        <span style={{ marginLeft:6, fontSize:9, color:probing?"var(--accent)":discoveredModels.length>0?"var(--success)":"var(--text4)" }}>
                          {probing ? "🔍 detecting…" : discoveredModels.length > 0 ? `✓ ${discoveredModels.length} found` : "• auto-detect from URL"}
                        </span>
                      )}
                    </Lbl>
                    <input value={form.model}
                      onChange={e => setForm(f => ({ ...f, model:e.target.value }))}
                      placeholder={displayModels[0] || preset.placeholder_model}
                      style={S.inp} list={`mdl-${form.provider}`} />
                    {displayModels.length > 0 && (
                      <>
                        <datalist id={`mdl-${form.provider}`}>
                          {displayModels.map(m => <option key={m} value={m}/>)}
                        </datalist>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
                          {displayModels.map(m => (
                            <button key={m} type="button" onClick={() => setForm(f => ({ ...f, model:m }))}
                              style={{ padding:"2px 8px", fontSize:9,
                                border:`1px solid ${form.model===m?"var(--accent2)":"var(--border)"}`,
                                borderRadius:4, background:form.model===m?"var(--accent2)18":"transparent",
                                color:form.model===m?"var(--accent)":"var(--text3)",
                                cursor:"pointer", fontFamily:"inherit" }}>
                              {m.split("/").pop()}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {probeError && <div style={{ fontSize:10, color:"var(--danger)", marginTop:4 }}>⚠ {probeError}</div>}
                    {preset.autoDiscover && !probing && !probeError && discoveredModels.length === 0 && (
                      <button type="button" onClick={() => discoverModels(form.base_url || preset.placeholder_url)}
                        style={{ marginTop:5, fontSize:9, color:"var(--accent)", background:"none", border:"none",
                          cursor:"pointer", padding:0, fontFamily:"inherit" }}>
                        🔍 Detect models
                      </button>
                    )}
                  </div>

                  {/* Base URL */}
                  <div>
                    <Lbl>BASE URL</Lbl>
                    <input value={form.base_url}
                      onChange={e => setForm(f => ({ ...f, base_url:e.target.value }))}
                      placeholder={preset.placeholder_url} style={S.inp} />
                    {preset.autoDiscover && (
                      <div style={{ fontSize:9, color:"var(--text4)", marginTop:3 }}>
                        Change URL to re-detect models
                      </div>
                    )}
                  </div>

                  {/* API key — only for providers that need one */}
                  {preset.needsKey && (
                    <div style={{ gridColumn:"1/-1" }}>
                      <Lbl>{isEdit ? "API KEY (leave blank to keep current)" : "API KEY"}</Lbl>
                      <input type="password" value={form.api_key}
                        onChange={e => setForm(f => ({ ...f, api_key:e.target.value }))}
                        placeholder={isEdit ? "••••••••" : "sk-…"} required={!isEdit}
                        style={S.inp} />
                    </div>
                  )}
                </div>

                {/* Default checkbox */}
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:11,
                  color:"var(--text3)", cursor:"pointer" }}>
                  <input type="checkbox" checked={form.is_default}
                    onChange={e => setForm(f => ({ ...f, is_default:e.target.checked }))} />
                  Set as default provider (used when no provider is explicitly selected)
                </label>

                {/* Actions */}
                <div style={{ display:"flex", gap:8 }}>
                  <button type="submit" disabled={saving} style={{ ...S.primary, opacity:saving?0.7:1 }}>
                    {saving ? "Saving…" : isEdit ? "SAVE CHANGES" : "ADD PROVIDER"}
                  </button>
                  <button type="button" onClick={cancelForm} style={S.ghost}>CANCEL</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={openNew} style={{ ...S.primary, alignSelf:"flex-start" }}>
              + ADD PROVIDER
            </button>
          )}

          <div style={{ fontSize:10, color:"var(--text4)", lineHeight:1.6,
            borderTop:"1px solid var(--border)", paddingTop:12, marginTop:4 }}>
            🔒 API keys are encrypted with AES-256-GCM before storage. All LLM calls are proxied through the NoNote backend.
          </div>
        </div>
      </div>
    </div>
  );
}

const Lbl = ({ children }) => (
  <div style={{ fontSize:9, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:4 }}>
    {children}
  </div>
);

const Alert = ({ type, children }) => {
  const c = type === "success" ? "#4CAF50" : "var(--danger)";
  return (
    <div style={{ background:`${c}18`, border:`1px solid ${c}40`, borderRadius:8,
      padding:"9px 12px", fontSize:12, color:c }}>
      {children}
    </div>
  );
};

const S = {
  xBtn:    { background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22, lineHeight:1, padding:"0 4px" },
  inp:     { width:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:7,
             padding:"8px 10px", color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
  primary: { padding:"9px 18px", background:"var(--accent2)", border:"none", borderRadius:8,
             color:"#fff", fontSize:10, fontWeight:700, letterSpacing:1, cursor:"pointer", fontFamily:"inherit" },
  ghost:   { padding:"9px 14px", background:"var(--bg3)", border:"none", borderRadius:8,
             color:"var(--text3)", fontSize:10, fontWeight:700, letterSpacing:1, cursor:"pointer", fontFamily:"inherit" },
  danger:  { background:"none", border:"1px solid #f7816640", borderRadius:6, color:"var(--danger)",
             cursor:"pointer", fontSize:9, padding:"4px 10px", fontFamily:"inherit", fontWeight:700 },
};
