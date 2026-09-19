import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { analyzeScalarConflicts } from "./scalarConflicts";

function existingPerson(
  overrides: Partial<ExistingPersonRecord> = {},
): ExistingPersonRecord {
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

describe("analyzeScalarConflicts", () => {
  it("fills an existing null scalar with an incoming value", () => {
    const [analysis] = analyzeScalarConflicts(existingPerson(), {
      firstName: "Marcus",
      lastName: null,
      currentCity: null,
      currentCountry: null,
      headline: null,
    });

    expect(analysis).toMatchObject({ field: "firstName", status: "FILL" });
  });

  it("treats an identical incoming value as a no-op", () => {
    const existing = existingPerson({ currentCity: "Boston" });

    const analysis = analyzeScalarConflicts(existing, {
      firstName: null,
      lastName: null,
      currentCity: "boston",
      currentCountry: null,
      headline: null,
    }).find((a) => a.field === "currentCity");

    expect(analysis?.status).toBe("NO_OP");
  });

  it("surfaces a conflicting existing value for review instead of overwriting it", () => {
    const existing = existingPerson({ currentCity: "Boston" });

    const analysis = analyzeScalarConflicts(existing, {
      firstName: null,
      lastName: null,
      currentCity: "Austin",
      currentCountry: null,
      headline: null,
    }).find((a) => a.field === "currentCity");

    expect(analysis).toMatchObject({
      status: "CONFLICT",
      existingValue: "Boston",
      incomingValue: "Austin",
    });
  });

  it("treats an incoming null as unknown, never as a delete signal", () => {
    const existing = existingPerson({ currentCity: "Boston" });

    const analysis = analyzeScalarConflicts(existing, {
      firstName: null,
      lastName: null,
      currentCity: null,
      currentCountry: null,
      headline: null,
    }).find((a) => a.field === "currentCity");

    expect(analysis).toMatchObject({ status: "UNKNOWN", existingValue: "Boston" });
  });
});
