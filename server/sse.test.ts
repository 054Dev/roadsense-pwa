import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sseManager } from "./sseManager";
import type { Response } from "express";

describe("SSE Manager", () => {
  beforeEach(() => {
    // Clear manager state before each test
    sseManager.shutdown();
  });

  afterEach(() => {
    sseManager.shutdown();
  });

  it("should register and track client connections", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn((event: string, handler: Function) => {
        if (event === "close" || event === "error") {
          // Don't auto-trigger for testing
        }
      }),
    } as any as Response;

    sseManager.registerClient(mockRes, "client-1");

    expect(sseManager.getActiveClientCount()).toBe(1);
    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockRes.write).toHaveBeenCalled();
  });

  it("should broadcast hazards to all connected clients", () => {
    const mockRes1 = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    const mockRes2 = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes1, "client-1");
    sseManager.registerClient(mockRes2, "client-2");

    const hazard = {
      id: 1,
      latitude: "-1.2921",
      longitude: "36.8219",
      severity: 3,
      type: "pothole" as const,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sseManager.broadcastHazard(hazard);

    // Each client should receive the hazard event
    const client1Calls = mockRes1.write.mock.calls.filter(
      (call: any[]) => call[0]?.includes("hazard")
    );
    const client2Calls = mockRes2.write.mock.calls.filter(
      (call: any[]) => call[0]?.includes("hazard")
    );

    expect(client1Calls.length).toBeGreaterThan(0);
    expect(client2Calls.length).toBeGreaterThan(0);
  });

  it("should deduplicate hazards within the deduplication window", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes, "client-1");

    const hazard = {
      id: 1,
      latitude: "-1.2921",
      longitude: "36.8219",
      severity: 2,
      type: "rough" as const,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Broadcast the same hazard twice
    sseManager.broadcastHazard(hazard);
    const writeCountAfterFirst = mockRes.write.mock.calls.length;

    sseManager.broadcastHazard(hazard);
    const writeCountAfterSecond = mockRes.write.mock.calls.length;

    // Second broadcast should not increase write calls (deduplication)
    expect(writeCountAfterSecond).toBe(writeCountAfterFirst);
  });

  it("should return accurate statistics", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes, "client-1");
    sseManager.registerClient(mockRes, "client-2");

    const hazard = {
      id: 1,
      latitude: "-1.2921",
      longitude: "36.8219",
      severity: 1,
      type: "pothole" as const,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sseManager.broadcastHazard(hazard);

    const stats = sseManager.getStats();

    expect(stats.activeClients).toBe(2);
    expect(stats.queueSize).toBeGreaterThan(0);
    expect(stats.recentHazards).toBeGreaterThan(0);
  });

  it("should handle client disconnection", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes, "client-1");
    expect(sseManager.getActiveClientCount()).toBe(1);

    sseManager.unregisterClient("client-1");
    expect(sseManager.getActiveClientCount()).toBe(0);
  });

  it("should maintain event queue with max size limit", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes, "client-1");

    // Broadcast more hazards than the max queue size
    for (let i = 0; i < 150; i++) {
      const hazard = {
        id: i,
        latitude: "-1.2921",
        longitude: "36.8219",
        severity: Math.floor(Math.random() * 3) + 1,
        type: Math.random() > 0.5 ? ("pothole" as const) : ("rough" as const),
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sseManager.broadcastHazard(hazard);
    }

    const stats = sseManager.getStats();

    // Queue should not exceed max size (100)
    expect(stats.queueSize).toBeLessThanOrEqual(100);
  });

  it("should send connection confirmation on client registration", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes, "test-client");

    // Check that write was called with connection event
    const writeCalls = mockRes.write.mock.calls;
    const connectionEvent = writeCalls.some((call: any[]) =>
      call[0]?.includes("event: connected")
    );

    expect(connectionEvent).toBe(true);
  });

  it("should handle multiple hazards with different severities", () => {
    const mockRes = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any as Response;

    sseManager.registerClient(mockRes, "client-1");

    const hazards = [
      { severity: 1, type: "pothole" as const },
      { severity: 2, type: "rough" as const },
      { severity: 3, type: "pothole" as const },
    ];

    hazards.forEach((h, idx) => {
      const hazard = {
        id: idx,
        latitude: "-1.2921",
        longitude: "36.8219",
        severity: h.severity,
        type: h.type,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sseManager.broadcastHazard(hazard);
    });

    const stats = sseManager.getStats();
    expect(stats.recentHazards).toBe(3);
  });
});
