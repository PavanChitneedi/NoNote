function inlineFormat(text) {
  // Bold **text**, italic *text*, inline code `text`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} style={{color:'var(--text)',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*'))
      return <em key={i} style={{color:'var(--text2)'}}>{p.slice(1,-1)}</em>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} style={{background:'var(--bg)',borderRadius:3,
        padding:'0 3px',fontSize:10,fontFamily:'monospace',color:'#79c0ff'}}>{p.slice(1,-1)}</code>;
    return p;
  });
}

export default function FormattedContent({ content }) {
  if (!content) return null;
  const segments = content.split(/(```[\s\S]*?```)/g);
  const elements = [];
  let ki = 0;
  segments.forEach(seg => {
    if (seg.startsWith('```') && seg.endsWith('```')) {
      const inner = seg.slice(3,-3);
      const lm = inner.match(/^[a-zA-Z]+\n/);
      const code = lm ? inner.slice(lm[0].length) : inner;
      elements.push(<pre key={ki++} style={{background:'var(--bg)',border:'1px solid var(--border2)',
        borderRadius:'var(--radius-sm)',padding:'7px 9px',fontSize:10,overflowX:'auto',
        margin:'4px 0',fontFamily:'monospace',color:'var(--accent)',lineHeight:1.5,whiteSpace:'pre'}}>{code.trimEnd()}</pre>);
      return;
    }
    const lines = seg.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^---+$/.test(line.trim())) { elements.push(<hr key={ki++} style={{border:'none',borderTop:'1px solid var(--border)',margin:'6px 0'}}/>); i++; continue; }
      const hm = line.match(/^(#{1,3})\s+(.+)/);
      if (hm) { const sz={1:13,2:12,3:11}[hm[1].length]; elements.push(<div key={ki++} style={{fontWeight:700,fontSize:sz,color:'var(--text)',margin:'6px 0 2px'}}>{inlineFormat(hm[2])}</div>); i++; continue; }
      if (line.startsWith('>')) { elements.push(<div key={ki++} style={{borderLeft:'3px solid var(--accent)',paddingLeft:7,color:'var(--text3)',fontStyle:'italic',margin:'3px 0',fontSize:11}}>{inlineFormat(line.replace(/^>\s*/,''))}</div>); i++; continue; }
      if (/^[-*]\s/.test(line)) {
        const items=[];
        while(i<lines.length&&/^[-*]\s/.test(lines[i])){items.push(lines[i].replace(/^[-*]\s/,''));i++;}
        elements.push(<ul key={ki++} style={{margin:'3px 0',paddingLeft:14,listStyle:'disc'}}>{items.map((it,li)=><li key={li} style={{color:'var(--text2)',fontSize:11,lineHeight:1.6}}>{inlineFormat(it)}</li>)}</ul>);
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        const items=[];
        while(i<lines.length&&/^\d+\.\s/.test(lines[i])){items.push(lines[i].replace(/^\d+\.\s/,''));i++;}
        elements.push(<ol key={ki++} style={{margin:'3px 0',paddingLeft:14}}>{items.map((it,li)=><li key={li} style={{color:'var(--text2)',fontSize:11,lineHeight:1.6}}>{inlineFormat(it)}</li>)}</ol>);
        continue;
      }
      if (line.trim()==='') { elements.push(<div key={ki++} style={{height:4}}/>); i++; continue; }
      elements.push(<div key={ki++} style={{color:'var(--text2)',fontSize:11,lineHeight:1.6}}>{inlineFormat(line)}</div>);
      i++;
    }
  });
  return <div style={{display:'flex',flexDirection:'column'}}>{elements}</div>;
}
