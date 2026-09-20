const http = require("http");
const PORT = process.env.PORT || 3000;
const BACKEND = process.env.BACKEND_URL || "http://10.100.0.94:4000";

async function fetchJ(u) {
  try { const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); return await r.json(); }
  catch { return { error: "unreachable" }; }
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SOC Command Center | Security Operations</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#060a14;--s1:#0c1222;--s2:#151d30;--s3:#1a2540;
  --b:rgba(99,102,241,.12);--b2:rgba(99,102,241,.25);
  --t:#e8ecf4;--t2:#c1c9d9;--m:#6b7a99;
  --p:#818cf8;--p2:#6366f1;--p3:#4f46e5;
  --g:#34d399;--g2:#059669;--r:#f87171;--r2:#dc2626;
  --o:#fbbf24;--o2:#d97706;--c:#22d3ee;--c2:#0891b2;
  --pk:#f472b6;--pp:#a78bfa;
  --grad1:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);
  --grad2:linear-gradient(135deg,rgba(99,102,241,.08),rgba(6,182,212,.05));
  --glow:0 0 30px rgba(99,102,241,.15);
}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;overflow:hidden}

/* ── HEADER ── */
.hd{height:56px;background:var(--s1);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:relative;z-index:10}
.hd::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:var(--grad1);opacity:.4}
.hd-left{display:flex;align-items:center;gap:12px}
.logo{font-size:18px;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px}
.badge{font-size:9px;background:var(--p3);color:white;padding:2px 6px;border-radius:4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.hd-right{display:flex;align-items:center;gap:16px}
#sc{font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px}
.pulse{width:7px;height:7px;border-radius:50%;background:var(--g);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.5)}50%{box-shadow:0 0 0 6px rgba(52,211,153,0)}}
.ts{font-size:10px;color:var(--m)}

/* ── LAYOUT ── */
.layout{display:flex;height:calc(100vh - 56px)}
nav{width:200px;background:var(--s1);border-right:1px solid var(--b);padding:8px;overflow-y:auto;flex-shrink:0}
nav .grp{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--m);padding:14px 12px 6px;font-weight:700}
nav a{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;color:var(--m);cursor:pointer;font-size:12px;font-weight:500;transition:all .15s;margin-bottom:1px;text-decoration:none}
nav a:hover{background:rgba(99,102,241,.08);color:var(--t)}
nav a.on{background:rgba(99,102,241,.12);color:var(--p);font-weight:600}
nav a .ico{font-size:14px;width:20px;text-align:center}
#ct{flex:1;padding:20px;overflow-y:auto;overflow-x:hidden}

