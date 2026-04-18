/**
 * DocExportModal — Word (.docx) and PDF export in Normal and AI modes.
 *
 * Modes:
 *   "normal-docx"  — structured docx built from nodes/notes/connections
 *   "ai-docx"      — LLM interprets map → docx
 *   "normal-pdf"   — same structured content → styled HTML print page
 *   "ai-pdf"       — LLM interprets → styled HTML print page
 */

import { useState, useEffect } from "react";
import { apiFetch } from "../api/client.js";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  BorderStyle, ShadingType, Table, TableRow, TableCell,
  WidthType, AlignmentType, LevelFormat,
} from "docx";

const NT_LABELS = {
  note:"Note", heading:"Heading", user:"User", process:"Process",
  decision:"Decision", annotation:"Comment",
  router:"Router", switch:"Switch", firewall:"Firewall", server:"Server",
  webserver:"Web Server", database:"Database", api:"API", service:"Service",
  cloud:"Cloud", container:"Container", k8s:"Kubernetes",
  microservice:"Microservice", cache:"Cache", storage:"Storage",
  mobile:"Mobile", laptop:"Laptop", desktop:"Desktop",
  ids:"IDS/IPS", waf:"WAF", vault:"Vault",
};

// ── Build structured sections from map data ──────────────────────────────
function buildNormalSections(nodes, edges, title) {
  const sections = [];
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  sections.push({ type:"h1", text:"Overview" });
  sections.push({ type:"p", text:`This document describes "${title}" — a map containing ${nodes.length} components and ${edges.length} connections. Exported from NoNote on ${new Date().toLocaleDateString("en-GB", { dateStyle:"long" })}.` });
  sections.push({ type:"divider" });

  // Group by type category
  const byCat = {};
  nodes.forEach(n => {
    const cat = n.type || "note";
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(n);
  });

  sections.push({ type:"h1", text:"Components" });
  Object.entries(byCat).forEach(([type, group]) => {
    const label = NT_LABELS[type] || type;
    sections.push({ type:"h2", text:`${label} (${group.length})` });
    group.forEach(node => {
      sections.push({ type:"h3", text: node.title || "Untitled" });
      if (node.description) sections.push({ type:"p", text: node.description });
      sections.push({ type:"label", label:"Type", value: label });

      const notes = Array.isArray(node.notes)
        ? node.notes.filter(n => !n?.sensitive)
        : [];
      if (notes.length) {
        notes.forEach(note => {
          const text = typeof note === "string" ? note : (note?.content || "");
          if (text) sections.push({ type:"note", text });
        });
      }
      Object.entries(node.properties || {}).filter(([,v]) => v).forEach(([k,v]) => {
        sections.push({ type:"label", label: k, value: String(v) });
      });
      sections.push({ type:"divider" });
    });
  });

  if (edges.length) {
    sections.push({ type:"h1", text:"Connections" });
    sections.push({
      type:"table",
      headers:["From","To","Label","Style"],
      rows: edges.map(e => [
        nodeMap[e.from]?.title || e.from,
        nodeMap[e.to]?.title   || e.to,
        e.label || "—",
        e.style  || "arrow",
      ]),
    });
  }
  return sections;
}

// ── Build LLM prompt ──────────────────────────────────────────────────────
function buildLLMPrompt(nodes, edges, title) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  return [
    `You are a senior technical writer. Convert this NoNote diagram into professional documentation.`,
    `Map: "${title}"`,
    ``,
    `NODES (${nodes.length}):`,
    ...nodes.map(n => {
      const notes = (Array.isArray(n.notes) ? n.notes : [])
        .filter(x => !x?.sensitive)
        .map(x => typeof x === "string" ? x : x?.content)
        .filter(Boolean);
      return `- [${(NT_LABELS[n.type] || n.type).toUpperCase()}] ${n.title}${n.description ? `: ${n.description}` : ""}${notes.length ? ` | Notes: ${notes.join("; ")}` : ""}`;
    }),
    ``,
    `CONNECTIONS (${edges.length}):`,
    ...edges.map(e => `- ${nodeMap[e.from]?.title || "?"} → ${nodeMap[e.to]?.title || "?"}${e.label ? ` (${e.label})` : ""}`),
    ``,
    `Write a professional technical document with these sections:`,
    `1. Executive Summary (what this system does)`,
    `2. Architecture Overview`,
    `3. Component Details (group logically)`,
    `4. Data / Control Flow`,
    `5. Key Relationships`,
    ``,
    `Return ONLY a JSON array (no markdown, no preamble). Each element:`,
    `{"type":"h1"|"h2"|"h3"|"p"|"note"|"divider","text":"..."}`,
  ].join("\n");
}

