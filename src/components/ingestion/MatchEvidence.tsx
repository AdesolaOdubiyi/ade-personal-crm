import Link from "next/link";
import type { PersonMatch } from "@/domain/matching/matchCandidate";

export function MatchEvidence({
  matches,
  targetPersonId,
  onSelectTarget,
  onUseAsNew,
}: {
  matches: PersonMatch[];
  targetPersonId: string | null;
  onSelectTarget: (personId: string) => void;
  onUseAsNew: () => void;
}) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {matches.map((match) => {
        const isTarget = targetPersonId === match.personId;
        return (
          <div
            key={match.personId}
            className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm text-foreground">{match.reasons.join(" · ")}</p>
              <Link
                href={`/people/${match.personId}`}
                target="_blank"
                className="text-sm text-accent hover:underline"
              >
                View person
              </Link>
            </div>
            <button
              type="button"
              onClick={() => onSelectTarget(match.personId)}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                isTarget
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-foreground hover:border-border-strong"
              }`}
            >
              {isTarget ? "Updating this person" : "Update this person instead"}
            </button>
          </div>
        );
      })}
      {targetPersonId && (
        <button
          type="button"
          onClick={onUseAsNew}
          className="self-start text-sm text-foreground-muted hover:text-foreground hover:underline"
        >
          Save as a new person instead
        </button>
      )}
    </div>
  );
}
