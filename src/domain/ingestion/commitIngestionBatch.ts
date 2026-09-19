import { applyUpdateMergePlan, createPersonAggregate } from "../../db/queries/people";
import { toNewPersonAggregate } from "../../db/queries/candidateMappers";
import { listExistingPersonRecords } from "../../db/queries/existingPeople";
import type { DbClient } from "../../db/client";
import { buildUpdateMergePlan } from "./buildUpdateMergePlan";
import type { PersonCandidate, PersonScalarsCandidate } from "./candidateTypes";

export type CommitDecision =
  | { action: "CREATE"; candidate: PersonCandidate }
  | {
      action: "UPDATE";
      personId: string;
      candidate: PersonCandidate;
      resolvedScalars?: Partial<PersonScalarsCandidate>;
    }
  | { action: "SKIP" };

export type CommitResult =
  | { status: "CREATED"; personId: string }
  | { status: "UPDATED"; personId: string }
  | { status: "SKIPPED" }
  | { status: "FAILED"; error: string };

/**
 * Sequential, not Promise.all: batch atomicity is per-candidate, not
 * per-batch (design doc section 16), so results must stay in submission
 * order and one candidate's failure must never affect another's outcome.
 */
export async function commitIngestionBatch(
  db: DbClient,
  decisions: CommitDecision[],
): Promise<CommitResult[]> {
  const results: CommitResult[] = [];

  for (const decision of decisions) {
    results.push(await commitOneDecision(db, decision));
  }

  return results;
}

async function commitOneDecision(
  db: DbClient,
  decision: CommitDecision,
): Promise<CommitResult> {
  try {
    if (decision.action === "SKIP") {
      return { status: "SKIPPED" };
    }

    const existingPeople = await listExistingPersonRecords(db);

    if (decision.action === "CREATE") {
      const newAggregate = toNewPersonAggregate(decision.candidate, existingPeople);
      const personId = createPersonAggregate(db, newAggregate);
      return { status: "CREATED", personId };
    }

    const existing = existingPeople.find((person) => person.personId === decision.personId);
    if (!existing) {
      return {
        status: "FAILED",
        error: `No existing person found with id ${decision.personId}`,
      };
    }

    const plan = buildUpdateMergePlan(
      existing,
      decision.candidate,
      decision.resolvedScalars ?? {},
    );
    applyUpdateMergePlan(db, decision.personId, plan, existingPeople);
    return { status: "UPDATED", personId: decision.personId };
  } catch (error) {
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown commit failure.",
    };
  }
}
