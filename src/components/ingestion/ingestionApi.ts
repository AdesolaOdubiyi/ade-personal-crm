import type { CandidateComparison } from "@/domain/ingestion/compareCandidateToExisting";
import type { CandidatePreview } from "@/domain/ingestion/previewCandidate";
import type { PersonCandidate } from "@/domain/ingestion/candidateTypes";
import type { CommitOutcome, ReviewCandidate } from "./reviewTypes";

export class IngestionApiError extends Error {}

export async function requestPreview(text: string): Promise<CandidatePreview[]> {
  const response = await fetch("/api/ingestions/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { type: "text", text } }),
  });

  const body = await parseJson(response);
  if (!response.ok) {
    throw new IngestionApiError(errorMessage(body, "Extraction failed."));
  }
  return (body as { candidates: CandidatePreview[] }).candidates;
}

export async function requestComparison(
  candidate: PersonCandidate,
  personId: string,
): Promise<CandidateComparison> {
  const response = await fetch("/api/ingestions/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate, personId }),
  });

  const body = await parseJson(response);
  if (!response.ok) {
    throw new IngestionApiError(errorMessage(body, "Comparison failed."));
  }
  return body as CandidateComparison;
}

export async function requestCommit(
  reviewCandidates: ReviewCandidate[],
): Promise<CommitOutcome[]> {
  const decisions = reviewCandidates
    .filter((reviewCandidate) => reviewCandidate.included)
    .map((reviewCandidate) =>
      reviewCandidate.action === "UPDATE" && reviewCandidate.targetPersonId
        ? {
            action: "UPDATE" as const,
            candidateId: reviewCandidate.candidateId,
            personId: reviewCandidate.targetPersonId,
            candidate: reviewCandidate.candidate,
            resolvedScalars: reviewCandidate.resolvedScalars,
          }
        : {
            action: "CREATE" as const,
            candidateId: reviewCandidate.candidateId,
            candidate: reviewCandidate.candidate,
          },
    );

  const ingestionId = crypto.randomUUID();
  const response = await fetch(`/api/ingestions/${ingestionId}/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decisions }),
  });

  const body = await parseJson(response);
  if (!response.ok) {
    throw new IngestionApiError(errorMessage(body, "Save failed."));
  }
  return (body as { results: CommitOutcome[] }).results;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}
