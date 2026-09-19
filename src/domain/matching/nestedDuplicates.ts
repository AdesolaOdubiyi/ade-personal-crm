import { normalizeName } from "../../lib/normalization/name";
import { normalizeOrganizationName } from "../../lib/normalization/organizationName";
import type {
  ConnectionCandidate,
  ContactCandidate,
  FactCandidate,
  InteractionCandidate,
  PersonOrganizationCandidate,
} from "../ingestion/candidateTypes";
import type {
  ExistingConnection,
  ExistingContact,
  ExistingFact,
  ExistingInteraction,
  ExistingPersonOrganization,
} from "../people/existingPersonRecord";

export type NestedDuplicateStatus = "DUPLICATE" | "NEW";

export type NestedDuplicateResult<T> = {
  item: T;
  status: NestedDuplicateStatus;
};

export function classifyNestedItems<TCandidate, TExisting>(
  candidateItems: TCandidate[],
  existingItems: TExisting[],
  isDuplicate: (candidateItem: TCandidate, existingItem: TExisting) => boolean,
): NestedDuplicateResult<TCandidate>[] {
  return candidateItems.map((item) => ({
    item,
    status: existingItems.some((existingItem) => isDuplicate(item, existingItem))
      ? "DUPLICATE"
      : "NEW",
  }));
}

export function classifyContactDuplicates(
  candidateContacts: ContactCandidate[],
  existingContacts: ExistingContact[],
): NestedDuplicateResult<ContactCandidate>[] {
  return classifyNestedItems(candidateContacts, existingContacts, (candidate, existing) => {
    if (candidate.type !== existing.type) return false;
    if (candidate.normalizedValue && existing.normalizedValue) {
      return candidate.normalizedValue === existing.normalizedValue;
    }
    return normalizeName(candidate.value) === normalizeName(existing.value);
  });
}

export function classifyOrganizationDuplicates(
  candidateOrganizations: PersonOrganizationCandidate[],
  existingOrganizations: ExistingPersonOrganization[],
): NestedDuplicateResult<PersonOrganizationCandidate>[] {
  return classifyNestedItems(
    candidateOrganizations,
    existingOrganizations,
    (candidate, existing) =>
      normalizeOrganizationName(candidate.organizationName) ===
        existing.normalizedOrganizationName &&
      normalizeOptional(candidate.relationship) === normalizeOptional(existing.relationship) &&
      normalizeOptional(candidate.title) === normalizeOptional(existing.title),
  );
}

export function classifyConnectionDuplicates(
  candidateConnections: ConnectionCandidate[],
  existingConnections: ExistingConnection[],
): NestedDuplicateResult<ConnectionCandidate>[] {
  return classifyNestedItems(candidateConnections, existingConnections, (candidate, existing) => {
    return (
      normalizeOptional(candidate.context) === normalizeOptional(existing.context) &&
      normalizeOptional(candidate.locationWhereMet) ===
        normalizeOptional(existing.locationWhereMet) &&
      candidate.dateMet === existing.dateMet
    );
  });
}

export function classifyFactDuplicates(
  candidateFacts: FactCandidate[],
  existingFacts: ExistingFact[],
): NestedDuplicateResult<FactCandidate>[] {
  return classifyNestedItems(
    candidateFacts,
    existingFacts,
    (candidate, existing) =>
      normalizeOptional(candidate.category) === normalizeOptional(existing.category) &&
      normalizeOptional(candidate.value) === normalizeOptional(existing.value),
  );
}

export function classifyInteractionDuplicates(
  candidateInteractions: InteractionCandidate[],
  existingInteractions: ExistingInteraction[],
): NestedDuplicateResult<InteractionCandidate>[] {
  return classifyNestedItems(
    candidateInteractions,
    existingInteractions,
    (candidate, existing) =>
      normalizeOptional(candidate.summary) === normalizeOptional(existing.summary) &&
      candidate.interactionDate === existing.interactionDate,
  );
}

function normalizeOptional(value: string | null): string | null {
  return value === null ? null : normalizeName(value);
}
