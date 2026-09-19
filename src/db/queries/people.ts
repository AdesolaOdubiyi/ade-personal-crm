import { eq } from "drizzle-orm";
import type { DbClient } from "../client";
import {
  people,
  contacts,
  personOrganizations,
  connections,
  facts,
  interactions,
} from "../schema";
import { findOrCreateOrganization } from "./organizations";

export type NewPersonScalars = {
  firstName: string | null;
  lastName: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  headline: string | null;
};

export type NewContact = {
  type: string;
  value: string;
  normalizedValue: string | null;
  isPrimary: boolean;
};

export type NewPersonOrganization = {
  organizationName: string;
  organizationType: string | null;
  relationship: string | null;
  title: string | null;
  isCurrent: boolean | null;
  knownYear: number | null;
};

export type NewConnection = {
  context: string;
  locationWhereMet: string | null;
  introducedBy: string | null;
  details: string | null;
  dateMet: Date | null;
};

export type NewFact = {
  category: string;
  value: string;
  details: string | null;
};

export type NewInteraction = {
  interactionDate: Date | null;
  type: string | null;
  summary: string;
  followUp: string | null;
};

export type NewPersonAggregate = {
  person: NewPersonScalars;
  contacts?: NewContact[];
  organizations?: NewPersonOrganization[];
  connections?: NewConnection[];
  facts?: NewFact[];
  interactions?: NewInteraction[];
};

export function createPersonAggregate(
  db: DbClient,
  input: NewPersonAggregate,
): string {
  return db.transaction((tx) => {
    const [createdPerson] = tx
      .insert(people)
      .values(input.person)
      .returning({ personId: people.personId })
      .all();
    const personId = createdPerson.personId;

    for (const contact of input.contacts ?? []) {
      tx.insert(contacts).values({ ...contact, personId }).run();
    }

    for (const org of input.organizations ?? []) {
      const organizationId = findOrCreateOrganization(
        tx,
        org.organizationName,
        org.organizationType,
      );
      tx.insert(personOrganizations)
        .values({
          personId,
          organizationId,
          relationship: org.relationship,
          title: org.title,
          isCurrent: org.isCurrent,
          knownYear: org.knownYear,
        })
        .run();
    }

    for (const connection of input.connections ?? []) {
      tx.insert(connections).values({ ...connection, personId }).run();
    }

    for (const fact of input.facts ?? []) {
      tx.insert(facts).values({ ...fact, personId }).run();
    }

    for (const interaction of input.interactions ?? []) {
      tx.insert(interactions).values({ ...interaction, personId }).run();
    }

    return personId;
  });
}

export async function getPersonAggregate(db: DbClient, personId: string) {
  return await db.query.people.findFirst({
    where: eq(people.personId, personId),
    with: {
      contacts: true,
      personOrganizations: { with: { organization: true } },
      connections: true,
      facts: true,
      interactions: true,
    },
  });
}

export function deletePerson(db: DbClient, personId: string): void {
  db.delete(people).where(eq(people.personId, personId)).run();
}

