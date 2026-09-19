import { describe, expect, it } from "vitest";
import {
  ingestionInputSchema,
  personCandidateBatchSchema,
  personCandidateSchema,
} from "./candidateSchemas";

function sparseCandidate(overrides: Record<string, unknown> = {}) {
  return {
    person: {
      firstName: "Maya",
      lastName: null,
      currentCity: null,
      currentCountry: null,
      headline: null,
    },
    contacts: [],
    organizations: [],
    connections: [],
    facts: [],
    interactions: [],
    ...overrides,
  };
}

describe("personCandidateSchema", () => {
  it("accepts a sparse candidate with only a first name and empty collections", () => {
    const result = personCandidateSchema.safeParse(sparseCandidate());

    expect(result.success).toBe(true);
  });

  it("accepts a fully populated candidate with all nested collections", () => {
    const fullCandidate = sparseCandidate({
      person: {
        firstName: "Marcus",
        lastName: "Lee",
        currentCity: "Atlanta",
        currentCountry: "USA",
        headline: "Software engineer",
      },
      contacts: [
        {
          type: "linkedin",
          value: "https://linkedin.com/in/marcus",
          normalizedValue: "linkedin.com/in/marcus",
          isPrimary: true,
        },
      ],
      organizations: [
        {
          organizationName: "LinkedIn",
          organizationType: "company",
          relationship: "employee",
          title: "Software Engineer",
          isCurrent: true,
          knownYear: 2026,
        },
      ],
      connections: [
        {
          context: "Met at ColorStack",
          locationWhereMet: "Atlanta",
          introducedBy: null,
          details: null,
          dateMet: "2026-03-01",
        },
      ],
      facts: [
        { category: "expertise", value: "developer infrastructure", details: null },
      ],
      interactions: [
        {
          interactionDate: "2026-03-01",
          type: "conversation",
          summary: "Discussed infra tooling",
          followUp: null,
        },
      ],
    });

    const result = personCandidateSchema.safeParse(fullCandidate);

    expect(result.success).toBe(true);
  });

  it("rejects a candidate with neither first name nor last name", () => {
    const result = personCandidateSchema.safeParse(
      sparseCandidate({
        person: {
          firstName: null,
          lastName: null,
          currentCity: null,
          currentCountry: null,
          headline: null,
        },
      }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a candidate whose name fields are only whitespace", () => {
    const result = personCandidateSchema.safeParse(
      sparseCandidate({
        person: {
          firstName: "   ",
          lastName: null,
          currentCity: null,
          currentCountry: null,
          headline: null,
        },
      }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects an unsupported contact type", () => {
    const result = personCandidateSchema.safeParse(
      sparseCandidate({
        contacts: [
          {
            type: "telegram",
            value: "@maya",
            normalizedValue: null,
            isPrimary: null,
          },
        ],
      }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a malformed date_met value", () => {
    const result = personCandidateSchema.safeParse(
      sparseCandidate({
        connections: [
          {
            context: "Met at a conference",
            locationWhereMet: null,
            introducedBy: null,
            details: null,
            dateMet: "not-a-date",
          },
        ],
      }),
    );

    expect(result.success).toBe(false);
  });
});

describe("personCandidateBatchSchema", () => {
  it("accepts a batch of multiple valid candidates", () => {
    const result = personCandidateBatchSchema.safeParse([
      sparseCandidate({ person: { ...sparseCandidate().person, firstName: "James" } }),
      sparseCandidate({ person: { ...sparseCandidate().person, firstName: "Sarah" } }),
    ]);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it("rejects a batch where one candidate is invalid", () => {
    const result = personCandidateBatchSchema.safeParse([
      sparseCandidate(),
      sparseCandidate({
        person: {
          firstName: null,
          lastName: null,
          currentCity: null,
          currentCountry: null,
          headline: null,
        },
      }),
    ]);

    expect(result.success).toBe(false);
  });
});

describe("ingestionInputSchema", () => {
  it("accepts raw text input", () => {
    const result = ingestionInputSchema.safeParse({
      type: "text",
      text: "Met Maya at ColorStack.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts pre-structured candidate input, bypassing extraction", () => {
    const result = ingestionInputSchema.safeParse({
      type: "structured",
      people: [sparseCandidate()],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty text input", () => {
    const result = ingestionInputSchema.safeParse({ type: "text", text: "" });

    expect(result.success).toBe(false);
  });
});
