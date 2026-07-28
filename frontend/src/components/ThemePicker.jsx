import { useState } from "react";
import { useTheme, THEMES, THEME_GROUPS } from "../context/ThemeContext.jsx";
import { useSkin } from "../context/SkinContext.jsx";
import { SKINS, SKIN_KEYS } from "../skins.js";

export default function ThemePicker({ onClose }) {
  const { themeName, setThemeName } = useTheme();
  const { skinName, setSkinName } = useSkin();
  const [tab, setTab] = useState("theme"); // "theme" | "skin"
  const [showAll, setShowAll] = useState(false); // reveal extra themes/skins

  const overlay = {
    position:"fixed",inset:0,zIndex:500,
    background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",
    display:"flex",alignItems:"center",justifyContent:"center",padding:20,
  };
  const modal = {
    background:"var(--bg2)",border:"1px solid var(--border)",
    borderRadius:"var(--radius-lg)",width:520,
    boxShadow:"var(--shadow-panel)",overflow:"hidden",
    animation:"nn-slide-in-up 0.2s cubic-bezier(0.34,1.56,0.64,1)",
  };
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"16px 20px 0",display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Appearance</div>
            <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>Customize how NoNote looks and feels</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:22,padding:4,lineHeight:1}}>×</button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",margin:"14px 20px 0",background:"var(--bg3)",borderRadius:"var(--radius-sm)",padding:2,gap:2}}>
          {[["theme","🎨 Color"],["skin","✦ Personality"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              flex:1,padding:"7px 0",border:"none",cursor:"pointer",borderRadius:"calc(var(--radius-sm) - 2px)",
              fontFamily:"var(--font-ui)",fontWeight:600,fontSize:11,
              background:tab===id?"var(--accent)":"transparent",
              color:tab===id?"#fff":"var(--text3)",
              transition:"all 0.14s",
            }}>{label}</button>
          ))}
          <button onClick={()=>setShowAll(v=>!v)} title="A focused core set is shown by default — reveal every theme & skin"
            style={{padding:"7px 10px",border:"none",cursor:"pointer",borderRadius:"calc(var(--radius-sm) - 2px)",
              fontFamily:"var(--font-ui)",fontWeight:600,fontSize:10,
              background:showAll?"var(--accent2)":"transparent",color:showAll?"#fff":"var(--text4)",
              transition:"all 0.14s",whiteSpace:"nowrap"}}>{showAll?"Core only":"Show all"}</button>
        </div>
        {tab==="theme"&&(
          <div style={{padding:20}}>
            {["Dark","Light"].map(group=>(
              <div key={group} style={{marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",marginBottom:10,textTransform:"uppercase"}}>{group}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                  {THEME_GROUPS[group].filter(k=>showAll||!THEMES[k].extra||themeName===k).map(key=>{
                    const t=THEMES[key];
                    const active=themeName===key;
                    const bg=t.vars["--bg2"];
                    const nodeBg=t.vars["--node-bg"];
                    const accent=t.vars["--accent"];
                    const text=t.vars["--text"];
                    const text2=t.vars["--text2"];
                    const border=t.vars["--border"];
                    return(
                      <button key={key} onClick={()=>setThemeName(key)} style={{
                        background:bg,border:`2px solid ${active?accent:border}`,
                        borderRadius:10,padding:"10px 10px 8px",cursor:"pointer",
                        textAlign:"left",position:"relative",
                        boxShadow:active?`0 0 0 1px ${accent}55, 0 4px 16px rgba(0,0,0,0.15)`:"0 2px 8px rgba(0,0,0,0.1)",
                        transition:"all 0.14s",
                      }}
                      onMouseEnter={e=>{if(!active)e.currentTarget.style.borderColor=accent+"88"}}
                      onMouseLeave={e=>{if(!active)e.currentTarget.style.borderColor=border}}>
                        {/* Checkmark */}
                        {active&&<div style={{position:"absolute",top:7,right:7,width:14,height:14,borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff"}}>✓</div>}
                        {/* Mini node preview */}
                        <div style={{background:nodeBg,borderRadius:6,padding:"5px 7px",marginBottom:8,
                          borderTop:`2px solid ${accent}`,border:`1px solid ${border}`}}>
                          <div style={{width:"65%",height:4,background:text,borderRadius:2,opacity:.8,marginBottom:3}}/>
                          <div style={{width:"42%",height:3,background:text2,borderRadius:2,opacity:.5}}/>
                        </div>
                        {/* Swatches */}
                        <div style={{display:"flex",gap:3,marginBottom:7}}>
                          {[t.vars["--accent"],t.vars["--success"],t.vars["--danger"],text,text2].map((c,i)=>(
                            <div key={i} style={{width:10,height:10,borderRadius:"50%",background:c,flexShrink:0}}/>
                          ))}
                        </div>
                        <div style={{fontSize:11,fontWeight:700,color:text,lineHeight:1.2}}>{t.icon} {t.name}</div>
                        <div style={{fontSize:9,color:text2,marginTop:2,opacity:.7,lineHeight:1.3}}>{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skin tab */}
        {tab==="skin"&&(
          <div style={{padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {SKIN_KEYS.filter(k=>showAll||!SKINS[k].extra||skinName===k).map(key=>{
                const s=SKINS[key];
                const active=skinName===key;
                return(
                  <button key={key} onClick={()=>setSkinName(key)} style={{
                    background:"var(--bg3)",border:`2px solid ${active?"var(--accent)":"var(--border)"}`,
                    borderRadius:"var(--radius-md)",padding:"14px 16px",cursor:"pointer",
                    textAlign:"left",position:"relative",
                    boxShadow:active?"0 0 0 1px var(--accent)44":"none",
                    transition:"all 0.14s",
                  }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.borderColor="var(--accent)66"}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.borderColor="var(--border)"}}>
                    {active&&<div style={{position:"absolute",top:10,right:10,width:16,height:16,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>✓</div>}
                    {/* Font preview */}
                    <div style={{fontFamily:s.vars["--font-ui"],fontSize:15,fontWeight:s.vars["--font-weight-node"],color:"var(--text)",marginBottom:5,letterSpacing:s.vars["--letter-space"]}}>
                      {s.icon} {s.name}
                    </div>
                    {/* Radius preview */}
                    <div style={{display:"flex",gap:5,marginBottom:8,alignItems:"center"}}>
                      {[s.vars["--radius-xs"],s.vars["--radius-sm"],s.vars["--radius-md"]].map((r,i)=>(
                        <div key={i} style={{width:16+i*6,height:12+i*4,borderRadius:r,background:"var(--accent)",opacity:0.5+i*0.15}}/>
                      ))}
                      <span style={{fontSize:9,color:"var(--text3)",marginLeft:2}}>radius</span>
                    </div>
                    <div style={{fontSize:10,color:"var(--text2)",lineHeight:1.4,fontFamily:s.vars["--font-ui"]}}>{s.desc}</div>
                    <div style={{fontSize:9,color:"var(--text3)",marginTop:4}}>Default color: {THEMES[s.defaultTheme]?.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Apply skin's default theme */}
            {skinName && SKINS[skinName]?.defaultTheme !== themeName && (
              <div style={{marginTop:14,padding:"10px 14px",background:"var(--accent)11",border:"1px solid var(--accent)30",borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",gap:10,fontSize:11}}>
                <span style={{color:"var(--text2)"}}>This skin pairs well with <strong style={{color:"var(--accent)"}}>{THEMES[SKINS[skinName].defaultTheme]?.name}</strong></span>
                <button onClick={()=>setThemeName(SKINS[skinName].defaultTheme)} style={{
                  marginLeft:"auto",background:"var(--accent)",border:"none",borderRadius:"var(--radius-xs)",
                  color:"#fff",padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-ui)",
                }}>Apply</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
