export function normalizeOrganizationName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
