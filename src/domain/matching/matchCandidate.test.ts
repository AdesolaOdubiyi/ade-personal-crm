import { describe, expect, it } from "vitest";
import type { PersonCandidate } from "../ingestion/candidateTypes";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { matchCandidateAgainstExisting } from "./matchCandidate";

function candidate(overrides: Partial<PersonCandidate> = {}): PersonCandidate {
  return {
    person: {
      firstName: null,
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

describe("matchCandidateAgainstExisting", () => {
  it("returns NEW with no matches when nothing corresponds", () => {
    const result = matchCandidateAgainstExisting(
      candidate({ person: { ...candidate().person, firstName: "Zoe" } }),
      [existingPerson({ firstName: "Marcus", lastName: "Lee" })],
    );

    expect(result.overallStatus).toBe("NEW");
    expect(result.matches).toHaveLength(0);
  });

  it("returns MATCH on an exact normalized email match", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        person: { ...candidate().person, firstName: "Marcus" },
        contacts: [
          { type: "email", value: "Marcus@Example.com", normalizedValue: null, isPrimary: true },
        ],
      }),
      [
        existingPerson({
          firstName: "M.",
          contacts: [
            { type: "email", value: "marcus@example.com", normalizedValue: "marcus@example.com" },
          ],
        }),
      ],
    );

    expect(result.overallStatus).toBe("MATCH");
    expect(result.matches[0].reasons[0]).toMatch(/exact normalized email match/i);
  });

  it("returns MATCH on an exact normalized LinkedIn URL match differing only by tracking params", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        contacts: [
          {
            type: "linkedin",
            value: "https://linkedin.com/in/marcus-lee?utm_source=share",
            normalizedValue: null,
            isPrimary: false,
          },
        ],
      }),
      [
        existingPerson({
          contacts: [
            {
              type: "linkedin",
              value: "https://linkedin.com/in/marcus-lee/",
              normalizedValue: "linkedin.com/in/marcus-lee",
            },
          ],
        }),
      ],
    );

    expect(result.overallStatus).toBe("MATCH");
  });

  it("returns POSSIBLE_MATCH for an exact full name match with zero corroborating evidence", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        person: {
          firstName: "John",
          lastName: "Smith",
          currentCity: null,
          currentCountry: null,
          headline: null,
        },
      }),
      [existingPerson({ firstName: "John", lastName: "Smith" })],
    );

    expect(result.overallStatus).toBe("POSSIBLE_MATCH");
  });

  it("upgrades an exact full name match to MATCH when corroborating evidence exists", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        person: {
          firstName: "Marcus",
          lastName: "Lee",
          currentCity: null,
          currentCountry: null,
          headline: null,
        },
        organizations: [
          {
            organizationName: "LinkedIn",
            organizationType: null,
            relationship: null,
            title: null,
            isCurrent: null,
            knownYear: null,
          },
        ],
      }),
      [
        existingPerson({
          firstName: "Marcus",
          lastName: "Lee",
          organizations: [
            {
              organizationName: "LinkedIn",
              normalizedOrganizationName: "linkedin",
              relationship: null,
              title: null,
            },
          ],
        }),
      ],
    );

    expect(result.overallStatus).toBe("MATCH");
  });

  it("does not match when last names conflict, even with matching first name and corroborating evidence", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        person: {
          firstName: "Sarah",
          lastName: "Jones",
          currentCity: "Boston",
          currentCountry: null,
          headline: null,
        },
        organizations: [
          {
            organizationName: "HubSpot",
            organizationType: null,
            relationship: null,
            title: null,
            isCurrent: null,
            knownYear: null,
          },
        ],
      }),
      [
        existingPerson({
          firstName: "Sarah",
          lastName: "Smith",
          currentCity: "Boston",
          organizations: [
            {
              organizationName: "HubSpot",
              normalizedOrganizationName: "hubspot",
              relationship: null,
              title: null,
            },
          ],
        }),
      ],
    );

    expect(result.overallStatus).toBe("NEW");
  });

  it("does not surface a first-name-only match with a single corroborating signal", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        person: { ...candidate().person, firstName: "James" },
        organizations: [
          {
            organizationName: "Stripe",
            organizationType: null,
            relationship: null,
            title: null,
            isCurrent: null,
            knownYear: null,
          },
        ],
      }),
      [
        existingPerson({
          firstName: "James",
          organizations: [
            { organizationName: "Stripe", normalizedOrganizationName: "stripe", relationship: null, title: null },
          ],
        }),
      ],
    );

    expect(result.overallStatus).toBe("NEW");
  });

  it("surfaces a first-name-only match as POSSIBLE_MATCH with two corroborating signals", () => {
    const result = matchCandidateAgainstExisting(
      candidate({
        person: {
          firstName: "James",
          lastName: null,
          currentCity: "Boston",
          currentCountry: null,
          headline: null,
        },
        organizations: [
          {
            organizationName: "Stripe",
            organizationType: null,
            relationship: null,
            title: null,
            isCurrent: null,
            knownYear: null,
          },
        ],
      }),
      [
        existingPerson({
          firstName: "James",
          currentCity: "Boston",
          organizations: [
            { organizationName: "Stripe", normalizedOrganizationName: "stripe", relationship: null, title: null },
          ],
        }),
      ],
    );

    expect(result.overallStatus).toBe("POSSIBLE_MATCH");
  });

  it("ranks multiple existing matches strongest-first", () => {
    const withContact = matchCandidateAgainstExisting(
      candidate({
        person: {
          firstName: "Marcus",
          lastName: "Lee",
          currentCity: null,
          currentCountry: null,
          headline: null,
        },
        contacts: [
          { type: "email", value: "marcus@example.com", normalizedValue: null, isPrimary: true },
        ],
      }),
      [
        existingPerson({ personId: "possible", firstName: "Marcus", lastName: "Lee" }),
        existingPerson({
          personId: "strong",
          firstName: "M",
          contacts: [
            { type: "email", value: "marcus@example.com", normalizedValue: "marcus@example.com" },
          ],
        }),
      ],
    );

    expect(withContact.matches[0].personId).toBe("strong");
    expect(withContact.matches[0].status).toBe("MATCH");
  });
});
