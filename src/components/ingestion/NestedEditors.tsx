import { CONTACT_TYPES } from "@/domain/ingestion/candidateTypes";
import type {
  ConnectionCandidate,
  ContactCandidate,
  FactCandidate,
  InteractionCandidate,
  PersonOrganizationCandidate,
} from "@/domain/ingestion/candidateTypes";
import { RepeatingSection } from "./RepeatingSection";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-foreground-subtle">{label}</span>
      {children}
    </label>
  );
}

export function ContactsEditor({
  contacts,
  onChange,
}: {
  contacts: ContactCandidate[];
  onChange: (contacts: ContactCandidate[]) => void;
}) {
  return (
    <RepeatingSection
      title="Contacts"
      addLabel="Add contact"
      items={contacts}
      onAdd={() =>
        onChange([...contacts, { type: "email", value: "", normalizedValue: null, isPrimary: null }])
      }
      onRemove={(index) => onChange(contacts.filter((_, i) => i !== index))}
      renderRow={(contact, index) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Type">
            <select
              value={contact.type}
              onChange={(event) =>
                onChange(
                  contacts.map((c, i) =>
                    i === index ? { ...c, type: event.target.value as ContactCandidate["type"] } : c,
                  ),
                )
              }
              className={inputClass}
            >
              {CONTACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Value">
            <input
              type="text"
              value={contact.value}
              onChange={(event) =>
                onChange(contacts.map((c, i) => (i === index ? { ...c, value: event.target.value } : c)))
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}
    />
  );
}

export function OrganizationsEditor({
  organizations,
  onChange,
}: {
  organizations: PersonOrganizationCandidate[];
  onChange: (organizations: PersonOrganizationCandidate[]) => void;
}) {
  return (
    <RepeatingSection
      title="Organizations"
      addLabel="Add organization"
      items={organizations}
      onAdd={() =>
        onChange([
          ...organizations,
          {
            organizationName: "",
            organizationType: null,
            relationship: null,
            title: null,
            isCurrent: null,
            knownYear: null,
          },
        ])
      }
      onRemove={(index) => onChange(organizations.filter((_, i) => i !== index))}
      renderRow={(organization, index) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Organization">
            <input
              type="text"
              value={organization.organizationName}
              onChange={(event) =>
                onChange(
                  organizations.map((o, i) =>
                    i === index ? { ...o, organizationName: event.target.value } : o,
                  ),
                )
              }
              className={inputClass}
            />
          </Field>
          <Field label="Title">
            <input
              type="text"
              value={organization.title ?? ""}
              onChange={(event) =>
                onChange(
                  organizations.map((o, i) =>
                    i === index ? { ...o, title: event.target.value || null } : o,
                  ),
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}
    />
  );
}

export function ConnectionsEditor({
  connections,
  onChange,
}: {
  connections: ConnectionCandidate[];
  onChange: (connections: ConnectionCandidate[]) => void;
}) {
  return (
    <RepeatingSection
      title="Connections"
      addLabel="Add connection"
      items={connections}
      onAdd={() =>
        onChange([
          ...connections,
          { context: "", locationWhereMet: null, introducedBy: null, details: null, dateMet: null },
        ])
      }
      onRemove={(index) => onChange(connections.filter((_, i) => i !== index))}
      renderRow={(connection, index) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Context">
            <input
              type="text"
              value={connection.context}
              onChange={(event) =>
                onChange(
                  connections.map((c, i) => (i === index ? { ...c, context: event.target.value } : c)),
                )
              }
              className={inputClass}
            />
          </Field>
          <Field label="Location met">
            <input
              type="text"
              value={connection.locationWhereMet ?? ""}
              onChange={(event) =>
                onChange(
                  connections.map((c, i) =>
                    i === index ? { ...c, locationWhereMet: event.target.value || null } : c,
                  ),
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}
    />
  );
}

export function FactsEditor({
  facts,
  onChange,
}: {
  facts: FactCandidate[];
  onChange: (facts: FactCandidate[]) => void;
}) {
  return (
    <RepeatingSection
      title="Facts"
      addLabel="Add fact"
      items={facts}
      onAdd={() => onChange([...facts, { category: "", value: "", details: null }])}
      onRemove={(index) => onChange(facts.filter((_, i) => i !== index))}
      renderRow={(fact, index) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Category">
            <input
              type="text"
              value={fact.category}
              onChange={(event) =>
                onChange(facts.map((f, i) => (i === index ? { ...f, category: event.target.value } : f)))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Value">
            <input
              type="text"
              value={fact.value}
              onChange={(event) =>
                onChange(facts.map((f, i) => (i === index ? { ...f, value: event.target.value } : f)))
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}
    />
  );
}

export function InteractionsEditor({
  interactions,
  onChange,
}: {
  interactions: InteractionCandidate[];
  onChange: (interactions: InteractionCandidate[]) => void;
}) {
  return (
    <RepeatingSection
      title="Interactions"
      addLabel="Add interaction"
      items={interactions}
      onAdd={() =>
        onChange([
          ...interactions,
          { interactionDate: null, type: null, summary: "", followUp: null },
        ])
      }
      onRemove={(index) => onChange(interactions.filter((_, i) => i !== index))}
      renderRow={(interaction, index) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Summary">
            <input
              type="text"
              value={interaction.summary}
              onChange={(event) =>
                onChange(
                  interactions.map((it, i) =>
                    i === index ? { ...it, summary: event.target.value } : it,
                  ),
                )
              }
              className={inputClass}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={interaction.interactionDate ?? ""}
              onChange={(event) =>
                onChange(
                  interactions.map((it, i) =>
                    i === index ? { ...it, interactionDate: event.target.value || null } : it,
                  ),
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}
    />
  );
}
