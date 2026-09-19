import { normalizeName } from "../../lib/normalization/name";
import type { PersonScalarsCandidate } from "../ingestion/candidateTypes";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";

export type ScalarFieldStatus = "UNKNOWN" | "FILL" | "NO_OP" | "CONFLICT";

export type ScalarFieldAnalysis = {
  field: keyof PersonScalarsCandidate;
  status: ScalarFieldStatus;
  existingValue: string | null;
  incomingValue: string | null;
};

const SCALAR_FIELDS: ReadonlyArray<keyof PersonScalarsCandidate> = [
  "firstName",
  "lastName",
  "currentCity",
  "currentCountry",
  "headline",
];

/**
 * Incoming null means "unknown," never "delete" (design doc section 16) --
 * it always resolves to UNKNOWN, never CONFLICT or an implicit clear.
 */
export function analyzeScalarConflicts(
  existing: ExistingPersonRecord,
  incoming: PersonScalarsCandidate,
): ScalarFieldAnalysis[] {
  return SCALAR_FIELDS.map((field) =>
    analyzeField(field, existing[field], incoming[field]),
  );
}

function analyzeField(
  field: keyof PersonScalarsCandidate,
  existingValue: string | null,
  incomingValue: string | null,
): ScalarFieldAnalysis {
  if (incomingValue === null) {
    return { field, status: "UNKNOWN", existingValue, incomingValue };
  }
  if (existingValue === null) {
    return { field, status: "FILL", existingValue, incomingValue };
  }
  if (normalizeName(existingValue) === normalizeName(incomingValue)) {
    return { field, status: "NO_OP", existingValue, incomingValue };
  }
  return { field, status: "CONFLICT", existingValue, incomingValue };
}
