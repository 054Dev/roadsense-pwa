import React, { useState } from 'react';
import { Activity, ArrowRight, Bell, CheckCircle2, ChevronDown, CircleAlert, Clock3, Compass, Gauge, MapPin, Menu, Radio, ShieldCheck, Signal, X } from 'lucide-react';

const hazards = [
  { id: 'RS-2048', road: 'Kisumu–Kakamega Road', area: 'Kisumu County', severity: 'High', time: '4 min ago', x: '26%', y: '32%' },
  { id: 'RS-2047', road: 'Nakuru–Eldoret Highway', area: 'Nakuru County', severity: 'Medium', time: '18 min ago', x: '63%', y: '48%' },
  { id: 'RS-2046', road: 'Kericho–Litein Road', area: 'Kericho County', severity: 'Low', time: '32 min ago', x: '46%', y: '72%' },
];
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('Overview');
  const [selected, setSelected] = useState(hazards[0]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [demo, setDemo] = useState(false);
  const nav = ['Overview', 'Live map', 'Reports', 'About'];
  const jump = (label) => { setActive(label); setMenuOpen(false); if(label === 'Live map') document.getElementById('map')?.scrollIntoView({behavior:'smooth'}); else if(label === 'Reports') document.getElementById('reports')?.scrollIntoView({behavior:'smooth'}); else window.scrollTo({top:0,behavior:'smooth'}); };
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Activity size={21}/></span><span>road<span className="lime">sense</span><small>ROAD INTELLIGENCE</small></span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}>{nav.map(n=><button key={n} className={active===n?'nav-link active':'nav-link'} onClick={()=>jump(n)}>{n}</button>)}</nav>
      <div className="top-actions"><button className="icon-btn" aria-label="Notifications" onClick={()=>setShowAlerts(!showAlerts)}><Bell size={18}/><i/></button><button className="btn btn-outline small" onClick={()=>setDemo(true)}>Open dashboard <ArrowRight size={15}/></button></div>
      <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen?<X/>:<Menu/>}</button>
      {showAlerts && <div className="notification-pop"><b>Recent alerts</b><p><CircleAlert size={14}/> 1 high-severity road hazard detected</p><p><CheckCircle2 size={14}/> 3 reports validated today</p></div>}
    </header>
    <main>
      <section className="hero wrap">
        <div className="hero-copy"><div className="eyebrow"><span className="pulse"/> SMART ROAD MONITORING <span className="eyebrow-line"/></div>
          <h1>Better roads<br/>begin with <em>better data.</em></h1>
          <p className="hero-lead">Turning road conditions into actionable intelligence. Detect hazards, map their locations, and help communities make every journey safer.</p>
          <div className="hero-buttons"><button className="btn btn-primary" onClick={()=>jump('Live map')}>Explore live map <ArrowRight size={17}/></button><button className="btn btn-ghost" onClick={()=>setDemo(true)}><span className="play">▶</span> See how it works</button></div>
          <div className="hero-proof"><div className="avatar-stack"><span>R</span><span>S</span><span>+</span></div><span><b>Data-led decisions.</b><br/>Safer journeys for everyone.</span></div>
        </div>
        <div className="hero-visual"><div className="visual-glow"/><div className="map-card">
          <div className="map-head"><div><span className="live-dot"/> LIVE HAZARD OVERVIEW</div><span className="map-time"><Clock3 size={12}/> Updated just now</span></div>
          <div className="map-art"><div className="map-grid"/><svg className="roads" viewBox="0 0 600 360" preserveAspectRatio="none"><path d="M-20 270 C120 220 100 120 220 140 S370 260 620 70" /><path d="M70 -20 C150 90 250 60 310 160 S430 280 510 390"/><path d="M-20 80 L620 300"/><path d="M10 350 L580 10"/></svg>
            <div className="map-label label-a">KISUMU</div><div className="map-label label-b">NAKURU</div><div className="map-label label-c">RIFT VALLEY</div>
            {hazards.map(h=><button key={h.id} className={'pin '+h.severity.toLowerCase()+(selected.id===h.id?' selected':'')} style={{left:h.x,top:h.y}} onClick={()=>setSelected(h)} title={h.road}><span/></button>)}
            <div className="map-legend"><span><i className="dot high"/> High</span><span><i className="dot medium"/> Medium</span><span><i className="dot low"/> Low</span></div>
          </div>
          <div className="selected-hazard"><div className="hazard-icon"><MapPin size={17}/></div><div className="hazard-info"><b>{selected.road}</b><span>{selected.area} · {selected.time}</span></div><span className={'severity '+selected.severity.toLowerCase()}>{selected.severity}</span></div>
        </div><div className="float-stat"><span className="stat-icon"><Signal size={17}/></span><div><b>Live detection</b><small>Sensor network active</small></div><span className="online">●</span></div></div>
      </section>
      <section className="stats wrap"><div><span className="stat-label">HAZARDS IDENTIFIED</span><b>1,284</b><small><span className="up">↗ 12.8%</span> this month</small></div><div><span className="stat-label">COUNTIES COVERED</span><b>08</b><small>Growing coverage</small></div><div><span className="stat-label">REPORTS VALIDATED</span><b>936</b><small>Community verified</small></div><div><span className="stat-label">SYSTEM STATUS</span><b className="status-text"><i/> Operational</b><small>All systems running</small></div></section>
      <section className="section wrap" id="map"><div className="section-heading"><div><div className="eyebrow">THE ROAD AHEAD, IN REAL TIME</div><h2>See the road <em>clearly.</em></h2></div><button className="text-link" onClick={()=>setDemo(true)}>View all activity <ArrowRight size={16}/></button></div>
        <div className="content-grid"><div className="map-panel"><div className="panel-top"><div><b>Road condition activity</b><span>Illustrative live monitoring view</span></div><button className="filter-btn">Last 24 hours <ChevronDown size={14}/></button></div><div className="large-map"><div className="map-grid"/><div className="county c1">KENYA</div><div className="county c2">RIFT VALLEY</div><div className="county c3">WESTERN</div><svg viewBox="0 0 700 360" preserveAspectRatio="none"><path d="M40 300 Q180 20 350 180 T680 40 M80 20 Q260 180 330 320 T650 250 M10 180 L690 180"/></svg>{hazards.map((h,i)=><button key={h.id} className={'map-point '+h.severity.toLowerCase()} style={{left:h.x,top:h.y}} onClick={()=>setSelected(h)}>{i+1}</button>)}</div><div className="map-foot"><span><i className="dot high"/> High risk</span><span><i className="dot medium"/> Moderate</span><span><i className="dot low"/> Low risk</span><span className="map-foot-note"><Compass size={13}/> Map preview · Sample data</span></div></div>
          <aside className="activity-panel" id="reports"><div className="activity-title"><b>Recent detections</b><span className="live-pill">LIVE</span></div>{hazards.map(h=><button key={h.id} className={'activity-item '+(selected.id===h.id?'chosen':'')} onClick={()=>setSelected(h)}><span className={'activity-marker '+h.severity.toLowerCase()}><MapPin size={16}/></span><span className="activity-copy"><b>{h.road}</b><small>{h.area}</small><small>{h.time}</small></span><span className={'severity '+h.severity.toLowerCase()}>{h.severity}</span></button>)}<button className="all-reports" onClick={()=>setDemo(true)}>See all reports <ArrowRight size={15}/></button></aside></div>
      </section>
      <section className="features"><div className="wrap"><div className="eyebrow">FROM ROAD TO INSIGHT</div><h2>One connected system.<br/><em>Safer roads.</em></h2><div className="feature-grid"><article><span className="feature-icon"><Gauge/></span><h3>Intelligent detection</h3><p>Sensor-based monitoring identifies potholes and rough road surfaces as journeys happen.</p></article><article><span className="feature-icon"><MapPin/></span><h3>Precise locations</h3><p>GPS coordinates connect each detected hazard to the road segment that needs attention.</p></article><article><span className="feature-icon"><ShieldCheck/></span><h3>Verified reporting</h3><p>Review and validate reports to turn raw observations into trusted road-condition data.</p></article><article><span className="feature-icon"><Radio/></span><h3>Actionable insights</h3><p>Bring road intelligence together in one dashboard for faster, evidence-led decisions.</p></article></div></div></section>
      <section className="cta wrap"><div><div className="eyebrow">BUILDING BETTER JOURNEYS</div><h2>Make every road<br/>count.</h2><p>Explore how connected sensing and reliable data can help improve road safety.</p></div><button className="btn btn-primary" onClick={()=>setDemo(true)}>Explore the dashboard <ArrowRight size={17}/></button></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><a className="brand" href="#"><span className="brand-mark"><Activity size={20}/></span><span>road<span className="lime">sense</span><small>ROAD INTELLIGENCE</small></span></a><span>© 2026 RoadSense. Better roads begin with better data.</span><span className="footer-tag">BUILT FOR SAFER JOURNEYS <span className="lime">●</span></span></div></footer>
    {demo && <div className="modal-backdrop" onClick={()=>setDemo(false)}><div className="demo-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setDemo(false)}><X/></button><span className="feature-icon"><Activity/></span><div className="eyebrow">ROAD SENSE PREVIEW</div><h2>Dashboard preview</h2><p>This is a front-end concept using sample data. The live sensor feed, authentication, report validation and backend API will be connected during integration.</p><div className="modal-metrics"><span><b>1,284</b><small>Hazards identified</small></span><span><b>936</b><small>Validated reports</small></span></div><button className="btn btn-primary" onClick={()=>setDemo(false)}>Continue exploring <ArrowRight size={16}/></button></div></div>}
  </div>;
}
export default App;