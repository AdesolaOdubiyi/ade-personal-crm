import { describe, expect, it } from "vitest";
import {
  connectionCandidateSchema,
  contactCandidateSchema,
  factCandidateSchema,
  interactionCandidateSchema,
  personOrganizationCandidateSchema,
  personScalarsObjectSchema,
} from "../../domain/ingestion/candidateSchemas";
import { PERSON_CANDIDATE_BATCH_JSON_SCHEMA } from "./groqExtractionProvider";

const candidateItemSchema =
  PERSON_CANDIDATE_BATCH_JSON_SCHEMA.properties.people.items;

function sortedKeys(obj: object): string[] {
  return Object.keys(obj).sort();
}

/**
 * The Groq-facing JSON schema is hand-written (see groqExtractionProvider.ts
 * for why). This test is the safety net for that decision: if a candidate
 * field is added, renamed, or removed in candidateSchemas.ts without a
 * matching edit here, this fails instead of the drift surfacing as a
 * confusing validation error at the Groq API boundary.
 */
describe("hand-written Groq JSON schema stays in sync with the Zod candidate schemas", () => {
  it("person fields match", () => {
    expect(sortedKeys(candidateItemSchema.properties.person.properties)).toEqual(
      sortedKeys(personScalarsObjectSchema.shape),
    );
  });

  it("contact fields match", () => {
    expect(
      sortedKeys(candidateItemSchema.properties.contacts.items.properties),
    ).toEqual(sortedKeys(contactCandidateSchema.shape));
  });

  it("organization fields match", () => {
    expect(
      sortedKeys(candidateItemSchema.properties.organizations.items.properties),
    ).toEqual(sortedKeys(personOrganizationCandidateSchema.shape));
  });

  it("connection fields match", () => {
    expect(
      sortedKeys(candidateItemSchema.properties.connections.items.properties),
    ).toEqual(sortedKeys(connectionCandidateSchema.shape));
  });

  it("fact fields match", () => {
    expect(
      sortedKeys(candidateItemSchema.properties.facts.items.properties),
    ).toEqual(sortedKeys(factCandidateSchema.shape));
  });

  it("interaction fields match", () => {
    expect(
      sortedKeys(candidateItemSchema.properties.interactions.items.properties),
    ).toEqual(sortedKeys(interactionCandidateSchema.shape));
  });

  it("top-level candidate sections match the PersonCandidate aggregate shape", () => {
    expect(sortedKeys(candidateItemSchema.properties)).toEqual(
      [
        "person",
        "contacts",
        "organizations",
        "connections",
        "facts",
        "interactions",
      ].sort(),
    );
  });
});
