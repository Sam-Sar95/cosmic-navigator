import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

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

// Astral Theme Table
export const astralThemes = mysqlTable("astral_themes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Birth data
  birthDate: varchar("birthDate", { length: 10 }).notNull(), // YYYY-MM-DD
  birthTime: varchar("birthTime", { length: 8 }).notNull(), // HH:MM:SS
  birthPlace: varchar("birthPlace", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
  timezone: decimal("timezone", { precision: 5, scale: 2 }).notNull(),
  
  // Planetary positions (stored as JSON)
  planetaryData: text("planetaryData").notNull(), // JSON stringified AstrologicalData
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AstralTheme = typeof astralThemes.$inferSelect;
export type InsertAstralTheme = typeof astralThemes.$inferInsert;

// Interpretations Table (cache for Gemini responses)
export const interpretations = mysqlTable("interpretations", {
  id: int("id").autoincrement().primaryKey(),
  themeId: int("themeId").notNull(),
  elementName: varchar("elementName", { length: 50 }).notNull(), // e.g., "sun", "moon", "mercury"
  interpretation: text("interpretation").notNull(), // Gemini response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interpretation = typeof interpretations.$inferSelect;
export type InsertInterpretation = typeof interpretations.$inferInsert;

// Compatibility Records Table
export const compatibilityRecords = mysqlTable("compatibility_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  theme1Id: int("theme1Id").notNull(),
  theme2Id: int("theme2Id").notNull(),
  compatibilityScore: int("compatibilityScore").notNull(),
  compatibilityData: text("compatibilityData").notNull(), // JSON stringified compatibility data
  interpretation: text("interpretation"), // Gemini interpretation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompatibilityRecord = typeof compatibilityRecords.$inferSelect;
export type InsertCompatibilityRecord = typeof compatibilityRecords.$inferInsert;
