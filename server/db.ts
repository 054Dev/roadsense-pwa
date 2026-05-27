import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, Hazard, InsertHazard, hazards, HazardValidation, InsertHazardValidation, hazardValidations, Notification, InsertNotification, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all hazards with optional filtering and pagination.
 * Supports filtering by type (pothole/rough) and severity (1-3).
 * Multiple filters are combined with AND logic.
 */
export async function getHazards({
  type,
  severity,
  limit = 100,
  offset = 0,
}: {
  type?: string;
  severity?: number;
  limit?: number;
  offset?: number;
} = {}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get hazards: database not available");
    return [];
  }

  try {
    // Build filter conditions as an array
    const conditions: any[] = [];
    if (type) {
      conditions.push(eq(hazards.type, type as "pothole" | "rough"));
    }
    if (severity !== undefined) {
      conditions.push(eq(hazards.severity, severity));
    }

    // Build query with all conditions combined via AND
    let query: any = db.select().from(hazards);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(desc(hazards.timestamp))
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get hazards:", error);
    return [];
  }
}

/**
 * Create a new hazard report.
 */
export async function createHazard(hazard: InsertHazard): Promise<Hazard | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create hazard: database not available");
    return null;
  }

  try {
    await db.insert(hazards).values(hazard);

    // Fetch the most recently created hazard by createdAt timestamp
    const created = await db
      .select()
      .from(hazards)
      .orderBy(desc(hazards.createdAt))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create hazard:", error);
    throw error;
  }
}

/**
 * Get hazard statistics (totals by severity and type).
 */
export async function getHazardStats() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get hazard stats: database not available");
    return { total: 0, bySeverity: { 1: 0, 2: 0, 3: 0 }, byType: { pothole: 0, rough: 0 } };
  }

  try {
    const all = await db.select().from(hazards);

    const stats = {
      total: all.length,
      bySeverity: {
        1: all.filter((h) => h.severity === 1).length,
        2: all.filter((h) => h.severity === 2).length,
        3: all.filter((h) => h.severity === 3).length,
      },
      byType: {
        pothole: all.filter((h) => h.type === "pothole").length,
        rough: all.filter((h) => h.type === "rough").length,
      },
    };

    return stats;
  } catch (error) {
    console.error("[Database] Failed to get hazard stats:", error);
    throw error;
  }
}

/**
 * Get recent hazards (last N reports).
 */
export async function getRecentHazards(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recent hazards: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(hazards)
      .orderBy(desc(hazards.timestamp))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get recent hazards:", error);
    throw error;
  }
}

/**
 * Create a hazard validation (confirmation or fixed report).
 */
export async function createValidation(validation: InsertHazardValidation): Promise<HazardValidation | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create validation: database not available");
    return null;
  }

  try {
    await db.insert(hazardValidations).values(validation);
    const created = await db
      .select()
      .from(hazardValidations)
      .orderBy(desc(hazardValidations.timestamp))
      .limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create validation:", error);
    throw error;
  }
}

/**
 * Get validation metrics for a hazard (confirmations and fixed counts).
 */
export async function getHazardMetrics(hazardId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get hazard metrics: database not available");
    return { confirmed: 0, fixed: 0 };
  }

  try {
    const validations = await db
      .select()
      .from(hazardValidations)
      .where(eq(hazardValidations.hazardId, hazardId));

    return {
      confirmed: validations.filter((v) => v.validationType === "confirmed").length,
      fixed: validations.filter((v) => v.validationType === "fixed").length,
    };
  } catch (error) {
    console.error("[Database] Failed to get hazard metrics:", error);
    throw error;
  }
}

/**
 * Create a notification for real-time alerts.
 */
export async function createNotification(notification: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return null;
  }

  try {
    await db.insert(notifications).values(notification);
    const created = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.timestamp))
      .limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Get unread notifications for a user.
 */
export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notifications: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.readStatus, 0)))
      .orderBy(desc(notifications.timestamp));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read.
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notification as read: database not available");
    return false;
  }

  try {
    await db
      .update(notifications)
      .set({ readStatus: 1 })
      .where(eq(notifications.id, notificationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Get hazards within a date range and optional location bounds for data export.
 */
export async function getHazardsForExport({
  startDate,
  endDate,
  severity,
  type,
  minLat,
  maxLat,
  minLng,
  maxLng,
}: {
  startDate?: Date;
  endDate?: Date;
  severity?: number;
  type?: string;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
} = {}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get hazards for export: database not available");
    return [];
  }

  try {
    const conditions: any[] = [];

    // Note: Date filtering is applied after query for simplicity
    // Drizzle ORM date comparisons require gte/lte from drizzle-orm
    if (severity !== undefined) {
      conditions.push(eq(hazards.severity, severity));
    }
    if (type) {
      conditions.push(eq(hazards.type, type as "pothole" | "rough"));
    }

    let query: any = db.select().from(hazards);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(hazards.timestamp));

    // Apply date filtering if provided
    let filtered = result;
    if (startDate) {
      filtered = filtered.filter((h: any) => new Date(h.timestamp) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((h: any) => new Date(h.timestamp) <= endDate);
    }

    // Filter by location bounds if provided
    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      return filtered.filter((h: any) => {
        const lat = parseFloat(h.latitude);
        const lng = parseFloat(h.longitude);
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      });
    }

    return result;
  } catch (error) {
    console.error("[Database] Failed to get hazards for export:", error);
    throw error;
  }
}
