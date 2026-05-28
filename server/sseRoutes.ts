import { Express, Request, Response } from "express";
import { sseManager } from "./sseManager";
import { nanoid } from "nanoid";

/**
 * Register SSE routes for real-time hazard streaming
 */
export function registerSSERoutes(app: Express): void {
  /**
   * SSE endpoint for hazard stream
   * GET /api/hazards/stream
   * 
   * Establishes a Server-Sent Events connection for real-time hazard notifications.
   * Client connects and receives all new hazards with automatic deduplication.
   */
  app.get("/api/hazards/stream", (req: Request, res: Response) => {
    const clientId = nanoid();
    console.log(`[SSE] New client connection: ${clientId}`);

    // Register client with SSE manager
    sseManager.registerClient(res, clientId);
  });

  /**
   * Health check endpoint for SSE manager
   * GET /api/hazards/stream/stats
   * 
   * Returns current SSE connection statistics
   */
  app.get("/api/hazards/stream/stats", (req: Request, res: Response) => {
    const stats = sseManager.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Test endpoint to broadcast a test hazard event
   * POST /api/hazards/stream/test
   * 
   * For testing purposes only - broadcasts a test hazard to all connected clients
   */
  app.post("/api/hazards/stream/test", (req: Request, res: Response) => {
    const testHazard = {
      id: Math.floor(Math.random() * 1000000),
      latitude: (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
      severity: Math.floor(Math.random() * 3) + 1,
      type: Math.random() > 0.5 ? ("pothole" as const) : ("rough" as const),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sseManager.broadcastHazard(testHazard);

    res.json({
      success: true,
      message: "Test hazard broadcasted",
      hazard: testHazard,
      stats: sseManager.getStats(),
    });
  });
}
