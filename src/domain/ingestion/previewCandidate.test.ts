import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { previewCandidate } from "./previewCandidate";
import type { PersonCandidate } from "./candidateTypes";

function candidate(overrides: Partial<PersonCandidate> = {}): PersonCandidate {
  return {
    person: {
      firstName: "Marcus",
      lastName: "Lee",
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

function existingPerson(overrides: Partial<ExistingPersonRecord> = {}): ExistingPersonRecord {
  return {
    personId: "person-1",
    firstName: "Marcus",
    lastName: "Lee",
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

describe("previewCandidate", () => {
  it("assigns a generated candidateId when none is provided", () => {
    const preview = previewCandidate(candidate(), []);

    expect(preview.candidateId).toBeTruthy();
  });

  it("preserves a client-supplied candidateId", () => {
    const preview = previewCandidate(candidate({ candidateId: "fixed-id" }), []);

    expect(preview.candidateId).toBe("fixed-id");
  });

  it("reports NEW with no scalar conflicts or nested duplicates when nothing matches", () => {
    const preview = previewCandidate(candidate({ person: { ...candidate().person, firstName: "Zoe" } }), []);

    expect(preview.matchStatus).toBe("NEW");
    expect(preview.topMatchScalarConflicts).toBeUndefined();
    expect(preview.topMatchNestedDuplicates).toBeUndefined();
  });

  it("computes scalar conflicts and nested duplicates against the top match only", () => {
    const preview = previewCandidate(
      candidate({ person: { ...candidate().person, currentCity: "Austin" } }),
      [existingPerson()],
    );

    expect(preview.matchStatus).toBe("POSSIBLE_MATCH");
    expect(preview.topMatchScalarConflicts).toBeDefined();
    const cityConflict = preview.topMatchScalarConflicts?.find((c) => c.field === "currentCity");
    expect(cityConflict).toMatchObject({ status: "CONFLICT", existingValue: "Boston", incomingValue: "Austin" });
    expect(preview.topMatchNestedDuplicates).toBeDefined();
  });

  it("never mutates permanent data -- reading existing people twice yields the same result", () => {
    const existing = [existingPerson()];
    const before = JSON.stringify(existing);

    previewCandidate(candidate(), existing);

    expect(JSON.stringify(existing)).toBe(before);
  });
});
