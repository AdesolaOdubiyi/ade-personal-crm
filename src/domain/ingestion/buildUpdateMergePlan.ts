import {
  classifyConnectionDuplicates,
  classifyContactDuplicates,
  classifyFactDuplicates,
  classifyInteractionDuplicates,
  classifyOrganizationDuplicates,
} from "../matching/nestedDuplicates";
import { analyzeScalarConflicts } from "../matching/scalarConflicts";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import type {
  ConnectionCandidate,
  ContactCandidate,
  FactCandidate,
  InteractionCandidate,
  PersonCandidate,
  PersonOrganizationCandidate,
  PersonScalarsCandidate,
} from "./candidateTypes";

export type UpdateMergePlan = {
  scalarUpdates: Partial<PersonScalarsCandidate>;
  newContacts: ContactCandidate[];
  newOrganizations: PersonOrganizationCandidate[];
  newConnections: ConnectionCandidate[];
  newFacts: FactCandidate[];
  newInteractions: InteractionCandidate[];
};

/**
 * resolvedScalars carries the reviewer's explicit decision for any CONFLICT
 * field (design doc: never silently overwrite meaningful existing data). A
 * CONFLICT field absent from resolvedScalars is left untouched.
 */
export function buildUpdateMergePlan(
  existing: ExistingPersonRecord,
  candidate: PersonCandidate,
  resolvedScalars: Partial<PersonScalarsCandidate> = {},
): UpdateMergePlan {
  const scalarAnalysis = analyzeScalarConflicts(existing, candidate.person);

  const scalarUpdates: Partial<PersonScalarsCandidate> = {};
  for (const field of scalarAnalysis) {
    if (field.status === "FILL") {
      scalarUpdates[field.field] = field.incomingValue;
    } else if (field.status === "CONFLICT" && resolvedScalars[field.field] !== undefined) {
      scalarUpdates[field.field] = resolvedScalars[field.field] ?? null;
    }
  }

  return {
    scalarUpdates,
    newContacts: onlyNew(classifyContactDuplicates(candidate.contacts, existing.contacts)),
    newOrganizations: onlyNew(
      classifyOrganizationDuplicates(candidate.organizations, existing.organizations),
    ),
    newConnections: onlyNew(
      classifyConnectionDuplicates(candidate.connections, existing.connections),
    ),
    newFacts: onlyNew(classifyFactDuplicates(candidate.facts, existing.facts)),
    newInteractions: onlyNew(
      classifyInteractionDuplicates(candidate.interactions, existing.interactions),
    ),
  };
}

function onlyNew<T>(results: { item: T; status: "DUPLICATE" | "NEW" }[]): T[] {
  return results.filter((result) => result.status === "NEW").map((result) => result.item);
}
