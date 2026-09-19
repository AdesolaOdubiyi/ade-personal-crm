import type { ScalarFieldAnalysis } from "@/domain/matching/scalarConflicts";

const FIELD_LABELS: Record<ScalarFieldAnalysis["field"], string> = {
  firstName: "First name",
  lastName: "Last name",
  currentCity: "City",
  currentCountry: "Country",
  headline: "Headline",
};

export function ConflictRow({
  conflict,
  resolvedValue,
  onResolve,
}: {
  conflict: ScalarFieldAnalysis;
  resolvedValue: string | null | undefined;
  onResolve: (value: string) => void;
}) {
  const chosenExisting = resolvedValue === conflict.existingValue;
  const chosenIncoming = resolvedValue === conflict.incomingValue;

  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 text-sm font-medium text-foreground">
        {FIELD_LABELS[conflict.field]}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onResolve(conflict.existingValue as string)}
          aria-pressed={chosenExisting}
          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
            chosenExisting
              ? "border-accent bg-accent/5 text-foreground"
              : "border-border text-foreground-muted hover:border-border-strong"
          }`}
        >
          <span className="block text-xs text-foreground-subtle">Current value</span>
          {conflict.existingValue}
        </button>
        <button
          type="button"
          onClick={() => onResolve(conflict.incomingValue as string)}
          aria-pressed={chosenIncoming}
          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
            chosenIncoming
              ? "border-accent bg-accent/5 text-foreground"
              : "border-border text-foreground-muted hover:border-border-strong"
          }`}
        >
          <span className="block text-xs text-foreground-subtle">From these notes</span>
          {conflict.incomingValue}
        </button>
      </div>
    </div>
  );
}
