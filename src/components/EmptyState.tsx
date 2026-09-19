import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-6 py-10">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-foreground-muted">{description}</p>}
      {action}
    </div>
  );
}
