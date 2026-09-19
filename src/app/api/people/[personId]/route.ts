import { NextResponse } from "next/server";
import { getAppDb } from "@/db/appDb";
import { getExistingPersonRecord } from "@/db/queries/existingPeople";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/people/[personId]">,
) {
  const { personId } = await ctx.params;

  const db = getAppDb();
  const person = await getExistingPersonRecord(db, personId);

  if (!person) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  return NextResponse.json({ person });
}
