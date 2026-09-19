import Link from "next/link";
import { getAppDb } from "@/db/appDb";
import { listExistingPersonRecords } from "@/db/queries/existingPeople";
import { searchPeople, sortPeopleByName } from "@/domain/people/searchPeople";
import { EmptyState } from "@/components/EmptyState";
import { PeopleSearchForm } from "@/components/people/PeopleSearchForm";
import { PersonRow } from "@/components/people/PersonRow";

export default async function PeoplePage(props: PageProps<"/people">) {
  const searchParams = await props.searchParams;
  const query = firstValue(searchParams.q) ?? "";

  const db = getAppDb();
  const allPeople = await listExistingPersonRecords(db);
  const people = sortPeopleByName(searchPeople(allPeople, query));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold text-foreground">People</h1>
      <PeopleSearchForm defaultValue={query} />
      {allPeople.length === 0 ? (
        <EmptyState
          title="No people yet"
          description="Paste notes about someone to add your first person."
          action={
            <Link
              href="/add"
              className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              Add people
            </Link>
          }
        />
      ) : people.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`Nothing matches "${query}".`}
        />
      ) : (
        <ul className="rounded-md border border-border">
          {people.map((person) => (
            <PersonRow key={person.personId} person={person} />
          ))}
        </ul>
      )}
    </div>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
