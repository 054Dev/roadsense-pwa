import { useState } from "react";
import { Activity, ArrowRight, Bell, ChevronDown, Download, Map, Menu, Radio, Settings2, ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const primaryLinks = [
  { label: "Overview", href: "/" },
  { label: "Live map", href: "/dashboard" },
  { label: "Reports", href: "/alerts" },
  { label: "Validate", href: "/validate" },
];

export default function RoadSenseShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="rs-app-shell">
      <header className="rs-topbar">
        <Link href="/" className="rs-brand" aria-label="RoadSense overview" onClick={closeMenu}>
          <span className="rs-brand-mark"><Activity size={20} strokeWidth={2.3} /></span>
          <span className="rs-brand-word">road<span>sense</span><small>ROAD INTELLIGENCE</small></span>
        </Link>

        <nav className={`rs-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          {primaryLinks.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`rs-nav-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={closeMenu}>
                {item.label}
              </Link>
            );
          })}
          <details className="rs-more">
            <summary>More <ChevronDown size={14} /></summary>
            <div className="rs-more-menu">
              <Link href="/export" onClick={closeMenu}><Download size={15} /> Data export</Link>
              <Link href="/firmware" onClick={closeMenu}><Radio size={15} /> Hardware setup</Link>
            </div>
          </details>
        </nav>

        <div className="rs-top-actions">
          <Link href="/alerts" className="rs-icon-button" aria-label="Open live alerts" title="Live alerts">
            <Bell size={18} /><span className="rs-notification-dot" />
          </Link>
          <Link href="/settings" className="rs-icon-button rs-settings-button" aria-label="App settings" title="App settings">
            <Settings2 size={18} />
          </Link>
          <Link href="/dashboard" className="rs-dashboard-button">Open dashboard <ArrowRight size={15} /></Link>
        </div>

        <button className="rs-mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <div className="rs-route-content">{children}</div>
      <footer className="rs-footer">
        <Link href="/" className="rs-footer-brand"><span className="rs-footer-dot" /> RoadSense</Link>
        <span>Road hazard reports · Data availability depends on the connected service</span>
        <Link href="/firmware" className="rs-footer-link"><ShieldCheck size={14} /> Hardware guide</Link>
      </footer>
    </div>
  );
}
