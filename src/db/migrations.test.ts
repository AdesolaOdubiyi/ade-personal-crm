import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "./testUtils";
import type { DbClient } from "./client";

describe("migrations", () => {
  let db: DbClient;
  let cleanup: () => void;

  beforeEach(() => {
    ({ db, cleanup } = createTestDb());
  });

  afterEach(() => cleanup());

  it("creates all seven core tables in a brand-new database", () => {
    const rows = db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table'`,
    );
    const tableNames = rows.map((row) => row.name);

    expect(tableNames).toEqual(
      expect.arrayContaining([
        "people",
        "contacts",
        "organizations",
        "person_organizations",
        "connections",
        "facts",
        "interactions",
      ]),
    );
  });
});
