import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, CircleHelp, Link2, Server, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl, getVehicleMode, resolveApiUrl, saveApiBaseUrl, setVehicleMode } from "@/lib/apiUrl";

export default function Settings() {
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<"idle" | "connected" | "error">("idle");
  const [vehicleMode, setVehicleModeState] = useState(getVehicleMode());
  const nativeApp = window.location.protocol === "capacitor:";

  const save = () => {
    const value = serverUrl.trim().replace(/\/+$/, "");
    if (value) {
      try {
        const parsed = new URL(value);
        const localDevelopmentAddress = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
        if (parsed.protocol !== "https:" && !localDevelopmentAddress) throw new Error();
      } catch {
        toast.error("Use a secure HTTPS address, such as https://roadsense.example");
        return;
      }
    }
    saveApiBaseUrl(value);
    setServerUrl(value);
    setStatus("idle");
    toast.success("Server address saved");
  };

  const checkConnection = async () => {
    setChecking(true);
    setStatus("idle");
    try {
      const response = await fetch(resolveApiUrl("/api/hazards/stats"), { cache: "no-store" });
      if (!response.ok) throw new Error("The server returned an error");
      const body = await response.json();
      if (body?.success !== true || !body?.stats) throw new Error("This address did not return RoadSense data");
      setStatus("connected");
      toast.success("RoadSense server is responding");
    } catch {
      setStatus("error");
      toast.error("Could not reach RoadSense. Check the address and network.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="settings-shell">
      <div className="settings-content">
        <p className="settings-eyebrow">APP SETTINGS</p>
        <h1>Connect RoadSense</h1>
        <p className="settings-lead">Choose the RoadSense server this app should use. Your address is saved on this device.</p>

        <section className="settings-panel" aria-labelledby="server-title">
          <div className="settings-panel-icon"><Server size={20} /></div>
          <div className="settings-panel-heading">
            <h2 id="server-title">RoadSense server</h2>
            <p>Use the secure web address for your deployed RoadSense service.</p>
          </div>
          <label className="settings-label" htmlFor="server-url">Server address</label>
          <div className="settings-input-row">
            <Link2 size={18} aria-hidden="true" />
            <input id="server-url" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              placeholder="https://roadsense.example" value={serverUrl}
              onChange={(event) => { setServerUrl(event.target.value); setStatus("idle"); }} />
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button settings-button-primary" onClick={save}>Save address</button>
            <button type="button" className="settings-button" onClick={checkConnection} disabled={checking}>{checking ? "Checking…" : "Check connection"}</button>
          </div>
          {status === "connected" && <p className="settings-result connected"><CheckCircle2 size={17} /> RoadSense server is responding.</p>}
          {status === "error" && <p className="settings-result error"><TriangleAlert size={17} /> Could not reach this server. Check the address and your internet connection.</p>}
        </section>

        <section className="vehicle-mode-panel">
          <div><h2>Vehicle display mode</h2><p>Use larger text, clearer status, and wider touch targets on a mounted display.</p></div>
          <label className="vehicle-mode-switch"><span className="sr-only">Enable vehicle display mode</span><input type="checkbox" checked={vehicleMode} onChange={(event) => { setVehicleModeState(event.target.checked); setVehicleMode(event.target.checked); }} /><span aria-hidden="true" /></label>
        </section>

        {nativeApp && !serverUrl && (
          <aside className="settings-notice"><TriangleAlert size={18} /><span><strong>Server address needed</strong><br />This Android app needs the address of a deployed RoadSense server before reports can load.</span></aside>
        )}

        <section className="settings-help">
          <CircleHelp size={19} />
          <div><h2>What is available?</h2><p>The current system shows hazard reports sent by the Pico WH service. It does not provide a live vehicle sensor connection, turn-by-turn navigation, or transport fares. Those features need their own verified data connections.</p></div>
        </section>
        <Link href="/firmware" className="settings-doc-link">Open the hardware setup guide <ArrowLeft size={15} /></Link>
      </div>
    </main>
  );
}
