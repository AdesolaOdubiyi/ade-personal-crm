import { randomUUID } from "node:crypto";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { people } from "./people";

export const facts = sqliteTable("facts", {
  factId: text("fact_id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  personId: text("person_id")
    .notNull()
    .references(() => people.personId, { onDelete: "cascade" }),
  category: text("category").notNull(),
  value: text("value").notNull(),
  details: text("details"),
});
