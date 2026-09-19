import { createDbClient, type DbClient } from "./client";

let cachedDb: DbClient | undefined;

export function getAppDb(): DbClient {
  if (!cachedDb) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    cachedDb = createDbClient(databaseUrl).db;
  }
  return cachedDb;
}
