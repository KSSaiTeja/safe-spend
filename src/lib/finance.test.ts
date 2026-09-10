import { describe, expect, it } from "vitest";

import {
  calculateMonthlyPlan,
  calculateSafeSpendPace,
  generateMonthPreviews,
  getCardUsageStatus,
  octoberSeedData,
} from "./finance";

describe("October Safe Spend logic", () => {
  it("keeps Daddy fully reserved and recommends a Venkat payment with a ₹5k buffer", () => {
    const plan = calculateMonthlyPlan(octoberSeedData);

    expect(plan.totalIncome).toBe(162700);
    expect(plan.personalEmisTotal).toBe(13974);
    expect(plan.venkatPayableEmisTotal).toBe(15750);
    expect(plan.outgoingEmisTotal).toBe(29724);
    expect(plan.ownEmisTotal).toBe(29724);
    expect(plan.nonEmiExpensesTotal).toBe(18000);
    expect(plan.coreObligationsBeforeVenkat).toBe(100311);
    expect(plan.maxVenkatPaymentWithoutBuffer).toBe(62389);
    expect(plan.recommendedVenkatPayment).toBe(50000);
    expect(plan.deferredVenkatBalance).toBe(0);
    expect(plan.finalBufferAfterRecommendedPlan).toBe(12389);
  });

  it("sets variable spending to ₹9k, or ₹300 per day for a 30-day month", () => {
    const pace = calculateSafeSpendPace({
      monthlyVariableBudget: 9000,
      spentSoFar: 950,
      dayOfMonth: 4,
      daysInMonth: 30,
    });

    expect(pace.dailySafeAmount).toBe(300);
    expect(pace.allowedByToday).toBe(1200);
    expect(pace.remainingToday).toBe(250);
    expect(pace.status).toBe("green");
  });

  it("warns when spending has crossed the cumulative daily safe pace", () => {
    const pace = calculateSafeSpendPace({
      monthlyVariableBudget: 9000,
      spentSoFar: 1800,
      dayOfMonth: 4,
      daysInMonth: 30,
    });

    expect(pace.remainingToday).toBe(-600);
    expect(pace.status).toBe("red");
  });

  it("splits EMIs into personal, payable-to-Venkat, and receivable-from-Venkat buckets", () => {
    const plan = calculateMonthlyPlan(octoberSeedData);

    expect(plan.personalEmisTotal).toBe(13974);
    expect(plan.venkatPayableEmisTotal).toBe(15750);
    expect(plan.outgoingEmisTotal).toBe(29724);
    expect(plan.venkatPayableFromBankEmisTotal).toBe(19386);
  });

  it("automatically excludes EMIs after their end month", () => {
    const plan = calculateMonthlyPlan({ ...octoberSeedData, targetMonth: "2026-12" });

    expect(plan.venkatPayableEmisTotal).toBe(14250);
    expect(plan.outgoingEmisTotal).toBe(28224);
  });

  it("generates salary-only month previews until all tracked EMIs become zero", () => {
    const previews = generateMonthPreviews(octoberSeedData);
    const november = previews[0];
    const december = previews.find((preview) => preview.month === "2026-12");
    const zeroMonth = previews.at(-1);

    expect(november.month).toBe("2026-11");
    expect(november.salaryIncome).toBe(60000);
    expect(november.venkatPayableEmis).toBe(15750);
    expect(november.venkatOnYourNameDebit).toBe(19386);
    expect(november.youKeepThisMonth).toBe(9776);
    expect(december?.venkatPayableEmis).toBe(14250);
    expect(zeroMonth?.month).toBe("2028-07");
    expect(zeroMonth?.activeEmiCount).toBe(0);
    expect(zeroMonth?.status).toBe("emi-zero");
  });

  it("freezes cards that are above a conservative utilization threshold", () => {
    expect(getCardUsageStatus({ name: "Axis", limit: 15000, available: 7500 }).status).toBe("freeze");
    expect(getCardUsageStatus({ name: "YES Bank", limit: 27000, available: 25061 }).status).toBe("safe-but-dont-use");
  });
});

describe("Bank SMS Auto-Parsing", () => {
  it("correctly parses HDFC credit card SMS alerts", async () => {
    const { parseBankSms } = await import("../app/api/spends/auto-log/route");
    const parsed = parseBankSms("Rs 370.00 debited from HDFC Bank Card ending 8020 on 08-SEP-26 to CHICKEN SHOP via UPI");
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(370);
    expect(parsed?.paidBy).toBe("hdfc");
    expect(parsed?.cardId).toBe("hdfc-phonepe");
    expect(parsed?.categoryId).toBe("groceries");
  });

  it("correctly parses credit & refund SMS alerts", async () => {
    const { parseBankSms } = await import("../app/api/spends/auto-log/route");
    const parsed = parseBankSms("Rs 1500.00 credited to A/C ...8020 on 08-SEP-26 from Client via UPI");
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(1500);
    expect(parsed?.isCredit).toBe(true);
  });

  it("correctly parses Axis Bank multiline SMS alerts", async () => {
    const { parseBankSms } = await import("../app/api/spends/auto-log/route");
    const axisSms = `Spent INR 1017\nAxis Bank Card no. XX9691\n09-09-26 08:33:40 IST\nFLIPKART PA\nAvl Limit: INR 417.24\nNot you? SMS BLOCK 9691 to 919951860002`;
    const parsed = parseBankSms(axisSms);
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(1017);
    expect(parsed?.paidBy).toBe("axis");
    expect(parsed?.cardId).toBe("axis-flipkart");
    expect(parsed?.payee).toBe("FLIPKART PA");
    expect(parsed?.categoryId).toBe("groceries");
  });
});

describe("Transactions & Seed Data Integrity", () => {
  it("contains 17 initial September spend entries spanning Sep 1 to Sep 8", async () => {
    const { initialSeptemberSpends, sortSpendsNewestFirst } = await import("./finance");
    expect(initialSeptemberSpends.length).toBe(17);
    const sorted = sortSpendsNewestFirst(initialSeptemberSpends);
    expect(sorted[0].date).toBe("2026-09-08");
    expect(sorted[sorted.length - 1].date).toBe("2026-09-01");
  });

  it("handles POST requests to /api/spends to update/create transactions", async () => {
    const { POST } = await import("../app/api/spends/route");
    const testSpend = {
      id: "test-spend-edit-1",
      date: "2026-09-08",
      amount: 450,
      categoryId: "groceries",
      paidBy: "upi" as const,
      note: "Updated groceries amount",
    };
    const req = new Request("http://localhost/api/spends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spend: testSpend }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.spend.id).toBe("test-spend-edit-1");
    expect(data.spend.amount).toBe(450);
  });
});




