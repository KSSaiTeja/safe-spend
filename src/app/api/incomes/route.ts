import { NextResponse } from "next/server";
import { deleteIncomeFromDb, fetchIncomesFromDb, saveIncomeToDb } from "@/lib/db";
import { octoberSeedData } from "@/lib/finance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || "2026-09";

    const dbIncomes = await fetchIncomesFromDb(month);
    if (dbIncomes && dbIncomes.length > 0) {
      return NextResponse.json({ incomes: dbIncomes });
    }

    if (month === "2026-09") {
      for (const inc of octoberSeedData.income) {
        await saveIncomeToDb(inc, month);
      }
      const seeded = await fetchIncomesFromDb(month);
      return NextResponse.json({ incomes: seeded.length > 0 ? seeded : octoberSeedData.income });
    }
    return NextResponse.json({ incomes: [] });
  } catch (error) {
    console.error("GET /api/incomes error:", error);
    return NextResponse.json({ incomes: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { income, month } = body;
    if (!income || !income.id || !month) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const success = await saveIncomeToDb(income, month);
    return NextResponse.json({ success, income });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }
    const success = await deleteIncomeFromDb(id);
    return NextResponse.json({ success, id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
