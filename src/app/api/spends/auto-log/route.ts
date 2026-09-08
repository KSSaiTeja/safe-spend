import { NextResponse } from "next/server";
import { saveSpendToDb } from "@/lib/db";

export type AutoParsedSpend = {
  amount: number;
  payee: string;
  paidBy: "upi" | "cash" | "hdfc" | "axis" | "yes-bank";
  cardId?: string;
  categoryId: string;
  date: string;
  note: string;
  rawMessage: string;
};

/**
 * Parses Indian Bank SMS / Notification text for automated spend logging.
 * Robustly parses HDFC, Axis, YES Bank, Uni, SBI, ICICI, PhonePe, Paytm, GPay, etc.
 */
export function parseBankSms(text: string): AutoParsedSpend | null {
  if (!text || typeof text !== "string") return null;

  const lower = text.toLowerCase();

  // Ignore non-debit / non-spend messages (e.g. OTP, balance enquiry, promotional)
  const isTransaction =
    lower.includes("debited") ||
    lower.includes("spent") ||
    lower.includes("paid") ||
    lower.includes("sent") ||
    lower.includes("used") ||
    lower.includes("vpa") ||
    lower.includes("txn") ||
    lower.includes("transfer") ||
    lower.includes("info");

  if (!isTransaction) return null;

  // 1. Extract Amount (e.g. "Rs 250.00", "INR 1,500", "debited by 450", "Spent Rs.370")
  const amountMatch =
    text.match(/(?:rs\.?|inr|debited by|spent|paid|vpa|amt|amount)\s*[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
    text.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:debited|spent|paid)/i);

  if (!amountMatch) return null;
  const rawAmountStr = amountMatch[1].replace(/,/g, "");
  const amount = Math.round(Number(rawAmountStr));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // 2. Extract Payee / Vendor
  let payee = "Bank Transaction";
  const payeeMatch =
    text.match(/(?:to|at|vpa|info|vendor|trf to)\s+([A-Za-z0-9\s._-]+?)(?:\s+via|\s+on|\s+ref|\s+avail|\s+card|\.|\$|$)/i);
  if (payeeMatch && payeeMatch[1].trim()) {
    payee = payeeMatch[1].trim();
  }

  // 3. Determine Payment Method & Card ID
  let paidBy: "upi" | "cash" | "hdfc" | "axis" | "yes-bank" = "upi";
  let cardId: string | undefined = undefined;

  if (lower.includes("hdfc")) {
    paidBy = "hdfc";
    cardId = "hdfc-phonepe";
  } else if (lower.includes("axis")) {
    paidBy = "axis";
    cardId = "axis-flipkart";
  } else if (lower.includes("yes") || lower.includes("uni")) {
    paidBy = "yes-bank";
    cardId = "yes-uni-gold";
  } else if (lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("paytm")) {
    paidBy = "upi";
  }

  // 4. Smart Categorization based on Payee & Message Keywords
  let categoryId = "misc";
  const searchSpace = `${payee} ${text}`.toLowerCase();

  if (
    searchSpace.includes("zomato") ||
    searchSpace.includes("swiggy") ||
    searchSpace.includes("blinkit") ||
    searchSpace.includes("zepto") ||
    searchSpace.includes("instamart") ||
    searchSpace.includes("mart") ||
    searchSpace.includes("supermarket") ||
    searchSpace.includes("grocery") ||
    searchSpace.includes("dmart") ||
    searchSpace.includes("milk") ||
    searchSpace.includes("chicken") ||
    searchSpace.includes("egg") ||
    searchSpace.includes("food") ||
    searchSpace.includes("restaurant")
  ) {
    categoryId = "groceries";
  } else if (
    searchSpace.includes("fuel") ||
    searchSpace.includes("petrol") ||
    searchSpace.includes("hpcl") ||
    searchSpace.includes("bpcl") ||
    searchSpace.includes("iocl") ||
    searchSpace.includes("indian oil") ||
    searchSpace.includes("shell") ||
    searchSpace.includes("garage") ||
    searchSpace.includes("wash") ||
    searchSpace.includes("bike") ||
    searchSpace.includes("auto")
  ) {
    categoryId = "bike";
  } else if (searchSpace.includes("gym") || searchSpace.includes("fitness") || searchSpace.includes("cult")) {
    categoryId = "gym";
  } else if (searchSpace.includes("rent")) {
    categoryId = "rent";
  } else if (
    searchSpace.includes("bescom") ||
    searchSpace.includes("electricity") ||
    searchSpace.includes("power") ||
    searchSpace.includes("recharge") ||
    searchSpace.includes("internet") ||
    searchSpace.includes("broadband") ||
    searchSpace.includes("airtel") ||
    searchSpace.includes("jio") ||
    searchSpace.includes("wifi")
  ) {
    categoryId = "electricity";
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  return {
    amount,
    payee,
    paidBy,
    cardId,
    categoryId,
    date: dateStr,
    note: `Auto-logged: ${payee}`,
    rawMessage: text,
  };
}

export async function POST(request: Request) {
  try {
    let rawText = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await request.json();
      rawText = json.message || json.text || json.sms || JSON.stringify(json);
    } else {
      rawText = await request.text();
    }

    const parsed = parseBankSms(rawText);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not parse valid transaction from SMS text",
          receivedText: rawText,
        },
        { status: 400 },
      );
    }

    const newEntry = {
      id: `auto-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: parsed.date,
      amount: parsed.amount,
      categoryId: parsed.categoryId,
      paidBy: parsed.paidBy,
      cardId: parsed.cardId,
      note: parsed.note,
    };

    // Save to PostgreSQL database
    await saveSpendToDb(newEntry);

    return NextResponse.json({
      success: true,
      message: `Successfully parsed and logged transaction of ₹${parsed.amount} to ${parsed.payee}`,
      entry: newEntry,
      parsedData: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/spends/auto-log",
    description: "SafeSpend Live Webhook for iPhone Shortcuts & Bank Transaction Auto-Logging",
    samplePayload: {
      message: "Rs 370.00 debited from A/C ...8020 on 08-SEP-26 to CHICKEN SHOP via UPI",
    },
  });
}
