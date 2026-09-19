import { normalizeEmail } from "../../lib/normalization/email";
import { normalizeLinkedInUrl } from "../../lib/normalization/linkedin";
import { normalizeName } from "../../lib/normalization/name";
import { normalizeOrganizationName } from "../../lib/normalization/organizationName";
import { normalizePhone } from "../../lib/normalization/phone";
import type { ContactType, PersonCandidate, PersonScalarsCandidate } from "../ingestion/candidateTypes";
import type { ExistingPersonRecord } from "../people/existingPersonRecord";

export type MatchStatus = "NEW" | "POSSIBLE_MATCH" | "MATCH";

export type PersonMatch = {
  personId: string;
  status: MatchStatus;
  reasons: string[];
};

export type CandidateMatchResult = {
  overallStatus: MatchStatus;
  matches: PersonMatch[];
};

const IDENTITY_CONTACT_TYPES: ReadonlyArray<ContactType> = [
  "email",
  "phone",
  "linkedin",
];

/**
 * A partial-name match (only first or only last name overlaps -- common
 * when one record is sparse) needs more than a single coincidental overlap
 * to surface for review in a small personal network. A full-name match
 * always surfaces regardless of evidence (confirmed with the user).
 */
const PARTIAL_NAME_MATCH_EVIDENCE_THRESHOLD = 2;

const MATCH_STATUS_RANK: Record<MatchStatus, number> = {
  MATCH: 2,
  POSSIBLE_MATCH: 1,
  NEW: 0,
};

export function matchCandidateAgainstExisting(
  candidate: PersonCandidate,
  existingPeople: ExistingPersonRecord[],
): CandidateMatchResult {
  const matches = existingPeople
    .map((existing) => matchAgainstOnePerson(candidate, existing))
    .filter((match): match is PersonMatch => match !== null)
    .sort((a, b) => MATCH_STATUS_RANK[b.status] - MATCH_STATUS_RANK[a.status]);

  return {
    overallStatus: matches[0]?.status ?? "NEW",
    matches,
  };
}

function matchAgainstOnePerson(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): PersonMatch | null {
  const strongContactReason = findStrongContactMatch(candidate, existing);
  if (strongContactReason) {
    return { personId: existing.personId, status: "MATCH", reasons: [strongContactReason] };
  }

  const nameComparison = compareNames(candidate.person, existing);
  if (nameComparison.result === "no-match") {
    return null;
  }

  const evidence = collectCorroboratingEvidence(candidate, existing);

  if (nameComparison.result === "full-name-match") {
    const reasons = [
      `Exact full name match: ${candidate.person.firstName} ${candidate.person.lastName}`,
      ...evidence,
    ];
    return {
      personId: existing.personId,
      status: evidence.length > 0 ? "MATCH" : "POSSIBLE_MATCH",
      reasons,
    };
  }

  if (evidence.length < PARTIAL_NAME_MATCH_EVIDENCE_THRESHOLD) {
    return null;
  }

  return {
    personId: existing.personId,
    status: "POSSIBLE_MATCH",
    reasons: [`${nameComparison.matchedComponent} name match only`, ...evidence],
  };
}

function findStrongContactMatch(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): string | null {
  for (const contact of candidate.contacts) {
    if (!IDENTITY_CONTACT_TYPES.includes(contact.type)) continue;

    const normalizedValue = computeIdentityNormalizedValue(contact.type, contact.value);
    if (!normalizedValue) continue;

    const hasMatch = existing.contacts.some(
      (existingContact) =>
        existingContact.type === contact.type &&
        existingContact.normalizedValue === normalizedValue,
    );

    if (hasMatch) {
      return `Exact normalized ${contact.type} match on ${normalizedValue}`;
    }
  }

  return null;
}

function computeIdentityNormalizedValue(
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

type NameComparison =
  | { result: "full-name-match" }
  | { result: "partial-name-match"; matchedComponent: "First" | "Last" }
  | { result: "no-match" };

function compareNames(
  candidatePerson: PersonScalarsCandidate,
  existing: ExistingPersonRecord,
): NameComparison {
  const firstMatches = componentMatches(candidatePerson.firstName, existing.firstName);
  const lastMatches = componentMatches(candidatePerson.lastName, existing.lastName);
  const firstConflicts = componentConflicts(candidatePerson.firstName, existing.firstName);
  const lastConflicts = componentConflicts(candidatePerson.lastName, existing.lastName);

  if (firstConflicts || lastConflicts) {
    return { result: "no-match" };
  }
  if (firstMatches && lastMatches) {
    return { result: "full-name-match" };
  }
  if (firstMatches) {
    return { result: "partial-name-match", matchedComponent: "First" };
  }
  if (lastMatches) {
    return { result: "partial-name-match", matchedComponent: "Last" };
  }
  return { result: "no-match" };
}

function componentMatches(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && normalizeName(a) === normalizeName(b);
}

function componentConflicts(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && normalizeName(a) !== normalizeName(b);
}

function collectCorroboratingEvidence(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): string[] {
  const evidence: string[] = [];

  const sharedOrganization = findSharedOrganization(candidate, existing);
  if (sharedOrganization) {
    evidence.push(`Shared organization: ${sharedOrganization}`);
  }

  if (hasSharedLocation(candidate.person, existing)) {
    evidence.push(
      `Shared location: ${candidate.person.currentCity ?? candidate.person.currentCountry}`,
    );
  }

  const sharedContext = findSharedConnectionContext(candidate, existing);
  if (sharedContext) {
    evidence.push(`Shared connection location: ${sharedContext}`);
  }

  const sharedContact = findSharedSecondaryContact(candidate, existing);
  if (sharedContact) {
    evidence.push(`Shared contact: ${sharedContact}`);
  }

  return evidence;
}

function findSharedOrganization(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): string | null {
  for (const org of candidate.organizations) {
    const normalized = normalizeOrganizationName(org.organizationName);
    const match = existing.organizations.find(
      (existingOrg) => existingOrg.normalizedOrganizationName === normalized,
    );
    if (match) return match.organizationName;
  }
  return null;
}

function hasSharedLocation(
  candidatePerson: PersonScalarsCandidate,
  existing: ExistingPersonRecord,
): boolean {
  if (!candidatePerson.currentCity || !existing.currentCity) {
    return false;
  }
  if (normalizeName(candidatePerson.currentCity) !== normalizeName(existing.currentCity)) {
    return false;
  }
  if (candidatePerson.currentCountry && existing.currentCountry) {
    return (
      normalizeName(candidatePerson.currentCountry) ===
      normalizeName(existing.currentCountry)
    );
  }
  return true;
}

function findSharedConnectionContext(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): string | null {
  for (const connection of candidate.connections) {
    if (!connection.locationWhereMet) continue;
    const normalizedLocation = normalizeName(connection.locationWhereMet);
    const match = existing.connections.find(
      (existingConnection) =>
        existingConnection.locationWhereMet !== null &&
        normalizeName(existingConnection.locationWhereMet) === normalizedLocation,
    );
    if (match) return connection.locationWhereMet;
  }
  return null;
}

function findSharedSecondaryContact(
  candidate: PersonCandidate,
  existing: ExistingPersonRecord,
): string | null {
  for (const contact of candidate.contacts) {
    if (IDENTITY_CONTACT_TYPES.includes(contact.type)) continue;

    const normalizedValue = contact.value.trim().toLowerCase();
    const match = existing.contacts.find(
      (existingContact) =>
        existingContact.type === contact.type &&
        existingContact.value.trim().toLowerCase() === normalizedValue,
    );
    if (match) return `${contact.type}: ${contact.value}`;
  }
  return null;
}
