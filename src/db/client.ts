import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export function createDbClient(databaseUrl: string) {
  const sqlite = new Database(databaseUrl);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  return { db, close: () => sqlite.close() };
}
