import type { ContactType } from "../ingestion/candidateTypes";

export type ExistingContact = {
  type: ContactType;
  value: string;
  normalizedValue: string | null;
  isPrimary?: boolean;
};

export type ExistingPersonOrganization = {
  organizationName: string;
  normalizedOrganizationName: string;
  relationship: string | null;
  title: string | null;
  isCurrent?: boolean | null;
};

export type ExistingConnection = {
  context: string;
  locationWhereMet: string | null;
  dateMet: string | null;
};

export type ExistingFact = {
  category: string;
  value: string;
};

export type ExistingInteraction = {
  summary: string;
  interactionDate: string | null;
};

export type ExistingPersonRecord = {
  personId: string;
  firstName: string | null;
  lastName: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  headline: string | null;
  contacts: ExistingContact[];
  organizations: ExistingPersonOrganization[];
  connections: ExistingConnection[];
  facts: ExistingFact[];
  interactions: ExistingInteraction[];
};
