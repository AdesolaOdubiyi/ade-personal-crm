import {
  getCandidateConnectionContext,
  getCandidateDisplayName,
  getCandidateLocation,
  getCandidateOrganizationLabel,
} from "@/lib/presentation/candidateDisplay";
import { ConflictRow } from "./ConflictRow";
import {
  ContactsEditor,
  ConnectionsEditor,
  FactsEditor,
  InteractionsEditor,
  OrganizationsEditor,
} from "./NestedEditors";
import { MatchEvidence } from "./MatchEvidence";
import { MatchStatusBadge } from "./MatchStatusBadge";
import { PersonFieldsEditor } from "./PersonFieldsEditor";
import type { ReviewCandidate } from "./reviewTypes";
import type { PersonCandidate, PersonScalarsCandidate } from "@/domain/ingestion/candidateTypes";

export function CandidateCard({
  reviewCandidate,
  onToggleIncluded,
  onToggleExpanded,
  onChangeCandidate,
  onSelectTarget,
  onUseAsNew,
  onResolveConflict,
}: {
  reviewCandidate: ReviewCandidate;
  onToggleIncluded: () => void;
  onToggleExpanded: () => void;
  onChangeCandidate: (candidate: PersonCandidate) => void;
  onSelectTarget: (personId: string) => void;
  onUseAsNew: () => void;
  onResolveConflict: (field: keyof PersonScalarsCandidate, value: string) => void;
}) {
  const { candidate, matchStatus, matches, included, expanded, targetPersonId, resolvedScalars } =
    reviewCandidate;

  const name = getCandidateDisplayName(candidate);
  const organization = getCandidateOrganizationLabel(candidate);
  const location = getCandidateLocation(candidate);
  const connectionContext = getCandidateConnectionContext(candidate);
  const subline = [organization, location].filter(Boolean).join(" · ");

  const activeComparison = targetPersonId
    ? reviewCandidate.comparisons[targetPersonId]
    : undefined;
  const conflicts =
    activeComparison?.scalarConflicts.filter((c) => c.status === "CONFLICT") ?? [];

  return (
    <li
      className={`rounded-md border p-4 ${
        matchStatus === "POSSIBLE_MATCH" ? "border-attention/40" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={included}
          onChange={onToggleIncluded}
          aria-label={`Save ${name}`}
          className="mt-1 size-4 accent-accent"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{name}</p>
              {subline && <p className="truncate text-sm text-foreground-muted">{subline}</p>}
              {connectionContext && (
                <p className="truncate text-sm text-foreground-subtle">{connectionContext}</p>
              )}
            </div>
            <MatchStatusBadge status={matchStatus} />
          </div>

          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            className="mt-2 text-sm text-accent hover:underline"
          >
            {expanded ? "Hide details" : "View details"}
          </button>

          {expanded && (
            <div className="mt-4 flex flex-col gap-5 border-t border-border pt-4">
              <PersonFieldsEditor
                candidateId={reviewCandidate.candidateId}
                person={candidate.person}
                onChange={(field, value) =>
                  onChangeCandidate({
                    ...candidate,
                    person: { ...candidate.person, [field]: value || null },
                  })
                }
              />

              {matches.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Matching evidence</p>
                  <MatchEvidence
                    matches={matches}
                    targetPersonId={targetPersonId}
                    onSelectTarget={onSelectTarget}
                    onUseAsNew={onUseAsNew}
                  />
                </div>
              )}

              {conflicts.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Conflicts</p>
                  <div className="flex flex-col gap-2">
                    {conflicts.map((conflict) => (
                      <ConflictRow
                        key={conflict.field}
                        conflict={conflict}
                        resolvedValue={resolvedScalars[conflict.field]}
                        onResolve={(value) => onResolveConflict(conflict.field, value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <ContactsEditor
                contacts={candidate.contacts}
                onChange={(contacts) => onChangeCandidate({ ...candidate, contacts })}
              />
              <OrganizationsEditor
                organizations={candidate.organizations}
                onChange={(organizations) => onChangeCandidate({ ...candidate, organizations })}
              />
              <ConnectionsEditor
                connections={candidate.connections}
                onChange={(connections) => onChangeCandidate({ ...candidate, connections })}
              />
              <FactsEditor
                facts={candidate.facts}
                onChange={(facts) => onChangeCandidate({ ...candidate, facts })}
              />
              <InteractionsEditor
                interactions={candidate.interactions}
                onChange={(interactions) => onChangeCandidate({ ...candidate, interactions })}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
