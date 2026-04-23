import React, { useState, useEffect, useRef, useCallback } from 'react';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
const DB_ID = "gestor_principal";

async function dbLoad() {
  try {
    var res = await fetch(SUPABASE_URL + "/rest/v1/gestor_datos?id=eq." + DB_ID + "&select=data", {
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    });
    var rows = await res.json();
    if (rows && rows.length > 0) return rows[0].data;
    return null;
  } catch(e) { console.error("dbLoad error", e); return null; }
}

async function dbSave(data) {
  try {
    await fetch(SUPABASE_URL + "/rest/v1/gestor_datos", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id: DB_ID, data: data, updated_at: new Date().toISOString() }),
    });
  } catch(e) { console.error("dbSave error", e); }
}

const STATUSES = ["pendiente","en curso","completado","urgente"];
const SL = { pendiente:"Pendiente","en curso":"En curso",completado:"Completado",urgente:"Urgente" };
const SC = {
  pendiente:  { bg:"#1A2F10", border:"#8DC63F", text:"#B5E36A", dot:"#8DC63F" },
  "en curso": { bg:"#082030", border:"#00B4D8", text:"#5DCFEA", dot:"#00B4D8" },
  completado: { bg:"#082028", border:"#0077B6", text:"#4AABDC", dot:"#0077B6" },
  urgente:    { bg:"#2A0A0A", border:"#E24B4A", text:"#F09595", dot:"#E24B4A" },
};
const DEF_AREAS    = ["Administración","Contabilidad","Calidad","Sistemas"];
const DEF_PROJECTS = ["Sin proyecto"];
const DEF_PEOPLE   = ["María García","Juan Pérez","Laura Rodríguez"];
const DEF_MEET_CATS= ["Administración","Calidad","Logística","Diego"];
const PIE_C = ["#00B4D8","#8DC63F","#0077B6","#E24B4A","#FACC15","#06B6D4","#EC4899","#84CC16"];
const MONTHS_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const WDAYS   = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
const PLAN_MONTHS = ["Abr 2026","May 2026","Jun 2026","Jul 2026","Ago 2026","Sep 2026","Oct 2026","Nov 2026","Dic 2026","Ene 2027","Feb 2027","Mar 2027"];

const th = {
  bg:"#0D1B2E",
  surface:"#132338",
  s2:"#1B2F4A",
  border:"#1E3A5F",
  borderHi:"#2A5080",
  text:"#E8F4FC",
  muted:"#6B9AB8",
  accent:"#00B4D8",
  accentBg:"#082030",
};

const SEC = {
  dashboard:     { color:"#00B4D8", bg:"#082030", border:"#00B4D844" },
  tareas:        { color:"#8DC63F", bg:"#0F1E08", border:"#8DC63F44" },
  historial:     { color:"#00B4D8", bg:"#082030", border:"#00B4D844" },
  objetivos:     { color:"#8DC63F", bg:"#0F1E08", border:"#8DC63F44" },
  reuniones:     { color:"#0077B6", bg:"#081828", border:"#0077B644" },
  indicadores:   { color:"#00B4D8", bg:"#082030", border:"#00B4D844" },
  notas:         { color:"#8DC63F", bg:"#0F1E08", border:"#8DC63F44" },
  configuración: { color:"#6B9AB8", bg:"#132338", border:"#6B9AB844" },
};

const I = {
  width:"100%", boxSizing:"border-box", padding:"8px 11px",
  borderRadius:8, border:`1.5px solid ${th.borderHi}`,
  fontSize:13, background:th.s2, color:th.text, outline:"none",
};
const FI = {
  width:"100%", boxSizing:"border-box", padding:"9px 12px",
  fontSize:14, background:"transparent", color:th.text, border:"none", outline:"none",
};
const EMPTY_FORM = {
  title:"", desc:"", status:"pendiente", area:"", project:"",
  due:"", responsibles:[], freeResp:"", url:"",
};

function btn(v, extra) {
  var base = {
    padding:"7px 15px", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer",
    border: v==="p" ? `1.5px solid ${th.accent}` : v==="r" ? "1.5px solid #E24B4A" : `1.5px solid ${th.borderHi}`,
    background: v==="p" ? th.accent : v==="r" ? "#2A0A0A" : th.s2,
    color: v==="p" ? "#0D1B2E" : v==="r" ? "#F09595" : th.text,
  };
  return Object.assign({}, base, extra || {});
}

function fmtD(str) {
  if (!str) return "";
  var parts = str.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}
function fmtDT(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"})
    + " " + d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
}