/* ── COMPONENTS ── */
.title{font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px;color:var(--t)}
.title .ico{font-size:18px}
.grid{display:grid;gap:12px;margin-bottom:16px}
.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g2{grid-template-columns:repeat(2,1fr)}
@media(max-width:1200px){.g4{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:768px){.g4,.g3,.g2{grid-template-columns:1fr}}

.card{background:var(--s2);border:1px solid var(--b);border-radius:10px;padding:16px;transition:border-color .2s}
.card:hover{border-color:var(--b2)}
.card h4{font-size:10px;color:var(--m);text-transform:uppercase;letter-spacing:.8px;font-weight:600;margin-bottom:8px}
.val{font-size:26px;font-weight:800;line-height:1.1}
.val.green{color:var(--g)}.val.orange{color:var(--o)}.val.blue{color:var(--c)}
.val.red{color:var(--r)}.val.purple{color:var(--pp)}.val.pink{color:var(--pk)}
.sub{font-size:10px;color:var(--m);margin-top:4px}

/* TABLE */
.tbl{width:100%;border-collapse:collapse;font-size:11px}
.tbl th{text-align:left;padding:8px;border-bottom:1px solid var(--b);color:var(--m);font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:700}
.tbl td{padding:7px 8px;border-bottom:1px solid rgba(99,102,241,.06)}
.tbl tr:hover{background:rgba(99,102,241,.04)}
.mono{font-family:'Courier New',monospace;font-size:10px;color:var(--c)}

/* TAGS */
.tag{display:inline-block;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
.tag.critical,.tag.P1{background:rgba(248,113,113,.15);color:var(--r);border:1px solid rgba(248,113,113,.2)}
.tag.high,.tag.P2{background:rgba(251,191,36,.12);color:var(--o);border:1px solid rgba(251,191,36,.2)}
.tag.medium,.tag.P3{background:rgba(129,140,248,.12);color:var(--p);border:1px solid rgba(129,140,248,.2)}
.tag.low,.tag.P4,.tag.info{background:rgba(52,211,153,.1);color:var(--g);border:1px solid rgba(52,211,153,.2)}
.tag.active,.tag.running,.tag.healthy,.tag.open,.tag.success{background:rgba(52,211,153,.1);color:var(--g);border:1px solid rgba(52,211,153,.2)}
.tag.failed,.tag.dead,.tag.closed,.tag.DENY{background:rgba(248,113,113,.12);color:var(--r);border:1px solid rgba(248,113,113,.2)}
.tag.investigating,.tag.recovering,.tag.suspicious,.tag.paused,.tag.draft,.tag.pending,.tag.LOG{background:rgba(251,191,36,.1);color:var(--o);border:1px solid rgba(251,191,36,.2)}
.tag.contained,.tag.mitigated,.tag.resolved,.tag.normal,.tag.scanned,.tag.ALLOW{background:rgba(34,211,238,.1);color:var(--c);border:1px solid rgba(34,211,238,.2)}

/* SERVICE GRID */
.svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.svc-card{background:var(--s2);border:1px solid var(--b);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:all .2s}
.svc-card:hover{transform:translateY(-2px);border-color:var(--b2);box-shadow:var(--glow)}
.svc-dot{width:8px;height:8px;border-radius:50%;margin:0 auto 10px}
.svc-dot.up{background:var(--g);box-shadow:0 0 10px rgba(52,211,153,.5)}
.svc-dot.dn{background:var(--r);box-shadow:0 0 10px rgba(248,113,113,.5)}
.svc-ico{font-size:24px;margin-bottom:6px}
.svc-name{font-size:11px;font-weight:700;color:var(--t)}
.svc-role{font-size:9px;color:var(--m);margin-top:2px}
</style>
</head>
<body>
<div class="hd">
  <div class="hd-left">
    <span class="logo">SOC Command Center</span>
    <span class="badge">Live</span>
  </div>
  <div class="hd-right">
    <span id="sc"><span class="pulse"></span> Loading...</span>
    <span class="ts" id="clock"></span>
  </div>
</div>
<div class="layout">
  <nav id="sb">
    <div class="grp">Overview</div>
    <a class="on" data-t="dash"><span class="ico">📊</span> Dashboard</a>
    <a data-t="svcs"><span class="ico">🔌</span> Services</a>
    <a data-t="scan"><span class="ico">🔍</span> Live Scan</a>
    <div class="grp">Security</div>
    <a data-t="siem"><span class="ico">📋</span> SIEM</a>
    <a data-t="soar"><span class="ico">⚡</span> SOAR</a>
    <a data-t="hp"><span class="ico">🍯</span> Honeypot</a>
    <a data-t="ids"><span class="ico">🛡️</span> IDS/IPS</a>
    <a data-t="fw"><span class="ico">🔥</span> Firewall</a>
    <div class="grp">Analytics</div>
    <a data-t="uba"><span class="ico">👤</span> UBA</a>
    <a data-t="ti"><span class="ico">🌐</span> Threat Intel</a>
    <a data-t="vs"><span class="ico">🔍</span> Vuln Scanner</a>
    <div class="grp">Operations</div>
    <a data-t="ops"><span class="ico">🚨</span> Incidents</a>
  </nav>
  <main id="ct"><div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--m);font-size:13px">Connecting to backend...</div></main>
</div>
<script>
var SN=["soc-siem","soc-soar","soc-honeypot","soc-ids","soc-firewall","soc-uba","soc-threat-intel","soc-vuln-scan","soc-ops"];
var LB={"soc-siem":"SIEM","soc-soar":"SOAR","soc-honeypot":"Honeypot","soc-ids":"IDS/IPS","soc-firewall":"Firewall","soc-uba":"UBA","soc-threat-intel":"Threat Intel","soc-vuln-scan":"Vuln Scanner","soc-ops":"Incidents"};
var IC={"soc-siem":"📋","soc-soar":"⚡","soc-honeypot":"🍯","soc-ids":"🛡️","soc-firewall":"🔥","soc-uba":"👤","soc-threat-intel":"🌐","soc-vuln-scan":"🔍","soc-ops":"🚨"};
var RL={"soc-siem":"Log Collection","soc-soar":"Orchestration","soc-honeypot":"Deception","soc-ids":"Detection","soc-firewall":"Traffic Control","soc-uba":"Behavior Analytics","soc-threat-intel":"IOC Feeds","soc-vuln-scan":"Vulnerability Assessment","soc-ops":"Incident Management"};
var TM={"siem":"soc-siem","soar":"soc-soar","hp":"soc-honeypot","ids":"soc-ids","fw":"soc-firewall","uba":"soc-uba","ti":"soc-threat-intel","vs":"soc-vuln-scan","ops":"soc-ops"};
var C={},H={},tab="dash";

function api(u){return fetch(u,{signal:AbortSignal.timeout(8000)}).then(function(r){return r.json()}).catch(function(){return{error:"unreachable"}})}
function refresh(){
  return Promise.allSettled(SN.map(function(s){
    return api("/proxy/"+s+"/health").then(function(h){H[s]=h;return Promise.all([api("/proxy/"+s+"/stats"),api("/proxy/"+s+"/alerts"),api("/proxy/"+s+"/items"),api("/proxy/"+s+"/rules")]).then(function(a){C[s]={stats:a[0],alerts:a[1],items:a[2],rules:a[3]}})}).catch(function(){H[s]={error:"down"}})
  })).then(function(){
    var up=Object.values(H).filter(function(h){return h.status==="healthy"}).length;
    document.getElementById("sc").innerHTML='<span class="pulse"></span> '+up+"/"+SN.length+" Online";
  })
}
function ago(t){if(!t||t<1e9)return"-";var s=Math.floor((Date.now()-t)/1000);return s<60?s+"s ago":s<3600?Math.floor(s/60)+"m ago":Math.floor(s/3600)+"h ago"}
function tag(v){if(!v)return"-";return '<span class="tag '+v+'">'+v+"</span>"}
function findTab(s){var f="dash";Object.keys(TM).forEach(function(k){if(TM[k]===s)f=k});return f}
function clock(){document.getElementById("clock").textContent=new Date().toLocaleTimeString()}
setInterval(clock,1000);clock();

function rDash(){
  var ta=0,cr=0,ev=0,bl=0;
  Object.values(C).forEach(function(c){ta+=(c&&c.alerts&&c.alerts.length)||0;if(c&&c.alerts)c.alerts.forEach(function(a){if(a.sev==="critical"||a.sev==="P1")cr++});ev+=(c&&c.stats&&c.stats.evt)||0;bl+=(c&&c.stats&&c.stats.blocked)||0});
  var up=Object.values(H).filter(function(h){return h.status==="healthy"}).length;
  var al=[];
  Object.keys(C).forEach(function(k){if(C[k]&&C[k].alerts)C[k].alerts.forEach(function(a){al.push(Object.assign({},a,{src:LB[k]||k}))})});
  al.sort(function(a,b){return(b.ts||0)-(a.ts||0)});
  var oi=0;if(C["soc-ops"]&&C["soc-ops"].items)C["soc-ops"].items.forEach(function(i){if(i.status==="open"||i.status==="investigating")oi++});
  var iocs=(C["soc-threat-intel"]&&C["soc-threat-intel"].items&&C["soc-threat-intel"].items.length)||0;
  var hp=0;if(C["soc-honeypot"]&&C["soc-honeypot"].items)C["soc-honeypot"].items.forEach(function(i){hp+=i.interactions||0});
  
  var h='<div class="title"><span class="ico">📊</span> Security Operations Dashboard</div>';
  h+='<div class="grid g4">';
  h+='<div class="card"><h4>Services Online</h4><div class="val green">'+up+'/'+SN.length+'</div><div class="sub">All modules monitored</div></div>';
  h+='<div class="card"><h4>Total Alerts</h4><div class="val orange">'+ta+'</div><div class="sub">'+cr+' critical priority</div></div>';
  h+='<div class="card"><h4>Events Processed</h4><div class="val blue">'+ev.toLocaleString()+'</div><div class="sub">Across all sources</div></div>';
  h+='<div class="card"><h4>Threats Blocked</h4><div class="val red">'+bl.toLocaleString()+'</div><div class="sub">By IDS + Firewall</div></div>';
  h+='</div><div class="grid g4">';
  h+='<div class="card"><h4>Open Incidents</h4><div class="val pink">'+oi+'</div><div class="sub">Require attention</div></div>';
  h+='<div class="card"><h4>Active IOCs</h4><div class="val purple">'+iocs+'</div><div class="sub">From threat feeds</div></div>';
  h+='<div class="card"><h4>Honeypot Hits</h4><div class="val orange">'+hp+'</div><div class="sub">Attacker interactions</div></div>';
  h+='<div class="card"><h4>Scan Targets</h4><div class="val blue">'+(C["soc-vuln-scan"]&&C["soc-vuln-scan"].stats&&C["soc-vuln-scan"].stats.targets||0)+'</div><div class="sub">Real websites</div></div>';
  h+='</div>';
  
  // Alerts table
  h+='<div class="grid g2">';
  h+='<div class="card"><h4>Recent Alerts (All Sources)</h4>';
  if(al.length){
    h+='<table class="tbl"><thead><tr><th>Time</th><th>Source</th><th>Severity</th><th>Description</th></tr></thead><tbody>';
    al.slice(0,12).forEach(function(a){h+='<tr><td class="mono">'+ago(a.ts)+'</td><td>'+a.src+'</td><td>'+tag(a.sev)+'</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(a.msg||"-")+'</td></tr>'});
    h+='</tbody></table>';
  }else h+='<div style="color:var(--m);padding:30px;text-align:center;font-size:12px">Waiting for alert data...</div>';
  h+='</div>';
  
  // Service health grid
  h+='<div class="card"><h4>Service Health Matrix</h4><div class="svc-grid">';
  SN.forEach(function(s){
    var isUp=H[s]&&H[s].status==="healthy";
    h+='<div class="svc-card" onclick="go(&#39;'+findTab(s)+'&#39;)"><div class="svc-dot '+(isUp?"up":"dn")+'"></div><div class="svc-ico">'+IC[s]+'</div><div class="svc-name">'+LB[s]+'</div><div class="svc-role">'+(isUp?"Online":"Offline")+'</div></div>';
  });
  h+='</div></div></div>';
  document.getElementById("ct").innerHTML=h;
}

function rSvcs(){
  var h='<div class="title"><span class="ico">🔌</span> Service Map</div><div class="svc-grid" style="margin-bottom:16px">';
  SN.forEach(function(s){
    var isUp=H[s]&&H[s].status==="healthy";
    h+='<div class="svc-card" onclick="go(&#39;'+findTab(s)+'&#39;)"><div class="svc-dot '+(isUp?"up":"dn")+'"></div><div class="svc-ico">'+IC[s]+'</div><div class="svc-name">'+LB[s]+'</div><div class="svc-role">'+RL[s]+'</div><div style="margin-top:6px;font-size:10px;color:var(--m)">Req: '+((C[s]&&C[s].stats&&C[s].stats.req)||0)+'</div></div>';
  });
  h+='</div><div class="card"><h4>Service Details</h4><table class="tbl"><thead><tr><th>Service</th><th>Status</th><th>Role</th><th>Events</th><th>Alerts</th></tr></thead><tbody>';
  SN.forEach(function(s){
    var isUp=H[s]&&H[s].status==="healthy";
    h+='<tr><td>'+IC[s]+' '+LB[s]+'</td><td>'+tag(isUp?"active":"failed")+'</td><td style="color:var(--m);font-size:10px">'+RL[s]+'</td><td>'+((C[s]&&C[s].stats&&C[s].stats.evt)||0)+'</td><td>'+((C[s]&&C[s].alerts&&C[s].alerts.length)||0)+'</td></tr>';
  });
  h+='</tbody></table></div>';
  document.getElementById("ct").innerHTML=h;
}

function rScan(){
  var items=(C["soc-vuln-scan"]&&C["soc-vuln-scan"].items)||[];
  var h='<div class="title"><span class="ico">🔍</span> Live Vulnerability Scan (Real Targets)</div>';
  h+='<div class="grid g4">';
  items.forEach(function(r){
    if(!r.target)return;
    var scoreNum=parseInt(r.securityScore)||0;
    var color=scoreNum>=70?"green":scoreNum>=40?"orange":"red";
    h+='<div class="card"><h4>'+r.target+'</h4><div class="val '+color+'">'+(r.securityScore||"N/A")+'</div><div class="sub">Security Score</div><div style="margin-top:8px;font-size:10px;color:var(--m)">Latency: '+(r.latency||"?")+'</div><div style="font-size:10px;color:var(--m)">Headers: '+(r.headersFound||"?")+'</div></div>';
  });
  h+='</div>';
  if(items.length&&items[0].missing){
    h+='<div class="card"><h4>Scan Results Detail</h4><table class="tbl"><thead><tr><th>Target</th><th>Status</th><th>Score</th><th>Latency</th><th>Missing Headers</th></tr></thead><tbody>';
    items.forEach(function(r){
      if(!r.target)return;
      h+='<tr><td><strong>'+r.target+'</strong><br><span class="mono" style="font-size:9px">'+r.url+'</span></td><td>'+tag(r.status==="error"?"failed":"active")+'</td><td>'+(r.securityScore||"N/A")+'</td><td>'+(r.latency||"-")+'</td><td style="font-size:10px;color:var(--o)">'+(r.missing?r.missing.join(", "):"-")+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  document.getElementById("ct").innerHTML=h;
}

function rSvc(key){
  var d=C[key]||{};
  var h='<div class="title"><span class="ico">'+IC[key]+'</span> '+LB[key]+' <span style="font-size:11px;color:var(--m);font-weight:400;margin-left:8px">'+RL[key]+'</span></div>';
  h+='<div class="grid g4">';
  h+='<div class="card"><h4>Items</h4><div class="val blue">'+(d.items&&d.items.length||0)+'</div></div>';
  h+='<div class="card"><h4>Alerts</h4><div class="val orange">'+(d.alerts&&d.alerts.length||0)+'</div></div>';
  h+='<div class="card"><h4>Rules</h4><div class="val purple">'+(d.rules&&d.rules.length||0)+'</div></div>';
  h+='<div class="card"><h4>Events</h4><div class="val green">'+(d.stats&&d.stats.evt||0)+'</div></div>';
  h+='</div>';
  
  if(d.alerts&&d.alerts.length){
    h+='<div class="card" style="margin-bottom:12px"><h4>Alerts</h4><table class="tbl"><thead><tr><th>Time</th><th>Severity</th><th>Description</th></tr></thead><tbody>';
    d.alerts.forEach(function(a){h+='<tr><td class="mono">'+ago(a.ts)+'</td><td>'+tag(a.sev)+'</td><td>'+(a.msg||"-")+'</td></tr>'});
    h+='</tbody></table></div>';
  }
  if(d.items&&d.items.length){
    var keys=Object.keys(d.items[0]);
    h+='<div class="card"><h4>Data</h4><table class="tbl"><thead><tr>';
    keys.forEach(function(k){h+='<th>'+k+'</th>'});
    h+='</tr></thead><tbody>';
    d.items.slice(0,20).forEach(function(item){
      h+='<tr>';
      Object.values(item).forEach(function(v){
        var display=v;
        if(typeof v==="number"&&v>1e9)display=ago(v);
        else if(typeof v==="string"&&["critical","high","medium","low","open","closed","active","paused","resolved","investigating","P1","P2","P3","P4","success","failed","running","normal","suspicious","draft","pending","mitigated","contained","ALLOW","DENY","LOG"].indexOf(v)!==-1)display=tag(v);
        h+='<td>'+display+'</td>';
      });
      h+='</tr>';
    });
    h+='</tbody></table></div>';
  }
  document.getElementById("ct").innerHTML=h;
}

function go(t){tab=t;document.querySelectorAll("nav a").forEach(function(a){a.classList.toggle("on",a.dataset.t===t)});render()}
function render(){
  if(tab==="dash")rDash();
  else if(tab==="svcs")rSvcs();
  else if(tab==="scan")rScan();
  else if(TM[tab])rSvc(TM[tab]);
}
document.querySelectorAll("nav a").forEach(function(a){a.addEventListener("click",function(){go(a.dataset.t)})});
refresh().then(function(){render();setInterval(function(){refresh().then(render)},12000)});
</script>
</body></html>`;

function J(res, c, o) {
  res.writeHead(c, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*" });
  res.end(JSON.stringify(o));
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://l");
  if (req.method === "OPTIONS") return J(res, 200, {});
  if (u.pathname === "/health") return J(res, 200, { status: "healthy", service: "soc-gateway" });
  if (u.pathname.startsWith("/proxy/")) {
    const path = u.pathname.replace("/proxy/", "");
    const d = await fetchJ(BACKEND + "/" + path);
    return J(res, 200, d);
  }
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(HTML);
}).listen(PORT, () => console.log("SOC Gateway on " + PORT));
