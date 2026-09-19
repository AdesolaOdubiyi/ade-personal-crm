import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { people } from "./people";

export const interactions = sqliteTable("interactions", {
  interactionId: text("interaction_id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  personId: text("person_id")
    .notNull()
    .references(() => people.personId, { onDelete: "cascade" }),
  interactionDate: integer("interaction_date", { mode: "timestamp" }),
  type: text("type"),
  summary: text("summary").notNull(),
  followUp: text("follow_up"),
});
