export const CONTACT_TYPES = [
  "linkedin",
  "instagram",
  "phone",
  "email",
  "whatsapp",
  "x",
  "other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export type ContactCandidate = {
  type: ContactType;
  value: string;
  normalizedValue: string | null;
  isPrimary: boolean | null;
};

export type PersonOrganizationCandidate = {
  organizationName: string;
  organizationType: string | null;
  relationship: string | null;
  title: string | null;
  isCurrent: boolean | null;
  knownYear: number | null;
};

export type ConnectionCandidate = {
  context: string;
  locationWhereMet: string | null;
  introducedBy: string | null;
  details: string | null;
  dateMet: string | null;
};

export type FactCandidate = {
  category: string;
  value: string;
  details: string | null;
};

export type InteractionCandidate = {
  interactionDate: string | null;
  type: string | null;
  summary: string;
  followUp: string | null;
};

export type PersonScalarsCandidate = {
  firstName: string | null;
  lastName: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  headline: string | null;
};

export type PersonCandidate = {
  candidateId?: string;
  person: PersonScalarsCandidate;
  contacts: ContactCandidate[];
  organizations: PersonOrganizationCandidate[];
  connections: ConnectionCandidate[];
  facts: FactCandidate[];
  interactions: InteractionCandidate[];
};

export type IngestionInput =
  | { type: "text"; text: string }
  | { type: "structured"; people: PersonCandidate[] };
