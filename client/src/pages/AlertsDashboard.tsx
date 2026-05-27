import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, MapPin, Volume2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Alert {
  id: number;
  hazardId: number;
  title: string;
  message?: string;
  severity: 1 | 2 | 3;
  latitude: string;
  longitude: string;
  type: "pothole" | "rough";
  timestamp: Date;
  readStatus: boolean;
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate real-time alerts (in production, use WebSocket)
  const { data: hazardsData } = trpc.hazards.recent.useQuery({ limit: 20 });

  useEffect(() => {
    if (!hazardsData) return;
    const interval = setInterval(() => {
      // Fetch recent hazards
      const fetchAlerts = async () => {
        try {
          const hazards = hazardsData;
          const newAlerts = ((hazards as any) || []).map((h: any, idx: number) => ({
            id: h.id + idx * 1000,
            hazardId: h.id,
            title: `${h.type === "pothole" ? "🕳️ Pothole" : "〰️ Rough Road"} Detected`,
            message: `Severity Level ${h.severity} - ${h.latitude}, ${h.longitude}`,
            severity: h.severity as 1 | 2 | 3,
            latitude: h.latitude,
            longitude: h.longitude,
            type: h.type as "pothole" | "rough",
            timestamp: new Date(h.timestamp),
            readStatus: false,
          }));
          setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50));
        } catch (error) {
          console.error("Failed to fetch alerts:", error);
        }
      };
      fetchAlerts();
    }, 10000); // Fetch every 10 seconds

    return () => clearInterval(interval);
  }, [hazardsData]);

  const playAlert = () => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 3) return "bg-red-900 border-red-500 text-red-100";
    if (severity === 2) return "bg-yellow-900 border-yellow-500 text-yellow-100";
    return "bg-green-900 border-green-500 text-green-100";
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 3) return "Dangerous";
    if (severity === 2) return "Moderate";
    return "Mild";
  };

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">
            <span className="error-code">REAL-TIME ALERTS</span>
          </h1>
          <p className="text-sm error-code">
            [SYSTEM] Live hazard detection stream | Sound alerts enabled
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container py-6 flex gap-4 flex-wrap">
        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant={soundEnabled ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          {soundEnabled ? "Sound ON" : "Sound OFF"}
        </Button>
        <Button
          onClick={() => setAutoScroll(!autoScroll)}
          variant={autoScroll ? "default" : "outline"}
        >
          {autoScroll ? "Auto-Scroll ON" : "Auto-Scroll OFF"}
        </Button>
        <Button
          onClick={() => setAlerts([])}
          variant="outline"
          className="ml-auto"
        >
          Clear All
        </Button>
      </div>

      {/* Alerts Stream */}
      <div className="container pb-8">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {alerts.length === 0 ? (
            <Card className="bg-card border-border p-6 bracket-top text-center">
              <p className="text-sm error-code mb-2">NO_ACTIVE_ALERTS</p>
              <p className="text-muted-foreground">Waiting for hazard reports...</p>
            </Card>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-2 p-4 rounded-sm flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alert.severity === 3 ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    <h3 className="font-bold text-lg">{alert.title}</h3>
                    <Badge
                      variant="secondary"
                      className={`ml-auto ${alert.severity === 3 ? "bg-red-600" : alert.severity === 2 ? "bg-yellow-600" : "bg-green-600"}`}
                    >
                      {getSeverityBadge(alert.severity)}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2 font-mono">{alert.message}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{alert.latitude}, {alert.longitude}</span>
                    <span className="ml-auto">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-2 hover:bg-black/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Panel */}
      <div className="container pb-8">
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-black border border-border p-4">
            <p className="text-xs error-code mb-2">DANGEROUS</p>
            <p className="text-3xl font-bold text-red-400">
              {alerts.filter((a) => a.severity === 3).length}
            </p>
          </Card>
          <Card className="bg-black border border-border p-4">
            <p className="text-xs error-code mb-2">MODERATE</p>
            <p className="text-3xl font-bold text-yellow-400">
              {alerts.filter((a) => a.severity === 2).length}
            </p>
          </Card>
          <Card className="bg-black border border-border p-4">
            <p className="text-xs error-code mb-2">MILD</p>
            <p className="text-3xl font-bold text-green-400">
              {alerts.filter((a) => a.severity === 1).length}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
