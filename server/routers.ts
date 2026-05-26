import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createHazard, getHazards, getHazardStats, getRecentHazards } from "./db";

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
  }),
});

export type AppRouter = typeof appRouter;
