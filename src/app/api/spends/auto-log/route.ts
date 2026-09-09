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
  isCredit?: boolean;
};

/**
 * Parses Indian Bank SMS / Notification text for automated spend AND credit logging.
 * Robustly parses Axis Bank, HDFC, YES Bank, Uni, SBI, ICICI, PhonePe, Paytm, GPay, etc.
 */
export function parseBankSms(text: string): AutoParsedSpend | null {
  if (!text || typeof text !== "string") return null;

  const lower = text.toLowerCase();

  // Determine if transaction is a Credit or a Debit
  const isCredit =
    lower.includes("credited") ||
    lower.includes("received") ||
    lower.includes("refund") ||
    lower.includes("cashback") ||
    lower.includes("added") ||
    lower.includes("deposited");

  const isDebit =
    lower.includes("debited") ||
    lower.includes("spent") ||
    lower.includes("paid") ||
    lower.includes("sent") ||
    lower.includes("used") ||
    lower.includes("vpa") ||
    lower.includes("txn") ||
    lower.includes("transfer") ||
    lower.includes("info");

  if (!isCredit && !isDebit) return null;

  // 1. Extract Amount (e.g. "Spent INR 1017", "Rs 250.00", "INR 1,500", "debited by 450")
  const amountMatch =
    text.match(/(?:spent|debited by|credited with|credited|paid|vpa|amt|amount|inr|rs\.?)\s*[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
    text.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:debited|credited|spent|paid|received)/i);

  if (!amountMatch) return null;
  const rawAmountStr = amountMatch[1].replace(/,/g, "");
  const amount = Math.round(Number(rawAmountStr));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // 2. Extract Payee / Vendor (handles inline "at/to/from/vpa" AND multiline Axis/HDFC formats)
  let payee = isCredit ? "Credit / Refund Received" : "Bank Transaction";
  const payeeMatch =
    text.match(/(?:to|at|from|vpa|info|vendor|trf to)\s+([A-Za-z][A-Za-z0-9\s._-]{2,})/i);

  if (payeeMatch && payeeMatch[1].trim() && !payeeMatch[1].toLowerCase().includes("bank transaction") && !/^\d+$/.test(payeeMatch[1].trim())) {
    payee = payeeMatch[1].trim();
  } else {
    // Multiline fallback (e.g. Axis Bank SMS format where payee is on its own line like "FLIPKART PA")
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (
        !lineLower.includes("spent") &&
        !lineLower.includes("debited") &&
        !lineLower.includes("credited") &&
        !lineLower.includes("bank") &&
        !lineLower.includes("card no") &&
        !lineLower.includes("avl limit") &&
        !lineLower.includes("limit:") &&
        !lineLower.includes("not you") &&
        !lineLower.includes("sms block") &&
        !lineLower.includes("block") &&
        !lineLower.includes("ist") &&
        !/\d{4,}/.test(line) &&
        !/^[0-9:\-\s\/]+$/.test(line) &&
        line.length >= 3
      ) {
        payee = line;
        break;
      }
    }
  }

  // 3. Determine Payment Method & Precise Card ID using last-4 digits or bank keywords
  let paidBy: "upi" | "cash" | "hdfc" | "axis" | "yes-bank" = "upi";
  let cardId: string | undefined = undefined;

  // Check card last 4 digits matching
  if (lower.includes("9691")) {
    paidBy = "axis";
    cardId = "axis-flipkart";
  } else if (lower.includes("7380")) {
    paidBy = "axis";
    cardId = "axis-indianoil";
  } else if (lower.includes("6415")) {
    paidBy = "axis";
    cardId = "axis-myzone";
  } else if (lower.includes("8020")) {
    paidBy = "hdfc";
    cardId = "hdfc-phonepe";
  } else if (lower.includes("7192")) {
    paidBy = "hdfc";
    cardId = "hdfc-tataneu";
  } else if (lower.includes("6666")) {
    paidBy = "hdfc";
    cardId = "hdfc-rupay";
  } else if (lower.includes("0976")) {
    paidBy = "yes-bank";
    cardId = "yes-uni-gold";
  } else if (lower.includes("5456")) {
    paidBy = "yes-bank";
    cardId = "yes-uni-rupay";
  } else if (lower.includes("hdfc")) {
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
    searchSpace.includes("flipkart") ||
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
    note: isCredit ? `[Credit Received] ${payee}` : `Auto-logged: ${payee}`,
    rawMessage: text,
    isCredit,
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
      isReimbursed: parsed.isCredit ? true : undefined,
    };

    // Save to PostgreSQL database
    await saveSpendToDb(newEntry);

    return NextResponse.json({
      success: true,
      message: `Successfully parsed and logged ${parsed.isCredit ? "credit" : "debit"} transaction of ₹${parsed.amount} ${parsed.isCredit ? "from" : "to"} ${parsed.payee}`,
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
    description: "SafeSpend Live Webhook for iPhone Shortcuts & Bank Transaction Auto-Logging (Debits & Credits)",
    samplePayload: {
      message: "Spent INR 1017\nAxis Bank Card no. XX9691\n09-09-26 08:33:40 IST\nFLIPKART PA\nAvl Limit: INR 417.24",
    },
  });
}
