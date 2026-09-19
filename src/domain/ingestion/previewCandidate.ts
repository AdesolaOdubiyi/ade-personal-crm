import { randomUUID } from "node:crypto";
import {
  matchCandidateAgainstExisting,
  type MatchStatus,
  type PersonMatch,
} from "../matching/matchCandidate";
import type { ScalarFieldAnalysis } from "../matching/scalarConflicts";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";
import { compareCandidateToExisting, type NestedDuplicateAnalysis } from "./compareCandidateToExisting";
import type { PersonCandidate } from "./candidateTypes";

export type { NestedDuplicateAnalysis };

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
 * existing match. Comparing against a different match the reviewer picks
 * is handled on demand by POST /api/ingestions/compare
 * (compareCandidateToExisting), not precomputed here for every match.
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
    const comparison = compareCandidateToExisting(candidate, topMatchExisting);
    preview.topMatchScalarConflicts = comparison.scalarConflicts;
    preview.topMatchNestedDuplicates = comparison.nestedDuplicates;
  }

  return preview;
}
