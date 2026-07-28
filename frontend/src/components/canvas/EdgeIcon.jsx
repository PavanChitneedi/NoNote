import { EDGE_STYLES } from "../../lib/edgeRouting.js";

// Arrow marker paths
const ArrowHead = ({x,y,dir=1,col,arrowSize})=>(
  <polygon
    points={`${x},${y} ${x-dir*arrowSize},${y-arrowSize*.55} ${x-dir*arrowSize},${y+arrowSize*.55}`}
    fill={col}/>
);

// ── EdgeIcon — SVG preview of a connection style ──────────────
export default function EdgeIcon({ styleKey, size=40, active=false, color="var(--text3)" }) {
  const s = EDGE_STYLES[styleKey];
  if(!s) return null;
  const w=size, h=Math.round(size*0.55);
  const x1=6, x2=w-8, y=h/2;
  const dash = s.dash==="none" ? "none"
    : s.dash==="8,5" ? `${Math.round(size*.14)},${Math.round(size*.09)}`
    : `${Math.round(size*.035)},${Math.round(size*.09)}`;
  const sw = s.strokeW>=4 ? Math.round(size*.075) : Math.round(size*.045);
  const col = active?"var(--accent)":color;
  const arrowSize = Math.round(size*.13);

  // Wave path
  const wavePath = ()=>{
    const segs=5; const segW=(x2-x1)/segs;
    let d=`M ${x1} ${y}`;
    for(let i=0;i<segs;i++){
      const cx1=x1+i*segW+segW*.25, cy1=y-(h*.2);
      const cx2=x1+i*segW+segW*.75, cy2=y+(h*.2);
      const ex=x1+(i+1)*segW;
      d+=` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${y}`;
    }
    return d;
  };

  // Double line
  const offset=Math.round(size*.07);

  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:"block",overflow:"visible"}}>
      {s.wave?(
        <path d={wavePath()} stroke={col} strokeWidth={sw} fill="none"
          strokeDasharray={dash!=="none"?dash:undefined}/>
      ):s.strokeW>=1.5&&s.strokeW<2?(
        // Double line
        <>
          <line x1={x1} y1={y-offset} x2={x2} y2={y-offset} stroke={col} strokeWidth={sw*.7} fill="none"
            strokeDasharray={dash!=="none"?dash:undefined}/>
          <line x1={x1} y1={y+offset} x2={x2} y2={y+offset} stroke={col} strokeWidth={sw*.7} fill="none"
            strokeDasharray={dash!=="none"?dash:undefined}/>
        </>
      ):(
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={col} strokeWidth={sw} fill="none"
          strokeDasharray={dash!=="none"?dash:undefined}
          strokeLinecap="round"/>
      )}
      {/* End arrowhead */}
      {s.mEnd&&<ArrowHead x={x2} y={y} dir={1} col={col} arrowSize={arrowSize}/>}
      {/* Start arrowhead */}
      {s.mStart&&<ArrowHead x={x1} y={y} dir={-1} col={col} arrowSize={arrowSize}/>}
    </svg>
  );
}
