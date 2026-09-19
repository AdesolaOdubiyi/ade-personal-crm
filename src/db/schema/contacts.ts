import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { people } from "./people";

export const contacts = sqliteTable(
  "contacts",
  {
    contactId: text("contact_id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    personId: text("person_id")
      .notNull()
      .references(() => people.personId, { onDelete: "cascade" }),
    type: text("type").notNull(),
    value: text("value").notNull(),
    normalizedValue: text("normalized_value"),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    uniqueIndex("contacts_type_normalized_value_unique")
      .on(table.type, table.normalizedValue)
      .where(sql`${table.normalizedValue} is not null`),
  ],
);
