import { useState, useRef, useEffect } from "react";

// ── Editable custom property key with duplicate detection ────────────────
export default function CustomKeyInput({ propKey, node, canEdit, onRename, style }) {
  const [val, setVal]   = useState(propKey);
  const [err, setErr]   = useState("");

  // Reset if the key changes externally (e.g. successful rename)
  const prevKey = useRef(propKey);
  useEffect(() => { if(propKey !== prevKey.current){ setVal(propKey); setErr(""); prevKey.current=propKey; }}, [propKey]);

  const takenKeys = (inputVal) => {
    const lower = inputVal.trim().toLowerCase();
    const defaultKeys = Object.keys(node.properties||{}).map(k=>k.toLowerCase());
    const customKeys  = Object.keys(node.customProps||{}).filter(k=>k!==propKey).map(k=>k.toLowerCase());
    return [...defaultKeys,...customKeys].includes(lower);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    if(v.trim() && v.trim() !== propKey && takenKeys(v))
      setErr("Name already used by another property");
    else setErr("");
  };

  const handleBlur = (e) => {
    const nk = e.target.value.trim();
    if(!nk){ setVal(propKey); setErr(""); return; }           // empty → revert
    if(nk === propKey){ setErr(""); return; }                  // unchanged → ok
    if(takenKeys(nk)){ setErr("Name already used by another property"); setVal(propKey); return; } // dupe → revert
    onRename(propKey, nk);                                     // success
    setErr("");
  };

  return (
    <div style={{flex:"0 0 42%",display:"flex",flexDirection:"column",gap:2}}>
      <input
        value={val}
        disabled={!canEdit}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={e=>{if(e.key==="Enter")e.target.blur();e.stopPropagation();}}
        placeholder="property name"
        style={{...style,
          border: err ? "1.5px solid var(--danger)" : style?.border,
          outline: err ? "none" : undefined,
          boxShadow: err ? "0 0 0 2px var(--danger)30" : undefined,
        }}
      />
      {err && <span style={{fontSize:9,color:"var(--danger)",lineHeight:1.3,paddingLeft:2}}>{err}</span>}
    </div>
  );
}
