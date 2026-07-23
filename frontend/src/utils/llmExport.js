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

// ── Workflow Audit — chain detection + time-cost + LLM prompt ─────
// A "workflow" = one or more workflow_task nodes linked by edges (Step 1 → Step 2 → ...).
// A lone unlinked node is still valid — treated as a 1-step chain.
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

// Groups workflow_task nodes into ordered chains using edges between them.
// Returns [{ id, steps:[{id,title,frequency,duration,tools,automation,minutesPerMonth}], totalMinutesPerMonth }]
export function collectWorkflowChains(nodes, edges){
  const taskNodes = (nodes||[]).filter(n=>n.type==="workflow_task");
  const taskIds = new Set(taskNodes.map(n=>n.id));
  const byId = Object.fromEntries(taskNodes.map(n=>[n.id,n]));

  // Only edges connecting two workflow_task nodes count as chain links
  const links = (edges||[]).filter(e=>{
    const from = e.from ?? e.from_node, to = e.to ?? e.to_node;
    return taskIds.has(from) && taskIds.has(to);
  }).map(e=>({ from: e.from ?? e.from_node, to: e.to ?? e.to_node }));

  const hasIncoming = new Set(links.map(l=>l.to));
  const outgoing = {}; links.forEach(l=>{ (outgoing[l.from]=outgoing[l.from]||[]).push(l.to); });

  const toStep = (n) => {
    const p = n.properties||{};
    const minutesPerMonth = Math.round(parseMinutes(p.Duration) * parseFreqPerMonth(p.Frequency));
    return { id:n.id, title:n.title||"Untitled step", frequency:p.Frequency||"", duration:p.Duration||"",
      tools:p.Tools||"", automation:p.Automation||"Manual", minutesPerMonth };
  };

  // Walk each chain starting from a root (node with no incoming chain edge)
  const visited = new Set();
  const chains = [];
  taskNodes.forEach(n=>{
    if(hasIncoming.has(n.id) || visited.has(n.id)) return; // not a root, or already covered
    const steps = [];
    let cur = n.id;
    while(cur && !visited.has(cur) && byId[cur]){
      visited.add(cur);
      steps.push(toStep(byId[cur]));
      cur = (outgoing[cur]||[])[0]; // linear chain — first outgoing link
    }
    chains.push({ id:"chain-"+steps[0].id, steps, totalMinutesPerMonth: steps.reduce((a,s)=>a+s.minutesPerMonth,0) });
  });
  // Any leftover nodes caught in a cycle (rare) — treat as single-step chains
  taskNodes.forEach(n=>{ if(!visited.has(n.id)){ visited.add(n.id); chains.push({ id:"chain-"+n.id, steps:[toStep(n)], totalMinutesPerMonth: toStep(n).minutesPerMonth }); } });

  return chains;
}

// Backward-compatible flat list (used by badge time display)
export function collectWorkflowTasks(nodes){
  return (nodes||[]).filter(n=>n.type==="workflow_task").map(n=>{
    const p = n.properties||{};
    return { id:n.id, title:n.title||"Untitled task", minutesPerMonth: Math.round(parseMinutes(p.Duration)*parseFreqPerMonth(p.Frequency)) };
  });
}

// Builds the exact instruction sent to the LLM for /api/llm/workflow-audit.
// Response MUST be JSON only — see backend route for the enforced system prompt.
export function buildWorkflowAuditMessage(nodes, edges, mapTitle){
  const chains = collectWorkflowChains(nodes, edges);
  const block = chains.map(c => {
    const stepLines = c.steps.map((s,i) =>
      `    ${i+1}. id:${s.id} | "${s.title}" | frequency:${s.frequency} | duration:${s.duration} | tools:${s.tools||"none listed"} | automation:${s.automation}`
    ).join("\n");
    return `- Workflow (${c.steps.length} step${c.steps.length===1?"":"s"}, est. ${c.totalMinutesPerMonth} min/month total):\n${stepLines}`;
  }).join("\n\n");

  return `Map: "${mapTitle||"Untitled"}"\n\nWorkflows found (${chains.length}):\n\n${block}\n\n` +
    `For each workflow, decide if it (or specific steps within it) are worth automating — repeated + meaningful time cost. ` +
    `Bias suggestions toward this stack: cron, bash, n8n, Proxmox API, Home Assistant. Give a concrete first step, not a vague recommendation. ` +
    `You may flag the whole workflow OR individual step ids. ` +
    `Respond ONLY with JSON: {"findings":[{"id":"<task id, the specific step flagged>","automatable":true|false,"reason":"<one sentence>","suggestion":"<concrete first step>","snippet":"<a short bash/cron/n8n snippet the user can copy and run, or empty string>"}]}`;
}
