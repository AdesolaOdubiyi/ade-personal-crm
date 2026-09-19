import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const people = sqliteTable("people", {
  personId: text("person_id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  firstName: text("first_name"),
  lastName: text("last_name"),
  currentCity: text("current_city"),
  currentCountry: text("current_country"),
  headline: text("headline"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
