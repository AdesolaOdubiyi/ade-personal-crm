import type { PersonScalarsCandidate } from "@/domain/ingestion/candidateTypes";

const FIELDS: Array<{ key: keyof PersonScalarsCandidate; label: string; span?: boolean }> = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "currentCity", label: "City" },
  { key: "currentCountry", label: "Country" },
  { key: "headline", label: "Headline", span: true },
];

export function PersonFieldsEditor({
  candidateId,
  person,
  onChange,
}: {
  candidateId: string;
  person: PersonScalarsCandidate;
  onChange: (field: keyof PersonScalarsCandidate, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {FIELDS.map(({ key, label, span }) => {
        const inputId = `${candidateId}-${key}`;
        return (
          <div key={key} className={span ? "sm:col-span-2" : undefined}>
            <label htmlFor={inputId} className="mb-1 block text-xs text-foreground-subtle">
              {label}
            </label>
            <input
              id={inputId}
              type="text"
              value={person[key] ?? ""}
              onChange={(event) => onChange(key, event.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        );
      })}
    </div>
  );
}
