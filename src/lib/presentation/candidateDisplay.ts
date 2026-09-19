import type { PersonCandidate } from "../../domain/ingestion/candidateTypes";

export function getCandidateDisplayName(candidate: PersonCandidate): string {
  const name = [candidate.person.firstName, candidate.person.lastName]
    .filter(Boolean)
    .join(" ");
  return name.length > 0 ? name : "Unnamed";
}

export function getCandidateOrganizationLabel(candidate: PersonCandidate): string | null {
  const organization =
    candidate.organizations.find((org) => org.isCurrent === true) ??
    candidate.organizations[0];
  if (!organization) {
    return null;
  }
  return organization.title
    ? `${organization.title} at ${organization.organizationName}`
    : organization.organizationName;
}

export function getCandidateLocation(candidate: PersonCandidate): string | null {
  return (
    [candidate.person.currentCity, candidate.person.currentCountry].filter(Boolean).join(", ") ||
    null
  );
}

export function getCandidateConnectionContext(candidate: PersonCandidate): string | null {
  return candidate.connections[0]?.context ?? null;
}
