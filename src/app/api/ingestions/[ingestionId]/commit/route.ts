import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppDb } from "@/db/appDb";
import { personCandidateSchema, personScalarsObjectSchema } from "@/domain/ingestion/candidateSchemas";
import { commitIngestionBatch } from "@/domain/ingestion/commitIngestionBatch";

const commitDecisionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE"),
    candidateId: z.string().optional(),
    candidate: personCandidateSchema,
  }),
  z.object({
    action: z.literal("UPDATE"),
    candidateId: z.string().optional(),
    personId: z.string().min(1),
    candidate: personCandidateSchema,
    resolvedScalars: personScalarsObjectSchema.partial().optional(),
  }),
  z.object({ action: z.literal("SKIP"), candidateId: z.string().optional() }),
]);

const commitRequestSchema = z.object({
  decisions: z.array(commitDecisionSchema),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/ingestions/[ingestionId]/commit">,
) {
  const { ingestionId } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = commitRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid ingestion commit request.", issues: parsedRequest.error.issues },
      { status: 400 },
    );
  }

  const db = getAppDb();
  const results = await commitIngestionBatch(db, parsedRequest.data.decisions);

  return NextResponse.json({ ingestionId, results });
}
