"use client";

import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { InlineError } from "@/components/InlineError";
import { getCandidateDisplayName } from "@/lib/presentation/candidateDisplay";
import type { PersonCandidate, PersonScalarsCandidate } from "@/domain/ingestion/candidateTypes";
import { CandidateCard } from "./CandidateCard";
import { CommitResults } from "./CommitResults";
import { IngestionApiError, requestCommit, requestComparison, requestPreview } from "./ingestionApi";
import { PasteForm } from "./PasteForm";
import type { CommitOutcome, ReviewCandidate } from "./reviewTypes";

type Phase = "input" | "extracting" | "review" | "committing" | "done";

export function IngestionFlow() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [error, setError] = useState<string | null>(null);
  const [reviewCandidates, setReviewCandidates] = useState<ReviewCandidate[]>([]);
  const [outcomes, setOutcomes] = useState<CommitOutcome[]>([]);

  async function handleExtract() {
    setPhase("extracting");
    setError(null);

    try {
      const previews = await requestPreview(text);
      setReviewCandidates(previews.map(toReviewCandidate));
      setPhase("review");
    } catch (err) {
      setError(err instanceof IngestionApiError ? err.message : "Something went wrong. Try again.");
      setPhase("input");
    }
  }

  async function handleCommit() {
    setPhase("committing");
    setError(null);

    try {
      const results = await requestCommit(reviewCandidates);
      setOutcomes(results);
      setPhase("done");
    } catch (err) {
      setError(err instanceof IngestionApiError ? err.message : "Something went wrong. Try again.");
      setPhase("review");
    }
  }

  function updateCandidate(candidateId: string, update: (rc: ReviewCandidate) => ReviewCandidate) {
    setReviewCandidates((current) =>
      current.map((rc) => (rc.candidateId === candidateId ? update(rc) : rc)),
    );
  }

  async function handleSelectTarget(candidateId: string, personId: string) {
    updateCandidate(candidateId, (rc) => ({
      ...rc,
      action: "UPDATE",
      targetPersonId: personId,
      resolvedScalars: {},
    }));

    const current = reviewCandidates.find((rc) => rc.candidateId === candidateId);
    if (current && !current.comparisons[personId]) {
      try {
        const comparison = await requestComparison(current.candidate, personId);
        updateCandidate(candidateId, (rc) => ({
          ...rc,
          comparisons: { ...rc.comparisons, [personId]: comparison },
        }));
      } catch {
        // Comparison is advisory (helps surface conflicts); if it fails,
        // the update decision itself can still be committed safely --
        // any unresolved conflict just stays untouched server-side.
      }
    }
  }

  function handleStartOver() {
    setText("");
    setReviewCandidates([]);
    setOutcomes([]);
    setError(null);
    setPhase("input");
  }

  const includedCount = reviewCandidates.filter((rc) => rc.included).length;
  const namesByCandidateId = new Map(
    reviewCandidates.map((rc) => [rc.candidateId, getCandidateDisplayName(rc.candidate)]),
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Add people</h1>

      {error && (
        <div className="mb-4">
          <InlineError message={error} />
        </div>
      )}

      {(phase === "input" || phase === "extracting") && (
        <PasteForm
          text={text}
          onTextChange={setText}
          onSubmit={handleExtract}
          isExtracting={phase === "extracting"}
        />
      )}

      {(phase === "review" || phase === "committing") && (
        <div className="flex flex-col gap-4">
          {reviewCandidates.length === 0 ? (
            <EmptyState
              title="No people found"
              description="Nothing in that text matched a person. Try adding more detail."
            />
          ) : (
            <>
              <p className="text-sm text-foreground-muted">
                {reviewCandidates.length === 1
                  ? "1 person found"
                  : `${reviewCandidates.length} people found`}
              </p>
              <ul className="flex flex-col gap-3">
                {reviewCandidates.map((rc) => (
                  <CandidateCard
                    key={rc.candidateId}
                    reviewCandidate={rc}
                    onToggleIncluded={() =>
                      updateCandidate(rc.candidateId, (c) => ({ ...c, included: !c.included }))
                    }
                    onToggleExpanded={() =>
                      updateCandidate(rc.candidateId, (c) => ({ ...c, expanded: !c.expanded }))
                    }
                    onChangeCandidate={(candidate: PersonCandidate) =>
                      updateCandidate(rc.candidateId, (c) => ({ ...c, candidate }))
                    }
                    onSelectTarget={(personId) => handleSelectTarget(rc.candidateId, personId)}
                    onUseAsNew={() =>
                      updateCandidate(rc.candidateId, (c) => ({
                        ...c,
                        action: "CREATE",
                        targetPersonId: null,
                        resolvedScalars: {},
                      }))
                    }
                    onResolveConflict={(field: keyof PersonScalarsCandidate, value: string) =>
                      updateCandidate(rc.candidateId, (c) => ({
                        ...c,
                        resolvedScalars: { ...c.resolvedScalars, [field]: value },
                      }))
                    }
                  />
                ))}
              </ul>
              <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-background py-4">
                <span className="text-sm text-foreground-muted">
                  {includedCount} of {reviewCandidates.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={includedCount === 0 || phase === "committing"}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {phase === "committing"
                    ? "Saving…"
                    : `Save ${includedCount} ${includedCount === 1 ? "person" : "people"}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "done" && (
        <CommitResults
          outcomes={outcomes}
          namesByCandidateId={namesByCandidateId}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

function toReviewCandidate(preview: {
  candidateId: string;
  candidate: PersonCandidate;
  matchStatus: ReviewCandidate["matchStatus"];
  matches: ReviewCandidate["matches"];
  topMatchScalarConflicts?: ReviewCandidate["comparisons"][string]["scalarConflicts"];
  topMatchNestedDuplicates?: ReviewCandidate["comparisons"][string]["nestedDuplicates"];
}): ReviewCandidate {
  const topMatch = preview.matches[0];
  const comparisons =
    topMatch && preview.topMatchScalarConflicts && preview.topMatchNestedDuplicates
      ? {
          [topMatch.personId]: {
            scalarConflicts: preview.topMatchScalarConflicts,
            nestedDuplicates: preview.topMatchNestedDuplicates,
          },
        }
      : {};

  return {
    candidateId: preview.candidateId,
    candidate: preview.candidate,
    matchStatus: preview.matchStatus,
    matches: preview.matches,
    comparisons,
    included: true,
    action: "CREATE",
    targetPersonId: null,
    resolvedScalars: {},
    expanded: false,
  };
}
