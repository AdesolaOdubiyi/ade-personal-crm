import { eq } from "drizzle-orm";
import type { DbOrTransaction } from "../client";
import { organizations } from "../schema";

export function normalizeOrganizationName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findOrCreateOrganization(
  db: DbOrTransaction,
  name: string,
  type: string | null,
): string {
  const normalizedName = normalizeOrganizationName(name);

  const existing = db
    .select({ organizationId: organizations.organizationId })
    .from(organizations)
    .where(eq(organizations.normalizedName, normalizedName))
    .limit(1)
    .all();

  if (existing.length > 0) {
    return existing[0].organizationId;
  }

  const created = db
    .insert(organizations)
    .values({ name, normalizedName, type })
    .returning({ organizationId: organizations.organizationId })
    .all();

  return created[0].organizationId;
}
