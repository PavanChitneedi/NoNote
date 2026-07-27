// ── Highlight matched text (returns JSX spans) ────────────────
export function highlightText(text, query) {
  if(!query||!text) return text||"";
  const str = String(text), q = query.trim();
  const low = str.toLowerCase(), ql = q.toLowerCase();
  const idx = low.indexOf(ql);
  if(idx<0) return str;
  return <span>
    {str.slice(0,idx)}
    <mark style={{background:"var(--accent2)",color:"#fff",borderRadius:2,padding:"0 1px",fontSize:"inherit"}}>
      {str.slice(idx,idx+q.length)}
    </mark>
    {str.slice(idx+q.length)}
  </span>;
}
