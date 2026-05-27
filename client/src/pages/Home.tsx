import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { MapPin, Code, Bell, Users, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header/Hero */}
      <div className="border-b-2 border-accent bg-black p-8 md:p-16">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="error-code">ROADSENSE</span>
          </h1>
          <p className="text-lg md:text-xl error-code mb-2">
            [SYSTEM] Intelligent Road Hazard Mapping Network
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Transform your vehicle into a mobile infrastructure intelligence unit. Real-time pothole and rough road detection powered by distributed sensing.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Dashboard Card */}
          <Card className="bg-card border-2 border-accent p-6 hover:border-primary transition-colors bracket-top">
            <div className="flex items-start gap-4 mb-4">
              <MapPin className="w-8 h-8 flex-shrink-0" style={{ color: "#00ffff" }} />
              <div>
                <h2 className="text-2xl font-bold mb-2">MAP DASHBOARD</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time visualization of road hazards with interactive clustering and severity indicators.
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4 text-xs error-code">
              <p>• Live hazard markers (red/yellow/green)</p>
              <p>• Hazard clustering for danger zones</p>
              <p>• Statistics panel with severity breakdown</p>
              <p>• Filterable hazard list</p>
            </div>
            <Link href="/dashboard">
              <Button className="w-full">LAUNCH DASHBOARD</Button>
            </Link>
          </Card>

          {/* Firmware Card */}
          <Card className="bg-card border-2 border-accent p-6 hover:border-primary transition-colors bracket-top">
            <div className="flex items-start gap-4 mb-4">
              <Code className="w-8 h-8 flex-shrink-0" style={{ color: "#ff00ff" }} />
              <div>
                <h2 className="text-2xl font-bold mb-2">FIRMWARE GUIDE</h2>
                <p className="text-sm text-muted-foreground">
                  Complete documentation for Pico WH sensor integration with MPU6050 and GPS.
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4 text-xs error-code">
              <p>• Hardware wiring diagram</p>
              <p>• MicroPython code blueprints</p>
              <p>• Sensor calibration guide</p>
              <p>• Setup & troubleshooting</p>
            </div>
            <Link href="/firmware">
              <Button className="w-full">VIEW DOCUMENTATION</Button>
            </Link>
          </Card>

          {/* Alerts Card */}
          <Card className="bg-card border-2 border-accent p-6 hover:border-primary transition-colors bracket-top">
            <div className="flex items-start gap-4 mb-4">
              <Bell className="w-8 h-8 flex-shrink-0" style={{ color: "#ff00ff" }} />
              <div>
                <h2 className="text-2xl font-bold mb-2">REAL-TIME ALERTS</h2>
                <p className="text-sm text-muted-foreground">
                  Live hazard notification stream with sound alerts and map animations.
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4 text-xs error-code">
              <p>• Live hazard stream</p>
              <p>• Sound alert system</p>
              <p>• Severity breakdown</p>
              <p>• Auto-scroll feed</p>
            </div>
            <Link href="/alerts">
              <Button className="w-full">VIEW ALERTS</Button>
            </Link>
          </Card>

          {/* Validation Card */}
          <Card className="bg-card border-2 border-accent p-6 hover:border-primary transition-colors bracket-top">
            <div className="flex items-start gap-4 mb-4">
              <Users className="w-8 h-8 flex-shrink-0" style={{ color: "#00ffff" }} />
              <div>
                <h2 className="text-2xl font-bold mb-2">COMMUNITY VALIDATION</h2>
                <p className="text-sm text-muted-foreground">
                  Confirm hazards or report fixes to build community trust and accuracy metrics.
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4 text-xs error-code">
              <p>• Confirm hazards</p>
              <p>• Report fixes</p>
              <p>• Accuracy metrics</p>
              <p>• User reputation</p>
            </div>
            <Link href="/validate">
              <Button className="w-full">VALIDATE HAZARDS</Button>
            </Link>
          </Card>

          {/* Export Card */}
          <Card className="bg-card border-2 border-accent p-6 hover:border-primary transition-colors bracket-top">
            <div className="flex items-start gap-4 mb-4">
              <Download className="w-8 h-8 flex-shrink-0" style={{ color: "#00ff00" }} />
              <div>
                <h2 className="text-2xl font-bold mb-2">DATA EXPORT</h2>
                <p className="text-sm text-muted-foreground">
                  Download hazard reports in CSV or PDF format for analysis and planning.
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4 text-xs error-code">
              <p>• CSV export</p>
              <p>• PDF reports</p>
              <p>• Date filtering</p>
              <p>• Location bounds</p>
            </div>
            <Link href="/export">
              <Button className="w-full">EXPORT DATA</Button>
            </Link>
          </Card>
        </div>

        {/* System Status */}
        <Card className="bg-black border-2 border-border p-6 bracket-top mb-12">
          <p className="text-xs error-code mb-4">SYSTEM_STATUS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">API STATUS</p>
              <p className="text-lg font-bold" style={{ color: "#00ff00" }}>OPERATIONAL</p>
            </div>
            <div className="p-3 bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">HAZARD DETECTION</p>
              <p className="text-lg font-bold" style={{ color: "#00ff00" }}>ACTIVE</p>
            </div>
            <div className="p-3 bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">DATA SYNC</p>
              <p className="text-lg font-bold" style={{ color: "#00ff00" }}>SYNCHRONIZED</p>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <div className="space-y-6 mb-12">
          <h2 className="text-3xl font-bold">HOW IT WORKS</h2>

          <div className="space-y-4">
            <div className="p-4 bg-card border-l-4 border-accent">
              <p className="text-xs error-code mb-2">STEP_1: HARDWARE_DEPLOYMENT</p>
              <p className="text-sm">
                Mount a Pico WH device equipped with an MPU6050 accelerometer and NEO-6M GPS module on your vehicle. The device continuously monitors motion and location data.
              </p>
            </div>

            <div className="p-4 bg-card border-l-4 border-primary">
              <p className="text-xs error-code mb-2">STEP_2: REAL_TIME_DETECTION</p>
              <p className="text-sm">
                The firmware analyzes acceleration data to detect potholes (sudden spikes) and rough roads (sustained vibration). Severity is classified from 1 (mild) to 3 (dangerous).
              </p>
            </div>

            <div className="p-4 bg-card border-l-4 border-secondary">
              <p className="text-xs error-code mb-2">STEP_3: DATA_TRANSMISSION</p>
              <p className="text-sm">
                When a hazard is detected, the device sends GPS coordinates, severity level, and hazard type to the RoadSense backend via WiFi using a simple REST API.
              </p>
            </div>

            <div className="p-4 bg-card border-l-4 border-accent">
              <p className="text-xs error-code mb-2">STEP_4: VISUALIZATION</p>
              <p className="text-sm">
                The dashboard aggregates data from all devices, clusters nearby reports into danger zones, and displays them on an interactive map with real-time statistics.
              </p>
            </div>
          </div>
        </div>

        {/* Severity Guide */}
        <Card className="bg-black border-2 border-border p-6 bracket-top">
          <h2 className="text-2xl font-bold mb-4">SEVERITY CLASSIFICATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card border-l-4 border-green-500">
              <p className="text-xs error-code mb-2">SEVERITY_1_MILD</p>
              <p className="text-sm mb-2">Slight vibration or minor road irregularity</p>
              <p className="text-xs text-muted-foreground">Acceleration: &lt; 1.2g</p>
            </div>

            <div className="p-4 bg-card border-l-4 border-yellow-500">
              <p className="text-xs error-code mb-2">SEVERITY_2_MODERATE</p>
              <p className="text-sm mb-2">Noticeable pothole or rough surface</p>
              <p className="text-xs text-muted-foreground">Acceleration: 1.2-2.0g</p>
            </div>

            <div className="p-4 bg-card border-l-4 border-red-600">
              <p className="text-xs error-code mb-2">SEVERITY_3_DANGEROUS</p>
              <p className="text-sm mb-2">Severe pothole or very rough road</p>
              <p className="text-xs text-muted-foreground">Acceleration: &gt; 2.0g</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-black mt-12 p-6">
        <div className="container text-center">
          <p className="text-xs error-code">
            [FOOTER] RoadSense v2.0 | Distributed Road Hazard Intelligence System
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Built for real-world impact in infrastructure monitoring | Real-time alerts | Community validation | Data export
          </p>
        </div>
      </div>
    </div>
  );
}
