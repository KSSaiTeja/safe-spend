import { NextResponse } from "next/server";
import { fetchSpendsFromDb } from "@/lib/db";
import { initialSeptemberSpends, sortSpendsNewestFirst } from "@/lib/finance";

export async function GET() {
  try {
    const dbSpends = await fetchSpendsFromDb();
    if (dbSpends && dbSpends.length > 0) {
      return NextResponse.json({ spends: sortSpendsNewestFirst(dbSpends) });
    }
  } catch (error) {
    console.error("GET /api/spends error:", error);
  }
  return NextResponse.json({ spends: sortSpendsNewestFirst(initialSeptemberSpends) });
}
