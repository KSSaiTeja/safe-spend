import { NextResponse } from "next/server";
import { deleteSpendFromDb, fetchSpendsFromDb, isDbConfigured, saveSpendToDb } from "@/lib/db";
import { initialSeptemberSpends, sortSpendsNewestFirst, SpendEntry } from "@/lib/finance";

export async function GET() {
  try {
    let dbSpends = await fetchSpendsFromDb();

    // If DB is configured but completely empty, seed with initial September spends
    if (dbSpends.length === 0 && isDbConfigured) {
      for (const spend of initialSeptemberSpends) {
        await saveSpendToDb(spend);
      }
      dbSpends = await fetchSpendsFromDb();
    }

    if (dbSpends && dbSpends.length > 0) {
      return NextResponse.json({ spends: sortSpendsNewestFirst(dbSpends) });
    }
  } catch (error) {
    console.error("GET /api/spends error:", error);
  }
  return NextResponse.json({ spends: sortSpendsNewestFirst(initialSeptemberSpends) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const spend: SpendEntry = body.spend || body;
    if (!spend || !spend.id || spend.amount === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const success = await saveSpendToDb(spend);
    return NextResponse.json({ success, spend });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
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
