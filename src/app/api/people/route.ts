import { NextResponse } from "next/server";
import { getAppDb } from "@/db/appDb";
import { listExistingPersonRecords } from "@/db/queries/existingPeople";
import { searchPeople, sortPeopleByName } from "@/domain/people/searchPeople";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  const db = getAppDb();
  const people = await listExistingPersonRecords(db);
  const filtered = searchPeople(people, query);

  return NextResponse.json({ people: sortPeopleByName(filtered) });
}
