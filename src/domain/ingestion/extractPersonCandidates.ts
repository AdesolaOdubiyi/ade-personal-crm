import { z } from "zod";
import type { ExtractionProvider } from "../../lib/ai/extractionProvider";
import { personCandidateBatchSchema } from "./candidateSchemas";
import type { PersonCandidate } from "./candidateTypes";

const extractionResponseSchema = z.object({
  people: personCandidateBatchSchema,
});

export class CandidateValidationError extends Error {
  readonly issues: z.core.$ZodIssue[];

  constructor(message: string, issues: z.core.$ZodIssue[]) {
    super(message);
    this.name = "CandidateValidationError";
    this.issues = issues;
  }
}

export async function extractPersonCandidates(
  provider: ExtractionProvider,
  text: string,
): Promise<PersonCandidate[]> {
  const rawOutput = await provider.extractCandidates(text);
  const result = extractionResponseSchema.safeParse(rawOutput);

  if (!result.success) {
    throw new CandidateValidationError(
      "Extraction output failed candidate validation.",
      result.error.issues,
    );
  }

  return result.data.people;
}
