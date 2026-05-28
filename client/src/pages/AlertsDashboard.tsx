import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Alert {
  id: number;
  hazardId: number;
  title: string;
  message: string;
  severity: number;
  type: "pothole" | "rough";
  timestamp: Date;
  isNew: boolean;
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const alertsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenHazardsRef = useRef<Set<number>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial recent hazards
  const { data: initialHazards } = trpc.hazards.recent.useQuery({ limit: 20 });

  // Initialize SSE connection
  useEffect(() => {
    // Load initial hazards
    if (initialHazards) {
      const initialAlerts = (initialHazards as any).map((h: any, idx: number) => ({
        id: h.id + idx * 1000,
        hazardId: h.id,
        title: `${h.type === "pothole" ? "🕳️ Pothole" : "〰️ Rough Road"} Detected`,
        message: `Severity Level ${h.severity} - ${h.latitude}, ${h.longitude}`,
        severity: h.severity,
        type: h.type,
        timestamp: new Date(h.timestamp),
        isNew: false,
      }));
      setAlerts(initialAlerts);
      initialAlerts.forEach((a: Alert) => seenHazardsRef.current.add(a.hazardId));
    }

    // Connect to SSE stream
    const connectSSE = () => {
      try {
        const eventSource = new EventSource("/api/hazards/stream");

        eventSource.addEventListener("connected", (event) => {
          const data = JSON.parse(event.data);
          console.log("[SSE] Connected:", data);
          setConnected(true);
          setConnectionStatus("Connected");
        });

        eventSource.addEventListener("hazard", (event) => {
          const hazard = JSON.parse(event.data);
          console.log("[SSE] Received hazard:", hazard);

          // Check if we've already seen this hazard
          if (seenHazardsRef.current.has(hazard.id)) {
            console.log(`[SSE] Duplicate hazard ${hazard.id} ignored`);
            return;
          }

          // Mark as seen
          seenHazardsRef.current.add(hazard.id);

          // Create new alert
          const newAlert: Alert = {
            id: Date.now(),
            hazardId: hazard.id,
            title: `${hazard.type === "pothole" ? "🕳️ Pothole" : "〰️ Rough Road"} Detected`,
            message: `Severity Level ${hazard.severity} - ${hazard.latitude}, ${hazard.longitude}`,
            severity: hazard.severity,
            type: hazard.type,
            timestamp: new Date(hazard.timestamp),
            isNew: true,
          };

          // Add to alerts (prepend)
          setAlerts((prev) => [newAlert, ...prev].slice(0, 100));

          // Play sound alert
          playAlert();

          // Remove "new" badge after 5 seconds
          setTimeout(() => {
            setAlerts((prev) =>
              prev.map((a: Alert) => (a.id === newAlert.id ? { ...a, isNew: false } : a))
            );
          }, 5000);
        });

        eventSource.addEventListener("error", (event) => {
          console.error("[SSE] Connection error:", event);
          setConnected(false);
          setConnectionStatus("Connection error - reconnecting...");
          eventSource.close();
          // Clear any pending reconnect timer
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          // Attempt reconnection after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectSSE, 3000);
        });

        eventSource.onerror = () => {
          console.error("[SSE] EventSource error");
          setConnected(false);
          setConnectionStatus("Disconnected - reconnecting...");
          eventSource.close();
          // Clear any pending reconnect timer
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(connectSSE, 3000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error("[SSE] Failed to connect:", error);
        setConnected(false);
        setConnectionStatus("Failed to connect");
        // Clear any pending reconnect timer
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connectSSE, 3000);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initialHazards]);

  // Auto-scroll to latest alert
  useEffect(() => {
    if (autoScroll && alertsEndRef.current) {
      alertsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [alerts, autoScroll]);

  const playAlert = () => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Alert sound: 3 beeps
      const now = audioContext.currentTime;
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      oscillator.start(now);
      oscillator.stop(now + 0.1);

      // Second beep
      oscillator.start(now + 0.15);
      oscillator.stop(now + 0.25);

      // Third beep
      oscillator.start(now + 0.3);
      oscillator.stop(now + 0.4);
    } catch (err) {
      console.error("Failed to play alert sound:", err);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 3) return "text-red-400 border-red-500 bg-red-950";
    if (severity === 2) return "text-yellow-400 border-yellow-500 bg-yellow-950";
    return "text-green-400 border-green-500 bg-green-950";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity === 3) return "DANGEROUS";
    if (severity === 2) return "MODERATE";
    return "MILD";
  };

  const severityCounts = {
    dangerous: alerts.filter((a) => a.severity === 3).length,
    moderate: alerts.filter((a) => a.severity === 2).length,
    mild: alerts.filter((a) => a.severity === 1).length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">
              <span className="error-code">REAL-TIME ALERTS</span>
            </h1>
            <div className="flex items-center gap-2">
              {connected ? (
                <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className="text-xs font-mono">{connectionStatus}</span>
            </div>
          </div>
          <p className="text-sm error-code">
            [SYSTEM] Live hazard stream | SSE real-time push notifications
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container py-6 border-b border-border">
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                Sound Off
              </>
            )}
          </Button>
          <Button
            onClick={() => setAutoScroll(!autoScroll)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {autoScroll ? "Auto-Scroll On" : "Auto-Scroll Off"}
          </Button>
          <Button
            onClick={() => {
              setAlerts([]);
              seenHazardsRef.current.clear();
            }}
            variant="outline"
            className="ml-auto"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="container py-6 border-b border-border">
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-black border border-border p-4 text-center">
            <p className="text-xs error-code mb-2">TOTAL_ALERTS</p>
            <p className="text-3xl font-bold text-cyan-400">{alerts.length}</p>
          </Card>
          <Card className="bg-black border border-red-500 p-4 text-center">
            <p className="text-xs text-red-400 mb-2">DANGEROUS</p>
            <p className="text-3xl font-bold text-red-400">{severityCounts.dangerous}</p>
          </Card>
          <Card className="bg-black border border-yellow-500 p-4 text-center">
            <p className="text-xs text-yellow-400 mb-2">MODERATE</p>
            <p className="text-3xl font-bold text-yellow-400">{severityCounts.moderate}</p>
          </Card>
          <Card className="bg-black border border-green-500 p-4 text-center">
            <p className="text-xs text-green-400 mb-2">MILD</p>
            <p className="text-3xl font-bold text-green-400">{severityCounts.mild}</p>
          </Card>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="container py-8">
        {alerts.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-bold mb-2">No alerts yet</p>
            <p className="text-sm text-muted-foreground">
              Waiting for hazard reports from the sensor network...
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-2 p-4 bracket-top transition-all ${getSeverityColor(
                  alert.severity
                )} ${alert.isNew ? "animate-pulse border-2" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{alert.title}</h3>
                      {alert.isNew && (
                        <Badge className="bg-cyan-600 text-white text-xs animate-pulse">
                          NEW
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs`}>
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                    </div>
                    <p className="text-sm font-mono">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">ID: {alert.hazardId}</p>
                  </div>
                </div>
              </Card>
            ))}
            <div ref={alertsEndRef} />
          </div>
        )}
      </div>

      {/* Connection Status Footer */}
      <div className="border-t border-border bg-card p-4 mt-8">
        <div className="container text-xs text-muted-foreground text-center">
          <p className="error-code">
            [SSE_STREAM] {connected ? "Connected" : "Disconnected"} | Alerts: {alerts.length} |
            Seen Hazards: {seenHazardsRef.current.size}
          </p>
        </div>
      </div>
    </div>
  );
}
