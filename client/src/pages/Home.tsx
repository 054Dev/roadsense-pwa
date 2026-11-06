import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Compass,
  Download,
  Map,
  MapPin,
  Radio,
  Route,
  Settings2,
  ShieldCheck,
  Signal,
  SignalZero,
  Waves,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resolveApiUrl } from "@/lib/apiUrl";

type ConnectionState = "connecting" | "connected" | "offline";

function formatTime(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function severityLabel(severity: number) {
  if (severity === 3) return "High";
  if (severity === 2) return "Moderate";
  return "Low";
}

export default function Home() {
  const [stream, setStream] = useState<ConnectionState>("connecting");
  const statsQuery = trpc.hazards.stats.useQuery(undefined, {
    refetchInterval: 30_000,
    retry: 1,
  });
  const recentQuery = trpc.hazards.recent.useQuery(
    { limit: 4 },
    { refetchInterval: 30_000, retry: 1 },
  );

  useEffect(() => {
    let source: EventSource | undefined;
    let disposed = false;

    try {
      source = new EventSource(resolveApiUrl("/api/hazards/stream"));
      source.addEventListener("connected", () => {
        if (!disposed) setStream("connected");
      });
      source.onopen = () => {
        if (!disposed) setStream("connected");
      };
      source.onerror = () => {
        if (!disposed) setStream("offline");
      };
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
  const apiChecking = statsQuery.isLoading || recentQuery.isLoading;
  const apiAvailable = !apiChecking && !statsQuery.error && !recentQuery.error;
  const connectionText =
    stream === "connected"
      ? "Live feed connected"
      : stream === "connecting"
        ? "Connecting to live feed"
        : "Live feed unavailable";
  const StreamIcon = stream === "connected" ? Signal : SignalZero;

  return (
    <main className="cockpit-shell">
      <header className="cockpit-topbar">
        <Link href="/" className="cockpit-brand" aria-label="RoadSense home">
          <span className="brand-mark"><Route size={19} strokeWidth={2.3} /></span>
          <span>Road<span>Sense</span></span>
        </Link>
        <div className="cockpit-topbar-right">
          <span className={`connection-pill ${apiAvailable ? "is-ok" : "is-error"}`}>
            <span className="status-dot" />
            {apiChecking ? "Checking API" : apiAvailable ? "API responding" : "API unavailable"}
          </span>
          <Link href="/settings" className="icon-link" aria-label="RoadSense server settings">
            <Settings2 size={19} />
          </Link>
        </div>
      </header>

      <div className="cockpit-content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> ROAD CONDITIONS</p>
            <h1>Good journey.</h1>
            <p className="welcome-subtitle">A clear view of reported road hazards around the network.</p>
          </div>
          <Link href="/dashboard" className="map-shortcut">
            <Map size={17} /> <span>Open map</span><ChevronRight size={16} />
          </Link>
        </section>

        <section className="live-status-card" aria-label="RoadSense service status">
          <div className="live-status-icon"><Activity size={21} /></div>
          <div className="live-status-copy">
            <strong>{apiAvailable ? "RoadSense network" : "Network status unavailable"}</strong>
            <span>{apiAvailable ? "Hazard reporting service" : "Could not retrieve network data"}</span>
          </div>
          <div className={`feed-status ${stream}`}>
            <StreamIcon size={16} />
            <span>{connectionText}</span>
          </div>
        </section>

        {!apiAvailable && !apiChecking && (
          <div className="inline-notice" role="status">
            <AlertTriangle size={18} />
            <span>Road reports could not be loaded. Check your connection and try again.</span>
            <button
              type="button"
              onClick={() => {
                void statsQuery.refetch();
                void recentQuery.refetch();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {window.location.protocol === "capacitor:" && !statsQuery.data && (
          <Link href="/settings" className="inline-notice native-setup-notice">
            <Settings2 size={18} /><span>Connect this app to your RoadSense server to load current reports.</span><ChevronRight size={16} />
          </Link>
        )}

        <section className="summary-grid" aria-label="Reported hazard summary">
          <article className="summary-card summary-total">
            <div className="summary-card-head"><span>Reports logged</span><MapPin size={17} /></div>
            <div className="summary-number">{statsQuery.isLoading ? "—" : (stats?.total ?? "—")}</div>
            <div className="summary-foot"><CircleDot size={13} /> All reported road hazards</div>
          </article>
          <article className="summary-card summary-high">
            <div className="summary-card-head"><span>High severity</span><AlertTriangle size={17} /></div>
            <div className="summary-number">{statsQuery.isLoading ? "—" : (stats?.bySeverity[3] ?? "—")}</div>
            <div className="summary-foot"><span className="severity-mini high" /> Requires attention</div>
          </article>
          <article className="summary-card summary-mid">
            <div className="summary-card-head"><span>Moderate</span><Waves size={17} /></div>
            <div className="summary-number">{statsQuery.isLoading ? "—" : (stats?.bySeverity[2] ?? "—")}</div>
            <div className="summary-foot"><span className="severity-mini moderate" /> Reported irregularities</div>
          </article>
          <article className="summary-card summary-low">
            <div className="summary-card-head"><span>Low severity</span><Check size={17} /></div>
            <div className="summary-number">{statsQuery.isLoading ? "—" : (stats?.bySeverity[1] ?? "—")}</div>
            <div className="summary-foot"><span className="severity-mini low" /> Minor road reports</div>
          </article>
        </section>

        <section className="content-grid">
          <div className="panel reports-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">NETWORK ACTIVITY</p>
                <h2>Recent reports</h2>
              </div>
              <Link href="/dashboard" className="text-link">View all <ArrowRight size={15} /></Link>
            </div>

            {recentQuery.isLoading ? (
              <div className="empty-state"><span className="loading-indicator" /> Loading road reports…</div>
            ) : recent.length ? (
              <div className="report-list">
                {recent.map((report) => (
                  <article className="report-row" key={report.id}>
                    <span className={`report-icon severity-${report.severity}`}>
                      {report.severity === 3 ? <AlertTriangle size={17} /> : <ArrowDownRight size={17} />}
                    </span>
                    <div className="report-main">
                      <div className="report-title-row">
                        <strong>{report.type === "pothole" ? "Pothole reported" : "Rough road reported"}</strong>
                        <span className={`severity-tag severity-tag-${report.severity}`}>{severityLabel(report.severity)}</span>
                      </div>
                      <span className="report-location"><MapPin size={13} /> {report.latitude}, {report.longitude}</span>
                    </div>
                    <div className="report-time"><Clock3 size={13} /><span>{formatTime(report.timestamp)}</span><small>{formatDate(report.timestamp)}</small></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><ShieldCheck size={22} /></div>
                <strong>No road reports yet</strong>
                <span>New reports from connected devices will appear here.</span>
              </div>
            )}
            <p className="data-note"><InfoMark /> Reports reflect submitted hazard events; device sensor status is not available.</p>
          </div>

          <aside className="panel journey-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">JOURNEY TOOLS</p><h2>On the road</h2></div>
              <Compass size={19} className="panel-heading-icon" />
            </div>
            <div className="integration-card">
              <div className="integration-icon"><Route size={19} /></div>
              <div className="integration-copy"><strong>Navigation</strong><span>Route guidance isn’t connected yet.</span></div>
              <span className="integration-badge">INTEGRATION NEEDED</span>
            </div>
            <div className="integration-card">
              <div className="integration-icon transport"><Radio size={19} /></div>
              <div className="integration-copy"><strong>Transport & fares</strong><span>No route or fare feed is configured.</span></div>
              <span className="integration-badge">INTEGRATION NEEDED</span>
            </div>
            <div className="journey-footer"><ShieldCheck size={16} /><span>RoadSense displays submitted reports. Use vehicle controls safely.</span></div>
          </aside>
        </section>

        <section className="tools-section">
          <div className="tools-heading"><div><p className="eyebrow">ROADSense TOOLS</p><h2>More from RoadSense</h2></div></div>
          <nav className="tool-grid" aria-label="RoadSense tools">
            <ToolLink href="/dashboard" icon={<Map size={19} />} title="Hazard map" text="Explore reported locations" />
            <ToolLink href="/alerts" icon={<Bell size={19} />} title="Live alerts" text="Follow incoming reports" />
            <ToolLink href="/validate" icon={<Check size={19} />} title="Validate reports" text="Help review road reports" />
            <ToolLink href="/export" icon={<Download size={19} />} title="Data export" text="Download report data" />
            <ToolLink href="/firmware" icon={<Settings2 size={19} />} title="Hardware setup" text="Pico WH integration guide" />
          </nav>
        </section>

        <footer className="cockpit-footer">
          <span><span className="footer-mark" /> RoadSense</span>
          <span>Road hazard reporting · Data availability depends on connected devices</span>
        </footer>
      </div>
    </main>
  );
}

function ToolLink({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="tool-link">
      <span className="tool-icon">{icon}</span>
      <span className="tool-copy"><strong>{title}</strong><small>{text}</small></span>
      <ChevronRight size={17} className="tool-chevron" />
    </Link>
  );
}

function InfoMark() {
  return <span className="info-mark" aria-hidden="true">i</span>;
}