// ── Generate Word docx from sections ─────────────────────────────────────
async function generateDocx(title, sections) {
  const BLUE = "1F6FEB";
  const GREY = "888888";
  const W = 9360; // content width in DXA (US Letter, 1" margins each side)

  const border1 = { style: BorderStyle.SINGLE, size:1, color:"DDDDDD" };
  const borders = { top:border1, bottom:border1, left:border1, right:border1 };

  const children = [
    // Title
    new Paragraph({ children:[new TextRun({ text:title, bold:true, size:52, color:"111111" })], spacing:{ after:120 } }),
    new Paragraph({ children:[new TextRun({ text:`NoNote Export  ·  ${new Date().toLocaleDateString("en-GB",{dateStyle:"long"})}`, size:18, color:GREY, italics:true })], spacing:{ after:480 } }),
  ];

  const addP = (sec) => {
    if (sec.type === "h1") {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children:[new TextRun({ text:sec.text, bold:true, size:32, color:BLUE })],
        spacing:{ before:480, after:160 },
      }));
    } else if (sec.type === "h2") {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children:[new TextRun({ text:sec.text, bold:true, size:26 })],
        spacing:{ before:320, after:120 },
      }));
    } else if (sec.type === "h3") {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children:[new TextRun({ text:sec.text, bold:true, size:22 })],
        spacing:{ before:200, after:80 },
      }));
    } else if (sec.type === "p") {
      children.push(new Paragraph({
        children:[new TextRun({ text:sec.text, size:22 })],
        spacing:{ after:120 },
      }));
    } else if (sec.type === "label") {
      children.push(new Paragraph({
        children:[
          new TextRun({ text:`${sec.label}: `, bold:true, size:20, color:"444444" }),
          new TextRun({ text:sec.value, size:20 }),
        ],
        spacing:{ after:60 },
        indent:{ left:360 },
      }));
    } else if (sec.type === "note") {
      children.push(new Paragraph({
        children:[new TextRun({ text:sec.text, size:20, color:"333333", italics:true })],
        indent:{ left:720 },
        spacing:{ after:80 },
        border:{ left:{ style:BorderStyle.SINGLE, size:8, color:BLUE } },
      }));
    } else if (sec.type === "divider") {
      children.push(new Paragraph({
        children:[new TextRun("")],
        border:{ bottom:{ style:BorderStyle.SINGLE, size:4, color:"EEEEEE" } },
        spacing:{ after:160 },
      }));
    } else if (sec.type === "table") {
      const colW = Math.floor(W / sec.headers.length);
      children.push(new Table({
        width:{ size:W, type:WidthType.DXA },
        columnWidths: sec.headers.map(() => colW),
        rows:[
          new TableRow({
            tableHeader:true,
            children: sec.headers.map(h => new TableCell({
              borders, width:{ size:colW, type:WidthType.DXA },
              shading:{ fill:"1E3A5F", type:ShadingType.CLEAR },
              margins:{ top:80, bottom:80, left:120, right:120 },
              children:[new Paragraph({ children:[new TextRun({ text:h, bold:true, color:"FFFFFF", size:20 })] })],
            })),
          }),
          ...sec.rows.map((row, ri) => new TableRow({
            children: row.map(cell => new TableCell({
              borders, width:{ size:colW, type:WidthType.DXA },
              shading:{ fill: ri%2===0?"F5F7FA":"FFFFFF", type:ShadingType.CLEAR },
              margins:{ top:60, bottom:60, left:120, right:120 },
              children:[new Paragraph({ children:[new TextRun({ text:String(cell||""), size:20 })] })],
            })),
          })),
        ],
      }));
      children.push(new Paragraph({ children:[new TextRun("")], spacing:{ after:240 } }));
    }
  };

  sections.forEach(addP);

  const doc = new Document({
    styles:{
      default:{ document:{ run:{ font:"Calibri", size:22 } } },
      paragraphStyles:[
        { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true, run:{ size:32, bold:true, font:"Calibri", color:BLUE }, paragraph:{ spacing:{ before:480, after:160 }, outlineLevel:0 } },
        { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true, run:{ size:26, bold:true, font:"Calibri" }, paragraph:{ spacing:{ before:320, after:120 }, outlineLevel:1 } },
        { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true, run:{ size:22, bold:true, font:"Calibri" }, paragraph:{ spacing:{ before:200, after:80 }, outlineLevel:2 } },
      ],
    },
    sections:[{
      properties:{
        page:{ size:{ width:12240, height:15840 }, margin:{ top:1440, right:1440, bottom:1440, left:1440 } },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}

// ── Generate PDF via styled HTML print page ───────────────────────────────
function generatePDF(title, sections) {
  const rows = sections.map(s => {
    if (s.type === "h1")      return `<h1>${esc(s.text)}</h1>`;
    if (s.type === "h2")      return `<h2>${esc(s.text)}</h2>`;
    if (s.type === "h3")      return `<h3>${esc(s.text)}</h3>`;
    if (s.type === "p")       return `<p>${esc(s.text)}</p>`;
    if (s.type === "divider") return `<hr>`;
    if (s.type === "label")   return `<p class="lbl"><strong>${esc(s.label)}:</strong> ${esc(s.value)}</p>`;
    if (s.type === "note")    return `<blockquote>${esc(s.text)}</blockquote>`;
    if (s.type === "table") {
      const headers = s.headers.map(h => `<th>${esc(h)}</th>`).join("");
      const body = s.rows.map(row =>
        `<tr>${row.map(c => `<td>${esc(String(c||""))}</td>`).join("")}</tr>`
      ).join("");
      return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
    }
    return "";
  }).join("\n");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Calibri, "Segoe UI", Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
  .cover { border-bottom: 3px solid #1f6feb; padding-bottom: 24px; margin-bottom: 32px; }
  .cover h1 { font-size: 26pt; font-weight: 700; color: #111; margin-bottom: 6px; }
  .cover .meta { font-size: 10pt; color: #777; font-style: italic; }
  h1 { font-size: 18pt; color: #1f6feb; margin: 32px 0 10px; border-bottom: 1px solid #e0e8f4; padding-bottom: 4px; }
  h2 { font-size: 14pt; color: #1a1a2e; margin: 22px 0 8px; }
  h3 { font-size: 12pt; color: #2a2a3a; margin: 16px 0 6px; }
  p { margin: 6px 0; line-height: 1.6; }
  .lbl { margin: 3px 0 3px 20px; font-size: 10pt; color: #333; }
  blockquote { margin: 6px 0 6px 24px; padding: 6px 12px; border-left: 4px solid #1f6feb; background: #f0f5ff; color: #333; font-style: italic; font-size: 10pt; border-radius: 0 4px 4px 0; }
  hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 10pt; }
  th { background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  tr:nth-child(even) td { background: #f5f7fa; }
  td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
  @media print {
    body { padding: 20px; max-width: none; }
    @page { margin: 1.5cm; }
    h1 { page-break-before: auto; }
    h2, h3 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
</style>
</head><body>
<div class="cover">
  <h1>${esc(title)}</h1>
  <div class="meta">NoNote Export &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-GB",{dateStyle:"long"})}</div>
</div>
${rows}
<script>
  // Auto-trigger print dialog when page loads
  window.onload = () => { window.focus(); window.print(); };
</script>
</body></html>`;

  const blob = new Blob([html], { type:"text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) {
    // Fallback: download HTML file
    const a = document.createElement("a");
    a.href = url; a.download = `${sanitize(title)}.html`; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function sanitize(s) { return String(s||"map").replace(/[^a-z0-9]/gi,"-"); }

// ── Call LLM API ──────────────────────────────────────────────────────────
async function callLLM(prompt) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:4000,
      messages:[{ role:"user", content:prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`LLM API error: ${resp.status}`);
  const data = await resp.json();
  const raw  = data.content?.[0]?.text || "";
  const clean = raw.replace(/```json\n?|```/g,"").trim();
  return JSON.parse(clean);
}

// ── Main modal component ──────────────────────────────────────────────────
const MODE_INFO = {
  "normal-docx": { icon:"📄", label:"Standard Word Export",   sub:"Structured documentation built directly from your nodes, notes, and connections" },
  "ai-docx":     { icon:"🤖", label:"AI Word Export",          sub:"LLM reads and interprets your entire map into professional documentation" },
  "normal-pdf":  { icon:"🖨", label:"Standard PDF Export",     sub:"Same structured content as Word, opened as a print-ready page (Save as PDF)" },
  "ai-pdf":      { icon:"🤖", label:"AI PDF Export",           sub:"LLM interprets your map, then opens a print-ready page for saving as PDF" },
};

export default function DocExportModal({ nodes, edges, mapTitle, mode, onClose }) {
  const [status,   setStatus]   = useState("idle");
  const [progress, setProgress] = useState("");

  const info = MODE_INFO[mode] || MODE_INFO["normal-docx"];
  const isAI = mode.startsWith("ai-");
  const isPDF = mode.endsWith("-pdf");

  const noteCount = nodes.reduce((a,n) =>
    a + (Array.isArray(n.notes) ? n.notes.filter(x => !x?.sensitive).length : 0), 0);

  const doExport = async () => {
    setStatus("generating");
    try {
      let sections;

      if (isAI) {
        setProgress("Sending map to AI for interpretation…");
        const prompt = buildLLMPrompt(nodes, edges, mapTitle);
        try {
          sections = await callLLM(prompt);
        } catch (e) {
          // Try backend LLM proxy
          setProgress("Trying configured LLM provider…");
          const r = await apiFetch("/llm/chat-simple", {
            method:"POST",
            body:JSON.stringify({ message: prompt }),
          });
          const raw = r.response || r.content || "";
          sections = JSON.parse(raw.replace(/```json\n?|```/g,"").trim());
        }
        setProgress("AI response received, building document…");
      } else {
        setProgress("Building document…");
        sections = buildNormalSections(nodes, edges, mapTitle);
      }

      if (isPDF) {
        setProgress("Opening print page…");
        generatePDF(mapTitle, sections);
        setStatus("done");
        setProgress("Print page opened! Use Ctrl+P / Cmd+P → Save as PDF.");
      } else {
        setProgress("Generating Word file…");
        const blob = await generateDocx(mapTitle, sections);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url;
        a.download = `${sanitize(mapTitle)}${isAI?"-ai":""}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus("done");
        setProgress("Word document downloaded!");
      }
    } catch (err) {
      console.error("[DocExport]", err);
      setStatus("error");
      setProgress(err.message || "Export failed. Check browser console for details.");
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900,
      background:"rgba(0,0,0,.72)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:"var(--bg2)", border:"1.5px solid var(--border)",
          borderRadius:14, boxShadow:"0 24px 72px rgba(0,0,0,.7)",
          width:"min(480px,94vw)", padding:28, display:"flex", flexDirection:"column", gap:18 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
          <span style={{ fontSize:24, flexShrink:0, marginTop:2 }}>{info.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{info.label}</div>
            <div style={{ fontSize:11, color:"var(--text4)", marginTop:3, lineHeight:1.4 }}>{info.sub}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none",
            fontSize:22, color:"var(--text4)", cursor:"pointer", flexShrink:0 }}>×</button>
        </div>

        {/* What you'll get */}
        <div style={{ background:"var(--bg3)", borderRadius:8, padding:"12px 16px",
          border:`1px solid ${isAI?"var(--accent)30":"var(--border)"}` }}>
          {isAI ? (
            <div style={{ fontSize:12, color:"var(--text3)", lineHeight:1.65 }}>
              <strong style={{ color:"var(--text)" }}>The AI will:</strong><br/>
              • Read every node, description, note, and connection<br/>
              • Interpret the system architecture and write meaningful prose<br/>
              • Structure it with executive summary, component groups, data flow<br/>
              • {isPDF ? "Open a print-ready page — save as PDF with Ctrl+P" : "Generate a properly formatted Word document"}
            </div>
          ) : (
            <div style={{ fontSize:12, color:"var(--text3)", lineHeight:1.65 }}>
              <strong style={{ color:"var(--text)" }}>What you'll get:</strong><br/>
              • Overview paragraph with node/connection summary<br/>
              • Components section — each node with type, description, notes, properties<br/>
              • Connections table showing all relationships<br/>
              • {isPDF ? "Print-ready page — Ctrl+P → Save as PDF" : "Proper Word headings, Calibri font, 1\" margins, US Letter"}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:10 }}>
          {[["Nodes", nodes.length], ["Connections", edges.length], ["Notes", noteCount]].map(([l,c]) => (
            <div key={l} style={{ flex:1, background:"var(--bg3)", borderRadius:8,
              padding:"10px 14px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:700, color:"var(--accent)" }}>{c}</div>
              <div style={{ fontSize:10, color:"var(--text4)", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* PDF note */}
        {isPDF && (
          <div style={{ background:"#f59e0b14", border:"1px solid #f59e0b40",
            borderRadius:8, padding:"8px 14px", fontSize:11, color:"#d97706", lineHeight:1.5 }}>
            💡 A styled page will open in a new tab. Use <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac) and choose <strong>"Save as PDF"</strong> as the printer destination.
          </div>
        )}

        {/* Status */}
        {progress && (
          <div style={{ fontSize:12, color: status==="error"?"var(--danger)":status==="done"?"var(--success)":"var(--text3)",
            display:"flex", alignItems:"center", gap:8, lineHeight:1.5 }}>
            {status === "generating" && (
              <div style={{ width:12, height:12, border:"2px solid var(--accent)",
                borderTopColor:"transparent", borderRadius:"50%",
                animation:"spin .8s linear infinite", flexShrink:0 }}/>
            )}
            {status === "done" && <span>✓</span>}
            {status === "error" && <span>✗</span>}
            {progress}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose}
            style={{ padding:"10px 18px", background:"var(--bg3)", border:"1px solid var(--border)",
              borderRadius:8, color:"var(--text3)", cursor:"pointer", fontSize:13,
              fontFamily:"var(--font-ui)", fontWeight:600 }}>
            {status==="done" ? "Close" : "Cancel"}
          </button>
          <button onClick={doExport} disabled={status==="generating"}
            style={{ flex:1, padding:"10px 18px",
              background: status==="generating" ? "var(--bg3)" : "var(--accent2)",
              border:"none", borderRadius:8,
              color: status==="generating" ? "var(--text4)" : "#fff",
              cursor: status==="generating" ? "not-allowed" : "pointer",
              fontSize:13, fontWeight:700, fontFamily:"var(--font-ui)" }}>
            {status==="generating" ? "Working…"
              : status==="done" ? `Export Again ↓`
              : isPDF ? `Open PDF Page ↗`
              : `Export as Word (.docx) ↓`}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
