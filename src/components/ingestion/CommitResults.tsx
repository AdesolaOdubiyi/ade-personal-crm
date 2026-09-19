import { CheckCircle2, XCircle } from "lucide-react";
import type { CommitOutcome } from "./reviewTypes";

const STATUS_TEXT: Record<CommitOutcome["status"], string> = {
  CREATED: "added",
  UPDATED: "updated",
  SKIPPED: "skipped",
  FAILED: "couldn't be saved",
};

export function CommitResults({
  outcomes,
  namesByCandidateId,
  onStartOver,
}: {
  outcomes: CommitOutcome[];
  namesByCandidateId: Map<string, string>;
  onStartOver: () => void;
}) {
  const failedCount = outcomes.filter((outcome) => outcome.status === "FAILED").length;
  const savedCount = outcomes.length - failedCount;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground-muted">
        {savedCount} saved
        {failedCount > 0 ? `, ${failedCount} couldn't be saved` : ""}.
      </p>
      <ul className="flex flex-col gap-2">
        {outcomes.map((outcome, index) => {
          const name = outcome.candidateId
            ? (namesByCandidateId.get(outcome.candidateId) ?? "Person")
            : "Person";
          const failed = outcome.status === "FAILED";
          return (
            <li
              key={outcome.candidateId ?? index}
              className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              {failed ? (
                <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              )}
              <span>
                <span className="font-medium text-foreground">{name}</span>{" "}
                <span className="text-foreground-muted">{STATUS_TEXT[outcome.status]}</span>
                {failed && outcome.error && (
                  <span className="block text-foreground-subtle">{outcome.error}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onStartOver}
        className="self-start rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-border-strong"
      >
        Add more people
      </button>
    </div>
  );
}
