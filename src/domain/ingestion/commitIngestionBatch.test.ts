import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DbClient } from "../../db/client";
import { getPersonAggregate } from "../../db/queries/people";
import { createTestDb } from "../../db/testUtils";
import { people } from "../../db/schema";
import { commitIngestionBatch, type CommitDecision } from "./commitIngestionBatch";
import type { PersonCandidate } from "./candidateTypes";

function sparseCandidate(overrides: Partial<PersonCandidate> = {}): PersonCandidate {
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

describe("commitIngestionBatch", () => {
  let db: DbClient;
  let cleanup: () => void;

  beforeEach(() => {
    ({ db, cleanup } = createTestDb());
  });

  afterEach(() => cleanup());

  it("CREATE persists a complete person aggregate atomically", async () => {
    const decision: CommitDecision = {
      action: "CREATE",
      candidate: sparseCandidate({
        person: { ...sparseCandidate().person, firstName: "Marcus" },
        contacts: [
          { type: "linkedin", value: "https://linkedin.com/in/marcus", normalizedValue: null, isPrimary: true },
        ],
        organizations: [
          { organizationName: "LinkedIn", organizationType: "company", relationship: "employee", title: null, isCurrent: true, knownYear: null },
        ],
        facts: [{ category: "expertise", value: "developer infrastructure", details: null }],
      }),
    };

    const [result] = await commitIngestionBatch(db, [decision]);

    expect(result.status).toBe("CREATED");
    const personId = (result as { status: "CREATED"; personId: string }).personId;
    const aggregate = await getPersonAggregate(db, personId);

    expect(aggregate?.contacts).toHaveLength(1);
    // AI leaves normalizedValue null; commit must compute it for identity contacts.
    expect(aggregate?.contacts[0].normalizedValue).toBe("linkedin.com/in/marcus");
    expect(aggregate?.personOrganizations).toHaveLength(1);
    expect(aggregate?.facts).toHaveLength(1);
  });

  it("rolls back a CREATE entirely when a nested write violates a constraint", async () => {
    const duplicateContact = {
      type: "email" as const,
      value: "dup@example.com",
      normalizedValue: null,
      isPrimary: null,
    };

    const [result] = await commitIngestionBatch(db, [
      {
        action: "CREATE",
        candidate: sparseCandidate({
          person: { ...sparseCandidate().person, firstName: "Broken" },
          contacts: [duplicateContact, duplicateContact],
        }),
      },
    ]);

    expect(result.status).toBe("FAILED");
    expect(db.select().from(people).all()).toHaveLength(0);
  });

  it("does not roll back an earlier successful candidate when a later one fails", async () => {
    const duplicateContact = {
      type: "email" as const,
      value: "dup@example.com",
      normalizedValue: null,
      isPrimary: null,
    };

    const results = await commitIngestionBatch(db, [
      { action: "CREATE", candidate: sparseCandidate({ person: { ...sparseCandidate().person, firstName: "Good" } }) },
      {
        action: "CREATE",
        candidate: sparseCandidate({
          person: { ...sparseCandidate().person, firstName: "Bad" },
          contacts: [duplicateContact, duplicateContact],
        }),
      },
    ]);

    expect(results[0].status).toBe("CREATED");
    expect(results[1].status).toBe("FAILED");
    expect(db.select().from(people).all()).toHaveLength(1);
  });

  it("SKIP makes no database changes", async () => {
    const results = await commitIngestionBatch(db, [{ action: "SKIP" }]);

    expect(results[0]).toEqual({ status: "SKIPPED" });
    expect(db.select().from(people).all()).toHaveLength(0);
  });

  it("UPDATE fills an existing null scalar and leaves a conflict untouched without resolution", async () => {
    const [createResult] = await commitIngestionBatch(db, [
      { action: "CREATE", candidate: sparseCandidate({ person: { firstName: "Marcus", lastName: null, currentCity: null, currentCountry: null, headline: null } }) },
    ]);
    const personId = (createResult as { status: "CREATED"; personId: string }).personId;

    const [updateResult] = await commitIngestionBatch(db, [
      {
        action: "UPDATE",
        personId,
        candidate: sparseCandidate({
          person: { firstName: null, lastName: "Lee", currentCity: "Boston", currentCountry: null, headline: null },
        }),
      },
    ]);

    expect(updateResult.status).toBe("UPDATED");
    const aggregate = await getPersonAggregate(db, personId);
    expect(aggregate?.lastName).toBe("Lee");
    expect(aggregate?.currentCity).toBe("Boston");

    const [conflictingUpdate] = await commitIngestionBatch(db, [
      {
        action: "UPDATE",
        personId,
        candidate: sparseCandidate({
          person: { firstName: null, lastName: null, currentCity: "Austin", currentCountry: null, headline: null },
        }),
      },
    ]);

    expect(conflictingUpdate.status).toBe("UPDATED");
    const afterConflict = await getPersonAggregate(db, personId);
    expect(afterConflict?.currentCity).toBe("Boston");
  });

  it("UPDATE applies a conflicting scalar only when resolvedScalars provides it", async () => {
    const [createResult] = await commitIngestionBatch(db, [
      { action: "CREATE", candidate: sparseCandidate({ person: { firstName: "Marcus", lastName: null, currentCity: "Boston", currentCountry: null, headline: null } }) },
    ]);
    const personId = (createResult as { status: "CREATED"; personId: string }).personId;

    await commitIngestionBatch(db, [
      {
        action: "UPDATE",
        personId,
        candidate: sparseCandidate({
          person: { firstName: null, lastName: null, currentCity: "Austin", currentCountry: null, headline: null },
        }),
        resolvedScalars: { currentCity: "Austin" },
      },
    ]);

    const aggregate = await getPersonAggregate(db, personId);
    expect(aggregate?.currentCity).toBe("Austin");
  });

  it("UPDATE ignores an exact duplicate nested contact instead of duplicating it", async () => {
    const contact = { type: "email" as const, value: "marcus@example.com", normalizedValue: null, isPrimary: null };
    const [createResult] = await commitIngestionBatch(db, [
      { action: "CREATE", candidate: sparseCandidate({ person: { ...sparseCandidate().person, firstName: "Marcus" }, contacts: [contact] }) },
    ]);
    const personId = (createResult as { status: "CREATED"; personId: string }).personId;

    await commitIngestionBatch(db, [
      { action: "UPDATE", personId, candidate: sparseCandidate({ contacts: [contact] }) },
    ]);

    const aggregate = await getPersonAggregate(db, personId);
    expect(aggregate?.contacts).toHaveLength(1);
  });

  it("UPDATE fails clearly when the target person does not exist", async () => {
    const [result] = await commitIngestionBatch(db, [
      { action: "UPDATE", personId: "does-not-exist", candidate: sparseCandidate({ person: { ...sparseCandidate().person, firstName: "X" } }) },
    ]);

    expect(result.status).toBe("FAILED");
  });

  it("resolves introducedBy to a real person FK when unambiguous", async () => {
    const [introducerResult] = await commitIngestionBatch(db, [
      { action: "CREATE", candidate: sparseCandidate({ person: { firstName: "Sarah", lastName: "Kim", currentCity: null, currentCountry: null, headline: null } }) },
    ]);
    const introducerId = (introducerResult as { status: "CREATED"; personId: string }).personId;

    const [result] = await commitIngestionBatch(db, [
      {
        action: "CREATE",
        candidate: sparseCandidate({
          person: { ...sparseCandidate().person, firstName: "Daniel" },
          connections: [
            { context: "Introduced at a conference", locationWhereMet: null, introducedBy: "Sarah Kim", details: null, dateMet: null },
          ],
        }),
      },
    ]);
    const personId = (result as { status: "CREATED"; personId: string }).personId;

    const aggregate = await getPersonAggregate(db, personId);
    expect(aggregate?.connections[0].introducedBy).toBe(introducerId);
  });
});
