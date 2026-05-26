import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, MapPin, Clock } from "lucide-react";

interface Hazard {
  id: number;
  latitude: string;
  longitude: string;
  severity: number;
  type: "pothole" | "rough";
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface HazardCluster {
  lat: number;
  lng: number;
  count: number;
  severity: number;
  hazards: Hazard[];
}

/**
 * Simple clustering algorithm to group nearby hazards.
 * Uses a grid-based approach with ~100m cells.
 */
function clusterHazards(hazards: Hazard[], gridSize: number = 0.001): HazardCluster[] {
  const clusters = new Map<string, HazardCluster>();

  hazards.forEach((hazard) => {
    const lat = parseFloat(hazard.latitude);
    const lng = parseFloat(hazard.longitude);
    
    // Round to grid
    const gridLat = Math.round(lat / gridSize) * gridSize;
    const gridLng = Math.round(lng / gridSize) * gridSize;
    const key = `${gridLat},${gridLng}`;

    if (!clusters.has(key)) {
      clusters.set(key, {
        lat: gridLat,
        lng: gridLng,
        count: 0,
        severity: 0,
        hazards: [],
      });
    }

    const cluster = clusters.get(key)!;
    cluster.count += 1;
    cluster.severity = Math.max(cluster.severity, hazard.severity);
    cluster.hazards.push(hazard);
  });

  return Array.from(clusters.values());
}

/**
 * Get color for severity level.
 */
function getSeverityColor(severity: number): string {
  if (severity === 3) return "#ff0000"; // Red - dangerous
  if (severity === 2) return "#ffff00"; // Yellow - moderate
  return "#00ff00"; // Green - mild
}

/**
 * Get label for severity level.
 */
function getSeverityLabel(severity: number): string {
  if (severity === 3) return "Dangerous";
  if (severity === 2) return "Moderate";
  return "Mild";
}

export default function Dashboard() {
  const [filterType, setFilterType] = useState<"pothole" | "rough" | undefined>();
  const [filterSeverity, setFilterSeverity] = useState<number | undefined>();
  const [clusters, setClusters] = useState<HazardCluster[]>([]);

  // Fetch hazards
  const hazardsQuery = trpc.hazards.list.useQuery({
    type: filterType,
    severity: filterSeverity,
    limit: 500,
  });

  // Fetch stats
  const statsQuery = trpc.hazards.stats.useQuery();

  // Fetch recent hazards
  const recentQuery = trpc.hazards.recent.useQuery({ limit: 5 });

  // Update clusters when hazards change
  useEffect(() => {
    if (hazardsQuery.data) {
      const clustered = clusterHazards(hazardsQuery.data);
      setClusters(clustered);
    }
  }, [hazardsQuery.data]);

  const stats = statsQuery.data;
  const recentHazards = recentQuery.data || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">
            <span className="error-code">ROADSENSE v1.0</span>
          </h1>
          <p className="text-sm error-code">
            [SYSTEM] Road Hazard Detection & Mapping Network Active
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Hazards */}
          <Card className="bg-card border-border p-4 bracket-top">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs error-code mb-2">TOTAL_HAZARDS</p>
                <p className="text-3xl font-bold neon-glow" style={{ color: "#00ffff" }}>
                  {stats?.total || 0}
                </p>
              </div>
              <MapPin className="w-8 h-8" style={{ color: "#00ffff" }} />
            </div>
          </Card>

          {/* Dangerous Count */}
          <Card className="bg-card border-border p-4 bracket-top">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs error-code mb-2">DANGEROUS</p>
                <p className="text-3xl font-bold neon-glow" style={{ color: "#ff0000" }}>
                  {stats?.bySeverity[3] || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8" style={{ color: "#ff0000" }} />
            </div>
          </Card>

          {/* Moderate Count */}
          <Card className="bg-card border-border p-4 bracket-top">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs error-code mb-2">MODERATE</p>
                <p className="text-3xl font-bold neon-glow" style={{ color: "#ffff00" }}>
                  {stats?.bySeverity[2] || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "#ffff00" }} />
            </div>
          </Card>

