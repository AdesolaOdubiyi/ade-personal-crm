import { normalizeName } from "../../lib/normalization/name";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";

/**
 * introducedBy on a connection candidate is just a name at extraction time
 * (design doc section 13/16: "an unresolved introducer may temporarily
 * exist as a name"). Only resolve it to a real person FK when exactly one
 * existing person matches by full name -- any ambiguity (zero or multiple
 * matches) stays unresolved rather than guessing.
 */
export function resolveIntroducedByPersonId(
  introducedByName: string | null,
  existingPeople: ExistingPersonRecord[],
): string | null {
  if (!introducedByName) {
    return null;
  }

  const normalizedTarget = normalizeName(introducedByName);
  const matches = existingPeople.filter((person) => {
    const fullName = [person.firstName, person.lastName].filter(Boolean).join(" ");
    return fullName.length > 0 && normalizeName(fullName) === normalizedTarget;
  });

  return matches.length === 1 ? matches[0].personId : null;
}
