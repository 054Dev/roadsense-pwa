import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createHazard, getHazards, getHazardStats, getRecentHazards, createValidation, getHazardMetrics, createNotification, getUnreadNotifications, markNotificationAsRead, getHazardsForExport } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  hazards: router({
    /**
     * Create a new hazard report from sensor data.
     * Public endpoint for Pico WH device to submit data.
     */
    create: publicProcedure
      .input(
        z.object({
          latitude: z.string().describe("Latitude coordinate"),
          longitude: z.string().describe("Longitude coordinate"),
          severity: z.number().min(1).max(3).describe("Severity level: 1=mild, 2=moderate, 3=dangerous"),
          type: z.enum(["pothole", "rough"]).describe("Hazard type"),
          timestamp: z.date().describe("Detection timestamp"),
        })
      )
      .mutation(async ({ input }) => {
        const hazard = await createHazard({
          latitude: input.latitude,
          longitude: input.longitude,
          severity: input.severity,
          type: input.type,
          timestamp: input.timestamp,
        });
        return hazard;
      }),

    /**
     * List hazards with optional filtering and pagination.
     */
    list: publicProcedure
      .input(
        z.object({
          type: z.enum(["pothole", "rough"]).optional().describe("Filter by hazard type"),
          severity: z.number().min(1).max(3).optional().describe("Filter by severity level"),
          limit: z.number().min(1).max(500).default(100).describe("Results per page"),
          offset: z.number().min(0).default(0).describe("Pagination offset"),
        })
      )
      .query(async ({ input }) => {
        const hazards = await getHazards({
          type: input.type,
          severity: input.severity,
          limit: input.limit,
          offset: input.offset,
        });
        return hazards;
      }),

    /**
     * Get hazard statistics (totals by severity and type).
     */
    stats: publicProcedure.query(async () => {
      const stats = await getHazardStats();
      return stats;
    }),

    /**
     * Get most recent hazard reports.
     */
    recent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
      .query(async ({ input }) => {
        const hazards = await getRecentHazards(input.limit);
        return hazards;
      }),

    /**
     * Get validation metrics for a hazard (confirmations and fixed counts).
     */
    metrics: publicProcedure
      .input(z.object({ hazardId: z.number().describe("Hazard ID") }))
      .query(async ({ input }) => {
        const metrics = await getHazardMetrics(input.hazardId);
        return metrics;
      }),

    /**
     * Submit a validation (confirm or mark as fixed).
     */
    validate: publicProcedure
      .input(
        z.object({
          hazardId: z.number().describe("Hazard ID"),
          userId: z.number().describe("User ID"),
          validationType: z.enum(["confirmed", "fixed"]).describe("Validation type"),
        })
      )
      .mutation(async ({ input }) => {
        const validation = await createValidation({
          hazardId: input.hazardId,
          userId: input.userId,
          validationType: input.validationType,
        });
        return validation;
      }),

    /**
     * Export hazards as CSV with optional filtering.
     */
    exportCSV: publicProcedure
      .input(
        z.object({
          startDate: z.date().optional().describe("Start date for export"),
          endDate: z.date().optional().describe("End date for export"),
          severity: z.number().min(1).max(3).optional().describe("Filter by severity"),
          type: z.enum(["pothole", "rough"]).optional().describe("Filter by type"),
          minLat: z.number().optional().describe("Minimum latitude"),
          maxLat: z.number().optional().describe("Maximum latitude"),
          minLng: z.number().optional().describe("Minimum longitude"),
          maxLng: z.number().optional().describe("Maximum longitude"),
        })
      )
      .query(async ({ input }) => {
        const hazards = await getHazardsForExport({
          startDate: input.startDate,
          endDate: input.endDate,
          severity: input.severity,
          type: input.type,
          minLat: input.minLat,
          maxLat: input.maxLat,
          minLng: input.minLng,
          maxLng: input.maxLng,
        });

        // Convert to CSV format
        const headers = ["ID", "Latitude", "Longitude", "Severity", "Type", "Timestamp", "Created"];
        const rows = (hazards as any).map((h: any) => [
          h.id,
          h.latitude,
          h.longitude,
          h.severity,
          h.type,
          h.timestamp.toISOString(),
          h.createdAt.toISOString(),
        ]);

        const csv = [
          headers.join(","),
          ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
        ].join("\n");

        return { csv, count: hazards.length };
      }),
  }),

  notifications: router({
    /**
     * Get unread notifications for the current user.
     */
    unread: publicProcedure
      .input(z.object({ userId: z.number().describe("User ID") }))
      .query(async ({ input }) => {
        const notifications = await getUnreadNotifications(input.userId);
        return notifications;
      }),

    /**
     * Mark a notification as read.
     */
    markRead: publicProcedure
      .input(z.object({ notificationId: z.number().describe("Notification ID") }))
      .mutation(async ({ input }) => {
        const success = await markNotificationAsRead(input.notificationId);
        return { success };
      }),

    /**
     * Create a new notification (for real-time alerts).
     */
    create: publicProcedure
      .input(
        z.object({
          hazardId: z.number().describe("Hazard ID"),
          userId: z.number().optional().describe("User ID (optional for broadcast)"),
          title: z.string().describe("Notification title"),
          message: z.string().optional().describe("Notification message"),
        })
      )
      .mutation(async ({ input }) => {
        const notification = await createNotification({
          hazardId: input.hazardId,
          userId: input.userId || null,
          title: input.title,
          message: input.message || null,
        });
        return notification;
      }),
  }),
});

export type AppRouter = typeof appRouter;