          {/* Mild Count */}
          <Card className="bg-card border-border p-4 bracket-top">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs error-code mb-2">MILD</p>
                <p className="text-3xl font-bold neon-glow" style={{ color: "#00ff00" }}>
                  {stats?.bySeverity[1] || 0}
                </p>
              </div>
              <MapPin className="w-8 h-8" style={{ color: "#00ff00" }} />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="map">MAP VIEW</TabsTrigger>
            <TabsTrigger value="list">HAZARD LIST</TabsTrigger>
            <TabsTrigger value="recent">RECENT</TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map" className="mt-6">
            <Card className="bg-card border-border p-4 bracket-top">
              <div className="h-96 bg-black rounded border border-border overflow-hidden">
                <MapView
                  onMapReady={(mapInstance: any) => {
                    // Initialize map with hazard markers
                    if (mapInstance && clusters.length > 0) {
                      // Set map bounds to fit all clusters
                      const bounds = new google.maps.LatLngBounds();
                      clusters.forEach((cluster) => {
                        bounds.extend(new google.maps.LatLng(cluster.lat, cluster.lng));
                      });
                      mapInstance.fitBounds(bounds);

                      // Add markers for each cluster
                      clusters.forEach((cluster) => {
                        const marker = new google.maps.Marker({
                          position: { lat: cluster.lat, lng: cluster.lng },
                          map: mapInstance,
                          title: `${cluster.count} hazard(s) - ${getSeverityLabel(cluster.severity)}`,
                          icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: cluster.count > 1 ? 12 : 8,
                            fillColor: getSeverityColor(cluster.severity),
                            fillOpacity: 0.8,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                          },
                        });

                        // Info window
                        const infoWindow = new google.maps.InfoWindow({
                          content: `
                            <div style="color: #000; padding: 8px;">
                              <p><strong>${cluster.count} Hazard(s)</strong></p>
                              <p>Severity: ${getSeverityLabel(cluster.severity)}</p>
                              <p>Type: ${cluster.hazards[0]?.type || "Unknown"}</p>
                            </div>
                          `,
                        });

                        marker.addListener("click", () => {
                          infoWindow.open(mapInstance, marker);
                        });
                      });
                    }
                  }}
                />
              </div>
              <div className="mt-4 p-4 bg-black border-t border-border">
                <p className="text-xs error-code">
                  [MAP] {clusters.length} cluster(s) detected | {hazardsQuery.data?.length || 0} hazard(s)
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="mt-6">
            <Card className="bg-card border-border p-4 bracket-top">
              {/* Filters */}
              <div className="mb-6 p-4 bg-black border border-border">
                <p className="text-xs error-code mb-4">FILTER_OPTIONS</p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    variant={filterType === undefined ? "default" : "outline"}
                    onClick={() => setFilterType(undefined)}
                    className="text-xs"
                  >
                    ALL TYPES
                  </Button>
                  <Button
                    variant={filterType === "pothole" ? "default" : "outline"}
                    onClick={() => setFilterType("pothole")}
                    className="text-xs"
                  >
                    POTHOLES
                  </Button>
                  <Button
                    variant={filterType === "rough" ? "default" : "outline"}
                    onClick={() => setFilterType("rough")}
                    className="text-xs"
                  >
                    ROUGH ROADS
                  </Button>

                  <div className="w-full border-t border-border my-2"></div>

                  <Button
                    variant={filterSeverity === undefined ? "default" : "outline"}
                    onClick={() => setFilterSeverity(undefined)}
                    className="text-xs"
                  >
                    ALL SEVERITY
                  </Button>
                  <Button
                    variant={filterSeverity === 3 ? "default" : "outline"}
                    onClick={() => setFilterSeverity(3)}
                    className="text-xs severity-dangerous"
                  >
                    DANGEROUS
                  </Button>
                  <Button
                    variant={filterSeverity === 2 ? "default" : "outline"}
                    onClick={() => setFilterSeverity(2)}
                    className="text-xs severity-moderate"
                  >
                    MODERATE
                  </Button>
                  <Button
                    variant={filterSeverity === 1 ? "default" : "outline"}
                    onClick={() => setFilterSeverity(1)}
                    className="text-xs severity-mild"
                  >
                    MILD
                  </Button>
                </div>
              </div>

              {/* Hazard List */}
              <div className="space-y-2">
                {hazardsQuery.isLoading ? (
                  <p className="text-xs error-code p-4">[LOADING] Retrieving hazard data...</p>
                ) : hazardsQuery.data && hazardsQuery.data.length > 0 ? (
                  hazardsQuery.data.map((hazard: any) => (
                    <div
                      key={hazard.id}
                      className="p-3 bg-black border border-border flex justify-between items-center hover:border-accent transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-xs error-code">
                          {hazard.type.toUpperCase()} | {new Date(hazard.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lat: {hazard.latitude} | Lng: {hazard.longitude}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          hazard.severity === 3
                            ? "severity-dangerous"
                            : hazard.severity === 2
                            ? "severity-moderate"
                            : "severity-mild"
                        }`}
                      >
                        {getSeverityLabel(hazard.severity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs error-code p-4">[NO_DATA] No hazards found</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="mt-6">
            <Card className="bg-card border-border p-4 bracket-top">
              <p className="text-xs error-code mb-4">RECENT_DETECTIONS</p>
              <div className="space-y-3">
                {recentHazards.length > 0 ? (
                  recentHazards.map((hazard) => (
                    <div
                      key={hazard.id}
                      className="p-3 bg-black border border-border flex items-center gap-4"
                    >
                      <Clock className="w-4 h-4" style={{ color: "#00ffff" }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold">
                          {hazard.type.toUpperCase()} at {new Date(hazard.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hazard.latitude}, {hazard.longitude}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          hazard.severity === 3
                            ? "severity-dangerous"
                            : hazard.severity === 2
                            ? "severity-moderate"
                            : "severity-mild"
                        }`}
                      >
                        {getSeverityLabel(hazard.severity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs error-code">[NO_DATA] No recent hazards</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
