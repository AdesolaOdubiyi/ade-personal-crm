export function normalizeLinkedInUrl(rawValue: string): string {
  const trimmed = rawValue.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return `${url.hostname.toLowerCase()}${path}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}
