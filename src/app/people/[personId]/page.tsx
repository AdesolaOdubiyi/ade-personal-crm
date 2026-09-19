import { notFound } from "next/navigation";
import { getAppDb } from "@/db/appDb";
import { getExistingPersonRecord } from "@/db/queries/existingPeople";
import {
  CONTACT_TYPE_LABELS,
  getContactHref,
  getDisplayName,
  getLocation,
} from "@/lib/presentation/personDisplay";

export default async function PersonDetailPage(
  props: PageProps<"/people/[personId]">,
) {
  const { personId } = await props.params;
  const db = getAppDb();
  const person = await getExistingPersonRecord(db, personId);

  if (!person) {
    notFound();
  }

  const location = getLocation(person);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{getDisplayName(person)}</h1>
        {person.headline && <p className="mt-1 text-foreground-muted">{person.headline}</p>}
        {location && <p className="mt-1 text-sm text-foreground-subtle">{location}</p>}
      </div>

      <div className="flex flex-col gap-8">
        {person.organizations.length > 0 && (
          <Section title="Organizations">
            <ul className="flex flex-col gap-2">
              {person.organizations.map((organization, index) => (
                <li key={index} className="text-sm">
                  <span className="text-foreground">{organization.organizationName}</span>
                  {organization.title && (
                    <span className="text-foreground-muted"> — {organization.title}</span>
                  )}
                  {organization.isCurrent === false && (
                    <span className="ml-2 text-xs text-foreground-subtle">Past</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {person.contacts.length > 0 && (
          <Section title="Contact">
            <ul className="flex flex-col gap-2">
              {person.contacts.map((contact, index) => {
                const href = getContactHref(contact);
                return (
                  <li key={index} className="flex items-baseline gap-2 text-sm">
                    <span className="w-20 shrink-0 text-foreground-subtle">
                      {CONTACT_TYPE_LABELS[contact.type]}
                    </span>
                    {href ? (
                      <a href={href} className="text-accent hover:underline">
                        {contact.value}
                      </a>
                    ) : (
                      <span className="text-foreground">{contact.value}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {person.connections.length > 0 && (
          <Section title="How you know them">
            <ul className="flex flex-col gap-3">
              {person.connections.map((connection, index) => (
                <li key={index} className="text-sm">
                  <p className="text-foreground">{connection.context}</p>
                  {connection.locationWhereMet && (
                    <p className="text-foreground-subtle">{connection.locationWhereMet}</p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {person.facts.length > 0 && (
          <Section title="Facts">
            <ul className="flex flex-col gap-1.5">
              {person.facts.map((fact, index) => (
                <li key={index} className="text-sm">
                  <span className="text-foreground-subtle">{fact.category}</span>{" "}
                  <span className="text-foreground">{fact.value}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {person.interactions.length > 0 && (
          <Section title="Interactions">
            <ul className="flex flex-col gap-3">
              {person.interactions.map((interaction, index) => (
                <li key={index} className="text-sm">
                  <p className="text-foreground">{interaction.summary}</p>
                  {interaction.interactionDate && (
                    <p className="text-foreground-subtle">{interaction.interactionDate}</p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-foreground-muted">{title}</h2>
      {children}
    </section>
  );
}
