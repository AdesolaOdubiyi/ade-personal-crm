import {
  classifyConnectionDuplicates,
  classifyContactDuplicates,
  classifyFactDuplicates,
  classifyInteractionDuplicates,
  classifyOrganizationDuplicates,
  type NestedDuplicateResult,
} from "../matching/nestedDuplicates";
import { analyzeScalarConflicts, type ScalarFieldAnalysis } from "../matching/scalarConflicts";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import type {
  ConnectionCandidate,
  ContactCandidate,
  FactCandidate,
  InteractionCandidate,
  PersonCandidate,
  PersonOrganizationCandidate,
} from "./candidateTypes";

export type NestedDuplicateAnalysis = {
  contacts: NestedDuplicateResult<ContactCandidate>[];
  organizations: NestedDuplicateResult<PersonOrganizationCandidate>[];
  connections: NestedDuplicateResult<ConnectionCandidate>[];
  facts: NestedDuplicateResult<FactCandidate>[];
  interactions: NestedDuplicateResult<InteractionCandidate>[];
};

export type CandidateComparison = {
  scalarConflicts: ScalarFieldAnalysis[];
  nestedDuplicates: NestedDuplicateAnalysis;
};

/**
 * Shared by preview (eager, top match only) and the on-demand compare
 * endpoint (lazy, any match the reviewer picks) so the two never diverge.
 */
export function compareCandidateToExisting(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): CandidateComparison {
  return {
    scalarConflicts: analyzeScalarConflicts(existing, candidate.person),
    nestedDuplicates: {
      contacts: classifyContactDuplicates(candidate.contacts, existing.contacts),
      organizations: classifyOrganizationDuplicates(candidate.organizations, existing.organizations),
      connections: classifyConnectionDuplicates(candidate.connections, existing.connections),
      facts: classifyFactDuplicates(candidate.facts, existing.facts),
      interactions: classifyInteractionDuplicates(candidate.interactions, existing.interactions),
    },
  };
}
