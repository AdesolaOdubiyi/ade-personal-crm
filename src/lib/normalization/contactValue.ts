import type { ContactType } from "../../domain/ingestion/candidateTypes";
import { normalizeEmail } from "./email";
import { normalizeLinkedInUrl } from "./linkedin";
import { normalizePhone } from "./phone";

export const IDENTITY_CONTACT_TYPES: ReadonlyArray<ContactType> = [
  "email",
  "phone",
  "linkedin",
];

/**
 * Only email/phone/LinkedIn are identity-oriented (design doc section 14).
 * Used both by matching (compare candidate vs. existing normalized values)
 * and by commit persistence (compute the normalizedValue actually written
 * to the DB, since AI-extracted candidates almost always leave it null).
 */
export function computeIdentityNormalizedValue(
  type: ContactType,
  value: string,
): string | null {
  switch (type) {
    case "email":
      return normalizeEmail(value);
    case "phone":
      return normalizePhone(value);
    case "linkedin":
      return normalizeLinkedInUrl(value);
    default:
      return null;
  }
}
