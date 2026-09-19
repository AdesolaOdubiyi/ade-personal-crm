import type {
  ExistingContact,
  ExistingPersonOrganization,
  ExistingPersonRecord,
} from "../../domain/people/existingPersonRecord";

export function getDisplayName(person: ExistingPersonRecord): string {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return name.length > 0 ? name : "Unnamed";
}

export function getCurrentOrganization(
  person: ExistingPersonRecord,
): ExistingPersonOrganization | null {
  if (person.organizations.length === 0) {
    return null;
  }
  return (
    person.organizations.find((organization) => organization.isCurrent === true) ??
    person.organizations[0]
  );
}

export function getPrimaryContact(person: ExistingPersonRecord): ExistingContact | null {
  if (person.contacts.length === 0) {
    return null;
  }
  return person.contacts.find((contact) => contact.isPrimary) ?? person.contacts[0];
}

export function getLocation(person: ExistingPersonRecord): string | null {
  return [person.currentCity, person.currentCountry].filter(Boolean).join(", ") || null;
}

export function getConnectionContext(person: ExistingPersonRecord): string | null {
  return person.connections[0]?.context ?? null;
}

export function getContactHref(contact: ExistingContact): string | null {
  switch (contact.type) {
    case "email":
      return `mailto:${contact.value}`;
    case "phone":
    case "whatsapp":
      return `tel:${contact.value}`;
    case "linkedin":
    case "instagram":
    case "x":
      return contact.value.startsWith("http") ? contact.value : `https://${contact.value}`;
    default:
      return null;
  }
}

export const CONTACT_TYPE_LABELS: Record<ExistingContact["type"], string> = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  other: "Other",
};
