import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

/**
 * Mock context for testing
 */
function createMockContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Hazards API", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("hazards.create", () => {
    it("should create a hazard with valid data", async () => {
      const hazardData = {
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 2,
        type: "pothole" as const,
        timestamp: new Date(),
      };

      const result = await caller.hazards.create(hazardData);

      expect(result).toBeDefined();
      expect(result.latitude).toBe(hazardData.latitude);
      expect(result.longitude).toBe(hazardData.longitude);
      expect(result.severity).toBe(hazardData.severity);
      expect(result.type).toBe(hazardData.type);
    });

    it("should reject invalid severity levels", async () => {
      const hazardData = {
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 5, // Invalid: should be 1-3
        type: "pothole" as const,
        timestamp: new Date(),
      };

      await expect(caller.hazards.create(hazardData)).rejects.toThrow();
    });

    it("should reject invalid hazard types", async () => {
      const hazardData = {
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 2,
        type: "invalid" as any,
        timestamp: new Date(),
      };

      await expect(caller.hazards.create(hazardData)).rejects.toThrow();
    });

    it("should accept both pothole and rough types", async () => {
      const potholeData = {
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 3,
        type: "pothole" as const,
        timestamp: new Date(),
      };

      const roughData = {
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 1,
        type: "rough" as const,
        timestamp: new Date(),
      };

      await caller.hazards.create(potholeData);
      await caller.hazards.create(roughData);

      // Verify both types exist in the database
      const allHazards = await caller.hazards.list({});
      const hasPothole = allHazards.some((h) => h.type === "pothole");
      const hasRough = allHazards.some((h) => h.type === "rough");
      
      expect(hasPothole).toBe(true);
      expect(hasRough).toBe(true);
    });
  });

  describe("hazards.list", () => {
    it("should list all hazards without filters", async () => {
      const result = await caller.hazards.list({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter hazards by type", async () => {
      // Create test hazards
      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 2,
        type: "pothole",
        timestamp: new Date(),
      });

      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 1,
        type: "rough",
        timestamp: new Date(),
      });

      // Filter by pothole
      const potholes = await caller.hazards.list({ type: "pothole" });
      expect(potholes.every((h) => h.type === "pothole")).toBe(true);

      // Filter by rough
      const rough = await caller.hazards.list({ type: "rough" });
      expect(rough.every((h) => h.type === "rough")).toBe(true);
    });

    it("should filter hazards by severity", async () => {
      // Create test hazards with different severities
      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 1,
        type: "pothole",
        timestamp: new Date(),
      });

      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 3,
        type: "pothole",
        timestamp: new Date(),
      });

      // Filter by severity 1
      const mild = await caller.hazards.list({ severity: 1 });
      expect(mild.every((h) => h.severity === 1)).toBe(true);

      // Filter by severity 3
      const dangerous = await caller.hazards.list({ severity: 3 });
      expect(dangerous.every((h) => h.severity === 3)).toBe(true);
    });

    it("should combine type and severity filters", async () => {
      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 2,
        type: "pothole",
        timestamp: new Date(),
      });

      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 2,
        type: "rough",
        timestamp: new Date(),
      });

      const result = await caller.hazards.list({
        type: "pothole",
        severity: 2,
      });

      expect(result.every((h) => h.type === "pothole" && h.severity === 2)).toBe(true);
    });

    it("should respect limit and offset", async () => {
      // Create multiple hazards
      for (let i = 0; i < 5; i++) {
        await caller.hazards.create({
          latitude: `1.${2900 + i}`,
          longitude: `36.${8200 + i}`,
          severity: (i % 3) + 1,
          type: i % 2 === 0 ? "pothole" : "rough",
          timestamp: new Date(),
        });
      }

      const page1 = await caller.hazards.list({ limit: 2, offset: 0 });
      const page2 = await caller.hazards.list({ limit: 2, offset: 2 });

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
    });
  });

  describe("hazards.stats", () => {
    it("should return statistics with correct structure", async () => {
      const stats = await caller.hazards.stats();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("bySeverity");
      expect(stats).toHaveProperty("byType");

      expect(typeof stats.total).toBe("number");
      expect(stats.bySeverity).toHaveProperty("1");
      expect(stats.bySeverity).toHaveProperty("2");
      expect(stats.bySeverity).toHaveProperty("3");
      expect(stats.byType).toHaveProperty("pothole");
      expect(stats.byType).toHaveProperty("rough");
    });

    it("should correctly count hazards by severity", async () => {
      // Create hazards with different severities
      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 1,
        type: "pothole",
        timestamp: new Date(),
      });

      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 2,
        type: "pothole",
        timestamp: new Date(),
      });

      await caller.hazards.create({
        latitude: "1.2923",
        longitude: "36.8221",
        severity: 3,
        type: "pothole",
        timestamp: new Date(),
      });

      const stats = await caller.hazards.stats();

      expect(stats.bySeverity[1]).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity[2]).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity[3]).toBeGreaterThanOrEqual(1);
    });

    it("should correctly count hazards by type", async () => {
      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 1,
        type: "pothole",
        timestamp: new Date(),
      });

      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 1,
        type: "rough",
        timestamp: new Date(),
      });

      const stats = await caller.hazards.stats();

      expect(stats.byType.pothole).toBeGreaterThanOrEqual(1);
      expect(stats.byType.rough).toBeGreaterThanOrEqual(1);
    });
  });

  describe("hazards.recent", () => {
    it("should return recent hazards in reverse chronological order", async () => {
      // Create hazards with different timestamps
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const twoHoursAgo = new Date(now.getTime() - 7200000);

      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 1,
        type: "pothole",
        timestamp: twoHoursAgo,
      });

      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 2,
        type: "pothole",
        timestamp: oneHourAgo,
      });

      await caller.hazards.create({
        latitude: "1.2923",
        longitude: "36.8221",
        severity: 3,
        type: "pothole",
        timestamp: now,
      });

      const recent = await caller.hazards.recent({ limit: 5 });

      expect(recent.length).toBeGreaterThan(0);
      // Most recent should be first
      if (recent.length > 1) {
        expect(new Date(recent[0].timestamp).getTime()).toBeGreaterThanOrEqual(
          new Date(recent[1].timestamp).getTime()
        );
      }
    });

    it("should respect limit parameter", async () => {
      // Create multiple hazards
      for (let i = 0; i < 10; i++) {
        await caller.hazards.create({
          latitude: `1.${2900 + i}`,
          longitude: `36.${8200 + i}`,
          severity: (i % 3) + 1,
          type: "pothole",
          timestamp: new Date(Date.now() - i * 1000),
        });
      }

      const recent3 = await caller.hazards.recent({ limit: 3 });
      const recent5 = await caller.hazards.recent({ limit: 5 });

      expect(recent3.length).toBeLessThanOrEqual(3);
      expect(recent5.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Severity Classification", () => {
    it("should classify severity 1 as mild", async () => {
      await caller.hazards.create({
        latitude: "1.2921",
        longitude: "36.8219",
        severity: 1,
        type: "pothole",
        timestamp: new Date(),
      });

      const mild = await caller.hazards.list({ severity: 1 });
      expect(mild.some((h) => h.severity === 1)).toBe(true);
    });

    it("should classify severity 2 as moderate", async () => {
      await caller.hazards.create({
        latitude: "1.2922",
        longitude: "36.8220",
        severity: 2,
        type: "pothole",
        timestamp: new Date(),
      });

      const moderate = await caller.hazards.list({ severity: 2 });
      expect(moderate.some((h) => h.severity === 2)).toBe(true);
    });

    it("should classify severity 3 as dangerous", async () => {
      await caller.hazards.create({
        latitude: "1.2923",
        longitude: "36.8221",
        severity: 3,
        type: "pothole",
        timestamp: new Date(),
      });

      const dangerous = await caller.hazards.list({ severity: 3 });
      expect(dangerous.some((h) => h.severity === 3)).toBe(true);
    });
  });
});
