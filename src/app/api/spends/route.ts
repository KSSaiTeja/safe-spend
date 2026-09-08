import { NextResponse } from "next/server";
import { deleteSpendFromDb, fetchSpendsFromDb } from "@/lib/db";
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }
    const success = await deleteSpendFromDb(id);
    return NextResponse.json({ success, id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
