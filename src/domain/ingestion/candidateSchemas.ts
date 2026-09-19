import { z } from "zod";
import { CONTACT_TYPES } from "./candidateTypes";
import type { PersonCandidate } from "./candidateTypes";

const nonEmptyTrimmedString = z.string().trim().min(1);
const nullableTrimmedString = nonEmptyTrimmedString.nullable();
const nullableDateString = z.iso.date().nullable();

export const contactCandidateSchema = z.object({
  type: z.enum(CONTACT_TYPES),
  value: nonEmptyTrimmedString,
  normalizedValue: nullableTrimmedString,
  isPrimary: z.boolean().nullable(),
});

export const personOrganizationCandidateSchema = z.object({
  organizationName: nonEmptyTrimmedString,
  organizationType: nullableTrimmedString,
  relationship: nullableTrimmedString,
  title: nullableTrimmedString,
  isCurrent: z.boolean().nullable(),
  knownYear: z.number().int().nullable(),
});

export const connectionCandidateSchema = z.object({
  context: nonEmptyTrimmedString,
  locationWhereMet: nullableTrimmedString,
  introducedBy: nullableTrimmedString,
  details: nullableTrimmedString,
  dateMet: nullableDateString,
});

export const factCandidateSchema = z.object({
  category: nonEmptyTrimmedString,
  value: nonEmptyTrimmedString,
  details: nullableTrimmedString,
});

export const interactionCandidateSchema = z.object({
  interactionDate: nullableDateString,
  type: nullableTrimmedString,
  summary: nonEmptyTrimmedString,
  followUp: nullableTrimmedString,
});

export const personScalarsObjectSchema = z.object({
  firstName: nullableTrimmedString,
  lastName: nullableTrimmedString,
  currentCity: nullableTrimmedString,
  currentCountry: nullableTrimmedString,
  headline: nullableTrimmedString,
});

const personScalarsCandidateSchema = personScalarsObjectSchema.refine(
  (person) => person.firstName !== null || person.lastName !== null,
  { message: "At least a first name or last name is required." },
);

export const personCandidateSchema = z.object({
  candidateId: z.string().optional(),
  person: personScalarsCandidateSchema,
  contacts: z.array(contactCandidateSchema).default([]),
  organizations: z.array(personOrganizationCandidateSchema).default([]),
  connections: z.array(connectionCandidateSchema).default([]),
  facts: z.array(factCandidateSchema).default([]),
  interactions: z.array(interactionCandidateSchema).default([]),
});

export const personCandidateBatchSchema = z.array(personCandidateSchema);

export const ingestionInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: nonEmptyTrimmedString }),
  z.object({
    type: z.literal("structured"),
    people: personCandidateBatchSchema,
  }),
]);

export type PersonCandidateInput = z.infer<typeof personCandidateSchema>;

type _AssertSchemaMatchesDomainType = PersonCandidateInput extends PersonCandidate
  ? PersonCandidate extends PersonCandidateInput
    ? true
    : never
  : never;
const _typeParityGuard: _AssertSchemaMatchesDomainType = true;
void _typeParityGuard;
