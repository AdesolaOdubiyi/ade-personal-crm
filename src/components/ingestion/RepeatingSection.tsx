import { X } from "lucide-react";
import type { ReactNode } from "react";

export function RepeatingSection<T>({
  title,
  addLabel,
  items,
  onAdd,
  onRemove,
  renderRow,
}: {
  title: string;
  addLabel: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderRow: (item: T, index: number) => ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <button type="button" onClick={onAdd} className="text-sm text-accent hover:underline">
          {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-subtle">None yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="flex-1">{renderRow(item, index)}</div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${title.toLowerCase()} entry ${index + 1}`}
                className="mt-1.5 shrink-0 text-foreground-subtle hover:text-danger"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
