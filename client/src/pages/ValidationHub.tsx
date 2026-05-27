import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface HazardWithMetrics {
  id: number;
  latitude: string;
  longitude: string;
  severity: 1 | 2 | 3;
  type: "pothole" | "rough";
  timestamp: Date;
  confirmed: number;
  fixed: number;
}

export default function ValidationHub() {
  const [hazards, setHazards] = useState<HazardWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [userValidations, setUserValidations] = useState<number[]>([]);

  // Fetch hazards with metrics
  const { data: hazardsData, isLoading } = trpc.hazards.list.useQuery({ limit: 50 });

  useEffect(() => {
    if (isLoading || !hazardsData) return;
    const fetchHazards = async () => {
      try {
        setLoading(false);
        const data = hazardsData as any;
        
        // For demo, use mock metrics
        const hazardsWithMetrics = (data as any).map((h: any) => ({
          id: h.id,
          latitude: h.latitude,
          longitude: h.longitude,
          severity: h.severity as 1 | 2 | 3,
          type: h.type as "pothole" | "rough",
          timestamp: new Date(h.timestamp),
          confirmed: Math.floor(Math.random() * 10),
          fixed: Math.floor(Math.random() * 5),
        }));
        
        setHazards(hazardsWithMetrics);
      } catch (error) {
        console.error("Failed to fetch hazards:", error);
      }
    };

    fetchHazards();
  }, [hazardsData, isLoading]);

  const validateMutation = trpc.hazards.validate.useMutation();

  const handleValidation = async (hazardId: number, validationType: "confirmed" | "fixed") => {
    try {
      // In production, get actual user ID from auth context
      const userId = Math.floor(Math.random() * 10000);
      
      await validateMutation.mutateAsync({
        hazardId,
        userId,
        validationType,
      });

      // Update local state
      if (!userValidations.includes(hazardId)) {
        setUserValidations((prev) => [...prev, hazardId]);
      }
      
      // Update metrics locally
      setHazards((prev) =>
        prev.map((h) =>
          h.id === hazardId
            ? {
                ...h,
                confirmed: validationType === "confirmed" ? h.confirmed + 1 : h.confirmed,
                fixed: validationType === "fixed" ? h.fixed + 1 : h.fixed,
              }
            : h
        )
      );
    } catch (error) {
      console.error("Failed to submit validation:", error);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 3) return "text-red-400 border-red-500";
    if (severity === 2) return "text-yellow-400 border-yellow-500";
    return "text-green-400 border-green-500";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity === 3) return "DANGEROUS";
    if (severity === 2) return "MODERATE";
    return "MILD";
  };

  const getAccuracyScore = (confirmed: number, fixed: number) => {
    const total = confirmed + fixed;
    if (total === 0) return 0;
    return Math.round((confirmed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">
            <span className="error-code">COMMUNITY VALIDATION</span>
          </h1>
          <p className="text-sm error-code">
            [SYSTEM] Confirm hazards or report fixes | Build community trust
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {loading ? (
          <Card className="bg-card border-border p-6 text-center">
            <p className="text-sm error-code">LOADING_HAZARDS</p>
          </Card>
        ) : hazards.length === 0 ? (
          <Card className="bg-card border-border p-6 text-center">
            <p className="text-sm error-code">NO_HAZARDS_FOUND</p>
            <p className="text-muted-foreground mt-2">No hazards to validate</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {hazards.map((hazard) => {
              const accuracy = getAccuracyScore(hazard.confirmed, hazard.fixed);
              const hasValidated = userValidations.includes(hazard.id);

              return (
                <Card
                  key={hazard.id}
                  className={`bg-card border-2 p-6 bracket-top ${getSeverityColor(hazard.severity)}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Hazard Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">
                          {hazard.type === "pothole" ? "🕳️" : "〰️"}
                        </span>
                        <h3 className="font-bold text-lg">
                          {hazard.type === "pothole" ? "Pothole" : "Rough Road"}
                        </h3>
                        <Badge variant="outline" className={getSeverityColor(hazard.severity)}>
                          {getSeverityLabel(hazard.severity)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-mono">
                            {hazard.latitude}, {hazard.longitude}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reported: {hazard.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="bg-black border border-border p-4 rounded-sm">
                      <p className="text-xs error-code mb-2">ACCURACY_SCORE</p>
                      <p className="text-3xl font-bold text-cyan-400">{accuracy}%</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {hazard.confirmed} confirmed, {hazard.fixed} fixed
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleValidation(hazard.id, "confirmed")}
                        disabled={hasValidated || validateMutation.isPending}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Still There
                      </Button>
                      <Button
                        onClick={() => handleValidation(hazard.id, "fixed")}
                        disabled={hasValidated || validateMutation.isPending}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <XCircle className="w-4 h-4" />
                        Fixed
                      </Button>
                      {hasValidated && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          ✓ You validated this
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Community Stats */}
      <div className="container pb-8">
        <Card className="bg-card border-border p-6 bracket-top">
          <p className="text-xs error-code mb-4">COMMUNITY_STATISTICS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Hazards</p>
              <p className="text-2xl font-bold text-cyan-400">{hazards.length}</p>
            </div>
            <div className="bg-black border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-green-400">
                {hazards.reduce((sum, h) => sum + h.confirmed, 0)}
              </p>
            </div>
            <div className="bg-black border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Fixed</p>
              <p className="text-2xl font-bold text-blue-400">
                {hazards.reduce((sum, h) => sum + h.fixed, 0)}
              </p>
            </div>
            <div className="bg-black border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Your Validations</p>
              <p className="text-2xl font-bold text-magenta-400">{userValidations.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
