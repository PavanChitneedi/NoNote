// Shared "Copy for AI" context builder — used by NodeCanvas topbar,
// Dashboard card menu, and multi-map export.
// NT is passed in to avoid duplicating the node-type registry.

export function buildLLMText(title, nodes, edges, NT = {}) {
  let out = `# ${title}\n_NoNote export · ${new Date().toLocaleString()}_\n\n## Summary\n${nodes.length} components · ${edges.length} connections\n\n## Components\n\n`;
  const cats = {};
  nodes.forEach(n => { const c = NT[n.type]?.cat || "General"; (cats[c] = cats[c] || []).push(n); });
  Object.entries(cats).forEach(([cat, ns]) => {
    out += `### ${cat}\n\n`;
    ns.forEach(n => {
      out += `**${n.title}** _(${NT[n.type]?.label || n.type})_\n`;
      [...Object.entries(n.properties || {}), ...Object.entries(n.customProps || n.custom_props || {})]
        .filter(([, v]) => v).forEach(([k, v]) => { out += `- ${k}: ${v}\n`; });
      if (n.node_notes && n.node_notes.trim()) {
        if (n.notes_private) out += `- Notes: [PRIVATE]\n`;
        else out += `- Notes:\n${n.node_notes.split("\n").map(l => `  ${l}`).join("\n")}\n`;
      }
      out += "\n";
    });
  });
  if (edges.length) {
    out += `## Relationships\n\n`;
    edges.forEach(e => {
      const from = e.from ?? e.from_node, to = e.to ?? e.to_node;
      const f = nodes.find(n => n.id === from), t = nodes.find(n => n.id === to);
      if (!f || !t) return;
      const edgeTypeLbl = { data: "data flow", method: "method call", network: "network link", dependency: "depends on", trigger: "triggers", other: "connects" }[e.edgeType || "data"] || "connects to";
      const verb = e.label ? `"${e.label} (${edgeTypeLbl})"` : edgeTypeLbl;
      out += `- **${f.title}** ${e.style === "bidirectional" ? "↔" : "→"} **${t.title}**: ${verb}\n`;
    });
  }
  out += `\n---\n_Paste into any LLM for review, documentation, or Q&A._`;
  return out;
}

// Combine several maps into one AI context document
export function buildMultiMapLLMText(mapsData, NT = {}) {
  const header = `# Combined context — ${mapsData.length} maps\n_NoNote multi-map export · ${new Date().toLocaleString()}_\n\nMaps included: ${mapsData.map(m => m.title).join(", ")}\n\n`;
  const body = mapsData.map(m =>
    `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    buildLLMText(m.title, m.nodes, m.edges, NT)
  ).join("");
  return header + body;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); ta.remove();
      return true;
    } catch { return false; }
  }
}

// ── Workflow Audit — heuristic time-cost + LLM prompt ──────────────
// Rough parse of free-text frequency/duration into monthly-minutes for sorting.
// Doesn't need to be exact — just enough to rank "worth automating" candidates
// before the LLM does the real reasoning.
const FREQ_PER_MONTH = { daily:30, weekly:4.3, biweekly:2, monthly:1, "ad-hoc":1, adhoc:1, quarterly:0.33, yearly:0.08 };
function parseMinutes(durationStr=""){
  const m = String(durationStr).match(/([\d.]+)\s*(h|hr|hour|m|min|minute)/i);
  if(!m) return 15;
  const n = parseFloat(m[1]);
  return /h/i.test(m[2]) ? n*60 : n;
}
function parseFreqPerMonth(freqStr=""){
  const key = String(freqStr).toLowerCase().replace(/[^a-z-]/g,"");
  return FREQ_PER_MONTH[key] ?? 4.3;
}

export function collectWorkflowTasks(nodes){
  return (nodes||[]).filter(n=>n.type==="workflow_task").map(n=>{
    const p = n.properties||{};
    const minutesPerMonth = parseMinutes(p.Duration) * parseFreqPerMonth(p.Frequency);
    return {
      id: n.id, title: n.title||"Untitled task",
      frequency: p.Frequency||"", duration: p.Duration||"", tools: p.Tools||"",
      steps: p.Steps||"", automation: p.Automation||"Manual",
      minutesPerMonth: Math.round(minutesPerMonth),
    };
  });
}

// Builds the exact instruction sent to the LLM for /api/llm/workflow-audit.
// Response MUST be JSON only — see backend route for the enforced system prompt.
export function buildWorkflowAuditMessage(nodes, mapTitle){
  const tasks = collectWorkflowTasks(nodes);
  const lines = tasks.map(t =>
    `- id:${t.id} | "${t.title}" | frequency:${t.frequency} | duration:${t.duration} | tools:${t.tools||"none listed"} | automation:${t.automation} | est.${t.minutesPerMonth} min/month | steps:${t.steps||"none listed"}`
  ).join("\n");
  return `Map: "${mapTitle||"Untitled"}"\n\nWorkflow tasks (${tasks.length}):\n${lines}\n\n` +
    `For each task not already "Automated", decide if it's worth automating (repeated + meaningful time cost). ` +
    `For automatable ones, bias suggestions toward this stack: cron, bash, n8n, Proxmox API, Home Assistant. ` +
    `Give a concrete first step, not a vague recommendation. ` +
    `Respond ONLY with JSON: {"findings":[{"id":"<task id>","automatable":true|false,"reason":"<one sentence>","suggestion":"<concrete first step>","snippet":"<a short bash/cron/n8n snippet the user can copy and run, or empty string>"}]}`;
}
