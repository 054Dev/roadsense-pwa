import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Hazard reports from Pico WH sensor devices.
 * Stores road hazard detections with location, severity, and type.
 */
export const hazards = mysqlTable("hazards", {
  id: int("id").autoincrement().primaryKey(),
  latitude: varchar("latitude", { length: 32 }).notNull(),
  longitude: varchar("longitude", { length: 32 }).notNull(),
  severity: int("severity").notNull(), // 1 = mild, 2 = moderate, 3 = dangerous
  type: mysqlEnum("type", ["pothole", "rough"]).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hazard = typeof hazards.$inferSelect;
export type InsertHazard = typeof hazards.$inferInsert;

/**
 * User validations for hazard reports.
 * Tracks confirmations and "fixed" reports to build accuracy metrics.
 */
export const hazardValidations = mysqlTable("hazardValidations", {
  id: int("id").autoincrement().primaryKey(),
  hazardId: int("hazardId").notNull(),
  userId: int("userId").notNull(),
  validationType: mysqlEnum("validationType", ["confirmed", "fixed"]).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type HazardValidation = typeof hazardValidations.$inferSelect;
export type InsertHazardValidation = typeof hazardValidations.$inferInsert;

/**
 * Notification tracking for real-time alerts.
 * Tracks which users have been notified about hazards.
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  hazardId: int("hazardId").notNull(),
  userId: int("userId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  readStatus: int("readStatus").default(0).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;