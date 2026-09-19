import { randomUUID } from "node:crypto";
import {
  classifyConnectionDuplicates,
  classifyContactDuplicates,
  classifyFactDuplicates,
  classifyInteractionDuplicates,
  classifyOrganizationDuplicates,
  type NestedDuplicateResult,
} from "../matching/nestedDuplicates";
import {
  matchCandidateAgainstExisting,
  type MatchStatus,
  type PersonMatch,
} from "../matching/matchCandidate";
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

export type CandidatePreview = {
  candidateId: string;
  candidate: PersonCandidate;
  matchStatus: MatchStatus;
  matches: PersonMatch[];
  topMatchScalarConflicts?: ScalarFieldAnalysis[];
  topMatchNestedDuplicates?: NestedDuplicateAnalysis;
};

/**
 * Conflict/duplicate analysis is computed only against the strongest
 * existing match. If a reviewer wants to target a different candidate
 * match instead, that comparison is recomputed when they act on it
 * (Phase 7 concern) -- the preview response isn't trying to precompute
 * every possible pairing up front.
 */
export function previewCandidate(
  candidate: PersonCandidate,
  existingPeople: ExistingPersonRecord[],
): CandidatePreview {
  const { overallStatus, matches } = matchCandidateAgainstExisting(
    candidate,
    existingPeople,
  );

  const preview: CandidatePreview = {
    candidateId: candidate.candidateId ?? randomUUID(),
    candidate,
    matchStatus: overallStatus,
    matches,
  };

  const topMatch = matches[0];
  const topMatchExisting = topMatch
    ? existingPeople.find((existing) => existing.personId === topMatch.personId)
    : undefined;

  if (topMatch && topMatchExisting) {
    preview.topMatchScalarConflicts = analyzeScalarConflicts(
      topMatchExisting,
      candidate.person,
    );
    preview.topMatchNestedDuplicates = {
      contacts: classifyContactDuplicates(candidate.contacts, topMatchExisting.contacts),
      organizations: classifyOrganizationDuplicates(
        candidate.organizations,
        topMatchExisting.organizations,
      ),
      connections: classifyConnectionDuplicates(
        candidate.connections,
        topMatchExisting.connections,
      ),
      facts: classifyFactDuplicates(candidate.facts, topMatchExisting.facts),
      interactions: classifyInteractionDuplicates(
        candidate.interactions,
        topMatchExisting.interactions,
      ),
    };
  }

  return preview;
}
