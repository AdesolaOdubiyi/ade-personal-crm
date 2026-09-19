/** @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IngestionFlow } from "./IngestionFlow";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sparseCandidatePreview(overrides: Record<string, unknown> = {}) {
  return {
    candidateId: "candidate-1",
    candidate: {
      person: { firstName: "Maya", lastName: null, currentCity: null, currentCountry: null, headline: null },
      contacts: [],
      organizations: [],
      connections: [],
      facts: [],
      interactions: [],
    },
    matchStatus: "NEW",
    matches: [],
    ...overrides,
  };
}

describe("IngestionFlow", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "ingestion-id" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the initial paste state with the extract action disabled for empty input", () => {
    render(<IngestionFlow />);

    expect(screen.getByLabelText("Paste notes about people")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extract people" })).toBeDisabled();
  });

  it("enables extraction once text is entered and submits it to the preview endpoint", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ candidates: [sparseCandidatePreview()] }));
    render(<IngestionFlow />);

    await user.type(screen.getByLabelText("Paste notes about people"), "Met Maya at ColorStack.");
    const button = screen.getByRole("button", { name: "Extract people" });
    expect(button).toBeEnabled();
    await user.click(button);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/ingestions/preview",
      expect.objectContaining({ method: "POST" }),
    ));
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      input: { type: "text", text: "Met Maya at ColorStack." },
    });
  });

  it("shows a restrained loading state during extraction and preserves the input", async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((resolve) => (resolveFetch = resolve)));
    render(<IngestionFlow />);

    await user.type(screen.getByLabelText("Paste notes about people"), "Met Maya.");
    await user.click(screen.getByRole("button", { name: "Extract people" }));

    expect(screen.getByRole("button", { name: "Extracting people…" })).toBeDisabled();
    expect(screen.getByLabelText("Paste notes about people")).toHaveValue("Met Maya.");

    resolveFetch(jsonResponse({ candidates: [sparseCandidatePreview()] }));
    await waitFor(() => expect(screen.getByText("1 person found")).toBeInTheDocument());
  });

  it("renders a successful multi-person preview", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [
          sparseCandidatePreview({ candidateId: "c1" }),
          sparseCandidatePreview({
            candidateId: "c2",
            candidate: {
              person: { firstName: "James", lastName: null, currentCity: null, currentCountry: null, headline: null },
              contacts: [],
              organizations: [],
              connections: [],
              facts: [],
              interactions: [],
            },
          }),
        ],
      }),
    );
    render(<IngestionFlow />);
    await extractText(user, "Met Maya and James.");

    expect(screen.getByText("2 people found")).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByText("James")).toBeInTheDocument();
  });

  it("lets a reviewer edit an extracted field", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ candidates: [sparseCandidatePreview()] }));
    render(<IngestionFlow />);
    await extractText(user, "Met Maya.");

    await user.click(screen.getByRole("button", { name: "View details" }));
    const lastNameInput = screen.getByLabelText("Last name");
    await user.type(lastNameInput, "Chen");

    expect(lastNameInput).toHaveValue("Chen");
  });

  it("excludes a skipped candidate from the save count and the commit payload", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ candidates: [sparseCandidatePreview()] }));
    render(<IngestionFlow />);
    await extractText(user, "Met Maya.");

    expect(screen.getByText("1 of 1 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Save Maya" }));
    expect(screen.getByText("0 of 1 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save 0 people" })).toBeDisabled();
  });

  it("shows match status in plain language, not internal jargon", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [
          sparseCandidatePreview({
            matchStatus: "POSSIBLE_MATCH",
            matches: [{ personId: "existing-1", status: "POSSIBLE_MATCH", reasons: ["Shared organization: HubSpot"] }],
          }),
        ],
      }),
    );
    render(<IngestionFlow />);
    await extractText(user, "Met Maya.");

    expect(screen.getByText("Possible match")).toBeInTheDocument();
  });

  it("displays a scalar conflict and lets the reviewer resolve it", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [
          sparseCandidatePreview({
            matchStatus: "MATCH",
            matches: [{ personId: "existing-1", status: "MATCH", reasons: ["Exact normalized email match on maya@example.com"] }],
            topMatchScalarConflicts: [
              { field: "currentCity", status: "CONFLICT", existingValue: "Boston", incomingValue: "Austin" },
            ],
            topMatchNestedDuplicates: {
              contacts: [],
              organizations: [],
              connections: [],
              facts: [],
              interactions: [],
            },
          }),
        ],
      }),
    );
    render(<IngestionFlow />);
    await extractText(user, "Met Maya, now in Austin.");
    await user.click(screen.getByRole("button", { name: "View details" }));
    await user.click(screen.getByRole("button", { name: "Update this person instead" }));

    expect(screen.getByText("Current value")).toBeInTheDocument();
    expect(screen.getByText("Boston")).toBeInTheDocument();
    expect(screen.getByText("Austin")).toBeInTheDocument();

    const austinButton = screen.getByText("Austin").closest("button");
    await user.click(austinButton as HTMLButtonElement);
    expect(austinButton).toHaveAttribute("aria-pressed", "true");
  });

  it("commits selected candidates and reports success", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ candidates: [sparseCandidatePreview()] }))
      .mockResolvedValueOnce(
        jsonResponse({
          ingestionId: "ingestion-id",
          results: [{ candidateId: "candidate-1", status: "CREATED", personId: "new-1" }],
        }),
      );
    render(<IngestionFlow />);
    await extractText(user, "Met Maya.");

    await user.click(screen.getByRole("button", { name: "Save 1 person" }));

    await waitFor(() => expect(screen.getByText("Maya")).toBeInTheDocument());
    expect(screen.getByText("Maya").closest("li")).toHaveTextContent("Maya added");
    expect(screen.getByText("1 saved.")).toBeInTheDocument();
  });

  it("reports partial failure without implying the whole batch failed", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            sparseCandidatePreview({ candidateId: "c1" }),
            sparseCandidatePreview({
              candidateId: "c2",
              candidate: {
                person: { firstName: "Alex", lastName: null, currentCity: null, currentCountry: null, headline: null },
                contacts: [],
                organizations: [],
                connections: [],
                facts: [],
                interactions: [],
              },
            }),
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ingestionId: "ingestion-id",
          results: [
            { candidateId: "c1", status: "CREATED", personId: "new-1" },
            { candidateId: "c2", status: "FAILED", error: "No existing person found with id x" },
          ],
        }),
      );
    render(<IngestionFlow />);
    await extractText(user, "Met Maya and Alex.");
    await user.click(screen.getByRole("button", { name: "Save 2 people" }));

    await waitFor(() => expect(screen.getByText("Maya")).toBeInTheDocument());
    expect(screen.getByText("Maya").closest("li")).toHaveTextContent("Maya added");
    expect(screen.getByText("Alex").closest("li")).toHaveTextContent("Alex couldn't be saved");
    expect(screen.getByText("1 saved, 1 couldn't be saved.")).toBeInTheDocument();
  });

  it("shows a clear error when the extraction request fails, without losing the pasted text", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "GROQ_API_KEY is not configured." }, 502));
    render(<IngestionFlow />);

    await user.type(screen.getByLabelText("Paste notes about people"), "Met Maya.");
    await user.click(screen.getByRole("button", { name: "Extract people" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("GROQ_API_KEY is not configured."),
    );
    expect(screen.getByLabelText("Paste notes about people")).toHaveValue("Met Maya.");
  });

  it("does not extract empty or whitespace-only input", async () => {
    const user = userEvent.setup();
    render(<IngestionFlow />);

    await user.type(screen.getByLabelText("Paste notes about people"), "   ");
    expect(screen.getByRole("button", { name: "Extract people" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

async function extractText(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText("Paste notes about people"), text);
  await user.click(screen.getByRole("button", { name: "Extract people" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Extract people" })).not.toBeInTheDocument());
}
