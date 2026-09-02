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

    expect(plan.totalIncome).toBe(149000);
    expect(plan.personalEmisTotal).toBe(13974);
    expect(plan.venkatPayableEmisTotal).toBe(15750);
    expect(plan.outgoingEmisTotal).toBe(29724);
    expect(plan.ownEmisTotal).toBe(29724);
    expect(plan.nonEmiExpensesTotal).toBe(18000);
    expect(plan.coreObligationsBeforeVenkat).toBe(97724);
    expect(plan.maxVenkatPaymentWithoutBuffer).toBe(51276);
    expect(plan.recommendedVenkatPayment).toBe(46276);
    expect(plan.deferredVenkatBalance).toBe(3724);
    expect(plan.finalBufferAfterRecommendedPlan).toBe(5000);
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
