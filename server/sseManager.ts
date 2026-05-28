import { Response } from "express";

interface HazardEvent {
  id: number;
  latitude: string;
  longitude: string;
  severity: number;
  type: "pothole" | "rough";
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientConnection {
  res: Response;
  clientId: string;
  connectedAt: Date;
}

/**
 * SSE Manager for real-time hazard event broadcasting
 * Handles multiple client connections, event deduplication, and graceful cleanup
 */
class SSEManager {
  private clients: Map<string, ClientConnection> = new Map();
  private recentHazards: Map<number, HazardEvent> = new Map(); // For deduplication
  private eventQueue: HazardEvent[] = [];
  private maxQueueSize = 100;
  private deduplicationWindow = 5000; // 5 seconds

  /**
   * Register a new SSE client connection
   */
  registerClient(res: Response, clientId: string): void {
    const connection: ClientConnection = {
      res,
      clientId,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, connection);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send initial connection confirmation
    this.sendEvent(res, {
      type: "connected",
      data: {
        clientId,
        timestamp: new Date().toISOString(),
        message: "Connected to hazard stream",
      },
    });

    // Send recent hazards from queue to new client
    this.eventQueue.forEach((hazard) => {
      this.sendEvent(res, {
        type: "hazard",
        data: hazard,
      });
    });

    // Handle client disconnect
    res.on("close", () => {
      this.unregisterClient(clientId);
    });

    res.on("error", (err) => {
      console.error(`[SSE] Client ${clientId} error:`, err);
      this.unregisterClient(clientId);
    });
  }

  /**
   * Unregister a client connection
   */
  unregisterClient(clientId: string): void {
    const connection = this.clients.get(clientId);
    if (connection) {
      try {
        connection.res.end();
      } catch (err) {
        console.error(`[SSE] Error closing connection for ${clientId}:`, err);
      }
      this.clients.delete(clientId);
      console.log(`[SSE] Client ${clientId} disconnected. Active clients: ${this.clients.size}`);
    }
  }

  /**
   * Broadcast a new hazard event to all connected clients with deduplication
   */
  broadcastHazard(hazard: HazardEvent): void {
    // Check for duplicate within deduplication window
    if (this.recentHazards.has(hazard.id)) {
      const lastEvent = this.recentHazards.get(hazard.id)!;
      const timeDiff = new Date().getTime() - lastEvent.createdAt.getTime();
      if (timeDiff < this.deduplicationWindow) {
        console.log(`[SSE] Duplicate hazard ${hazard.id} suppressed`);
        return;
      }
    }

    // Mark hazard as recently seen
    this.recentHazards.set(hazard.id, hazard);

    // Add to event queue
    this.eventQueue.push(hazard);
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift(); // Remove oldest event
    }

    // Broadcast to all clients
    this.clients.forEach((connection) => {
      this.sendEvent(connection.res, {
        type: "hazard",
        data: hazard,
      });
    });

    console.log(
      `[SSE] Broadcasted hazard ${hazard.id} to ${this.clients.size} clients`
    );
  }

  /**
   * Send an SSE event to a specific response
   */
  private sendEvent(
    res: Response,
    event: { type: string; data: any }
  ): void {
    try {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    } catch (err) {
      console.error("[SSE] Error sending event:", err);
    }
  }

  /**
   * Get active client count
   */
  getActiveClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    activeClients: number;
    queueSize: number;
    recentHazards: number;
  } {
    return {
      activeClients: this.clients.size,
      queueSize: this.eventQueue.length,
      recentHazards: this.recentHazards.size,
    };
  }

  /**
   * Cleanup old entries from deduplication map
   */
  cleanupOldEntries(): void {
    const now = new Date().getTime();
    const toDelete: number[] = [];

    this.recentHazards.forEach((hazard, id) => {
      const age = now - hazard.createdAt.getTime();
      if (age > this.deduplicationWindow * 2) {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id) => this.recentHazards.delete(id));

    if (toDelete.length > 0) {
      console.log(`[SSE] Cleaned up ${toDelete.length} old deduplication entries`);
    }
  }

  /**
   * Gracefully shutdown all connections
   */
  shutdown(): void {
    console.log("[SSE] Shutting down SSE manager...");
    this.clients.forEach((connection) => {
      try {
        connection.res.end();
      } catch (err) {
        console.error("[SSE] Error closing connection during shutdown:", err);
      }
    });
    this.clients.clear();
    this.eventQueue = [];
    this.recentHazards.clear();
  }
}

// Export singleton instance
export const sseManager = new SSEManager();

// Cleanup old entries periodically
setInterval(() => {
  sseManager.cleanupOldEntries();
}, 10000); // Every 10 seconds
