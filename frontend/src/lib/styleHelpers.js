// ── Style helpers — shared inline-style object factories ─────────────────
export const tbtn=(active,color="var(--accent2)")=>({
  padding:"5px 10px",border:"none",borderRadius:"var(--radius-btn)",cursor:"pointer",
  fontSize:11,fontWeight:"var(--font-weight-ui)",flexShrink:0,
  letterSpacing:"var(--letter-space)",
  background:active?color:"var(--bg3)",
  color:active?"#fff":"var(--text3)",
  transition:"var(--transition-all)",
});
// Icon-only square button — tooltip via `title` attribute
export const iBtn=(active,ac="var(--accent2)")=>({
  background:active?`${ac}22`:"transparent",
  color:active?ac:"var(--text3)",
  border:active?`1px solid ${ac}55`:"1px solid transparent",
  borderRadius:"var(--radius-sm)",padding:"4px 6px",
  cursor:"pointer",fontSize:14,fontFamily:"var(--font-ui)",
  transition:"all .15s",display:"inline-flex",
  alignItems:"center",justifyContent:"center",
  minWidth:28,lineHeight:1,
});
export const inp=()=>({
  width:"100%",background:"var(--bg)",
  borderRadius:"var(--radius-sm)",padding:"7px 9px",color:"var(--text)",
  fontSize:"inherit",fontFamily:"inherit",marginTop:3,
  boxSizing:"border-box",outline:"none",
});
