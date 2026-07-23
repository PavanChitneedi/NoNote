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
