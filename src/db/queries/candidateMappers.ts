import { computeIdentityNormalizedValue } from "../../lib/normalization/contactValue";
import { resolveIntroducedByPersonId } from "../../domain/ingestion/resolveIntroducedBy";
import type {
  ConnectionCandidate,
  ContactCandidate,
  FactCandidate,
  InteractionCandidate,
  PersonCandidate,
  PersonOrganizationCandidate,
} from "../../domain/ingestion/candidateTypes";
import type { ExistingPersonRecord } from "../../domain/people/existingPersonRecord";
import type {
  NewConnection,
  NewContact,
  NewFact,
  NewInteraction,
  NewPersonAggregate,
  NewPersonOrganization,
} from "./people";

export function toNewPersonAggregate(
  candidate: PersonCandidate,
  existingPeople: ExistingPersonRecord[],
): NewPersonAggregate {
  return {
    person: candidate.person,
    contacts: candidate.contacts.map(toNewContact),
    organizations: candidate.organizations.map(toNewPersonOrganization),
    connections: candidate.connections.map((connection) =>
      toNewConnection(connection, existingPeople),
    ),
    facts: candidate.facts.map(toNewFact),
    interactions: candidate.interactions.map(toNewInteraction),
  };
}

export function toNewContact(contact: ContactCandidate): NewContact {
  return {
    type: contact.type,
    value: contact.value,
    normalizedValue:
      contact.normalizedValue ?? computeIdentityNormalizedValue(contact.type, contact.value),
    isPrimary: contact.isPrimary ?? false,
  };
}

export function toNewPersonOrganization(
  organization: PersonOrganizationCandidate,
): NewPersonOrganization {
  return {
    organizationName: organization.organizationName,
    organizationType: organization.organizationType,
    relationship: organization.relationship,
    title: organization.title,
    isCurrent: organization.isCurrent,
    knownYear: organization.knownYear,
  };
}

export function toNewConnection(
  connection: ConnectionCandidate,
  existingPeople: ExistingPersonRecord[],
): NewConnection {
  const resolvedIntroducedBy = resolveIntroducedByPersonId(
    connection.introducedBy,
    existingPeople,
  );
  const unresolvedIntroducer = connection.introducedBy && !resolvedIntroducedBy;

  return {
    context: connection.context,
    locationWhereMet: connection.locationWhereMet,
    introducedBy: resolvedIntroducedBy,
    details: unresolvedIntroducer
      ? appendIntroducerNote(connection.details, connection.introducedBy as string)
      : connection.details,
    dateMet: connection.dateMet ? new Date(connection.dateMet) : null,
  };
}

export function toNewFact(fact: FactCandidate): NewFact {
  return { category: fact.category, value: fact.value, details: fact.details };
}

export function toNewInteraction(interaction: InteractionCandidate): NewInteraction {
  return {
    interactionDate: interaction.interactionDate ? new Date(interaction.interactionDate) : null,
    type: interaction.type,
    summary: interaction.summary,
    followUp: interaction.followUp,
  };
}

function appendIntroducerNote(details: string | null, introducerName: string): string {
  const note = `Introduced by: ${introducerName}`;
  return details ? `${details} (${note})` : note;
}
