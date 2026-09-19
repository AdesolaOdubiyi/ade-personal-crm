import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppDb } from "@/db/appDb";
import { getExistingPersonRecord } from "@/db/queries/existingPeople";
import { compareCandidateToExisting } from "@/domain/ingestion/compareCandidateToExisting";
import { personCandidateSchema } from "@/domain/ingestion/candidateSchemas";

const compareRequestSchema = z.object({
  candidate: personCandidateSchema,
  personId: z.string().min(1),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = compareRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid comparison request.", issues: parsedRequest.error.issues },
      { status: 400 },
    );
  }

  const db = getAppDb();
  const existing = await getExistingPersonRecord(db, parsedRequest.data.personId);

  if (!existing) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const comparison = compareCandidateToExisting(parsedRequest.data.candidate, existing);
  return NextResponse.json(comparison);
}
