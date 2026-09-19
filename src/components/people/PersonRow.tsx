import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ExistingPersonRecord } from "@/domain/people/existingPersonRecord";
import {
  getConnectionContext,
  getCurrentOrganization,
  getDisplayName,
  getLocation,
} from "@/lib/presentation/personDisplay";

export function PersonRow({ person }: { person: ExistingPersonRecord }) {
  const organization = getCurrentOrganization(person);
  const location = getLocation(person);
  const connectionContext = getConnectionContext(person);

  const subline = [
    person.headline,
    organization ? organizationLabel(organization.organizationName, organization.title) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={`/people/${person.personId}`}
        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-muted sm:px-6"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {getDisplayName(person)}
          </p>
          {subline && (
            <p className="truncate text-sm text-foreground-muted">{subline}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-right text-sm text-foreground-muted sm:block">
            {location && <p>{location}</p>}
            {connectionContext && (
              <p className="max-w-56 truncate text-foreground-subtle">{connectionContext}</p>
            )}
          </div>
          <ChevronRight aria-hidden="true" className="size-4 text-foreground-subtle" />
        </div>
      </Link>
    </li>
  );
}

function organizationLabel(name: string, title: string | null): string {
  return title ? `${title} at ${name}` : name;
}
