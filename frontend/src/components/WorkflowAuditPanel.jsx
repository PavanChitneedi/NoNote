import { useState, useMemo } from "react";
import { apiFetch } from "../api/client.js";
import { buildWorkflowAuditMessage, collectWorkflowTasks, copyText } from "../utils/llmExport.js";
import { Zap, X, Copy, Check, Loader2, AlertTriangle } from "lucide-react";

// Report + badge writer for the Workflow Audit feature.
// nodes/updateCustom come from NodeCanvas so badges land straight on the map.
export default function WorkflowAuditPanel({ nodes, mapTitle, updateCustom, onClose }) {
  const tasks = useMemo(() => collectWorkflowTasks(nodes), [nodes]);
  const [status, setStatus]     = useState(tasks.length ? "idle" : "empty"); // idle|loading|done|error
  const [findings, setFindings] = useState([]);
  const [error, setError]       = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [applied, setApplied]   = useState(false);

  const runAudit = async () => {
    setStatus("loading"); setError("");
    try {
      const message = buildWorkflowAuditMessage(nodes, mapTitle);
      const d = await apiFetch("/llm/workflow-audit", { method: "POST", body: JSON.stringify({ message }) });
      setFindings(d.findings || []);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Audit failed"); setStatus("error");
    }
  };

  const copySnippet = async (f) => {
    const ok = await copyText(f.snippet || f.suggestion || "");
    if (ok) { setCopiedId(f.id); setTimeout(() => setCopiedId(null), 1800); }
  };

  const applyBadges = () => {
    findings.filter(f => f.automatable).forEach(f => {
      updateCustom(f.id, "_auditBadge", { reason: f.reason, suggestion: f.suggestion, snippet: f.snippet || "" });
    });
    setApplied(true);
  };

  const findByTask = (id) => tasks.find(t => t.id === id);
  const automatableCount = findings.filter(f => f.automatable).length;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 940, background: "rgba(0,0,0,.45)" }} onClick={onClose} />
      <div style={{ position: "fixed", top: "8%", left: "50%", transform: "translateX(-50%)", zIndex: 941,
        width: "min(620px,94vw)", maxHeight: "84vh", display: "flex", flexDirection: "column",
        background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-panel)", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border2)" }}>
          <Zap size={16} style={{ color: "var(--accent)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Workflow Audit</div>
            <div style={{ fontSize: 10, color: "var(--text4)" }}>{tasks.length} workflow task{tasks.length===1?"":"s"} in this map</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {status === "empty" && (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text4)", fontSize: 12 }}>
              No <b>Workflow Task</b> nodes on this map yet. Add a few from the sidebar (Workflow category) —
              set Frequency, Duration, Tools, and Steps — then run the audit.
            </div>
          )}

          {status === "idle" && (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>
                Analyzes your {tasks.length} workflow task{tasks.length===1?"":"s"} for repeated manual work worth automating —
                suggestions biased toward cron, bash, n8n, Proxmox API, and Home Assistant.
              </div>
              <button onClick={runAudit} style={{ background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)",
                color: "#fff", fontWeight: 700, fontSize: 12, padding: "9px 20px", cursor: "pointer" }}>
                Run Audit
              </button>
            </div>
          )}

          {status === "loading" && (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text3)", fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Loader2 size={18} className="nn-spin" />
              Analyzing {tasks.length} task{tasks.length===1?"":"s"}…
            </div>
          )}

          {status === "error" && (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>
                <AlertTriangle size={14} /> {error}
              </div>
              <button onClick={runAudit} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                color: "var(--text)", fontSize: 12, padding: "7px 16px", cursor: "pointer" }}>Retry</button>
            </div>
          )}

          {status === "done" && (
            <>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>
                <b style={{ color: "var(--accent)" }}>{automatableCount}</b> of {findings.length} flagged as worth automating.
              </div>
              {findings.map((f, i) => {
                const t = findByTask(f.id);
                return (
                  <div key={f.id || i} style={{ background: "var(--bg3)", borderRadius: "var(--radius-md)", padding: "10px 12px", marginBottom: 8,
                    border: `1px solid ${f.automatable ? "var(--accent)44" : "var(--border2)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      {f.automatable && <Zap size={12} style={{ color: "var(--accent)" }} />}
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{t?.title || "Task"}</span>
                      {t && <span style={{ fontSize: 9, color: "var(--text4)" }}>· ~{t.minutesPerMonth} min/mo</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: f.snippet ? 6 : 0 }}>{f.reason}</div>
                    {f.suggestion && <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: f.snippet ? 6 : 0 }}>→ {f.suggestion}</div>}
                    {f.snippet && (
                      <div style={{ position: "relative" }}>
                        <pre style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontSize: 10.5,
                          color: "var(--text)", overflow: "auto", margin: 0, fontFamily: "monospace" }}>{f.snippet}</pre>
                        <button onClick={() => copySnippet(f)} title="Copy snippet"
                          style={{ position: "absolute", top: 6, right: 6, background: "var(--bg3)", border: "1px solid var(--border)",
                            borderRadius: 5, cursor: "pointer", padding: "3px 6px", color: copiedId === f.id ? "var(--success)" : "var(--text3)",
                            display: "flex", alignItems: "center", gap: 3, fontSize: 9 }}>
                          {copiedId === f.id ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {status === "done" && automatableCount > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={applyBadges} disabled={applied}
              style={{ background: applied ? "var(--bg3)" : "var(--accent)", border: "none", borderRadius: "var(--radius-md)",
                color: applied ? "var(--text4)" : "#fff", fontWeight: 700, fontSize: 11, padding: "8px 16px",
                cursor: applied ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {applied ? <><Check size={12}/> Badges applied to canvas</> : <><Zap size={12}/> Stamp badges on canvas</>}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes nnSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .nn-spin{animation:nnSpin 1s linear infinite}
      `}</style>
    </>
  );
}
