import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDbClient, type DbClient } from "./client";

export function createTestDb(): { db: DbClient; cleanup: () => void } {
  const tempDir = mkdtempSync(join(tmpdir(), "ade-crm-db-test-"));
  const databasePath = join(tempDir, "test.db");
  const { db, close } = createDbClient(databasePath);

  migrate(db, { migrationsFolder: "./drizzle" });

  return {
    db,
    cleanup: () => {
      close();
      rmSync(tempDir, { recursive: true, force: true });
    },
  };
}