function Chip({ label, color, bg }) {
  return (
    <span style={{ background:bg, color:color, fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:99, border:`1px solid ${color}44`, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function FieldBox({ label, hint, children }) {
  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <label style={{ fontSize:11, color:th.muted, fontWeight:600, letterSpacing:"0.05em" }}>{label}</label>
        {hint && <span style={{ fontSize:10, color:th.muted }}>{hint}</span>}
      </div>
      <div style={{ borderRadius:8, border:`1.5px solid ${th.borderHi}`, overflow:"hidden", background:th.s2 }}>
        {children}
      </div>
    </div>
  );
}

function SCard({ children, style }) {
  return (
    <div style={Object.assign({ background:th.surface, border:`1px solid ${th.border}`, borderRadius:12, padding:"14px 16px" }, style || {})}>
      {children}
    </div>
  );
}

function SecTitle({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:600, color:th.muted, marginBottom:10, letterSpacing:"0.06em" }}>
      {children}
    </div>
  );
}

function TabBtn({ label, active, onClick, count, secKey }) {
  var sec = SEC[secKey] || SEC.dashboard;
  return (
    <button onClick={onClick} style={{
      padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500,
      cursor:"pointer", whiteSpace:"nowrap",
      border: active ? `1.5px solid ${sec.color}` : `1.5px solid ${th.border}`,
      background: active ? sec.bg : "transparent",
      color: active ? sec.color : th.muted,
      boxShadow: active ? `0 0 12px ${sec.color}33` : "none",
    }}>
      {label}
      {count > 0 && (
        <span style={{ marginLeft:4, fontSize:10, background:th.s2, border:`1px solid ${th.border}`, borderRadius:99, padding:"1px 5px", color:th.muted }}>
          {count}
        </span>
      )}
    </button>
  );
}

function ProgressBar({ pct, color, h }) {
  return (
    <div style={{ height:h||4, background:th.border, borderRadius:99 }}>
      <div style={{ height:h||4, borderRadius:99, background:color||th.accent, width: Math.min(100, pct) + "%", transition:"width 0.4s" }} />
    </div>
  );
}

function Pomodoro() {
  var WORK = 45*60, REST = 15*60;
  var [mode,setMode] = useState("work");
  var [secs,setSecs] = useState(WORK);
  var [on,setOn]     = useState(false);
  var ref  = useRef(null);
  var mRef = useRef("work");
  mRef.current = mode;
  var tick = useCallback(function() {
    setSecs(function(s) {
      if (s<=1) { clearInterval(ref.current); setOn(false); var nx=mRef.current==="work"?"rest":"work"; setMode(nx); setSecs(nx==="work"?WORK:REST); return 0; }
      return s-1;
    });
  },[]);
  useEffect(function() { if(on){ref.current=setInterval(tick,1000);}else clearInterval(ref.current); return function(){clearInterval(ref.current);}; },[on,tick]);
  function reset() { clearInterval(ref.current); setOn(false); setSecs(mode==="work"?WORK:REST); }
  function sw(m) { clearInterval(ref.current); setOn(false); setMode(m); setSecs(m==="work"?WORK:REST); }
  var total=mode==="work"?WORK:REST, pct=(secs/total)*100, r=30, circ=2*Math.PI*r;
  var mm=String(Math.floor(secs/60)).padStart(2,"0"), ss=String(secs%60).padStart(2,"0");
  var mc=mode==="work"?th.accent:"#8DC63F";
  return (
    <div style={{ background:th.surface, border:`1px solid ${th.border}`, borderRadius:12, padding:"12px" }}>
      <SecTitle>POMODORO</SecTitle>
      <div style={{ display:"flex", gap:4, marginBottom:10 }}>
        {[["work","Trabajo"],["rest","Descanso"]].map(function(pair) {
          return <button key={pair[0]} onClick={function(){sw(pair[0]);}} style={{ flex:1, padding:"3px", borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", border:`1px solid ${mode===pair[0]?mc:th.border}`, background:mode===pair[0]?(pair[0]==="work"?th.accentBg:"#0F1E08"):"transparent", color:mode===pair[0]?mc:th.muted }}>{pair[1]}</button>;
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} fill="none" stroke={th.s2} strokeWidth="5"/>
          <circle cx="38" cy="38" r={r} fill="none" stroke={mc} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round" transform="rotate(-90 38 38)" style={{ transition:"stroke-dashoffset 1s linear" }}/>
          <text x="38" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill={th.text}>{mm}:{ss}</text>
          <text x="38" y="49" textAnchor="middle" fontSize="8" fill={th.muted}>{mode==="work"?"trabajo":"descanso"}</text>
        </svg>
      </div>
      <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
        <button onClick={function(){setOn(function(o){return !o;});}} style={btn("p",{padding:"5px 12px",fontSize:12})}>{on?"Pausar":"Iniciar"}</button>
        <button onClick={reset} style={btn("d",{padding:"5px 9px",fontSize:12})}>↺</button>
      </div>
    </div>
  );
}

function Cal({ tasks, sel, onSel }) {
  var td=new Date(); var [c,setC]=useState({y:td.getFullYear(),m:td.getMonth()});
  var first=new Date(c.y,c.m,1).getDay(), dim=new Date(c.y,c.m+1,0).getDate(), todayS=td.toISOString().split("T")[0];
  var tmap={}; tasks.filter(function(t){return t.due;}).forEach(function(t){tmap[t.due]=(tmap[t.due]||0)+1;});
  var cells=[]; for(var i=0;i<first;i++)cells.push(null); for(var d=1;d<=dim;d++)cells.push(d);
  function ds(d){return c.y+"-"+String(c.m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");}
  return (
    <div style={{ background:th.surface, border:`1px solid ${th.border}`, borderRadius:12, padding:"12px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <button onClick={function(){setC(function(p){var m=p.m===0?11:p.m-1;return{y:m===11?p.y-1:p.y,m:m};});}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:15 }}>‹</button>
        <span style={{ fontSize:11, fontWeight:600, color:th.text }}>{MONTHS_S[c.m]} {c.y}</span>
        <button onClick={function(){setC(function(p){var m=p.m===11?0:p.m+1;return{y:m===0?p.y+1:p.y,m:m};});}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:15 }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:2 }}>
        {WDAYS.map(function(d){return <div key={d} style={{ textAlign:"center",fontSize:9,color:th.muted,fontWeight:600 }}>{d}</div>;})}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
        {cells.map(function(d,i){
          if(!d)return <div key={i}/>;
          var s=ds(d),isT=s===todayS,isS=s===sel;
          return <div key={i} onClick={function(){onSel(s===sel?null:s);}} style={{ textAlign:"center",fontSize:10,padding:"3px 1px",borderRadius:4,cursor:"pointer",background:isS?th.accent:isT?th.accentBg:"transparent",color:isS?"#0D1B2E":isT?th.accent:th.text,fontWeight:isT||isS?700:400 }}>
            {d}{tmap[s]>0&&<div style={{ width:3,height:3,borderRadius:"50%",background:isS?"#0D1B2E":th.accent,margin:"1px auto 0" }}/>}
          </div>;
        })}
      </div>
      {sel&&<div style={{ marginTop:7,borderTop:`1px solid ${th.border}`,paddingTop:5,fontSize:10,color:th.muted,textAlign:"center" }}>
        {(tmap[sel]||0)} tarea{tmap[sel]!==1?"s":""} — {fmtD(sel)}<br/>
        <button onClick={function(){onSel(null);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.accent,fontSize:10 }}>Limpiar</button>
      </div>}
    </div>
  );
}

function PieChart({ data }) {
  var sz=130,cx=65,cy=65,r=50,h=24,total=data.reduce(function(s,d){return s+d.n;},0)||1,angle=-Math.PI/2;
  var slices=data.map(function(d,i){
    var sw=(d.n/total)*2*Math.PI,x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle); angle+=sw;
    var x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle),xi1=cx+h*Math.cos(angle-sw),yi1=cy+h*Math.sin(angle-sw),xi2=cx+h*Math.cos(angle),yi2=cy+h*Math.sin(angle),lg=sw>Math.PI?1:0;
    return{p:"M"+x1+","+y1+" A"+r+","+r+" 0 "+lg+",1 "+x2+","+y2+" L"+xi2+","+yi2+" A"+h+","+h+" 0 "+lg+",0 "+xi1+","+yi1+" Z",c:PIE_C[i%PIE_C.length]};
  });
  return <svg width={sz} height={sz} viewBox={"0 0 "+sz+" "+sz}>
    {slices.map(function(s,i){return <path key={i} d={s.p} fill={s.c} stroke={th.bg} strokeWidth="1.5"/>;})}
    <circle cx={cx} cy={cy} r={h-1} fill={th.surface}/>
    <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fontWeight="700" fill={th.text}>{total}</text>
  </svg>;
}

function ICard({ title, data }) {
  return <SCard><SecTitle>{title.toUpperCase()}</SecTitle>
    {data.length===0?<div style={{ fontSize:12,color:th.muted }}>Sin datos</div>:
    <div style={{ display:"flex",gap:12,alignItems:"center" }}>
      <PieChart data={data}/>
      <div style={{ flex:1,minWidth:0 }}><div style={{ display:"grid",gridTemplateColumns:"10px 1fr auto auto",gap:"4px 7px",alignItems:"center" }}>
        {data.map(function(d,i){return[
          <div key={"c"+i} style={{ width:9,height:9,borderRadius:2,background:PIE_C[i%PIE_C.length] }}/>,
          <div key={"l"+i} style={{ fontSize:11,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{d.label}</div>,
          <div key={"n"+i} style={{ fontSize:11,color:th.muted,textAlign:"right" }}>{d.n}</div>,
          <div key={"p"+i} style={{ fontSize:11,color:th.accent,textAlign:"right",fontWeight:700 }}>{d.pct}%</div>,
        ];})}
      </div></div>
    </div>}
  </SCard>;
}

function KCard({ t, onOpen, onCycle, onDel, isOD }) {
  var sc=SC[t.status]||SC.pendiente,subT=(t.subtasks||[]).length,subD=(t.subtasks||[]).filter(function(s){return s.status==="completado";}).length;
  return <div onClick={function(){onOpen(t);}} onMouseEnter={function(e){e.currentTarget.style.borderColor=sc.border;}} onMouseLeave={function(e){e.currentTarget.style.borderColor=th.border;}}
    style={{ background:th.s2,border:`1px solid ${th.border}`,borderRadius:8,padding:"9px 11px",cursor:"pointer",marginBottom:5 }}>
    <div style={{ display:"flex",justifyContent:"space-between",gap:6,marginBottom:5 }}>
      <span style={{ fontSize:12,fontWeight:500,color:th.text,lineHeight:1.4 }}>{t.title}</span>
      <button onClick={function(e){e.stopPropagation();onDel(t.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:12,padding:0,flexShrink:0 }}>✕</button>
    </div>
    <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:4 }}>
      {t.area&&<Chip label={t.area} color="#00B4D8" bg="#082030"/>}
      {t.project&&t.project!=="Sin proyecto"&&<Chip label={t.project} color="#8DC63F" bg="#0F1E08"/>}
      {t.due&&<span style={{ fontSize:10,color:isOD(t)?"#F09595":th.muted }}>{isOD(t)?"⚠ ":""}{fmtD(t.due)}</span>}
    </div>
    {subT>0&&<div style={{ marginTop:4 }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}><span style={{ fontSize:9,color:th.muted }}>Subtareas</span><span style={{ fontSize:9,color:subD===subT?"#8DC63F":th.muted }}>{subD}/{subT}</span></div>
      <ProgressBar pct={subT?Math.round(subD/subT*100):0} color={subD===subT?"#8DC63F":th.accent} h={2}/>
    </div>}
    <div style={{ display:"flex",gap:6,marginTop:5,alignItems:"center" }}>
      {(t.responsibles||[]).length>0&&<span style={{ fontSize:10,color:"#8DC63F",flex:1 }}>👤 {t.responsibles[0]}{t.responsibles.length>1?" +"+(t.responsibles.length-1):""}</span>}
      <button onClick={fimport React, { useState, useEffect, useRef, useCallback } from 'react';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
const DB_ID = "gestor_principal";

async function dbLoad() {
  try {
    var res = await fetch(SUPABASE_URL + "/rest/v1/gestor_datos?id=eq." + DB_ID + "&select=data", {
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    });
    var rows = await res.json();
    if (rows && rows.length > 0) return rows[0].data;
    return null;
  } catch(e) { console.error("dbLoad error", e); return null; }
}

async function dbSave(data) {
  try {
    await fetch(SUPABASE_URL + "/rest/v1/gestor_datos", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id: DB_ID, data: data, updated_at: new Date().toISOString() }),
    });
  } catch(e) { console.error("dbSave error", e); }
}

const STATUSES = ["pendiente","en curso","completado","urgente"];
const SL = { pendiente:"Pendiente","en curso":"En curso",completado:"Completado",urgente:"Urgente" };
const SC = {
  pendiente:  { bg:"#3D2800", border:"#EF9F27", text:"#FAC775", dot:"#EF9F27" },
  "en curso": { bg:"#0C2F52", border:"#378ADD", text:"#85B7EB", dot:"#378ADD" },
  completado: { bg:"#0A2E1E", border:"#1D9E75", text:"#5DCAA5", dot:"#1D9E75" },
  urgente:    { bg:"#3A0E0E", border:"#E24B4A", text:"#F09595", dot:"#E24B4A" },
};
const DEF_AREAS    = ["Administración","Contabilidad","Calidad","Sistemas"];
const DEF_PROJECTS = ["Sin proyecto"];
const DEF_PEOPLE   = ["María García","Juan Pérez","Laura Rodríguez"];
const DEF_MEET_CATS= ["Administración","Calidad","Logística","Diego"];
const PIE_C = ["#6C63FF","#F97316","#1D9E75","#E24B4A","#FACC15","#06B6D4","#EC4899","#84CC16"];
const MONTHS_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const WDAYS   = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
const PLAN_MONTHS = ["Abr 2026","May 2026","Jun 2026","Jul 2026","Ago 2026","Sep 2026","Oct 2026","Nov 2026","Dic 2026","Ene 2027","Feb 2027","Mar 2027"];

const th = {
  bg:"#0F1117", surface:"#1A1D27", s2:"#22263A",
  border:"#2E3248", borderHi:"#4A4F6E",
  text:"#E8EAF6", muted:"#7B82A8",
  accent:"#6C63FF", accentBg:"#1E1B3A",
};

const I = {
  width:"100%", boxSizing:"border-box", padding:"8px 11px",
  borderRadius:8, border:`1.5px solid ${th.borderHi}`,
  fontSize:13, background:th.s2, color:th.text, outline:"none",
};
const FI = {
  width:"100%", boxSizing:"border-box", padding:"9px 12px",
  fontSize:14, background:"transparent", color:th.text, border:"none", outline:"none",
};
const EMPTY_FORM = {
  title:"", desc:"", status:"pendiente", area:"", project:"",
  due:"", responsibles:[], freeResp:"", url:"",
};

function btn(v, extra) {
  var base = {
    padding:"7px 15px", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer",
    border: v==="p" ? `1.5px solid ${th.accent}` : v==="r" ? "1.5px solid #E24B4A" : `1.5px solid ${th.borderHi}`,
    background: v==="p" ? th.accent : v==="r" ? "#3A0E0E" : th.s2,
    color: v==="p" ? "#fff" : v==="r" ? "#F09595" : th.text,
  };
  return Object.assign({}, base, extra || {});
}

function fmtD(str) {
  if (!str) return "";
  var parts = str.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}
function fmtDT(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"})
    + " " + d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
}

function Chip({ label, color, bg }) {
  return (
    <span style={{
      background:bg, color:color, fontSize:10, fontWeight:500,
      padding:"2px 8px", borderRadius:99,
      border:`1px solid ${color}44`, whiteSpace:"nowrap",
    }}>
      {label}
    </span>
  );
}

function FieldBox({ label, hint, children }) {
  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <label style={{ fontSize:11, color:th.muted, fontWeight:600, letterSpacing:"0.05em" }}>{label}</label>
        {hint && <span style={{ fontSize:10, color:th.muted }}>{hint}</span>}
      </div>
      <div style={{ borderRadius:8, border:`1.5px solid ${th.borderHi}`, overflow:"hidden", background:th.s2 }}>
        {children}
      </div>
    </div>
  );
}

function SCard({ children, style }) {
  return (
    <div style={Object.assign({ background:th.surface, border:`1px solid ${th.border}`, borderRadius:12, padding:"14px 16px" }, style || {})}>
      {children}
    </div>
  );
}

function SecTitle({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:600, color:th.muted, marginBottom:10, letterSpacing:"0.06em" }}>
      {children}
    </div>
  );
}

function TabBtn({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500,
      cursor:"pointer", whiteSpace:"nowrap",
      border: active ? `1.5px solid ${th.accent}` : `1.5px solid ${th.border}`,
      background: active ? th.accentBg : "transparent",
      color: active ? th.accent : th.muted,
    }}>
      {label}
      {count > 0 && (
        <span style={{
          marginLeft:4, fontSize:10, background:th.s2,
          border:`1px solid ${th.border}`, borderRadius:99,
          padding:"1px 5px", color:th.muted,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

function ProgressBar({ pct, color, h }) {
  return (
    <div style={{ height:h||4, background:th.border, borderRadius:99 }}>
      <div style={{
        height:h||4, borderRadius:99,
        background:color||th.accent,
        width: Math.min(100, pct) + "%",
        transition:"width 0.4s",
      }} />
    </div>
  );
}

function Pomodoro() {
  var WORK = 45 * 60, REST = 15 * 60;
  var [mode, setMode]   = useState("work");
  var [secs, setSecs]   = useState(WORK);
  var [on, setOn]       = useState(false);
  var ref  = useRef(null);
  var mRef = useRef("work");
  mRef.current = mode;

  var tick = useCallback(function() {
    setSecs(function(s) {
      if (s <= 1) {
        clearInterval(ref.current);
        setOn(false);
        var nx = mRef.current === "work" ? "rest" : "work";
        setMode(nx);
        setSecs(nx === "work" ? WORK : REST);
        return 0;
      }
      return s - 1;
    });
  }, []);

  useEffect(function() {
    if (on) { ref.current = setInterval(tick, 1000); }
    else clearInterval(ref.current);
    return function() { clearInterval(ref.current); };
  }, [on, tick]);

  function reset() { clearInterval(ref.current); setOn(false); setSecs(mode === "work" ? WORK : REST); }
  function sw(m) { clearInterval(ref.current); setOn(false); setMode(m); setSecs(m === "work" ? WORK : REST); }

  var total = mode === "work" ? WORK : REST;
  var pct   = (secs / total) * 100;
  var r     = 30, circ = 2 * Math.PI * r;
  var mm = String(Math.floor(secs / 60)).padStart(2, "0");
  var ss = String(secs % 60).padStart(2, "0");
  var mc = mode === "work" ? th.accent : "#1D9E75";

  return (
    <div style={{ background:th.surface, border:`1px solid ${th.border}`, borderRadius:12, padding:"12px" }}>
      <SecTitle>POMODORO</SecTitle>
      <div style={{ display:"flex", gap:4, marginBottom:10 }}>
        {[["work","Trabajo"],["rest","Descanso"]].map(function(pair) {
          return (
            <button key={pair[0]} onClick={function(){ sw(pair[0]); }} style={{
              flex:1, padding:"3px", borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer",
              border: mode===pair[0] ? `1px solid ${mc}` : `1px solid ${th.border}`,
              background: mode===pair[0] ? (pair[0]==="work" ? th.accentBg : "#0A2E1E") : "transparent",
              color: mode===pair[0] ? mc : th.muted,
            }}>
              {pair[1]}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} fill="none" stroke={th.s2} strokeWidth="5"/>
          <circle cx="38" cy="38" r={r} fill="none" stroke={mc} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
            strokeLinecap="round" transform="rotate(-90 38 38)"
            style={{ transition:"stroke-dashoffset 1s linear" }}/>
          <text x="38" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill={th.text}>{mm}:{ss}</text>
          <text x="38" y="49" textAnchor="middle" fontSize="8" fill={th.muted}>{mode==="work"?"trabajo":"descanso"}</text>
        </svg>
      </div>
      <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
        <button onClick={function(){ setOn(function(o){ return !o; }); }} style={btn("p",{padding:"5px 12px",fontSize:12})}>
          {on ? "Pausar" : "Iniciar"}
        </button>
        <button onClick={reset} style={btn("d",{padding:"5px 9px",fontSize:12})}>↺</button>
      </div>
    </div>
  );
}

function Cal({ tasks, sel, onSel }) {
  var td = new Date();
  var [c, setC] = useState({ y:td.getFullYear(), m:td.getMonth() });
  var first    = new Date(c.y, c.m, 1).getDay();
  var dim      = new Date(c.y, c.m+1, 0).getDate();
  var todayS   = td.toISOString().split("T")[0];
  var tmap     = {};
  tasks.filter(function(t){ return t.due; }).forEach(function(t){
    tmap[t.due] = (tmap[t.due] || 0) + 1;
  });
  var cells = [];
  for (var i = 0; i < first; i++) cells.push(null);
  for (var d = 1; d <= dim; d++) cells.push(d);

  function ds(d) {
    return c.y + "-" + String(c.m+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
  }

  return (
    <div style={{ background:th.surface, border:`1px solid ${th.border}`, borderRadius:12, padding:"12px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <button onClick={function(){ setC(function(prev){ var m=prev.m===0?11:prev.m-1; return{y:m===11?prev.y-1:prev.y,m:m}; }); }} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:15 }}>‹</button>
        <span style={{ fontSize:11, fontWeight:600, color:th.text }}>{MONTHS_S[c.m]} {c.y}</span>
        <button onClick={function(){ setC(function(prev){ var m=prev.m===11?0:prev.m+1; return{y:m===0?prev.y+1:prev.y,m:m}; }); }} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:15 }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:2 }}>
        {WDAYS.map(function(d){ return <div key={d} style={{ textAlign:"center",fontSize:9,color:th.muted,fontWeight:600 }}>{d}</div>; })}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
        {cells.map(function(d,i) {
          if (!d) return <div key={i} />;
          var s = ds(d), isT = s===todayS, isS = s===sel;
          return (
            <div key={i} onClick={function(){ onSel(s===sel ? null : s); }} style={{
              textAlign:"center", fontSize:10, padding:"3px 1px", borderRadius:4, cursor:"pointer",
              background: isS ? th.accent : isT ? th.accentBg : "transparent",
              color: isS ? "#fff" : isT ? th.accent : th.text,
              fontWeight: isT||isS ? 700 : 400,
            }}>
              {d}
              {tmap[s] > 0 && <div style={{ width:3,height:3,borderRadius:"50%",background:isS?"#fff":th.accent,margin:"1px auto 0" }} />}
            </div>
          );
        })}
      </div>
      {sel && (
        <div style={{ marginTop:7,borderTop:`1px solid ${th.border}`,paddingTop:5,fontSize:10,color:th.muted,textAlign:"center" }}>
          {(tmap[sel]||0)} tarea{tmap[sel]!==1?"s":""} — {fmtD(sel)}<br/>
          <button onClick={function(){ onSel(null); }} style={{ background:"none",border:"none",cursor:"pointer",color:th.accent,fontSize:10 }}>Limpiar</button>
        </div>
      )}
    </div>
  );
}

function PieChart({ data }) {
  var sz=130, cx=65, cy=65, r=50, h=24;
  var total = data.reduce(function(s,d){ return s+d.n; }, 0) || 1;
  var angle = -Math.PI/2;
  var slices = data.map(function(d, i) {
    var sw  = (d.n/total)*2*Math.PI;
    var x1  = cx+r*Math.cos(angle), y1 = cy+r*Math.sin(angle);
    angle  += sw;
    var x2  = cx+r*Math.cos(angle), y2  = cy+r*Math.sin(angle);
    var xi1 = cx+h*Math.cos(angle-sw), yi1 = cy+h*Math.sin(angle-sw);
    var xi2 = cx+h*Math.cos(angle),    yi2 = cy+h*Math.sin(angle);
    var lg  = sw > Math.PI ? 1 : 0;
    var p   = "M"+x1+","+y1+" A"+r+","+r+" 0 "+lg+",1 "+x2+","+y2
            + " L"+xi2+","+yi2+" A"+h+","+h+" 0 "+lg+",0 "+xi1+","+yi1+" Z";
    return { p:p, c:PIE_C[i % PIE_C.length] };
  });
  return (
    <svg width={sz} height={sz} viewBox={"0 0 "+sz+" "+sz}>
      {slices.map(function(s,i){
        return <path key={i} d={s.p} fill={s.c} stroke={th.bg} strokeWidth="1.5"/>;
      })}
      <circle cx={cx} cy={cy} r={h-1} fill={th.surface}/>
      <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fontWeight="700" fill={th.text}>{total}</text>
    </svg>
  );
}

function ICard({ title, data }) {
  return (
    <SCard>
      <SecTitle>{title.toUpperCase()}</SecTitle>
      {data.length === 0
        ? <div style={{ fontSize:12,color:th.muted }}>Sin datos</div>
        : (
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <PieChart data={data} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"grid", gridTemplateColumns:"10px 1fr auto auto", gap:"4px 7px", alignItems:"center" }}>
                {data.map(function(d,i){
                  return [
                    <div key={"c"+i} style={{ width:9,height:9,borderRadius:2,background:PIE_C[i%PIE_C.length] }}/>,
                    <div key={"l"+i} style={{ fontSize:11,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{d.label}</div>,
                    <div key={"n"+i} style={{ fontSize:11,color:th.muted,textAlign:"right" }}>{d.n}</div>,
                    <div key={"p"+i} style={{ fontSize:11,color:th.accent,textAlign:"right",fontWeight:700 }}>{d.pct}%</div>,
                  ];
                })}
              </div>
            </div>
          </div>
        )
      }
    </SCard>
  );
}

function KCard({ t, onOpen, onCycle, onDel, isOD }) {
  var sc   = SC[t.status] || SC.pendiente;
  var subT = (t.subtasks||[]).length;
  var subD = (t.subtasks||[]).filter(function(s){ return s.status==="completado"; }).length;
  return (
    <div
      onClick={function(){ onOpen(t); }}
      onMouseEnter={function(e){ e.currentTarget.style.borderColor=sc.border; }}
      onMouseLeave={function(e){ e.currentTarget.style.borderColor=th.border; }}
      style={{ background:th.s2,border:`1px solid ${th.border}`,borderRadius:8,padding:"9px 11px",cursor:"pointer",marginBottom:5 }}
    >
      <div style={{ display:"flex",justifyContent:"space-between",gap:6,marginBottom:5 }}>
        <span style={{ fontSize:12,fontWeight:500,color:th.text,lineHeight:1.4 }}>{t.title}</span>
        <button onClick={function(e){ e.stopPropagation(); onDel(t.id); }} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:12,padding:0,flexShrink:0 }}>✕</button>
      </div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:4 }}>
        {t.area && <Chip label={t.area} color="#A78BFA" bg="#1E1B3A"/>}
        {t.project && t.project!=="Sin proyecto" && <Chip label={t.project} color="#60A5FA" bg="#0C2040"/>}
        {t.due && <span style={{ fontSize:10,color:isOD(t)?"#F09595":th.muted }}>{isOD(t)?"⚠ ":""}{fmtD(t.due)}</span>}
      </div>
      {subT > 0 && (
        <div style={{ marginTop:4 }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
            <span style={{ fontSize:9,color:th.muted }}>Subtareas</span>
            <span style={{ fontSize:9,color:subD===subT?"#1D9E75":th.muted }}>{subD}/{subT}</span>
          </div>
          <ProgressBar pct={subT ? Math.round(subD/subT*100):0} color={subD===subT?"#1D9E75":th.accent} h={2}/>
        </div>
      )}
      <div style={{ display:"flex",gap:6,marginTop:5,alignItems:"center" }}>
        {(t.responsibles||[]).length > 0 && (
          <span style={{ fontSize:10,color:"#34D399",flex:1 }}>
            👤 {t.responsibles[0]}{t.responsibles.length>1?" +"+(t.responsibles.length-1):""}
          </span>
        )}
        <button
          onClick={function(e){ e.stopPropagation(); onCycle(t.id); }}
          style={{ marginLeft:"auto",fontSize:10,padding:"2px 7px",borderRadius:99,border:`1px solid ${sc.border}44`,background:sc.bg,color:sc.text,cursor:"pointer" }}
        >
          {SL[t.status]} →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  var [tasks,    setTasks]    = useState([]);
  var [areas,    setAreas]    = useState(DEF_AREAS);
  var [projects, setProjects] = useState(DEF_PROJECTS);
  var [people,   setPeople]   = useState(DEF_PEOPLE);
  var [objectives,setObj]     = useState([]);
  var [shortcuts, setSC2]     = useState([]);
  var [notes,    setNotes]    = useState("");
  var [meetings, setMeetings] = useState([]);
  var [meetCats, setMeetCats] = useState(DEF_MEET_CATS);
  var [view,     setView]     = useState("list");
  var [lmode,    setLmode]    = useState("lista");
  var [editId,   setEditId]   = useState(null);
  var [detailId, setDId]      = useState(null);
  var [form,     setForm]     = useState(EMPTY_FORM);
  var [fil,      setFil]      = useState({ area:"",project:"",status:"",search:"",due:"",specDate:"" });
  var [calSel,   setCalSel]   = useState(null);
  var [tab,      setTab]      = useState("dashboard");
  var [nArea,    setNArea]    = useState("");
  var [nProj,    setNProj]    = useState("");
  var [nPers,    setNPers]    = useState("");
  var [novelty,  setNovelty]  = useState("");
  var [nSub,     setNSub]     = useState("");
  var [sortBy,   setSortBy]   = useState("created");
  var [sortDir,  setSDir]     = useState("desc");
  var [confClear,setCC]       = useState(false);
  var [drag,     setDrag]     = useState(null);
  var [objView,  setObjView]  = useState("list");
  var [objForm,  setObjForm]  = useState({ title:"",desc:"",emoji:"🎯" });
  var [objId,    setObjId]    = useState(null);
  var [editObjId,setEObjId]   = useState(null);
  var [newAction,setNewAct]   = useState({ month:0, text:"" });
  var [linkTask, setLinkTask] = useState("");
  var [scForm,   setScForm]   = useState({ emoji:"🔗",name:"",url:"" });
  var [showScF,  setShowScF]  = useState(false);
  var [meetCat,  setMeetCat]  = useState(null);
  var [meetForm, setMeetForm] = useState({ date:"",summary:"",url:"" });
  var [showMF,   setShowMF]   = useState(false);
  var [newCatN,  setNewCatN]  = useState("");
  var [showNC,   setShowNC]   = useState(false);
  var fileRef    = useRef(null);
  var notesTimer = useRef(null);

  useEffect(function() {
    (async function() {
      try {
        var d = await dbLoad();
        if (d) {
          setTasks(d.tasks || []);
          setAreas(d.areas || DEF_AREAS);
          setProjects(d.projects || DEF_PROJECTS);
          setPeople(d.people || DEF_PEOPLE);
          setObj(d.objectives || []);
          setSC2(d.shortcuts || []);
          setNotes(d.notes || "");
          setMeetings(d.meetings || []);
          setMeetCats(d.meetCats || DEF_MEET_CATS);
        }
      } catch(e) { console.error(e); }
    })();
  }, []);

  function persist(overrides) {
    var s = Object.assign({ tasks,areas,projects,people,objectives,shortcuts,notes,meetings,meetCats }, overrides||{});
    dbSave(s);
  }

  var today  = new Date().toISOString().split("T")[0];
  function isOD(t) { return t.due && t.due < today && t.status !== "completado"; }

  function openNew()   { setForm(EMPTY_FORM); setEditId(null); setView("form"); }
  function openEdit(t) {
    setForm({ title:t.title,desc:t.desc||"",status:t.status,area:t.area||"",
              project:t.project||"",due:t.due||"",responsibles:t.responsibles||[],freeResp:"",url:t.url||"" });
    setEditId(t.id); setView("form");
  }
  function openDetail(t) { setDId(t.id); setNovelty(""); setNSub(""); setView("detail"); }
  function back()        { setView("list"); setEditId(null); setDId(null); }

  function submitTask() {
    if (!form.title.trim()) return;
    var resp = form.responsibles.slice();
    if (form.freeResp.trim() && !resp.includes(form.freeResp.trim())) resp.push(form.freeResp.trim());
    var pl = Object.assign({}, form, { responsibles:resp, freeResp:undefined });
    var u;
    if (editId) {
      u = tasks.map(function(t){ return t.id===editId ? Object.assign({},t,pl,{updatedAt:Date.now()}) : t; });
    } else {
      u = tasks.concat([Object.assign({},pl,{id:Date.now(),createdAt:Date.now(),notes:[],attachments:[],subtasks:[]})]);
    }
    setTasks(u); persist({tasks:u}); setView("list"); setEditId(null);
  }

  function delTask(id)    { var u=tasks.filter(function(t){return t.id!==id;}); setTasks(u); persist({tasks:u}); }
  function cycleS(id)     { var u=tasks.map(function(t){ if(t.id!==id)return t; return Object.assign({},t,{status:STATUSES[(STATUSES.indexOf(t.status)+1)%STATUSES.length],updatedAt:Date.now()}); }); setTasks(u); persist({tasks:u}); }
  function moveTo(id,st)  { var u=tasks.map(function(t){ return t.id!==id?t:Object.assign({},t,{status:st,updatedAt:Date.now()}); }); setTasks(u); persist({tasks:u}); }
  function dupTask(t)     { var u=tasks.concat([Object.assign({},t,{id:Date.now(),createdAt:Date.now(),title:t.title+" (copia)",notes:[],attachments:[],subtasks:[]})]); setTasks(u); persist({tasks:u}); }

  function addNote() {
    if (!novelty.trim()) return;
    var u=tasks.map(function(t){ return t.id!==detailId?t:Object.assign({},t,{notes:(t.notes||[]).concat([{id:Date.now(),text:novelty.trim(),date:new Date().toISOString()}])}); });
    setTasks(u); persist({tasks:u}); setNovelty("");
  }
  function delNote(tid,nid) { var u=tasks.map(function(t){ return t.id!==tid?t:Object.assign({},t,{notes:(t.notes||[]).filter(function(n){return n.id!==nid;})}); }); setTasks(u); persist({tasks:u}); }
  function addSub() {
    if (!nSub.trim()) return;
    var u=tasks.map(function(t){ return t.id!==detailId?t:Object.assign({},t,{subtasks:(t.subtasks||[]).concat([{id:Date.now(),title:nSub.trim(),status:"pendiente"}])}); });
    setTasks(u); persist({tasks:u}); setNSub("");
  }
  function cycleSub(tid,sid) {
    var u=tasks.map(function(t){
      if(t.id!==tid)return t;
      return Object.assign({},t,{subtasks:(t.subtasks||[]).map(function(s){ return s.id!==sid?s:Object.assign({},s,{status:STATUSES[(STATUSES.indexOf(s.status)+1)%STATUSES.length]}); })});
    });
    setTasks(u); persist({tasks:u});
  }
  function delSub(tid,sid) { var u=tasks.map(function(t){ return t.id!==tid?t:Object.assign({},t,{subtasks:(t.subtasks||[]).filter(function(s){return s.id!==sid;})}); }); setTasks(u); persist({tasks:u}); }
  function handleFiles(e) {
    Array.from(e.target.files).forEach(function(f){
      var r=new FileReader();
      r.onload=function(ev){
        var u=tasks.map(function(t){ return t.id!==detailId?t:Object.assign({},t,{attachments:(t.attachments||[]).concat([{id:Date.now(),name:f.name,size:f.size,data:ev.target.result}])}); });
        setTasks(u); persist({tasks:u});
      };
      r.readAsDataURL(f);
    });
    e.target.value="";
  }
  function delFile(tid,aid) { var u=tasks.map(function(t){ return t.id!==tid?t:Object.assign({},t,{attachments:(t.attachments||[]).filter(function(a){return a.id!==aid;})}); }); setTasks(u); persist({tasks:u}); }
  function togResp(n) { setForm(function(f){ return Object.assign({},f,{responsibles:f.responsibles.includes(n)?f.responsibles.filter(function(r){return r!==n;}):[...f.responsibles,n]}); }); }
  function addItem(list,setL,val,setV,key) {
    if (!val.trim() || list.includes(val.trim())) return;
    var u=list.concat([val.trim()]); setL(u); setV(""); persist({[key]:u});
  }
  function delItem(list,setL,item,key) {
    var u=list.filter(function(x){return x!==item;}); setL(u); persist({[key]:u});
  }

  function objProgress(ob) {
    var actions=(ob.plan||[]).reduce(function(a,m){return a+m.actions.length;},0);
    var done=(ob.plan||[]).reduce(function(a,m){return a+m.actions.filter(function(ac){return ac.done;}).length;},0);
    var linked=(ob.linkedTasks||[]).length;
    var ldone=(ob.linkedTasks||[]).filter(function(id){ var t=tasks.find(function(t){return t.id===id;}); return t&&t.status==="completado"; }).length;
    var total=actions+linked; return total===0?0:Math.round((done+ldone)/total*100);
  }
  function saveObj(ob) { var u=objectives.map(function(o){return o.id===ob.id?ob:o;}); setObj(u); persist({objectives:u}); }
  function submitObj() {
    if (!objForm.title.trim()) return;
    var plan=PLAN_MONTHS.map(function(label,i){return {month:i,label:label,actions:[]};});
    var newO={id:Date.now(),emoji:objForm.emoji,title:objForm.title,desc:objForm.desc,plan:plan,linkedTasks:[],createdAt:Date.now()};
    var u=editObjId?objectives.map(function(o){return o.id===editObjId?Object.assign({},o,{emoji:objForm.emoji,title:objForm.title,desc:objForm.desc}):o;}):objectives.concat([newO]);
    setObj(u); persist({objectives:u}); setObjView("list"); setEObjId(null); setObjForm({title:"",desc:"",emoji:"🎯"});
  }
  function delObj(id) { var u=objectives.filter(function(o){return o.id!==id;}); setObj(u); persist({objectives:u}); if(objId===id){setObjId(null);setObjView("list");} }
  function addAction(ob) {
    if (!newAction.text.trim()) return;
    var u=objectives.map(function(o){
      if(o.id!==ob.id)return o;
      var plan=o.plan.map(function(m,i){ return i!==newAction.month?m:Object.assign({},m,{actions:m.actions.concat([{id:Date.now(),text:newAction.text.trim(),done:false}])}); });
      return Object.assign({},o,{plan:plan});
    });
    setObj(u); persist({objectives:u}); setNewAct({month:newAction.month,text:""});
  }
  function togAction(ob,mi,ai) {
    var u=objectives.map(function(o){
      if(o.id!==ob.id)return o;
      var plan=o.plan.map(function(m,i){ return i!==mi?m:Object.assign({},m,{actions:m.actions.map(function(a,j){return j!==ai?a:Object.assign({},a,{done:!a.done});})}); });
      return Object.assign({},o,{plan:plan});
    });
    setObj(u); persist({objectives:u});
  }
  function delAction(ob,mi,ai) {
    var u=objectives.map(function(o){
      if(o.id!==ob.id)return o;
      var plan=o.plan.map(function(m,i){ return i!==mi?m:Object.assign({},m,{actions:m.actions.filter(function(_,j){return j!==ai;})}); });
      return Object.assign({},o,{plan:plan});
    });
    setObj(u); persist({objectives:u});
  }
  function linkTaskToObj(ob) {
    var tid=parseInt(linkTask);
    if(!tid||!tasks.find(function(t){return t.id===tid;}))return;
    if((ob.linkedTasks||[]).includes(tid))return;
    saveObj(Object.assign({},ob,{linkedTasks:(ob.linkedTasks||[]).concat([tid])})); setLinkTask("");
  }
  function unlinkTask(ob,tid) { saveObj(Object.assign({},ob,{linkedTasks:(ob.linkedTasks||[]).filter(function(id){return id!==tid;})})); }

  function addShortcut() {
    if(!scForm.name.trim()||!scForm.url.trim())return;
    var url=scForm.url.trim();
    if(!/^https?:\/\//i.test(url))url="https://"+url;
    var u=shortcuts.concat([{id:Date.now(),emoji:scForm.emoji,name:scForm.name,url:url}]);
    setSC2(u); persist({shortcuts:u}); setScForm({emoji:"🔗",name:"",url:""}); setShowScF(false);
  }
  function delShortcut(id) { var u=shortcuts.filter(function(s){return s.id!==id;}); setSC2(u); persist({shortcuts:u}); }
  function moveShortcut(from,to) { var u=shortcuts.slice(); var item=u.splice(from,1)[0]; u.splice(to,0,item); setSC2(u); persist({shortcuts:u}); }

  function submitMeeting() {
    if(!meetForm.summary.trim()||!meetForm.date)return;
    var u=[{id:Date.now(),cat:meetCat,date:meetForm.date,summary:meetForm.summary,url:meetForm.url}].concat(meetings);
    setMeetings(u); persist({meetings:u}); setMeetForm({date:"",summary:"",url:""}); setShowMF(false);
  }
  function delMeeting(id) { var u=meetings.filter(function(m){return m.id!==id;}); setMeetings(u); persist({meetings:u}); }
  function addMeetCat() {
    if(!newCatN.trim()||meetCats.includes(newCatN.trim()))return;
    var u=meetCats.concat([newCatN.trim()]); setMeetCats(u); persist({meetCats:u}); setNewCatN(""); setShowNC(false);
  }

  function handleNotes(val) {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current=setTimeout(function(){ persist({notes:val}); },800);
  }

  var wEnd=new Date(); wEnd.setDate(wEnd.getDate()+7); var wEndS=wEnd.toISOString().split("T")[0];
  var mEnd=new Date(); mEnd.setMonth(mEnd.getMonth()+1); var mEndS=mEnd.toISOString().split("T")[0];
  var effDate=calSel||(fil.due==="spec"?fil.specDate:"");

  var active=tasks.filter(function(t){
    if(t.status==="completado")return false;
    if(fil.area&&t.area!==fil.area)return false;
    if(fil.project&&t.project!==fil.project)return false;
    if(fil.status&&t.status!==fil.status)return false;
    if(fil.search&&!t.title.toLowerCase().includes(fil.search.toLowerCase())&&!(t.desc||"").toLowerCase().includes(fil.search.toLowerCase()))return false;
    if(effDate){ if(t.due!==effDate)return false; }
    else if(fil.due==="today"){ if(t.due!==today)return false; }
    else if(fil.due==="week"){ if(!t.due||t.due<today||t.due>wEndS)return false; }
    else if(fil.due==="month"){ if(!t.due||t.due<today||t.due>mEndS)return false; }
    else if(fil.due==="od"){ if(!isOD(t))return false; }
    return true;
  });

  var sorted=active.slice().sort(function(a,b){
    var va,vb;
    if(sortBy==="due"){ va=a.due||"9999"; vb=b.due||"9999"; }
    else if(sortBy==="status"){ va=STATUSES.indexOf(a.status); vb=STATUSES.indexOf(b.status); }
    else if(sortBy==="area"){ va=a.area||""; vb=b.area||""; }
    else { va=a.createdAt||0; vb=b.createdAt||0; }
    return sortDir==="asc"?(va>vb?1:-1):(va<vb?1:-1);
  });

  function tgSort(f) {
    if(sortBy===f) setSDir(function(d){return d==="asc"?"desc":"asc";});
    else { setSortBy(f); setSDir("asc"); }
  }

  function grp(arr,key,labels) {
    var c={};
    labels.forEach(function(l){c[l]=0;});
    arr.forEach(function(t){ var v=t[key]||(key==="area"?"Sin área":"Sin proyecto"); c[v]=(c[v]||0)+1; });
    var tot=arr.length||1;
    return Object.entries(c).filter(function(e){return e[1]>0;}).map(function(e){ return {label:e[0],n:e[1],pct:Math.round(e[1]/tot*100)}; });
  }
  function grpSt(arr) {
    var tot=arr.length||1;
    return STATUSES.map(function(s){ return {label:SL[s],n:arr.filter(function(t){return t.status===s;}).length,pct:0}; })
      .map(function(d){return Object.assign({},d,{pct:Math.round(d.n/tot*100)});})
      .filter(function(d){return d.n>0;});
  }

  var urgC  = tasks.filter(function(t){return t.status==="urgente";}).length;
  var odC   = tasks.filter(function(t){return isOD(t);}).length;
  var doneC = tasks.filter(function(t){return t.status==="completado";}).length;
  var dt    = tasks.find(function(t){return t.id===detailId;});

  var root={padding:"1.25rem 1rem",fontFamily:"system-ui,sans-serif",color:th.text,background:th.bg,minHeight:"100vh"};
  var sCard={background:th.surface,border:`1px solid ${th.border}`,borderRadius:12,padding:"13px 15px",marginBottom:12};

  function TaskRow({ t, idx, total }) {
    var sc=SC[t.status]||SC.pendiente;
    var subT=(t.subtasks||[]).length, subD=(t.subtasks||[]).filter(function(s){return s.status==="completado";}).length;
    return (
      <div
        style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 11px",borderBottom:idx<total-1?`1px solid ${th.border}`:"none",background:"transparent" }}
        onMouseEnter={function(e){e.currentTarget.style.background=th.s2;}}
        onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}
      >
        <button onClick={function(){cycleS(t.id);}} style={{ width:11,height:11,borderRadius:"50%",border:`2px solid ${sc.dot}`,background:"transparent",cursor:"pointer",flexShrink:0,padding:0 }}/>
        <div style={{ width:3,height:26,borderRadius:2,background:sc.border,flexShrink:0 }}/>
        <div style={{ flex:1,minWidth:0,cursor:"pointer" }} onClick={function(){openDetail(t);}}>
          <div style={{ fontSize:13,fontWeight:500,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
          <div style={{ display:"flex",gap:5,alignItems:"center",marginTop:1 }}>
            {t.area && <span style={{ fontSize:10,color:"#A78BFA" }}>{t.area}</span>}
            {t.project&&t.project!=="Sin proyecto" && <span style={{ fontSize:10,color:"#60A5FA" }}>{t.project}</span>}
            {subT>0 && <span style={{ fontSize:10,color:subD===subT?"#1D9E75":th.muted }}>✓ {subD}/{subT}</span>}
          </div>
        </div>
        <div style={{ display:"flex",gap:5,alignItems:"center",flexShrink:0 }}>
          {t.due && <span style={{ fontSize:10,color:isOD(t)?"#F09595":th.muted }}>{isOD(t)?"⚠ ":""}{fmtD(t.due)}</span>}
          <span style={{ fontSize:10,padding:"2px 6px",borderRadius:99,border:`1px solid ${sc.border}44`,color:sc.text,background:sc.bg }}>{SL[t.status]}</span>
          <button onClick={function(){openEdit(t);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:13,padding:"1px 3px" }}>✎</button>
          <button onClick={function(){delTask(t.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13,padding:"1px 3px" }}>✕</button>
        </div>
      </div>
    );
  }

  function renderTaskList(items) {
    if (items.length === 0) {
      return <div style={{ textAlign:"center",padding:"1.5rem",color:th.muted,fontSize:13 }}>Sin tareas</div>;
    }
    return (
      <div style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:10,overflow:"hidden" }}>
        {items.map(function(t,idx){ return <TaskRow key={t.id} t={t} idx={idx} total={items.length}/>; })}
      </div>
    );
  }

  if (view==="detail" && dt) {
    var sc = SC[dt.status]||SC.pendiente;
    var subT=(dt.subtasks||[]).length, subD=(dt.subtasks||[]).filter(function(s){return s.status==="completado";}).length;
    return (
      <div style={root}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
          <button onClick={back} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:th.muted }}>←</button>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:th.text }}>{dt.title}</h2>
            {dt.createdAt && <div style={{ fontSize:11,color:th.muted }}>Creada {fmtDT(new Date(dt.createdAt).toISOString())}</div>}
          </div>
          <button onClick={function(){dupTask(dt);back();}} style={btn("d",{fontSize:12,padding:"4px 11px"})}>Duplicar</button>
          <button onClick={function(){openEdit(dt);}} style={btn("d",{fontSize:12,padding:"4px 11px"})}>Editar</button>
        </div>
        <div style={{ background:sc.bg,border:`1.5px solid ${sc.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14 }}>
          <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:dt.desc?7:0 }}>
            <Chip label={SL[dt.status]} color={sc.text} bg={sc.bg}/>
            {dt.area && <Chip label={"📂 "+dt.area} color="#A78BFA" bg="#1E1B3A"/>}
            {dt.project&&dt.project!=="Sin proyecto" && <Chip label={"🗂 "+dt.project} color="#60A5FA" bg="#0C2040"/>}
            {dt.due && <Chip label={"📅 "+fmtD(dt.due)} color={isOD(dt)?"#F09595":sc.text} bg="transparent"/>}
          </div>
          {dt.desc && <p style={{ margin:"6px 0 0",fontSize:13,color:sc.text,lineHeight:1.6 }}>{dt.desc}</p>}
          {(dt.responsibles||[]).length>0 && (
            <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:7 }}>
              {dt.responsibles.map(function(r){ return <Chip key={r} label={"👤 "+r} color="#34D399" bg="#0A2E1E"/>; })}
            </div>
          )}
          {dt.url && (
            <div style={{ marginTop:9,padding:"7px 9px",background:"rgba(0,0,0,0.2)",borderRadius:6 }}>
              <a href={dt.url} target="_blank" rel="noreferrer" style={{ fontSize:12,color:"#60A5FA",wordBreak:"break-all",textDecoration:"none" }}>🔗 {dt.url}</a>
            </div>
          )}
        </div>
        <div style={sCard}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div style={{ fontSize:13,fontWeight:600,color:th.text }}>Subtareas <span style={{ fontSize:11,color:th.muted,fontWeight:400 }}>({subD}/{subT})</span></div>
            {subT>0 && <span style={{ fontSize:11,color:subD===subT?"#1D9E75":th.accent }}>{subT?Math.round(subD/subT*100):0}%</span>}
          </div>
          {subT>0 && <div style={{ marginBottom:10 }}><ProgressBar pct={subT?Math.round(subD/subT*100):0} color={subD===subT?"#1D9E75":th.accent} h={3}/></div>}
          {(dt.subtasks||[]).map(function(s){
            var ssc=SC[s.status]||SC.pendiente;
            return (
              <div key={s.id} style={{ display:"flex",alignItems:"center",gap:9,padding:"6px 9px",borderRadius:7,background:th.s2,marginBottom:5,border:`1px solid ${th.border}` }}>
                <button onClick={function(){cycleSub(dt.id,s.id);}} style={{ width:13,height:13,borderRadius:"50%",border:`2px solid ${ssc.dot}`,background:s.status==="completado"?ssc.dot:"transparent",cursor:"pointer",flexShrink:0,padding:0 }}/>
                <span style={{ flex:1,fontSize:12,color:s.status==="completado"?th.muted:th.text,textDecoration:s.status==="completado"?"line-through":"none" }}>{s.title}</span>
                <span onClick={function(){cycleSub(dt.id,s.id);}} style={{ fontSize:10,padding:"1px 6px",borderRadius:99,border:`1px solid ${ssc.border}44`,color:ssc.text,background:ssc.bg,cursor:"pointer" }}>{SL[s.status]}</span>
                <button onClick={function(){delSub(dt.id,s.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:13 }}>✕</button>
              </div>
            );
          })}
          <div style={{ display:"flex",gap:7,marginTop:7 }}>
            <input style={Object.assign({},I,{flex:1,padding:"6px 10px",fontSize:12})} value={nSub} onChange={function(e){setNSub(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addSub();}} placeholder="Agregar subtarea..."/>
            <button style={btn("p",{padding:"6px 12px",fontSize:12})} onClick={addSub}>+</button>
          </div>
        </div>
        <div style={sCard}>
          <div style={{ fontSize:13,fontWeight:600,color:th.text,marginBottom:9 }}>Novedades <span style={{ fontSize:11,color:th.muted,fontWeight:400 }}>({(dt.notes||[]).length})</span></div>
          <textarea value={novelty} onChange={function(e){setNovelty(e.target.value);}} placeholder="Escribí una actualización o comentario..."
            style={{ width:"100%",boxSizing:"border-box",resize:"vertical",minHeight:60,border:`1.5px solid ${th.borderHi}`,borderRadius:7,background:th.s2,padding:"8px 11px",fontSize:13,color:th.text,outline:"none",marginBottom:7 }}/>
          <button style={btn("p",{padding:"5px 14px",fontSize:12})} onClick={addNote}>Agregar</button>
          <div style={{ marginTop:10,display:"flex",flexDirection:"column",gap:7 }}>
            {(dt.notes||[]).slice().reverse().map(function(n){
              return (
                <div key={n.id} style={{ background:th.s2,borderRadius:7,padding:"9px 11px",borderLeft:`3px solid ${th.accent}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                    <span style={{ fontSize:10,color:th.muted }}>{fmtDT(n.date)}</span>
                    <button onClick={function(){delNote(dt.id,n.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:11 }}>✕</button>
                  </div>
                  <div style={{ fontSize:12,color:th.text,lineHeight:1.5 }}>{n.text}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={sCard}>
          <div style={{ fontSize:13,fontWeight:600,color:th.text,marginBottom:9 }}>Archivos <span style={{ fontSize:11,color:th.muted,fontWeight:400 }}>({(dt.attachments||[]).length})</span></div>
          <input type="file" multiple ref={fileRef} style={{ display:"none" }} onChange={handleFiles}/>
          <button style={btn("d",{padding:"5px 12px",fontSize:12})} onClick={function(){fileRef.current.click();}}>+ Adjuntar</button>
          <div style={{ marginTop:10,display:"flex",flexDirection:"column",gap:7 }}>
            {(dt.attachments||[]).map(function(a){
              return (
                <div key={a.id} style={{ display:"flex",alignItems:"center",gap:9,background:th.s2,borderRadius:7,padding:"7px 11px" }}>
                  <span>📎</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:500,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.name}</div>
                    <div style={{ fontSize:10,color:th.muted }}>{(a.size/1024).toFixed(1)} KB</div>
                  </div>
                  <a href={a.data} download={a.name} style={{ fontSize:11,color:"#60A5FA",textDecoration:"none" }}>Descargar</a>
                  <button onClick={function(){delFile(dt.id,a.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:14 }}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view==="form") {
    return (
      <div style={root}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
          <button onClick={back} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:th.muted }}>←</button>
          <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:th.text }}>{editId?"Editar tarea":"Nueva tarea"}</h2>
        </div>
        <FieldBox label="TÍTULO *"><input style={FI} value={form.title} onChange={function(e){setForm(function(f){return Object.assign({},f,{title:e.target.value});});}} placeholder="¿Qué hay que hacer?"/></FieldBox>
        <FieldBox label="DESCRIPCIÓN" hint="Opcional"><textarea style={Object.assign({},FI,{resize:"vertical",minHeight:72})} value={form.desc} onChange={function(e){setForm(function(f){return Object.assign({},f,{desc:e.target.value});});}} placeholder="Contexto, detalles..."/></FieldBox>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
          <FieldBox label="ESTADO">
            <select style={FI} value={form.status} onChange={function(e){setForm(function(f){return Object.assign({},f,{status:e.target.value});}); }}>
              {STATUSES.map(function(s){ return <option key={s} value={s} style={{ background:th.s2 }}>{SL[s]}</option>; })}
            </select>
          </FieldBox>
          <FieldBox label="FECHA LÍMITE"><input type="date" style={FI} value={form.due} onChange={function(e){setForm(function(f){return Object.assign({},f,{due:e.target.value});});}}/></FieldBox>
          <FieldBox label="ÁREA">
            <select style={FI} value={form.area} onChange={function(e){setForm(function(f){return Object.assign({},f,{area:e.target.value});}); }}>
              <option value="" style={{ background:th.s2 }}>Sin área</option>
              {areas.map(function(a){ return <option key={a} style={{ background:th.s2 }}>{a}</option>; })}
            </select>
          </FieldBox>
          <FieldBox label="PROYECTO">
            <select style={FI} value={form.project} onChange={function(e){setForm(function(f){return Object.assign({},f,{project:e.target.value});}); }}>
              <option value="" style={{ background:th.s2 }}>Sin proyecto</option>
              {projects.filter(function(p){return p!=="Sin proyecto";}).map(function(p){ return <option key={p} style={{ background:th.s2 }}>{p}</option>; })}
            </select>
          </FieldBox>
        </div>
        <FieldBox label="URL / DRIVE" hint="Opcional"><input style={FI} value={form.url} onChange={function(e){setForm(function(f){return Object.assign({},f,{url:e.target.value});});}} placeholder="https://..."/></FieldBox>
        <div style={{ marginBottom:13 }}>
          <label style={{ fontSize:11,color:th.muted,fontWeight:600,letterSpacing:"0.05em",display:"block",marginBottom:4 }}>RESPONSABLES</label>
          <div style={{ border:`1.5px solid ${th.borderHi}`,borderRadius:8,background:th.s2 }}>
            <div style={{ padding:"9px 11px",display:"flex",flexWrap:"wrap",gap:7 }}>
              {people.map(function(p){
                var sel=form.responsibles.includes(p);
                return (
                  <button key={p} onClick={function(){togResp(p);}} style={{ padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:500,cursor:"pointer",border:`1.5px solid ${sel?th.accent:th.borderHi}`,background:sel?th.accentBg:th.surface,color:sel?th.accent:th.muted }}>
                    {sel?"✓ ":""}{p}
                  </button>
                );
              })}
            </div>
            <div style={{ borderTop:`1px solid ${th.border}` }}>
              <input style={FI} value={form.freeResp} onChange={function(e){setForm(function(f){return Object.assign({},f,{freeResp:e.target.value});});}} placeholder="O escribí un nombre libre..."/>
            </div>
          </div>
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",marginTop:20 }}>
          <button style={btn()} onClick={back}>Cancelar</button>
          <div style={{ display:"flex",gap:9 }}>
            {!editId && <button style={btn()} onClick={function(){ submitTask(); setTimeout(openNew,50); }}>Guardar y nueva</button>}
            <button style={btn("p")} onClick={submitTask}>{editId?"Guardar cambios":"Crear tarea"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem" }}>
        <div>
          <h2 style={{ margin:"0 0 3px",fontSize:19,fontWeight:600,color:th.text }}>Gestor de tareas</h2>
          <p style={{ margin:0,fontSize:12,color:th.muted }}>{tasks.filter(function(t){return t.status!=="completado";}).length} activas · {doneC} completadas</p>
        </div>
        <div style={{ display:"flex",gap:7 }}>
          {urgC>0 && <div style={{ background:"#3A0E0E",border:"1px solid #E24B4A",borderRadius:7,padding:"3px 9px",fontSize:11,color:"#F09595",fontWeight:600 }}>⚠ {urgC} urgente{urgC>1?"s":""}</div>}
          {odC>0  && <div style={{ background:"#2E1A00",border:"1px solid #EF9F27",borderRadius:7,padding:"3px 9px",fontSize:11,color:"#FAC775",fontWeight:600 }}>🕐 {odC} vencida{odC>1?"s":""}</div>}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center" }}>
        <TabBtn label="🏠 Inicio"      active={tab==="dashboard"}     onClick={function(){setTab("dashboard");}}     count={0}/>
        <TabBtn label="✅ Tareas"       active={tab==="tareas"}        onClick={function(){setTab("tareas");}}        count={0}/>
        <TabBtn label="📁 Historial"   active={tab==="historial"}     onClick={function(){setTab("historial");}}     count={doneC}/>
        <TabBtn label="🎯 Objetivos"   active={tab==="objetivos"}     onClick={function(){setTab("objetivos");}}     count={0}/>
        <TabBtn label="🗓 Reuniones"   active={tab==="reuniones"}     onClick={function(){setTab("reuniones");}}     count={0}/>
        <TabBtn label="📊 Indicadores" active={tab==="indicadores"}   onClick={function(){setTab("indicadores");}}   count={0}/>
        <TabBtn label="📝 Notas"       active={tab==="notas"}         onClick={function(){setTab("notas");}}         count={0}/>
        <TabBtn label="⚙️ Config"      active={tab==="configuración"} onClick={function(){setTab("configuración");}} count={0}/>
        {tab==="tareas" && (
          <div style={{ marginLeft:"auto",display:"flex",gap:7 }}>
            <div style={{ display:"flex",border:`1px solid ${th.border}`,borderRadius:7,overflow:"hidden" }}>
              {[["lista","☰"],["kanban","⊞"]].map(function(pair){
                return <button key={pair[0]} onClick={function(){setLmode(pair[0]);}} style={{ padding:"5px 10px",fontSize:13,cursor:"pointer",border:"none",background:lmode===pair[0]?th.accent:th.s2,color:lmode===pair[0]?"#fff":th.muted }}>{pair[1]}</button>;
              })}
            </div>
            <button style={btn("p")} onClick={openNew}>+ Nueva tarea</button>
          </div>
        )}
        {tab==="objetivos" && objView==="list" && (
          <button style={Object.assign({},btn("p"),{marginLeft:"auto"})} onClick={function(){setObjForm({title:"",desc:"",emoji:"🎯"});setEObjId(null);setObjView("form");}}>+ Nuevo objetivo</button>
        )}
      </div>

      {tab==="dashboard" && (
        <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
          <div style={{ flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:12 }}>
            <SCard style={{ padding:"12px 14px" }}>
              <SecTitle>MÚSICA</SecTitle>
              <div style={{ display:"flex",gap:10 }}>
                <a href="https://open.spotify.com" target="_blank" rel="noreferrer"
                  style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",background:"#1DB954",borderRadius:10,textDecoration:"none" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span style={{ fontSize:13,fontWeight:600,color:"#fff" }}>Spotify</span>
                </a>
                <a href="https://music.youtube.com" target="_blank" rel="noreferrer"
                  style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",background:"#FF0000",borderRadius:10,textDecoration:"none" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm4.596 12.96l-6.336 3.696A1.105 1.105 0 018.64 15.6V8.4a1.104 1.104 0 011.62-.96l6.336 3.6a1.08 1.08 0 010 1.92z"/>
                  </svg>
                  <span style={{ fontSize:13,fontWeight:600,color:"#fff" }}>YouTube Music</span>
                </a>
              </div>
            </SCard>
            <SCard style={{ padding:"12px 14px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <SecTitle style={{ margin:0 }}>ACCESOS DIRECTOS</SecTitle>
                <button onClick={function(){setShowScF(function(s){return !s;});setScForm({emoji:"🔗",name:"",url:""}); }} style={btn("p",{fontSize:11,padding:"3px 10px"})}>+ Agregar</button>
              </div>
              {showScF && (
                <div style={{ display:"grid",gridTemplateColumns:"50px 1fr 1fr auto",gap:7,marginBottom:10 }}>
                  <input style={I} value={scForm.emoji} onChange={function(e){setScForm(function(f){return Object.assign({},f,{emoji:e.target.value});});}} placeholder="🔗"/>
                  <input style={I} value={scForm.name}  onChange={function(e){setScForm(function(f){return Object.assign({},f,{name:e.target.value});});}}  placeholder="Nombre"/>
                  <input style={I} value={scForm.url}   onChange={function(e){setScForm(function(f){return Object.assign({},f,{url:e.target.value});});}}   placeholder="URL"/>
                  <button style={btn("p",{padding:"6px 10px"})} onClick={addShortcut}>+</button>
                </div>
              )}
              {shortcuts.length===0 && !showScF && (
                <div style={{ fontSize:12,color:th.muted }}>No hay accesos directos. Agregá el primero.</div>
              )}
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {shortcuts.map(function(s){
                  return (
                    <div key={s.id} style={{ position:"relative" }}>
                      <a href={s.url} target="_blank" rel="noreferrer"
                        style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,textDecoration:"none",padding:"9px 12px",background:th.s2,borderRadius:10,border:`1px solid ${th.border}`,minWidth:60 }}>
                        <span style={{ fontSize:20 }}>{s.emoji}</span>
                        <span style={{ fontSize:10,color:th.text,fontWeight:500,textAlign:"center",maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</span>
                      </a>
                      <button onClick={function(){delShortcut(s.id);}} style={{ position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:"#E24B4A",border:"none",cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </SCard>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <SCard style={{ padding:"12px 14px" }}>
                <SecTitle>REQUIEREN ATENCIÓN</SecTitle>
                {tasks.filter(function(t){return t.status==="urgente"||isOD(t);}).length===0
                  ? <div style={{ fontSize:12,color:th.muted }}>✓ Todo en orden</div>
                  : renderTaskList(tasks.filter(function(t){return (t.status==="urgente"||isOD(t))&&t.status!=="completado";}).slice(0,4))
                }
              </SCard>
              <SCard style={{ padding:"12px 14px" }}>
                <SecTitle>PRÓXIMOS VENCIMIENTOS</SecTitle>
                {tasks.filter(function(t){return t.due&&t.due>=today&&t.status!=="completado";}).length===0
                  ? <div style={{ fontSize:12,color:th.muted }}>Sin vencimientos próximos</div>
                  : renderTaskList(tasks.filter(function(t){return t.due&&t.due>=today&&t.status!=="completado";}).sort(function(a,b){return a.due>b.due?1:-1;}).slice(0,4))
                }
              </SCard>
            </div>
            {objectives.length>0 && (
              <SCard style={{ padding:"12px 14px" }}>
                <SecTitle>PROGRESO DE OBJETIVOS</SecTitle>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {objectives.map(function(ob){
                    var pct=objProgress(ob);
                    return (
                      <div key={ob.id} style={{ cursor:"pointer" }} onClick={function(){setObjId(ob.id);setObjView("detail");setTab("objetivos");}}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                          <span style={{ fontSize:13,color:th.text }}>{ob.emoji} {ob.title}</span>
                          <span style={{ fontSize:12,color:pct===100?"#1D9E75":th.accent,fontWeight:600 }}>{pct}%</span>
                        </div>
                        <ProgressBar pct={pct} color={pct===100?"#1D9E75":th.accent} h={4}/>
                      </div>
                    );
                  })}
                </div>
              </SCard>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
              {[
                {label:"Activas",v:tasks.filter(function(t){return t.status!=="completado";}).length,c:th.accent},
                {label:"Completadas",v:doneC,c:"#1D9E75"},
                {label:"Urgentes",v:urgC,c:"#E24B4A"},
                {label:"Vencidas",v:odC,c:"#EF9F27"},
              ].map(function(item){
                return (
                  <div key={item.label} style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:10,padding:"12px",textAlign:"center" }}>
                    <div style={{ fontSize:22,fontWeight:700,color:item.c }}>{item.v}</div>
                    <div style={{ fontSize:11,color:th.muted,marginTop:2 }}>{item.label}</div>
                  </div>
                );
              })}
            </div>
            {notes.trim() && (
              <SCard style={{ padding:"12px 14px" }}>
                <SecTitle>NOTAS RÁPIDAS</SecTitle>
                <div style={{ fontSize:13,color:th.text,lineHeight:1.6,whiteSpace:"pre-wrap",maxHeight:80,overflow:"hidden" }}>
                  {notes.slice(0,300)}{notes.length>300?"…":""}
                </div>
                <button onClick={function(){setTab("notas");}} style={{ background:"none",border:"none",cursor:"pointer",color:th.accent,fontSize:11,marginTop:4,padding:0 }}>Ver todas →</button>
              </SCard>
            )}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,width:210,flexShrink:0 }}>
            <Cal tasks={tasks.filter(function(t){return t.status!=="completado";})} sel={calSel} onSel={function(d){ setCalSel(d); if(d)setFil(function(f){return Object.assign({},f,{due:"",specDate:""});}); }}/>
            <Pomodoro/>
          </div>
        </div>
      )}

      {tab==="tareas" && (
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7,marginBottom:7 }}>
            <input style={I} placeholder="Buscar..." value={fil.search} onChange={function(e){setFil(function(f){return Object.assign({},f,{search:e.target.value});});}}/>
            <select style={I} value={fil.status} onChange={function(e){setFil(function(f){return Object.assign({},f,{status:e.target.value});});}}>
              <option value="" style={{ background:th.s2 }}>Todos los estados</option>
              {STATUSES.filter(function(s){return s!=="completado";}).map(function(s){ return <option key={s} value={s} style={{ background:th.s2 }}>{SL[s]}</option>; })}
            </select>
            <select style={I} value={fil.area} onChange={function(e){setFil(function(f){return Object.assign({},f,{area:e.target.value});});}}>
              <option value="" style={{ background:th.s2 }}>Todas las áreas</option>
              {areas.map(function(a){ return <option key={a} style={{ background:th.s2 }}>{a}</option>; })}
            </select>
            <select style={I} value={fil.project} onChange={function(e){setFil(function(f){return Object.assign({},f,{project:e.target.value});});}}>
              <option value="" style={{ background:th.s2 }}>Todos los proyectos</option>
              {projects.filter(function(p){return p!=="Sin proyecto";}).map(function(p){ return <option key={p} style={{ background:th.s2 }}>{p}</option>; })}
            </select>
          </div>
          <div style={{ display:"flex",gap:5,marginBottom:10,flexWrap:"wrap" }}>
            {[["","Todo"],["today","Hoy"],["week","Esta semana"],["month","Este mes"],["od","Vencidas"],["spec","Fecha exacta"]].map(function(pair){
              var active2=fil.due===pair[0]&&!calSel;
              return (
                <button key={pair[0]} onClick={function(){setFil(function(f){return Object.assign({},f,{due:pair[0],specDate:""});});setCalSel(null);}}
                  style={{ padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:500,cursor:"pointer",border:`1.5px solid ${active2?th.accent:th.borderHi}`,background:active2?th.accentBg:"transparent",color:active2?th.accent:th.muted }}>
                  {pair[1]}
                </button>
              );
            })}
            {fil.due==="spec" && <input type="date" style={Object.assign({},I,{width:"auto",padding:"3px 8px",fontSize:11})} value={fil.specDate} onChange={function(e){setFil(function(f){return Object.assign({},f,{specDate:e.target.value});});}}/>}
          </div>
          {lmode==="kanban" ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
              {STATUSES.map(function(status){
                var sc2=SC[status], col=active.filter(function(t){return t.status===status;});
                return (
                  <div key={status}
                    onDragOver={function(e){e.preventDefault();}}
                    onDrop={function(e){e.preventDefault();if(drag)moveTo(drag,status);setDrag(null);}}
                    style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:10,padding:"9px",minHeight:180 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                        <div style={{ width:7,height:7,borderRadius:"50%",background:sc2.border }}/>
                        <span style={{ fontSize:12,fontWeight:600,color:sc2.text }}>{SL[status]}</span>
                      </div>
                      <span style={{ fontSize:10,color:th.muted,background:th.s2,padding:"1px 6px",borderRadius:99 }}>{col.length}</span>
                    </div>
                    {col.map(function(t){
                      return <div key={t.id} draggable onDragStart={function(){setDrag(t.id);}}><KCard t={t} onOpen={openDetail} onCycle={cycleS} onDel={delTask} isOD={isOD}/></div>;
                    })}
                    {col.length===0 && <div style={{ textAlign:"center",padding:"1.5rem 0",fontSize:11,color:th.muted }}>Sin tareas</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",gap:6,marginBottom:8,alignItems:"center" }}>
                  <span style={{ fontSize:11,color:th.muted }}>Ordenar:</span>
                  {[["created","Creación"],["due","Vencimiento"],["status","Estado"],["area","Área"]].map(function(pair){
                    return (
                      <button key={pair[0]} onClick={function(){tgSort(pair[0]);}}
                        style={{ padding:"2px 9px",borderRadius:99,fontSize:11,cursor:"pointer",border:`1px solid ${sortBy===pair[0]?th.accent:th.border}`,background:sortBy===pair[0]?th.accentBg:"transparent",color:sortBy===pair[0]?th.accent:th.muted }}>
                        {pair[1]}{sortBy===pair[0]?(sortDir==="asc"?" ↑":" ↓"):""}
                      </button>
                    );
                  })}
                </div>
                {renderTaskList(sorted)}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <Cal tasks={tasks.filter(function(t){return t.status!=="completado";})} sel={calSel} onSel={function(d){setCalSel(d);if(d)setFil(function(f){return Object.assign({},f,{due:"",specDate:""});});}}/>
                <Pomodoro/>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="historial" && (function(){
        var done=tasks.filter(function(t){return t.status==="completado";}).sort(function(a,b){return (b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0);});
        return (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <p style={{ margin:0,fontSize:12,color:th.muted }}>{done.length} tarea{done.length!==1?"s":""} completada{done.length!==1?"s":""}</p>
              {done.length>0 && (confClear
                ? <div style={{ display:"flex",gap:7,alignItems:"center" }}>
                    <span style={{ fontSize:12,color:"#F09595" }}>¿Confirmar?</span>
                    <button onClick={function(){var u=tasks.filter(function(t){return t.status!=="completado";});setTasks(u);persist({tasks:u});setCC(false);}} style={btn("r",{fontSize:12,padding:"4px 11px"})}>Sí, limpiar</button>
                    <button onClick={function(){setCC(false);}} style={btn("d",{fontSize:12,padding:"4px 11px"})}>Cancelar</button>
                  </div>
                : <button onClick={function(){setCC(true);}} style={btn("r",{fontSize:12,padding:"4px 11px"})}>Limpiar historial</button>
              )}
            </div>
            {done.length===0
              ? <div style={{ textAlign:"center",padding:"3rem",color:th.muted,fontSize:13 }}>No hay tareas completadas aún.</div>
              : (
                <div style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:10,overflow:"hidden" }}>
                  {done.map(function(t,idx){
                    var subT=(t.subtasks||[]).length, subD=(t.subtasks||[]).filter(function(s){return s.status==="completado";}).length;
                    return (
                      <div key={t.id}
                        style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 11px",borderBottom:idx<done.length-1?`1px solid ${th.border}`:"none",background:"transparent" }}
                        onMouseEnter={function(e){e.currentTarget.style.background=th.s2;}}
                        onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}
                      >
                        <div style={{ width:11,height:11,borderRadius:"50%",background:"#1D9E75",flexShrink:0 }}/>
                        <div style={{ width:3,height:26,borderRadius:2,background:"#1D9E75",flexShrink:0 }}/>
                        <div style={{ flex:1,minWidth:0,cursor:"pointer" }} onClick={function(){openDetail(t);}}>
                          <div style={{ fontSize:13,fontWeight:500,textDecoration:"line-through",color:th.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
                          <div style={{ display:"flex",gap:5,alignItems:"center",marginTop:1 }}>
                            {t.area && <span style={{ fontSize:10,color:"#A78BFA" }}>{t.area}</span>}
                            {t.project&&t.project!=="Sin proyecto" && <span style={{ fontSize:10,color:"#60A5FA" }}>{t.project}</span>}
                            {subT>0 && <span style={{ fontSize:10,color:"#1D9E75" }}>✓ {subD}/{subT}</span>}
                            {t.updatedAt && <span style={{ fontSize:10,color:th.muted }}>{fmtDT(new Date(t.updatedAt).toISOString())}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                          <button onClick={function(){moveTo(t.id,"pendiente");}} style={btn("d",{fontSize:11,padding:"2px 9px",color:th.muted})}>↩ Reabrir</button>
                          <button onClick={function(){delTask(t.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13 }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        );
      })()}

      {tab==="objetivos" && (function(){
        if (objView==="form") {
          return (
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
                <button onClick={function(){setObjView("list");}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:th.muted }}>←</button>
                <h3 style={{ margin:0,fontSize:16,fontWeight:600,color:th.text }}>{editObjId?"Editar objetivo":"Nuevo objetivo"}</h3>
              </div>
              <FieldBox label="EMOJI"><input style={FI} value={objForm.emoji} onChange={function(e){setObjForm(function(f){return Object.assign({},f,{emoji:e.target.value});});}} placeholder="🎯"/></FieldBox>
              <FieldBox label="TÍTULO *"><input style={FI} value={objForm.title} onChange={function(e){setObjForm(function(f){return Object.assign({},f,{title:e.target.value});});}} placeholder="¿Cuál es tu objetivo?"/></FieldBox>
              <FieldBox label="DESCRIPCIÓN" hint="Opcional"><textarea style={Object.assign({},FI,{resize:"vertical",minHeight:72})} value={objForm.desc} onChange={function(e){setObjForm(function(f){return Object.assign({},f,{desc:e.target.value});});}} placeholder="Describí el objetivo..."/></FieldBox>
              <div style={{ display:"flex",gap:9,marginTop:16 }}>
                <button style={btn()} onClick={function(){setObjView("list");}}>Cancelar</button>
                <button style={btn("p")} onClick={submitObj}>{editObjId?"Guardar":"Crear objetivo"}</button>
              </div>
            </div>
          );
        }
        if (objView==="detail") {
          var ob = objectives.find(function(o){return o.id===objId;});
          if (!ob) return null;
          var pct = objProgress(ob);
          return (
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
                <button onClick={function(){setObjView("list");}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:th.muted }}>←</button>
                <div style={{ flex:1 }}>
                  <h3 style={{ margin:0,fontSize:17,fontWeight:600,color:th.text }}>{ob.emoji} {ob.title}</h3>
                  {ob.desc && <p style={{ margin:"4px 0 0",fontSize:13,color:th.muted }}>{ob.desc}</p>}
                </div>
                <button onClick={function(){setObjForm({title:ob.title,desc:ob.desc||"",emoji:ob.emoji});setEObjId(ob.id);setObjView("form");}} style={btn("d",{fontSize:12,padding:"4px 11px"})}>Editar</button>
              </div>
              <SCard style={{ marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:th.text }}>Progreso general</span>
                  <span style={{ fontSize:14,fontWeight:700,color:pct===100?"#1D9E75":th.accent }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={pct===100?"#1D9E75":th.accent} h={6}/>
              </SCard>
              <div style={{ marginBottom:14 }}>
                <SecTitle>PLAN DE TRABAJO</SecTitle>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                  {ob.plan.map(function(m,mi){
                    return (
                      <div key={mi} style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:10,padding:"11px 13px" }}>
                        <div style={{ fontSize:12,fontWeight:600,color:th.accent,marginBottom:8 }}>{m.label}</div>
                        {m.actions.map(function(ac,ai){
                          return (
                            <div key={ac.id} style={{ display:"flex",alignItems:"flex-start",gap:7,marginBottom:5 }}>
                              <button onClick={function(){togAction(ob,mi,ai);}} style={{ width:13,height:13,borderRadius:3,border:`1.5px solid ${ac.done?"#1D9E75":th.borderHi}`,background:ac.done?"#1D9E75":"transparent",cursor:"pointer",flexShrink:0,marginTop:1,padding:0 }}/>
                              <span style={{ flex:1,fontSize:12,color:ac.done?th.muted:th.text,textDecoration:ac.done?"line-through":"none",lineHeight:1.4 }}>{ac.text}</span>
                              <button onClick={function(){delAction(ob,mi,ai);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:11,padding:0 }}>✕</button>
                            </div>
                          );
                        })}
                        <div style={{ marginTop:6 }}>
                          {newAction.month===mi
                            ? <div style={{ display:"flex",gap:5 }}>
                                <input style={Object.assign({},I,{flex:1,padding:"4px 7px",fontSize:11})} value={newAction.text} onChange={function(e){setNewAct(function(a){return Object.assign({},a,{text:e.target.value});});}} onKeyDown={function(e){if(e.key==="Enter")addAction(ob);}} placeholder="Acción..."/>
                                <button style={btn("p",{padding:"4px 9px",fontSize:11})} onClick={function(){addAction(ob);}}>+</button>
                              </div>
                            : <button onClick={function(){setNewAct({month:mi,text:""});}} style={{ fontSize:11,color:th.muted,background:"none",border:`1px dashed ${th.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",width:"100%" }}>+ Agregar acción</button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <SCard>
                <div style={{ fontSize:13,fontWeight:600,color:th.text,marginBottom:10 }}>Tareas vinculadas</div>
                {(ob.linkedTasks||[]).map(function(tid){
                  var t=tasks.find(function(t){return t.id===tid;}); if(!t)return null;
                  var sc2=SC[t.status]||SC.pendiente;
                  return (
                    <div key={tid} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"6px 10px",background:th.s2,borderRadius:7 }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",background:sc2.dot,flexShrink:0 }}/>
                      <span style={{ flex:1,fontSize:12,color:th.text,textDecoration:t.status==="completado"?"line-through":"none" }}>{t.title}</span>
                      <Chip label={SL[t.status]} color={sc2.text} bg={sc2.bg}/>
                      <button onClick={function(){unlinkTask(ob,tid);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:12 }}>✕</button>
                    </div>
                  );
                })}
                <div style={{ display:"flex",gap:7,marginTop:8 }}>
                  <select style={Object.assign({},I,{flex:1,fontSize:12})} value={linkTask} onChange={function(e){setLinkTask(e.target.value);}}>
                    <option value="" style={{ background:th.s2 }}>Seleccionar tarea...</option>
                    {tasks.filter(function(t){return !(ob.linkedTasks||[]).includes(t.id);}).map(function(t){ return <option key={t.id} value={t.id} style={{ background:th.s2 }}>{t.title}</option>; })}
                  </select>
                  <button style={btn("p",{padding:"6px 12px",fontSize:12})} onClick={function(){linkTaskToObj(ob);}}>Vincular</button>
                </div>
              </SCard>
            </div>
          );
        }
        return (
          <div>
            {objectives.length===0
              ? <div style={{ textAlign:"center",padding:"3rem",color:th.muted,fontSize:13 }}>No hay objetivos. ¡Creá el primero!</div>
              : (
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {objectives.map(function(ob){
                    var pct=objProgress(ob);
                    var totalAct=(ob.plan||[]).reduce(function(a,m){return a+m.actions.length;},0);
                    return (
                      <div key={ob.id} style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer" }} onClick={function(){setObjId(ob.id);setObjView("detail");}}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            <span style={{ fontSize:20 }}>{ob.emoji}</span>
                            <div>
                              <div style={{ fontSize:14,fontWeight:600,color:th.text }}>{ob.title}</div>
                              {ob.desc && <div style={{ fontSize:11,color:th.muted }}>{ob.desc}</div>}
                            </div>
                          </div>
                          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                            <span style={{ fontSize:13,fontWeight:700,color:pct===100?"#1D9E75":th.accent }}>{pct}%</span>
                            <button onClick={function(e){e.stopPropagation();delObj(ob.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13 }}>✕</button>
                          </div>
                        </div>
                        <ProgressBar pct={pct} color={pct===100?"#1D9E75":th.accent} h={4}/>
                        <div style={{ fontSize:11,color:th.muted,marginTop:5 }}>{totalAct} acciones · {(ob.linkedTasks||[]).length} tareas vinculadas</div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        );
      })()}

      {tab==="reuniones" && (
        <div>
          <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
            {meetCats.map(function(cat){
              return (
                <button key={cat} onClick={function(){setMeetCat(meetCat===cat?null:cat);setShowMF(false);}}
                  style={{ padding:"5px 14px",borderRadius:99,fontSize:12,fontWeight:500,cursor:"pointer",border:`1.5px solid ${meetCat===cat?th.accent:th.border}`,background:meetCat===cat?th.accentBg:"transparent",color:meetCat===cat?th.accent:th.muted }}>
                  {cat}
                </button>
              );
            })}
            {showNC
              ? <div style={{ display:"flex",gap:6 }}>
                  <input style={Object.assign({},I,{width:140,padding:"4px 9px",fontSize:12})} value={newCatN} onChange={function(e){setNewCatN(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addMeetCat();}} placeholder="Nombre categoría..."/>
                  <button style={btn("p",{padding:"4px 10px",fontSize:12})} onClick={addMeetCat}>+</button>
                  <button style={btn("d",{padding:"4px 8px",fontSize:12})} onClick={function(){setShowNC(false);}}>✕</button>
                </div>
              : <button onClick={function(){setShowNC(true);}} style={{ padding:"5px 12px",borderRadius:99,fontSize:12,cursor:"pointer",border:`1px dashed ${th.border}`,background:"transparent",color:th.muted }}>+ Categoría</button>
            }
            {meetCat && (
              <button onClick={function(){setShowMF(function(s){return !s;});setMeetForm({date:today,summary:"",url:""}); }}
                style={Object.assign({},btn("p",{fontSize:12,padding:"5px 14px"}),{marginLeft:"auto"})}>
                + Nueva reunión
              </button>
            )}
          </div>
          {showMF && meetCat && (
            <SCard style={{ marginBottom:14 }}>
              <div style={{ fontSize:13,fontWeight:600,color:th.text,marginBottom:12 }}>Nueva reunión — {meetCat}</div>
              <div style={{ display:"grid",gridTemplateColumns:"160px 1fr",gap:10,marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:11,color:th.muted,fontWeight:600,display:"block",marginBottom:4 }}>FECHA</label>
                  <input type="date" style={I} value={meetForm.date} onChange={function(e){setMeetForm(function(f){return Object.assign({},f,{date:e.target.value});});}}/>
                </div>
                <div>
                  <label style={{ fontSize:11,color:th.muted,fontWeight:600,display:"block",marginBottom:4 }}>RESEÑA BREVE</label>
                  <input style={I} value={meetForm.summary} onChange={function(e){setMeetForm(function(f){return Object.assign({},f,{summary:e.target.value});});}} placeholder="¿De qué trató la reunión?"/>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11,color:th.muted,fontWeight:600,display:"block",marginBottom:4 }}>LINK AL DOCUMENTO</label>
                <input style={I} value={meetForm.url} onChange={function(e){setMeetForm(function(f){return Object.assign({},f,{url:e.target.value});});}} placeholder="https://docs.google.com/..."/>
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <button style={btn()} onClick={function(){setShowMF(false);}}>Cancelar</button>
                <button style={btn("p")} onClick={submitMeeting}>Guardar reunión</button>
              </div>
            </SCard>
          )}
          {!meetCat && <div style={{ textAlign:"center",padding:"3rem",color:th.muted,fontSize:13 }}>Seleccioná una categoría para ver las reuniones.</div>}
          {meetCat && (function(){
            var catM=meetings.filter(function(m){return m.cat===meetCat;}).sort(function(a,b){return b.date>a.date?1:-1;});
            if(catM.length===0) return <div style={{ textAlign:"center",padding:"2rem",color:th.muted,fontSize:13 }}>No hay reuniones en "{meetCat}" aún.</div>;
            return (
              <div style={{ background:th.surface,border:`1px solid ${th.border}`,borderRadius:12,overflow:"hidden" }}>
                <div style={{ display:"grid",gridTemplateColumns:"120px 1fr 40px 36px",gap:10,padding:"8px 14px",borderBottom:`1px solid ${th.border}`,background:th.s2 }}>
                  <div style={{ fontSize:10,fontWeight:600,color:th.muted }}>FECHA</div>
                  <div style={{ fontSize:10,fontWeight:600,color:th.muted }}>RESEÑA</div>
                  <div style={{ fontSize:10,fontWeight:600,color:th.muted,textAlign:"center" }}>DOC</div>
                  <div/>
                </div>
                {catM.map(function(m,idx){
                  return (
                    <div key={m.id}
                      style={{ display:"grid",gridTemplateColumns:"120px 1fr 40px 36px",gap:10,padding:"10px 14px",borderBottom:idx<catM.length-1?`1px solid ${th.border}`:"none",alignItems:"center",background:"transparent" }}
                      onMouseEnter={function(e){e.currentTarget.style.background=th.s2;}}
                      onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}
                    >
                      <div style={{ fontSize:12,color:th.muted,fontWeight:500 }}>{fmtD(m.date)}</div>
                      <div style={{ fontSize:13,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.summary}</div>
                      <div style={{ textAlign:"center" }}>
                        {m.url
                          ? <a href={m.url} target="_blank" rel="noreferrer" title="Abrir documento" style={{ fontSize:18,textDecoration:"none" }}>📄</a>
                          : <span style={{ fontSize:14,color:th.border }}>—</span>
                        }
                      </div>
                      <button onClick={function(){delMeeting(m.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13,textAlign:"center" }}>✕</button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {tab==="indicadores" && (function(){
        if(tasks.length===0) return <div style={{ textAlign:"center",padding:"3rem",color:th.muted,fontSize:13 }}>No hay tareas aún.</div>;
        return (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
              <ICard title="Por estado"   data={grpSt(tasks)}/>
              <ICard title="Por proyecto" data={grp(tasks,"project",projects.filter(function(p){return p!=="Sin proyecto";}).concat(["Sin proyecto"]))}/>
              <ICard title="Por área"     data={grp(tasks,"area",areas.concat(["Sin área"]))}/>
            </div>
            <SCard>
              <SecTitle>RESUMEN GENERAL</SecTitle>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9 }}>
                {[
                  {label:"Total",v:tasks.length,c:th.accent},
                  {label:"Completadas",v:doneC,c:"#1D9E75"},
                  {label:"En curso",v:tasks.filter(function(t){return t.status==="en curso";}).length,c:"#378ADD"},
                  {label:"Urgentes",v:urgC,c:"#E24B4A"},
                  {label:"Vencidas",v:odC,c:"#EF9F27"},
                ].map(function(item){
                  return (
                    <div key={item.label} style={{ background:th.s2,borderRadius:8,padding:"11px",textAlign:"center" }}>
                      <div style={{ fontSize:22,fontWeight:700,color:item.c }}>{item.v}</div>
                      <div style={{ fontSize:10,color:th.muted,marginTop:2 }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </SCard>
          </div>
        );
      })()}

      {tab==="notas" && (
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <p style={{ margin:0,fontSize:12,color:th.muted }}>Guardado automático</p>
            {notes.trim() && <button onClick={function(){setNotes("");persist({notes:""}); }} style={btn("r",{fontSize:12,padding:"4px 11px"})}>Limpiar</button>}
          </div>
          <textarea value={notes} onChange={function(e){handleNotes(e.target.value);}} placeholder="Ideas, pendientes rápidos, recordatorios, borradores..."
            style={{ width:"100%",boxSizing:"border-box",minHeight:420,resize:"vertical",border:`1.5px solid ${th.borderHi}`,borderRadius:10,background:th.surface,padding:"14px 16px",fontSize:14,color:th.text,outline:"none",lineHeight:1.7,fontFamily:"system-ui,sans-serif" }}/>
        </div>
      )}

      {tab==="configuración" && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <SCard>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:600,color:th.text }}>Accesos directos</div>
              <button style={btn("p",{fontSize:12,padding:"4px 12px"})} onClick={function(){setShowScF(function(s){return !s;});}}>+ Agregar</button>
            </div>
            {showScF && (
              <div style={{ display:"grid",gridTemplateColumns:"60px 1fr 1fr auto",gap:8,marginBottom:12 }}>
                <input style={I} value={scForm.emoji} onChange={function(e){setScForm(function(f){return Object.assign({},f,{emoji:e.target.value});});}} placeholder="🔗"/>
                <input style={I} value={scForm.name}  onChange={function(e){setScForm(function(f){return Object.assign({},f,{name:e.target.value});});}}  placeholder="Nombre"/>
                <input style={I} value={scForm.url}   onChange={function(e){setScForm(function(f){return Object.assign({},f,{url:e.target.value});});}}   placeholder="URL"/>
                <button style={btn("p",{padding:"6px 12px"})} onClick={addShortcut}>+</button>
              </div>
            )}
            {shortcuts.length===0
              ? <div style={{ fontSize:12,color:th.muted }}>Sin accesos directos.</div>
              : (
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {shortcuts.map(function(s,i){
                    return (
                      <div key={s.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:th.s2,borderRadius:8 }}>
                        <span style={{ fontSize:18 }}>{s.emoji}</span>
                        <span style={{ flex:1,fontSize:13,color:th.text }}>{s.name}</span>
                        <span style={{ fontSize:11,color:th.muted,overflow:"hidden",textOverflow:"ellipsis",maxWidth:180 }}>{s.url}</span>
                        <div style={{ display:"flex",gap:4 }}>
                          {i>0 && <button onClick={function(){moveShortcut(i,i-1);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:13 }}>↑</button>}
                          {i<shortcuts.length-1 && <button onClick={function(){moveShortcut(i,i+1);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:13 }}>↓</button>}
                          <button onClick={function(){delShortcut(s.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13 }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </SCard>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
            {[
              {title:"Áreas",    list:areas,    setL:setAreas,    val:nArea, setV:setNArea, key:"areas"},
              {title:"Proyectos",list:projects, setL:setProjects, val:nProj, setV:setNProj, key:"projects"},
              {title:"Personas", list:people,   setL:setPeople,   val:nPers, setV:setNPers, key:"people"},
            ].map(function(cfg){
              return (
                <SCard key={cfg.title}>
                  <div style={{ fontSize:13,fontWeight:600,color:th.text,marginBottom:10 }}>{cfg.title}</div>
                  <div style={{ display:"flex",gap:7,marginBottom:10 }}>
                    <input style={Object.assign({},I,{flex:1})} placeholder="Nuevo/a..." value={cfg.val} onChange={function(e){cfg.setV(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addItem(cfg.list,cfg.setL,cfg.val,cfg.setV,cfg.key);}}/>
                    <button style={btn("p",{padding:"6px 12px"})} onClick={function(){addItem(cfg.list,cfg.setL,cfg.val,cfg.setV,cfg.key);}}>+</button>
                  </div>
                  {cfg.list.map(function(item){
                    return (
                      <div key={item} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`0.5px solid ${th.border}` }}>
                        <span style={{ fontSize:12,color:th.text }}>{item}</span>
                        {item!=="Sin proyecto" && <button onClick={function(){delItem(cfg.list,cfg.setL,item,cfg.key);}} style={{ background:"none",border:"none",cursor:"pointer",color:th.muted,fontSize:14 }}>✕</button>}
                      </div>
                    );
                  })}
                </SCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
