import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { people } from "./people";

export const connections = sqliteTable("connections", {
  connectionId: text("connection_id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  personId: text("person_id")
    .notNull()
    .references(() => people.personId, { onDelete: "cascade" }),
  context: text("context").notNull(),
  locationWhereMet: text("location_where_met"),
  introducedBy: text("introduced_by").references(
    (): AnySQLiteColumn => people.personId,
    { onDelete: "set null" },
  ),
  details: text("details"),
  dateMet: integer("date_met", { mode: "timestamp" }),
});
