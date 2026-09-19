import { eq } from "drizzle-orm";
import type { DbClient } from "../client";
import { people } from "../schema";
import type { ContactType } from "../../domain/ingestion/candidateTypes";
import type { ExistingPersonRecord } from "../../domain/people/existingPersonRecord";

const PERSON_AGGREGATE_RELATIONS = {
  contacts: true,
  personOrganizations: { with: { organization: true } },
  connections: true,
  facts: true,
  interactions: true,
} as const;

export async function listExistingPersonRecords(
  db: DbClient,
): Promise<ExistingPersonRecord[]> {
  const aggregates = await fetchPersonAggregates(db);
  return aggregates.map(toExistingPersonRecord);
}

export async function getExistingPersonRecord(
  db: DbClient,
  personId: string,
): Promise<ExistingPersonRecord | undefined> {
  const aggregate = await fetchPersonAggregateById(db, personId);
  return aggregate ? toExistingPersonRecord(aggregate) : undefined;
}

function fetchPersonAggregates(db: DbClient) {
  return db.query.people.findMany({ with: PERSON_AGGREGATE_RELATIONS });
}

function fetchPersonAggregateById(db: DbClient, personId: string) {
  return db.query.people.findFirst({
    where: eq(people.personId, personId),
    with: PERSON_AGGREGATE_RELATIONS,
  });
}

type PersonAggregate = Awaited<ReturnType<typeof fetchPersonAggregates>>[number];

function toExistingPersonRecord(aggregate: PersonAggregate): ExistingPersonRecord {
  return {
    personId: aggregate.personId,
    firstName: aggregate.firstName,
    lastName: aggregate.lastName,
    currentCity: aggregate.currentCity,
    currentCountry: aggregate.currentCountry,
    headline: aggregate.headline,
    contacts: aggregate.contacts.map((contact) => ({
      type: contact.type as ContactType,
      value: contact.value,
      normalizedValue: contact.normalizedValue,
      isPrimary: contact.isPrimary,
    })),
    organizations: aggregate.personOrganizations.map((relationship) => ({
      organizationName: relationship.organization.name,
      normalizedOrganizationName: relationship.organization.normalizedName,
      relationship: relationship.relationship,
      title: relationship.title,
      isCurrent: relationship.isCurrent,
    })),
    connections: aggregate.connections.map((connection) => ({
      context: connection.context,
      locationWhereMet: connection.locationWhereMet,
      dateMet: toDateOnlyString(connection.dateMet),
    })),
    facts: aggregate.facts.map((fact) => ({
      category: fact.category,
      value: fact.value,
    })),
    interactions: aggregate.interactions.map((interaction) => ({
      summary: interaction.summary,
      interactionDate: toDateOnlyString(interaction.interactionDate),
    })),
  };
}

function toDateOnlyString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
