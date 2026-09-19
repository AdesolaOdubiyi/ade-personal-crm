import { applyUpdateMergePlan, createPersonAggregate } from "../../db/queries/people";
import { toNewPersonAggregate } from "../../db/queries/candidateMappers";
import { listExistingPersonRecords } from "../../db/queries/existingPeople";
import type { DbClient } from "../../db/client";
import { buildUpdateMergePlan } from "./buildUpdateMergePlan";
import type { PersonCandidate, PersonScalarsCandidate } from "./candidateTypes";

export type CommitDecision =
  | { action: "CREATE"; candidateId?: string; candidate: PersonCandidate }
  | {
      action: "UPDATE";
      candidateId?: string;
      personId: string;
      candidate: PersonCandidate;
      resolvedScalars?: Partial<PersonScalarsCandidate>;
    }
  | { action: "SKIP"; candidateId?: string };

export type CommitResult =
  | { status: "CREATED"; candidateId?: string; personId: string }
  | { status: "UPDATED"; candidateId?: string; personId: string }
  | { status: "SKIPPED"; candidateId?: string }
  | { status: "FAILED"; candidateId?: string; error: string };

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
  const candidateId = decision.candidateId;

  try {
    if (decision.action === "SKIP") {
      return { status: "SKIPPED", candidateId };
    }

    const existingPeople = await listExistingPersonRecords(db);

    if (decision.action === "CREATE") {
      const newAggregate = toNewPersonAggregate(decision.candidate, existingPeople);
      const personId = createPersonAggregate(db, newAggregate);
      return { status: "CREATED", candidateId, personId };
    }

    const existing = existingPeople.find((person) => person.personId === decision.personId);
    if (!existing) {
      return {
        status: "FAILED",
        candidateId,
        error: `No existing person found with id ${decision.personId}`,
      };
    }

    const plan = buildUpdateMergePlan(
      existing,
      decision.candidate,
      decision.resolvedScalars ?? {},
    );
    applyUpdateMergePlan(db, decision.personId, plan, existingPeople);
    return { status: "UPDATED", candidateId, personId: decision.personId };
  } catch (error) {
    return {
      status: "FAILED",
      candidateId,
      error: error instanceof Error ? error.message : "Unknown commit failure.",
    };
  }
}
