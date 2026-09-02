import { NextResponse } from "next/server";
import { saveSpendToDb } from "@/lib/db";

export type AutoParsedSpend = {
  amount: number;
  payee: string;
  paidBy: "upi" | "cash" | "hdfc" | "axis" | "yes-bank";
  categoryId: string;
  date: string;
  note: string;
  rawMessage: string;
};

/**
 * Parses Indian Bank SMS / Email text for automated spend logging.
 * Handles SMS from HDFC, Axis, ICICI, SBI, Paytm, PhonePe, GPay, etc.
 */
function parseBankSms(text: string): AutoParsedSpend | null {
  if (!text || typeof text !== "string") return null;

  const lower = text.toLowerCase();

  // 1. Extract Amount (e.g. "Rs 250.00", "INR 1,500", "debited by 450")
  const amountMatch = text.match(/(?:rs\.?|inr|debited by|spent|vpa)\s*[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
                      text.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:debited|spent)/i);

  if (!amountMatch) return null;
  const rawAmountStr = amountMatch[1].replace(/,/g, "");
  const amount = Math.round(Number(rawAmountStr));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // 2. Extract Payee / Vendor (e.g. "to ZOMATO", "vpa zomato@upi", "at SWIGGY")
  let payee = "Bank Transaction";
  const payeeMatch = text.match(/(?:to|at|vpa|info)\s+([A-Za-z0-9\s._-]+?)(?:\s+via|\s+on|\s+ref|\s+avail|\.|\$|$)/i);
  if (payeeMatch && payeeMatch[1].trim()) {
    payee = payeeMatch[1].trim();
  }

  // 3. Determine Payment Method
  let paidBy: "upi" | "cash" | "hdfc" | "axis" | "yes-bank" = "upi";
  if (lower.includes("hdfc")) {
    paidBy = "hdfc";
  } else if (lower.includes("axis")) {
    paidBy = "axis";
  } else if (lower.includes("yes") || lower.includes("uni")) {
    paidBy = "yes-bank";
  } else if (lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("paytm")) {
    paidBy = "upi";
  }

  // 4. Auto Categorization based on Payee Keywords
  let categoryId = "misc";
  const payeeLower = payee.toLowerCase();

  if (
    payeeLower.includes("zomato") ||
    payeeLower.includes("swiggy") ||
    payeeLower.includes("blinkit") ||
    payeeLower.includes("zepto") ||
    payeeLower.includes("mart") ||
    payeeLower.includes("supermarket") ||
    payeeLower.includes("grocery") ||
    payeeLower.includes("dmart")
  ) {
    categoryId = "groceries";
  } else if (
    payeeLower.includes("fuel") ||
    payeeLower.includes("petrol") ||
    payeeLower.includes("hpcl") ||
    payeeLower.includes("bpcl") ||
    payeeLower.includes("iocl") ||
    payeeLower.includes("indian oil") ||
    payeeLower.includes("shell") ||
    payeeLower.includes("garage") ||
    payeeLower.includes("auto")
  ) {
    categoryId = "bike";
  } else if (payeeLower.includes("gym") || payeeLower.includes("fitness") || payeeLower.includes("cult")) {
    categoryId = "gym";
  } else if (payeeLower.includes("rent")) {
    categoryId = "rent";
  } else if (payeeLower.includes("bescom") || payeeLower.includes("electricity") || payeeLower.includes("power")) {
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
          error: "Could not parse bank debit transaction from SMS text",
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
      note: parsed.note,
    };

    // Auto-save to cloud PostgreSQL database if configured
    await saveSpendToDb(newEntry);

    return NextResponse.json({
      success: true,
      message: `Successfully parsed transaction of ₹${parsed.amount} to ${parsed.payee}`,
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
    description: "SafeSpend Webhook for iPhone Shortcuts & SMS Bank Transaction Auto-Logging",
    samplePayload: {
      message: "Rs 250.00 debited from A/C ...8020 on 02-SEP-26 to ZOMATO via UPI",
    },
    iphoneShortcutInstructions: [
      "1. Open Apple Shortcuts on iPhone -> Automation -> + New Automation",
      "2. Choose 'Message' -> Sender: Bank Name -> Message Contains: 'debited'",
      "3. Action: Get Contents of URL -> POST request to your SafeSpend webhook URL",
      "4. Set JSON Body key 'message' to Shortcut input (Message Text)",
    ],
  });
}
