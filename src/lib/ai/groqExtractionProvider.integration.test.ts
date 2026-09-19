import { describe, expect, it } from "vitest";
import { extractPersonCandidates } from "../../domain/ingestion/extractPersonCandidates";
import { GroqExtractionProvider } from "./groqExtractionProvider";

const REAL_TRIAL_COUNT = 3;
const CANONICAL_FIXTURE =
  "Met Maya at ColorStack in Atlanta. She works at HubSpot in product marketing and studied abroad in Germany.";

const apiKey = process.env.GROQ_API_KEY;

describe.skipIf(!apiKey)(
  "GroqExtractionProvider (real API, requires GROQ_API_KEY)",
  () => {
    it.each(Array.from({ length: REAL_TRIAL_COUNT }, (_, i) => i))(
      "extracts semantically correct candidates for the canonical fixture (trial %i)",
      async () => {
        const provider = new GroqExtractionProvider(apiKey as string);
        const candidates = await extractPersonCandidates(
          provider,
          CANONICAL_FIXTURE,
        );

        const maya = candidates.find((c) => c.person.firstName === "Maya");

        expect(maya).toBeDefined();
        expect(maya?.person.lastName).toBeNull();

        const organizationNames = maya?.organizations.map((org) =>
          org.organizationName.toLowerCase(),
        );
        expect(organizationNames).toContain("hubspot");

        const mentionsAtlanta = maya?.connections.some(
          (connection) =>
            connection.locationWhereMet?.toLowerCase().includes("atlanta") ??
            false,
        );
        expect(mentionsAtlanta).toBe(true);

        const mentionsGermany = maya?.facts.some(
          (fact) =>
            fact.value.toLowerCase().includes("germany") ||
            (fact.details?.toLowerCase().includes("germany") ?? false),
        );
        expect(mentionsGermany).toBe(true);
      },
      30000,
    );
  },
);
