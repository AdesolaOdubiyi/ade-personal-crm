import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { resolveIntroducedByPersonId } from "./resolveIntroducedBy";

function existingPerson(overrides: Partial<ExistingPersonRecord> = {}): ExistingPersonRecord {
  return {
    personId: "person-1",
    firstName: null,
    lastName: null,
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

describe("resolveIntroducedByPersonId", () => {
  it("resolves to the single unambiguous full-name match", () => {
    const result = resolveIntroducedByPersonId("Sarah Kim", [
      existingPerson({ personId: "sarah", firstName: "Sarah", lastName: "Kim" }),
      existingPerson({ personId: "james", firstName: "James", lastName: "Ito" }),
    ]);

    expect(result).toBe("sarah");
  });

  it("returns null when no one matches", () => {
    const result = resolveIntroducedByPersonId("Unknown Person", [
      existingPerson({ firstName: "Sarah", lastName: "Kim" }),
    ]);

    expect(result).toBeNull();
  });

  it("returns null when the name is ambiguous across multiple people", () => {
    const result = resolveIntroducedByPersonId("Sarah Kim", [
      existingPerson({ personId: "sarah-1", firstName: "Sarah", lastName: "Kim" }),
      existingPerson({ personId: "sarah-2", firstName: "Sarah", lastName: "Kim" }),
    ]);

    expect(result).toBeNull();
  });

  it("returns null for a null introducedBy", () => {
    expect(resolveIntroducedByPersonId(null, [])).toBeNull();
  });
});
