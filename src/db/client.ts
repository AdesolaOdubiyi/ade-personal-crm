import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export function createDbClient(databaseUrl: string) {
  const sqlite = new Database(databaseUrl);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, close: () => sqlite.close() };
}

export type DbClient = ReturnType<typeof createDbClient>["db"];

type TransactionCallback = Parameters<DbClient["transaction"]>[0];
export type DbTransaction = Parameters<TransactionCallback>[0];
export type DbOrTransaction = DbClient | DbTransaction;
