import { describe, expect, it } from "vitest";
import type { ExtractionProvider } from "../../lib/ai/extractionProvider";
import { ExtractionProviderError } from "../../lib/ai/extractionProvider";
import {
  CandidateValidationError,
  extractPersonCandidates,
} from "./extractPersonCandidates";

function fakeProvider(response: unknown): ExtractionProvider {
  return {
    extractCandidates: async () => response,
  };
}

function throwingProvider(error: unknown): ExtractionProvider {
  return {
    extractCandidates: async () => {
      throw error;
    },
  };
}

function sparsePersonJson(firstName: string) {
  return {
    person: {
      firstName,
      lastName: null,
      currentCity: null,
      currentCountry: null,
      headline: null,
    },
    contacts: [],
    organizations: [],
    connections: [],
    facts: [],
    interactions: [],
  };
}

describe("extractPersonCandidates", () => {
  it("returns validated candidates for a single-person extraction", async () => {
    const provider = fakeProvider({ people: [sparsePersonJson("Maya")] });

    const candidates = await extractPersonCandidates(provider, "Met Maya.");

    expect(candidates).toHaveLength(1);
    expect(candidates[0].person.firstName).toBe("Maya");
  });

  it("returns validated candidates for a multi-person extraction", async () => {
    const provider = fakeProvider({
      people: [sparsePersonJson("James"), sparsePersonJson("Sarah")],
    });

    const candidates = await extractPersonCandidates(provider, "text");

    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.person.firstName)).toEqual([
      "James",
      "Sarah",
    ]);
  });

  it("throws CandidateValidationError when the provider output fails validation", async () => {
    const provider = fakeProvider({
      people: [
        {
          person: {
            firstName: null,
            lastName: null,
            currentCity: null,
            currentCountry: null,
            headline: null,
          },
          contacts: [],
          organizations: [],
          connections: [],
          facts: [],
          interactions: [],
        },
      ],
    });

    await expect(extractPersonCandidates(provider, "text")).rejects.toThrow(
      CandidateValidationError,
    );
  });

  it("throws CandidateValidationError when the provider output is not the expected shape", async () => {
    const provider = fakeProvider({ unexpected: "shape" });

    await expect(extractPersonCandidates(provider, "text")).rejects.toThrow(
      CandidateValidationError,
    );
  });

  it("propagates provider failures instead of swallowing them", async () => {
    const provider = throwingProvider(
      new ExtractionProviderError("rate limited"),
    );

    await expect(extractPersonCandidates(provider, "text")).rejects.toThrow(
      ExtractionProviderError,
    );
  });
});
