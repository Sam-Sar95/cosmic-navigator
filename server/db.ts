import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, astralThemes, InsertAstralTheme, AstralTheme, interpretations, InsertInterpretation, Interpretation, compatibilityRecords, InsertCompatibilityRecord, CompatibilityRecord } from "../drizzle/schema";
import { ENV } from "./_core/env";

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
      values.role = "admin";
      updateSet.role = "admin";
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

// Astral Theme Functions

export async function createAstralTheme(data: InsertAstralTheme) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create astral theme: database not available");
    return;
  }
  const result = await db.insert(astralThemes).values(data);
  return (result as any).insertId;
}

export async function getAstralThemeById(id: number): Promise<AstralTheme | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(astralThemes)
    .where(eq(astralThemes.id, id));
  return result[0];
}

export async function getUserAstralThemes(userId: number): Promise<AstralTheme[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(astralThemes)
    .where(eq(astralThemes.userId, userId));
}

export async function updateAstralTheme(
  id: number,
  data: Partial<InsertAstralTheme>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(astralThemes)
    .set(data)
    .where(eq(astralThemes.id, id));
}

export async function deleteAstralTheme(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(astralThemes)
    .where(eq(astralThemes.id, id));
}

// Interpretation Functions

export async function createInterpretation(data: InsertInterpretation) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(interpretations).values(data);
  return (result as any).insertId;
}

export async function getInterpretation(
  themeId: number,
  elementName: string
): Promise<Interpretation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(interpretations)
    .where(eq(interpretations.themeId, themeId) && eq(interpretations.elementName, elementName));
  return result[0];
}

export async function getThemeInterpretations(themeId: number): Promise<Interpretation[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(interpretations)
    .where(eq(interpretations.themeId, themeId));
}

// Compatibility Functions

export async function createCompatibilityRecord(data: InsertCompatibilityRecord) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(compatibilityRecords).values(data);
  return (result as any).insertId;
}

export async function getCompatibilityRecord(
  id: number
): Promise<CompatibilityRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(compatibilityRecords)
    .where(eq(compatibilityRecords.id, id));
  return result[0];
}

export async function getUserCompatibilityRecords(userId: number): Promise<CompatibilityRecord[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(compatibilityRecords)
    .where(eq(compatibilityRecords.userId, userId));
}
