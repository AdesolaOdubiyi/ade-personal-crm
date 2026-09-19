import { randomUUID } from "node:crypto";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable(
  "organizations",
  {
    organizationId: text("organization_id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    type: text("type"),
  },
  (table) => [
    uniqueIndex("organizations_normalized_name_unique").on(
      table.normalizedName,
    ),
  ],
);
