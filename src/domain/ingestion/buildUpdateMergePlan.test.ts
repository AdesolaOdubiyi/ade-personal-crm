import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { buildUpdateMergePlan } from "./buildUpdateMergePlan";
import type { PersonCandidate } from "./candidateTypes";

function existingPerson(overrides: Partial<ExistingPersonRecord> = {}): ExistingPersonRecord {
  return {
    personId: "person-1",
    firstName: "Marcus",
    lastName: "Lee",
    currentCity: null,
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

describe("buildUpdateMergePlan", () => {
  it("fills an existing null scalar automatically", () => {
    const plan = buildUpdateMergePlan(
      existingPerson({ currentCity: null }),
      candidate({ person: { ...candidate().person, currentCity: "Boston" } }),
    );

    expect(plan.scalarUpdates.currentCity).toBe("Boston");
  });

  it("leaves a conflicting scalar untouched when no resolution is provided", () => {
    const plan = buildUpdateMergePlan(
      existingPerson({ currentCity: "Boston" }),
      candidate({ person: { ...candidate().person, currentCity: "Austin" } }),
    );

    expect(plan.scalarUpdates.currentCity).toBeUndefined();
  });

  it("applies a conflicting scalar only when the reviewer explicitly resolved it", () => {
    const plan = buildUpdateMergePlan(
      existingPerson({ currentCity: "Boston" }),
      candidate({ person: { ...candidate().person, currentCity: "Austin" } }),
      { currentCity: "Austin" },
    );

    expect(plan.scalarUpdates.currentCity).toBe("Austin");
  });

  it("does not include a no-op scalar in the plan", () => {
    const plan = buildUpdateMergePlan(
      existingPerson({ currentCity: "Boston" }),
      candidate({ person: { ...candidate().person, currentCity: "boston" } }),
    );

    expect(plan.scalarUpdates.currentCity).toBeUndefined();
  });

  it("appends a genuinely new contact while ignoring an exact duplicate", () => {
    const plan = buildUpdateMergePlan(
      existingPerson({
        contacts: [
          { type: "email", value: "marcus@example.com", normalizedValue: "marcus@example.com" },
        ],
      }),
      candidate({
        contacts: [
          { type: "email", value: "marcus@example.com", normalizedValue: "marcus@example.com", isPrimary: null },
          { type: "phone", value: "+15551234567", normalizedValue: "+15551234567", isPrimary: null },
        ],
      }),
    );

    expect(plan.newContacts).toHaveLength(1);
    expect(plan.newContacts[0].type).toBe("phone");
  });
});
