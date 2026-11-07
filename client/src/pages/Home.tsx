import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Download,
  Map,
  MapPin,
  Radio,
  Route,
  Settings2,
  ShieldCheck,
  Signal,
  SignalZero,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resolveApiUrl } from "@/lib/apiUrl";

type ConnectionState = "connecting" | "connected" | "offline";
type RecentReport = {
  id: number;
  type: "pothole" | "rough";
  severity: number;
  latitude: string;
  longitude: string;
  timestamp: Date | string;
};

const pinPositions = [
  { left: "26%", top: "32%" },
  { left: "63%", top: "48%" },
  { left: "46%", top: "72%" },
];

function formatTime(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function severityLabel(severity: number) {
  if (severity === 3) return "High";
  if (severity === 2) return "Moderate";
  return "Low";
}

function reportTitle(report: RecentReport) {
  return report.type === "pothole" ? "Pothole reported" : "Rough road reported";
}

function reportCoordinates(report: RecentReport) {
  return `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`;
}

export default function Home() {
  const [stream, setStream] = useState<ConnectionState>("connecting");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const statsQuery = trpc.hazards.stats.useQuery(undefined, { refetchInterval: 30_000, retry: 1 });
  const recentQuery = trpc.hazards.recent.useQuery({ limit: 5 }, { refetchInterval: 30_000, retry: 1 });

  useEffect(() => {
    let source: EventSource | undefined;
    let disposed = false;
    try {
      source = new EventSource(resolveApiUrl("/api/hazards/stream"));
      source.addEventListener("connected", () => { if (!disposed) setStream("connected"); });
      source.onopen = () => { if (!disposed) setStream("connected"); };
      source.onerror = () => { if (!disposed) setStream("offline"); };
    } catch {
      setStream("offline");
    }
    return () => {
      disposed = true;
      source?.close();
    };
  }, []);

  const stats = statsQuery.data;
  const recent = recentQuery.data ?? [];
  const selected = recent.find((report) => report.id === selectedId) ?? recent[0];
  const apiChecking = statsQuery.isLoading || recentQuery.isLoading;
  const apiAvailable = !apiChecking && !statsQuery.error && !recentQuery.error;
  const feedLabel = stream === "connected" ? "Live feed connected" : stream === "connecting" ? "Connecting to live feed" : "Live feed unavailable";
  const FeedIcon = stream === "connected" ? Signal : SignalZero;
  const nativeApp = window.location.protocol === "capacitor:";

  return (
    <main className="rs-home">
      <section className="rs-wrap rs-hero">
        <div className="rs-hero-copy">
          <p className="rs-eyebrow"><span className="rs-pulse" /> SMART ROAD MONITORING <span className="rs-eyebrow-rule" /></p>
          <h1>Better roads<br />begin with <em>better data.</em></h1>
          <p className="rs-hero-lead">Turn submitted road conditions into useful intelligence. Browse reported hazards, review their locations, and help communities make safer journeys.</p>
          <div className="rs-hero-actions">
            <Link href="/dashboard" className="rs-button rs-button-primary">Explore live map <ArrowRight size={17} /></Link>
            <a href="#rs-how-it-works" className="rs-button rs-button-outline"><span className="rs-play-icon">▶</span> How RoadSense works</a>
          </div>
          <div className="rs-hero-proof">
            <span className="rs-proof-mark"><Route size={17} /></span>
            <span><strong>Reports from connected RoadSense services.</strong><br />Locations and availability depend on submitted data.</span>
          </div>
        </div>

        <div className="rs-hero-visual">
          <div className="rs-visual-glow" />
          <section className="rs-map-card" aria-label="Recent road report overview">
            <div className="rs-map-card-head">
              <span><i className="rs-live-dot" /> ROAD REPORT OVERVIEW</span>
              <span className="rs-map-update"><Clock3 size={12} /> {recent[0] ? `Updated ${formatTime(recent[0].timestamp)}` : "Awaiting reports"}</span>
            </div>
            <div className="rs-map-art" role="group" aria-label="Illustrative road network activity preview; open the live map for report coordinates">
              <div className="rs-map-grid" />
              <svg className="rs-map-roads" viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true">
                <path d="M-20 270 C120 220 100 120 220 140 S370 260 620 70" />
                <path d="M70 -20 C150 90 250 60 310 160 S430 280 510 390" />
                <path d="M-20 80 L620 300" />
                <path d="M10 350 L580 10" />
              </svg>
              <span className="rs-map-label rs-map-label-a">ROAD NETWORK</span>
              <span className="rs-map-label rs-map-label-b">LIVE FEED</span>
              <span className="rs-map-label rs-map-label-c">ACTIVITY VIEW</span>
              {recent.slice(0, 3).map((report, index) => (
                <button
                  type="button"
                  key={report.id}
                  className={`rs-map-pin severity-${report.severity} ${selected?.id === report.id ? "is-selected" : ""}`}
                  style={pinPositions[index]}
                  onClick={() => setSelectedId(report.id)}
                  aria-label={`Select ${reportTitle(report)}, ${severityLabel(report.severity)} severity`}
                  title={reportTitle(report)}
                ><span /></button>
              ))}
              <div className="rs-map-legend"><span><i className="is-high" /> High</span><span><i className="is-moderate" /> Moderate</span><span><i className="is-low" /> Low</span></div>
              <span className="rs-map-note">Illustrative preview · open the map for reported GPS locations</span>
            </div>
            <div className="rs-selected-report">
              <span className="rs-selected-icon"><MapPin size={17} /></span>
              {selected ? (
                <>
                  <span className="rs-selected-copy"><strong>Report #{selected.id} · {reportTitle(selected)}</strong><small>{reportCoordinates(selected)} · {formatTime(selected.timestamp)}</small></span>
                  <span className={`rs-severity severity-${selected.severity}`}>{severityLabel(selected.severity)}</span>
                </>
              ) : (
                <span className="rs-selected-copy"><strong>No recent road reports</strong><small>New submitted reports will appear here.</small></span>
              )}
            </div>
          </section>
          <div className="rs-float-status">
            <span className="rs-float-icon"><FeedIcon size={17} /></span>
            <span><strong>{stream === "connected" ? "Live report feed" : "Report feed"}</strong><small>{feedLabel}</small></span>
            <i className={`rs-status-light ${stream}`} />
          </div>
        </div>
      </section>

      {!apiAvailable && !apiChecking && (
        <div className="rs-wrap rs-inline-notice" role="status">
          <TriangleAlert size={18} />
          <span>Road reports could not be loaded. Check your server address and network connection.</span>
          <button type="button" onClick={() => { void statsQuery.refetch(); void recentQuery.refetch(); }}>Retry</button>
        </div>
      )}
      {nativeApp && !statsQuery.data && (
        <div className="rs-wrap rs-native-notice"><Settings2 size={18} /><span>Connect this app to your RoadSense server to load current reports.</span><Link href="/settings" aria-label="Open server settings"><ChevronRight size={17} /></Link></div>
      )}

      <section className="rs-wrap rs-stats" aria-label="RoadSense report summary">
        <StatCard label="REPORTS LOGGED" value={apiChecking ? "—" : (stats?.total ?? "—")} note="All submitted road hazards" icon={<MapPin size={17} />} tone="lime" />
        <StatCard label="HIGH SEVERITY" value={apiChecking ? "—" : (stats?.bySeverity[3] ?? "—")} note="Reports requiring attention" icon={<TriangleAlert size={17} />} tone="high" />
        <StatCard label="MODERATE" value={apiChecking ? "—" : (stats?.bySeverity[2] ?? "—")} note="Reported road irregularities" icon={<Waves size={17} />} tone="moderate" />
        <StatCard label="LOW SEVERITY" value={apiChecking ? "—" : (stats?.bySeverity[1] ?? "—")} note="Minor road reports" icon={<Check size={17} />} tone="low" />
      </section>

      <section className="rs-wrap rs-section" id="rs-reports">
        <div className="rs-section-heading">
          <div><p className="rs-eyebrow">THE ROAD AHEAD, IN REAL TIME</p><h2>See the road <em>clearly.</em></h2></div>
          <Link href="/dashboard" className="rs-text-link">Open hazard map <ArrowRight size={16} /></Link>
        </div>
        <div className="rs-content-grid">
          <section className="rs-map-panel">
            <div className="rs-panel-head"><span><strong>Road condition activity</strong><small>Illustrative overview of submitted reports</small></span><Link href="/dashboard" className="rs-filter-link">Live map <ChevronRight size={14} /></Link></div>
            <div className="rs-large-map" role="group" aria-label="Illustrative road network activity overview">
              <div className="rs-map-grid" />
              <svg viewBox="0 0 700 360" preserveAspectRatio="none" aria-hidden="true"><path d="M40 300 Q180 20 350 180 T680 40 M80 20 Q260 180 330 320 T650 250 M10 180 L690 180" /></svg>
              <span className="rs-network-label rs-network-label-one">ROAD NETWORK</span><span className="rs-network-label rs-network-label-two">REPORT ACTIVITY</span><span className="rs-network-label rs-network-label-three">OPEN MAP FOR GPS LOCATIONS</span>
              {recent.slice(0, 5).map((report, index) => (
                <button type="button" key={report.id} className={`rs-activity-pin severity-${report.severity} ${selected?.id === report.id ? "is-selected" : ""}`} style={{ left: `${18 + ((index * 23) % 65)}%`, top: `${24 + ((index * 29) % 55)}%` }} onClick={() => setSelectedId(report.id)} aria-label={`Select report ${report.id}`}>
                  <span>{index + 1}</span>
                </button>
              ))}
            </div>
            <div className="rs-map-foot"><span><i className="is-high" /> High risk</span><span><i className="is-moderate" /> Moderate</span><span><i className="is-low" /> Low risk</span><span className="rs-map-foot-note"><MapPin size={13} /> Not a geographic map</span></div>
          </section>

          <aside className="rs-activity-panel" aria-label="Recent road reports">
            <div className="rs-activity-title"><strong>Recent reports</strong><span className="rs-live-pill">{stream === "connected" ? "LIVE" : "REPORTS"}</span></div>
            {recentQuery.isLoading ? (
              <div className="rs-empty-state"><span className="rs-spinner" /> Loading road reports…</div>
            ) : recent.length ? recent.slice(0, 4).map((report) => (
              <button type="button" key={report.id} className={`rs-report-item ${selected?.id === report.id ? "is-selected" : ""}`} onClick={() => setSelectedId(report.id)}>
                <span className={`rs-report-marker severity-${report.severity}`}><MapPin size={16} /></span>
                <span className="rs-report-copy"><strong>{reportTitle(report)}</strong><small>{reportCoordinates(report)}</small><small>{formatTime(report.timestamp)} · {formatDate(report.timestamp)}</small></span>
                <span className={`rs-severity severity-${report.severity}`}>{severityLabel(report.severity)}</span>
              </button>
            )) : (
              <div className="rs-empty-state"><span className="rs-empty-icon"><ShieldCheck size={21} /></span><strong>No road reports yet</strong><small>Submitted reports from connected devices will appear here.</small></div>
            )}
            <Link href="/alerts" className="rs-all-reports">Open live alerts <ArrowRight size={15} /></Link>
          </aside>
        </div>
        <p className="rs-data-note"><CircleDot size={13} /> The overview uses submitted RoadSense reports. Open the hazard map to view report locations on the configured map.</p>
      </section>

      <section className="rs-features" id="rs-how-it-works">
        <div className="rs-wrap">
          <p className="rs-eyebrow">FROM ROAD TO INSIGHT</p>
          <h2>One connected system.<br /><em>Safer roads.</em></h2>
          <div className="rs-feature-grid">
            <Feature icon={<Activity size={20} />} title="Submitted road reports" text="Pothole and rough-road reports arrive through the configured RoadSense service." href="/alerts" link="View reports" />
            <Feature icon={<MapPin size={20} />} title="Reported locations" text="Browse coordinates included with reports on the interactive hazard map." href="/dashboard" link="Explore map" />
            <Feature icon={<ShieldCheck size={20} />} title="Report review" text="Review available hazards and submit a confirmation or fixed status." href="/validate" link="Review reports" />
            <Feature icon={<Download size={20} />} title="Useful exports" text="Filter available records and download road report data." href="/export" link="Export data" />
          </div>
        </div>
      </section>

      <section className="rs-wrap rs-cta">
        <div><p className="rs-eyebrow">BUILDING BETTER JOURNEYS</p><h2>Make every road<br />count.</h2><p>Browse submitted road reports, review their locations, and help turn observations into useful records.</p></div>
        <Link href="/validate" className="rs-button rs-button-primary">Review road reports <ArrowRight size={17} /></Link>
      </section>

      <section className="rs-wrap rs-tools" aria-label="More RoadSense tools">
        <div><p className="rs-eyebrow">ROADSense TOOLS</p><h2>More from RoadSense</h2></div>
        <nav className="rs-tool-grid">
          <ToolLink href="/dashboard" icon={<Map size={19} />} title="Hazard map" text="Explore reported locations" />
          <ToolLink href="/alerts" icon={<Bell size={19} />} title="Live alerts" text="Follow incoming reports" />
          <ToolLink href="/validate" icon={<CheckCircle2 size={19} />} title="Validate reports" text="Review road reports" />
          <ToolLink href="/export" icon={<Download size={19} />} title="Data export" text="Download report data" />
          <ToolLink href="/firmware" icon={<Settings2 size={19} />} title="Hardware setup" text="Pico WH integration guide" />
        </nav>
      </section>
    </main>
  );
}

function StatCard({ label, value, note, icon, tone }: { label: string; value: string | number; note: string; icon: ReactNode; tone: string }) {
  return <article className={`rs-stat-card tone-${tone}`}><div className="rs-stat-top"><span>{label}</span><span className="rs-stat-icon">{icon}</span></div><strong>{value}</strong><small>{note}</small></article>;
}

function Feature({ icon, title, text, href, link }: { icon: ReactNode; title: string; text: string; href: string; link: string }) {
  return <article className="rs-feature-card"><span className="rs-feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p><Link href={href} className="rs-feature-link">{link} <ArrowRight size={14} /></Link></article>;
}

function ToolLink({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return <Link href={href} className="rs-tool-link"><span className="rs-tool-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><ChevronRight size={17} className="rs-tool-chevron" /></Link>;
}
