import { Router, Request, Response } from "express";
import { z } from "zod";
import { createHazard, getHazards, getHazardStats, getRecentHazards } from "./db";
import { sseManager } from "./sseManager";

const router = Router();

/**
 * Classify hazard severity based on acceleration data from sensor.
 * This function transforms raw sensor data into a severity level (1-3).
 *
 * Severity scoring logic:
 * - 1 (mild): Slight vibration or minor road irregularity
 * - 2 (moderate): Noticeable pothole or rough surface
 * - 3 (dangerous): Severe pothole or very rough road that could cause damage
 */
function classifySeverity(accelerationMagnitude: number): number {
  // Baseline acceleration is ~1g (9.8 m/s²)
  // Pothole detection uses acceleration spikes:
  // - Normal driving: ~1g
  // - Mild bump: 1.2-1.5g
  // - Moderate pothole: 1.5-2.5g
  // - Dangerous pothole: >2.5g

  if (accelerationMagnitude < 1.2) {
    return 1; // Mild
  } else if (accelerationMagnitude < 2.0) {
    return 2; // Moderate
  } else {
    return 3; // Dangerous
  }
}

/**
 * POST /api/hazards
 * Receive hazard data from Pico WH sensor device.
 *
 * Expected payload:
 * {
 *   "latitude": "-1.2921",
 *   "longitude": "36.8219",
 *   "accelerationMagnitude": 2.8,  // or severity: 1-3
 *   "type": "pothole",
 *   "timestamp": "2026-05-25T12:00:00Z"
 * }
 */
router.post("/hazards", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Validate required fields
    if (!payload.latitude || !payload.longitude) {
      return res.status(400).json({
        error: "Missing required fields: latitude, longitude",
      });
    }

    if (!payload.type || !["pothole", "rough"].includes(payload.type)) {
      return res.status(400).json({
        error: "Invalid hazard type. Must be 'pothole' or 'rough'",
      });
    }

    // Determine severity: either from provided severity or classify from accelerationMagnitude
    let severity = payload.severity;
    if (!severity && payload.accelerationMagnitude !== undefined) {
      severity = classifySeverity(payload.accelerationMagnitude);
    } else if (!severity) {
      // Default to moderate if neither provided
      severity = 2;
    }

    // Validate severity
    if (severity < 1 || severity > 3 || !Number.isInteger(severity)) {
      return res.status(400).json({
        error: "Invalid severity. Must be 1 (mild), 2 (moderate), or 3 (dangerous)",
      });
    }

    // Parse timestamp
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
    if (isNaN(timestamp.getTime())) {
      return res.status(400).json({
        error: "Invalid timestamp format",
      });
    }

    // Create hazard record
    const hazard = await createHazard({
      latitude: String(payload.latitude),
      longitude: String(payload.longitude),
      severity,
      type: payload.type as "pothole" | "rough",
      timestamp,
    });

    if (!hazard) {
      return res.status(500).json({
        error: "Failed to create hazard record",
      });
    }

    // Broadcast hazard to all connected SSE clients
    sseManager.broadcastHazard(hazard);

    return res.status(201).json({
      success: true,
      hazard,
    });
  } catch (error) {
    console.error("[Hazard API] Error creating hazard:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/hazards
 * Retrieve hazards with optional filtering.
 *
 * Query parameters:
 * - type: "pothole" | "rough" (optional)
 * - severity: 1 | 2 | 3 (optional)
 * - limit: number (default 100, max 500)
 * - offset: number (default 0)
 */
router.get("/hazards", async (req: Request, res: Response) => {
  try {
    const { type, severity, limit = 100, offset = 0 } = req.query;

    // Validate and parse parameters
    let parsedSeverity: number | undefined;
    if (severity) {
      const sev = parseInt(String(severity));
      if (isNaN(sev) || sev < 1 || sev > 3) {
        return res.status(400).json({
          error: "Invalid severity. Must be 1, 2, or 3",
        });
      }
      parsedSeverity = sev;
    }

    let parsedLimit = parseInt(String(limit));
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
      parsedLimit = 100;
    }

    let parsedOffset = parseInt(String(offset));
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      parsedOffset = 0;
    }

    const hazards = await getHazards({
      type: type ? String(type) : undefined,
      severity: parsedSeverity,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    return res.status(200).json({
      success: true,
      data: hazards,
      count: hazards.length,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  } catch (error) {
    console.error("[Hazard API] Error retrieving hazards:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/hazards/stats
 * Get hazard statistics (totals by severity and type).
 */
router.get("/hazards/stats", async (req: Request, res: Response) => {
  try {
    const stats = await getHazardStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[Hazard API] Error retrieving stats:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/hazards/recent
 * Get most recent hazard reports.
 *
 * Query parameters:
 * - limit: number (default 10, max 100)
 */
router.get("/hazards/recent", async (req: Request, res: Response) => {
  try {
    let limit = parseInt(String(req.query.limit || 10));
    if (isNaN(limit) || limit < 1 || limit > 100) {
      limit = 10;
    }

    const hazards = await getRecentHazards(limit);
    return res.status(200).json({
      success: true,
      data: hazards,
      count: hazards.length,
    });
  } catch (error) {
    console.error("[Hazard API] Error retrieving recent hazards:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export function registerHazardRoutes(app: any) {
  app.use("/api", router);
}
