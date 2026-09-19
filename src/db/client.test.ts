import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDbClient } from "./client";

describe("createDbClient", () => {
  let tempDir: string;
  let databasePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "ade-crm-db-test-"));
    databasePath = join(tempDir, "test.db");
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a fresh sqlite database file on first connection", () => {
    const { close } = createDbClient(databasePath);
    close();

    expect(existsSync(databasePath)).toBe(true);
  });

  it("applies the (currently empty) migration set to a brand-new database without error", () => {
    const { db, close } = createDbClient(databasePath);

    expect(() => migrate(db, { migrationsFolder: "./drizzle" })).not.toThrow();

    close();
  });
});
