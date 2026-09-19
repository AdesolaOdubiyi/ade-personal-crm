import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { compareCandidateToExisting } from "./compareCandidateToExisting";
import type { PersonCandidate } from "./candidateTypes";

function candidate(overrides: Partial<PersonCandidate> = {}): PersonCandidate {
  return {
    person: { firstName: "Marcus", lastName: null, currentCity: "Austin", currentCountry: null, headline: null },
    contacts: [],
    organizations: [],
    connections: [],
    facts: [],
    interactions: [],
    ...overrides,
  };
}

function existingPerson(overrides: Partial<ExistingPersonRecord> = {}): ExistingPersonRecord {
  return {
    personId: "person-1",
    firstName: "Marcus",
    lastName: null,
    currentCity: "Boston",
    currentCountry: null,
    headline: null,
    contacts: [],
    organizations: [],
    connections: [],
    facts: [],
    interactions: [],
    ...overrides,
  };
}

describe("compareCandidateToExisting", () => {
  it("surfaces a scalar conflict against the specified existing person", () => {
    const result = compareCandidateToExisting(candidate(), existingPerson());

    const cityConflict = result.scalarConflicts.find((c) => c.field === "currentCity");
    expect(cityConflict).toMatchObject({ status: "CONFLICT", existingValue: "Boston", incomingValue: "Austin" });
  });

  it("classifies nested records against the specified existing person", () => {
    const result = compareCandidateToExisting(
      candidate({ facts: [{ category: "travel", value: "Japan", details: null }] }),
      existingPerson({ facts: [{ category: "travel", value: "Germany" }] }),
    );

    expect(result.nestedDuplicates.facts[0].status).toBe("NEW");
  });
});
