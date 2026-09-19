import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../testUtils";
import type { DbClient } from "../client";
import { contacts, organizations, people } from "../schema";
import {
  createPersonAggregate,
  deletePerson,
  getPersonAggregate,
  type NewPersonAggregate,
} from "./people";

function minimalAggregate(
  overrides: Partial<NewPersonAggregate["person"]> = {},
): NewPersonAggregate {
  return {
    person: {
      firstName: null,
      lastName: null,
      currentCity: null,
      currentCountry: null,
      headline: null,
      ...overrides,
    },
  };
}

describe("createPersonAggregate / getPersonAggregate", () => {
  let db: DbClient;
  let cleanup: () => void;

  beforeEach(() => {
    ({ db, cleanup } = createTestDb());
  });

  afterEach(() => cleanup());

  it("creates a person with only a first name", () => {
    const personId = createPersonAggregate(
      db,
      minimalAggregate({ firstName: "Maya" }),
    );

    const row = db
      .select()
      .from(people)
      .where(eq(people.personId, personId))
      .all()[0];

    expect(row.firstName).toBe("Maya");
    expect(row.lastName).toBeNull();
  });

  it("creates a person with only a last name", () => {
    const personId = createPersonAggregate(
      db,
      minimalAggregate({ lastName: "Okafor" }),
    );

    const row = db
      .select()
      .from(people)
      .where(eq(people.personId, personId))
      .all()[0];

    expect(row.lastName).toBe("Okafor");
    expect(row.firstName).toBeNull();
  });

  it("links nested contacts, facts, interactions, connections, and organization relationships to the correct person", async () => {
    const personId = createPersonAggregate(db, {
      person: { ...minimalAggregate().person, firstName: "Marcus" },
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
          dateMet: null,
        },
      ],
      facts: [
        { category: "expertise", value: "developer infrastructure", details: null },
      ],
      interactions: [
        {
          interactionDate: null,
          type: "conversation",
          summary: "Discussed infra tooling",
          followUp: null,
        },
      ],
    });

    const aggregate = await getPersonAggregate(db, personId);

    expect(aggregate?.contacts).toHaveLength(1);
    expect(aggregate?.contacts[0].value).toBe("https://linkedin.com/in/marcus");
    expect(aggregate?.personOrganizations).toHaveLength(1);
    expect(aggregate?.personOrganizations[0].organization.name).toBe("LinkedIn");
    expect(aggregate?.connections).toHaveLength(1);
    expect(aggregate?.facts).toHaveLength(1);
    expect(aggregate?.interactions).toHaveLength(1);
  });

  it("reuses a shared organization across multiple people instead of duplicating it", () => {
    const orgInput = {
      organizationName: "LinkedIn",
      organizationType: "company",
      relationship: "employee",
      title: null,
      isCurrent: null,
      knownYear: null,
    };

    createPersonAggregate(db, {
      person: { ...minimalAggregate().person, firstName: "Marcus" },
      organizations: [orgInput],
    });
    createPersonAggregate(db, {
      person: { ...minimalAggregate().person, firstName: "Priya" },
      organizations: [orgInput],
    });

    const orgRows = db.select().from(organizations).all();

    expect(orgRows).toHaveLength(1);
  });

  it("cascades deletion of person-owned records but preserves the shared organization", () => {
    const personId = createPersonAggregate(db, {
      person: { ...minimalAggregate().person, firstName: "Marcus" },
      contacts: [
        {
          type: "email",
          value: "marcus@example.com",
          normalizedValue: "marcus@example.com",
          isPrimary: true,
        },
      ],
      organizations: [
        {
          organizationName: "LinkedIn",
          organizationType: "company",
          relationship: "employee",
          title: null,
          isCurrent: null,
          knownYear: null,
        },
      ],
    });

    deletePerson(db, personId);

    const remainingContacts = db.select().from(contacts).all();
    const remainingOrgs = db.select().from(organizations).all();

    expect(remainingContacts).toHaveLength(0);
    expect(remainingOrgs).toHaveLength(1);
  });

  it("rejects a contact referencing a person that does not exist", () => {
    expect(() =>
      db
        .insert(contacts)
        .values({
          personId: "00000000-0000-0000-0000-000000000000",
          type: "email",
          value: "ghost@example.com",
          normalizedValue: "ghost@example.com",
          isPrimary: false,
        })
        .run(),
    ).toThrow(/FOREIGN KEY constraint failed/);
  });

  it("rolls back the entire candidate when a nested write violates a constraint", () => {
    const duplicateContact = {
      type: "email" as const,
      value: "dup@example.com",
      normalizedValue: "dup@example.com",
      isPrimary: false,
    };

    expect(() =>
      createPersonAggregate(db, {
        person: { ...minimalAggregate().person, firstName: "Broken" },
        contacts: [duplicateContact, duplicateContact],
      }),
    ).toThrow();

    const personRows = db.select().from(people).all();
    expect(personRows).toHaveLength(0);
  });
});
