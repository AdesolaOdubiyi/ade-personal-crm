import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { people } from "./people";
import { organizations } from "./organizations";

export const personOrganizations = sqliteTable("person_organizations", {
  personOrganizationId: text("person_organization_id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  personId: text("person_id")
    .notNull()
    .references(() => people.personId, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.organizationId, { onDelete: "cascade" }),
  relationship: text("relationship"),
  title: text("title"),
  isCurrent: integer("is_current", { mode: "boolean" }),
  knownYear: integer("known_year"),
});
