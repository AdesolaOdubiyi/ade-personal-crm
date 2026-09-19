import { relations } from "drizzle-orm";
import { people } from "./people";
import { contacts } from "./contacts";
import { organizations } from "./organizations";
import { personOrganizations } from "./personOrganizations";
import { connections } from "./connections";
import { facts } from "./facts";
import { interactions } from "./interactions";

export const peopleRelations = relations(people, ({ many }) => ({
  contacts: many(contacts),
  personOrganizations: many(personOrganizations),
  connections: many(connections, { relationName: "personConnections" }),
  introducedConnections: many(connections, {
    relationName: "introducerConnections",
  }),
  facts: many(facts),
  interactions: many(interactions),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  person: one(people, {
    fields: [contacts.personId],
    references: [people.personId],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  personOrganizations: many(personOrganizations),
}));

export const personOrganizationsRelations = relations(
  personOrganizations,
  ({ one }) => ({
    person: one(people, {
      fields: [personOrganizations.personId],
      references: [people.personId],
    }),
    organization: one(organizations, {
      fields: [personOrganizations.organizationId],
      references: [organizations.organizationId],
    }),
  }),
);

export const connectionsRelations = relations(connections, ({ one }) => ({
  person: one(people, {
    fields: [connections.personId],
    references: [people.personId],
    relationName: "personConnections",
  }),
  introducer: one(people, {
    fields: [connections.introducedBy],
    references: [people.personId],
    relationName: "introducerConnections",
  }),
}));

export const factsRelations = relations(facts, ({ one }) => ({
  person: one(people, {
    fields: [facts.personId],
    references: [people.personId],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  person: one(people, {
    fields: [interactions.personId],
    references: [people.personId],
  }),
}));
