export function PasteForm({
  text,
  onTextChange,
  onSubmit,
  isExtracting,
}: {
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  isExtracting: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="ingestion-text" className="mb-2 block text-sm font-medium text-foreground">
          Paste notes about people
        </label>
        <textarea
          id="ingestion-text"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          disabled={isExtracting}
          rows={12}
          placeholder="Met Maya at ColorStack in Atlanta. She works at HubSpot in product marketing and studied abroad in Germany."
          className="w-full resize-y rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isExtracting || text.trim().length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExtracting ? "Extracting people…" : "Extract people"}
        </button>
      </div>
    </form>
  );
}
