import type { CandidateComparison } from "@/domain/ingestion/compareCandidateToExisting";
import type { PersonCandidate, PersonScalarsCandidate } from "@/domain/ingestion/candidateTypes";
import type { MatchStatus, PersonMatch } from "@/domain/matching/matchCandidate";

export type ReviewAction = "CREATE" | "UPDATE";

export type ReviewCandidate = {
  candidateId: string;
  candidate: PersonCandidate;
  matchStatus: MatchStatus;
  matches: PersonMatch[];
  comparisons: Record<string, CandidateComparison>;
  included: boolean;
  action: ReviewAction;
  targetPersonId: string | null;
  resolvedScalars: Partial<PersonScalarsCandidate>;
  expanded: boolean;
};

export type CommitOutcome = {
  candidateId?: string;
  status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
  personId?: string;
  error?: string;
};
