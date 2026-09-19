/**
 * Only normalizes phone numbers that already carry an explicit country
 * code (a leading "+"). The design doc requires that we never invent a
 * country code, so a bare local number (e.g. "555-123-4567") returns null
 * instead of guessing -- it's still stored as-is in the contact's raw
 * `value`, just without a strong normalized identity signal.
 */
export function normalizePhone(rawValue: string): string | null {
  const trimmed = rawValue.trim();

  if (!trimmed.startsWith("+")) {
    return null;
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  return digits.length > 0 ? `+${digits}` : null;
}
