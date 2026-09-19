import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppDb } from "@/db/appDb";
import { listExistingPersonRecords } from "@/db/queries/existingPeople";
import { ingestionInputSchema } from "@/domain/ingestion/candidateSchemas";
import {
  CandidateValidationError,
  extractPersonCandidates,
} from "@/domain/ingestion/extractPersonCandidates";
import { previewCandidate } from "@/domain/ingestion/previewCandidate";
import type { PersonCandidate } from "@/domain/ingestion/candidateTypes";
import { ExtractionProviderError } from "@/lib/ai/extractionProvider";
import { GroqExtractionProvider } from "@/lib/ai/groqExtractionProvider";

const previewRequestSchema = z.object({ input: ingestionInputSchema });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = previewRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid ingestion preview request.", issues: parsedRequest.error.issues },
      { status: 400 },
    );
  }

  let candidates: PersonCandidate[];

  try {
    candidates = await resolveCandidates(parsedRequest.data.input);
  } catch (error) {
    return toErrorResponse(error);
  }

  const db = getAppDb();
  const existingPeople = await listExistingPersonRecords(db);
  const previews = candidates.map((candidate) => previewCandidate(candidate, existingPeople));

  return NextResponse.json({ candidates: previews });
}

async function resolveCandidates(
  input: z.infer<typeof ingestionInputSchema>,
): Promise<PersonCandidate[]> {
  if (input.type === "structured") {
    return input.people;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ExtractionProviderError(
      "GROQ_API_KEY is not configured; text extraction is unavailable.",
    );
  }

  const provider = new GroqExtractionProvider(apiKey);
  return extractPersonCandidates(provider, input.text);
}

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ExtractionProviderError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  if (error instanceof CandidateValidationError) {
    return NextResponse.json(
      { error: error.message, issues: error.issues },
      { status: 422 },
    );
  }
  return NextResponse.json({ error: "Unexpected ingestion preview failure." }, { status: 500 });
}
