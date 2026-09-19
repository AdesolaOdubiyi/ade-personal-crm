import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "./existingPersonRecord";
import { searchPeople, sortPeopleByName } from "./searchPeople";

function person(overrides: Partial<ExistingPersonRecord> = {}): ExistingPersonRecord {
  return {
    personId: "id",
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

describe("searchPeople", () => {
  it("returns everyone when the query is empty", () => {
    const people = [person({ firstName: "Maya" }), person({ firstName: "James" })];

    expect(searchPeople(people, "")).toHaveLength(2);
  });

  it("matches case-insensitively on name", () => {
    const people = [person({ firstName: "Maya", lastName: "Chen" })];

    expect(searchPeople(people, "chen")).toHaveLength(1);
  });

  it("matches on organization name", () => {
    const people = [
      person({
        firstName: "Marcus",
        organizations: [
          { organizationName: "LinkedIn", normalizedOrganizationName: "linkedin", relationship: null, title: null },
        ],
      }),
    ];

    expect(searchPeople(people, "linkedin")).toHaveLength(1);
  });

  it("excludes people that do not match", () => {
    const people = [person({ firstName: "Maya" }), person({ firstName: "James" })];

    expect(searchPeople(people, "maya")).toEqual([expect.objectContaining({ firstName: "Maya" })]);
  });
});

describe("sortPeopleByName", () => {
  it("sorts alphabetically by display name", () => {
    const people = [person({ firstName: "Zoe" }), person({ firstName: "Amir" })];

    expect(sortPeopleByName(people).map((p) => p.firstName)).toEqual(["Amir", "Zoe"]);
  });
});
