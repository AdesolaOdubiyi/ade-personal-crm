import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { MatchStatus } from "@/domain/matching/matchCandidate";

const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  NEW: {
    label: "New person",
    icon: Circle,
    className: "text-foreground-muted",
  },
  MATCH: {
    label: "Matches existing person",
    icon: CheckCircle2,
    className: "text-foreground",
  },
  POSSIBLE_MATCH: {
    label: "Possible match",
    icon: AlertCircle,
    className: "rounded-full bg-attention-bg px-2 py-0.5 text-attention",
  },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
