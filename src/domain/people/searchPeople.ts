import type { ExistingPersonRecord } from "./existingPersonRecord";

export function sortPeopleByName(
  people: ExistingPersonRecord[],
): ExistingPersonRecord[] {
  return [...people].sort((a, b) => displayName(a).localeCompare(displayName(b)));
}

function displayName(person: ExistingPersonRecord): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function searchPeople(
  people: ExistingPersonRecord[],
  query: string,
): ExistingPersonRecord[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) {
    return people;
  }

  return people.filter((person) => searchableText(person).includes(trimmedQuery));
}

function searchableText(person: ExistingPersonRecord): string {
  return [
    person.firstName,
    person.lastName,
    person.headline,
    person.currentCity,
    person.currentCountry,
    ...person.organizations.map((organization) => organization.organizationName),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}
