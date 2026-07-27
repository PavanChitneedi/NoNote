// ── Lucide icon renderer ─────────────────────────────────────────────────
// icon can be a Lucide component (new) or a string emoji (legacy/canvas fallback)
export default function NodeIcon({ icon, size=18, color="currentColor", strokeWidth=1.8 }) {
  if (!icon) return null;
  if (typeof icon === "string") return <span style={{fontSize:size,lineHeight:1}}>{icon}</span>;
  const I = icon;
  return <I size={size} color={color} strokeWidth={strokeWidth} style={{flexShrink:0}} />;
}
