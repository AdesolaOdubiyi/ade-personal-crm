import { Search } from "lucide-react";

export function PeopleSearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <form method="GET" className="relative mb-6 max-w-sm">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle"
      />
      <label htmlFor="people-search" className="sr-only">
        Search people
      </label>
      <input
        id="people-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by name, organization, or location"
        className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </form>
  );
}
