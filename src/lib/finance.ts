export type IncomeSource = {
  id: string;
  name: string;
  amount: number;
  expectedDate: string;
  status: "expected" | "received";
};

export type EmiDirection = "personal" | "pay-to-venkat" | "collect-from-venkat";

export type Emi = {
  id: string;
  name: string;
  amount: number;
  ends: string;
  /** YYYY-MM. When the app month is after this, the EMI is automatically excluded. */
  endMonth?: string;
  direction: EmiDirection;
  note?: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  amount: number;
  kind: "fixed" | "variable";
};

export type CreditCard = {
  name: string;
  limit: number;
  available: number;
};

export type Repayment = {
  id: string;
  name: string;
  amount: number;
  required: boolean;
};

export type SpendEntry = {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  paidBy: "upi" | "cash" | "hdfc" | "axis" | "yes-bank";
  cardId?: string;
  note?: string;
  isReimbursed?: boolean;
  isOneTime?: boolean;
};

export type CustomDebt = {
  id: string;
  name: string;
  lender: string;
  totalAmount: number;
  monthlyEmi?: number;
  month?: string;
  category: "person" | "bank" | "app";
  priority: "high" | "normal";
  note?: string;
};

export type FutureOneTimeExpense = {
  month: string;
  name: string;
  amount: number;
};

export type MonthlyBudgetData = {
  monthLabel: string;
  targetMonth: string;
  bufferTarget: number;
  defaultMonthlySalary: number;
  futureMonthlyLivingBudget: number;
  forecastStartMonth: string;
  income: IncomeSource[];
  personalEmis: Emi[];
  venkatPayableEmis: Emi[];
  venkatReceivableEmis: Emi[];
  futureOneTimeExpenses: FutureOneTimeExpense[];
  expenses: ExpenseCategory[];
  creditCardBill: number;
  lazyPay: number;
  repayments: Repayment[];
  cards: CreditCard[];
};

export type MonthlyPlan = {
  totalIncome: number;
  incomeReceived: number;
  personalEmisTotal: number;
  venkatPayableEmisTotal: number;
  outgoingEmisTotal: number;
  /** Backwards-compatible alias used by the existing budget cards. */
  ownEmisTotal: number;
  /** Reminder only: these EMIs are on Sai's name/details and will likely debit from Sai's bank account.
   *  They are tracked so Sai can check the statement and ask Venkat for reimbursement.
   *  They do NOT increase Sai's spendable cash for the month. */
  venkatPayableFromBankEmisTotal: number;
  nonEmiExpensesTotal: number;
  variableBudget: number;
  creditCardBill: number;
  mandatoryRepaymentsTotal: number;
  coreObligationsBeforeVenkat: number;
  maxVenkatPaymentWithoutBuffer: number;
  recommendedVenkatPayment: number;
  deferredVenkatBalance: number;
  finalBufferAfterRecommendedPlan: number;
  monthEndBalanceIfFullVenkat: number;
};

export type MonthPreviewStatus = "tight" | "stable" | "free" | "emi-zero";

export type MonthPreview = {
  month: string;
  label: string;
  salaryIncome: number;
  emisGoingOut: number;
  personalEmis: number;
  personalEmisList: Emi[];
  venkatPayableEmis: number;
  venkatPayableList: Emi[];
  venkatOnYourNameDebit: number;
  venkatOnYourNameList: Emi[];
  livingBudget: number;
  oneTimeExpenses: FutureOneTimeExpense[];
  oneTimeTotal: number;
  bufferTarget: number;
  totalCashOut: number;
  youKeepThisMonth: number;
  activeEmiCount: number;
  status: MonthPreviewStatus;
  milestone: string;
  endedThisMonth: Emi[];
};

export type PaceStatus = "green" | "yellow" | "red";

export type SafeSpendPace = {
  dailySafeAmount: number;
  allowedByToday: number;
  remainingToday: number;
  monthRemaining: number;
  projectedMonthEnd: number;
  status: PaceStatus;
  message: string;
};

export const octoberSeedData: MonthlyBudgetData = {
  monthLabel: "October readiness · Sep 1–30",
  targetMonth: "2026-09",
  bufferTarget: 5000,
  defaultMonthlySalary: 60000,
  futureMonthlyLivingBudget: 15500,
  forecastStartMonth: "2026-11",
  income: [
    {
      id: "salary",
      name: "Zenerative Minds salary",
      amount: 60000,
      expectedDate: "Sep 2 EOD",
      status: "expected",
    },
    {
      id: "sri-comforts",
      name: "Sri Comforts",
      amount: 36000,
      expectedDate: "September",
      status: "expected",
    },
    {
      id: "vridanta",
      name: "Vridanta",
      amount: 33000,
      expectedDate: "Mid September",
      status: "expected",
    },
    {
      id: "guiderhub",
      name: "Guiderhub",
      amount: 20000,
      expectedDate: "Mid September",
      status: "expected",
    },
  ],
  personalEmis: [
    { id: "moneyview", name: "MoneyView", amount: 11308, ends: "Sep 2027", endMonth: "2027-09", direction: "personal" },
    { id: "flipkart", name: "Flipkart", amount: 2666, ends: "Feb 2027", endMonth: "2027-02", direction: "personal" },
  ],
  venkatPayableEmis: [
    { id: "navi-pay-to-venkat", name: "Navi", amount: 2850, ends: "Apr 2028", endMonth: "2028-04", direction: "pay-to-venkat" },
    { id: "ac-pay-to-venkat", name: "AC EMI", amount: 1400, ends: "Mar 2027", endMonth: "2027-03", direction: "pay-to-venkat" },
    { id: "goa-pay-to-venkat", name: "Goa trip EMI", amount: 1500, ends: "Nov 2026", endMonth: "2026-11", direction: "pay-to-venkat" },
    { id: "sriram-pay-to-venkat", name: "Sriram", amount: 5000, ends: "Mar 2028", endMonth: "2028-03", direction: "pay-to-venkat" },
    { id: "chitfund-pay-to-venkat", name: "Chit fund", amount: 5000, ends: "Jul 2027", endMonth: "2027-07", direction: "pay-to-venkat", note: "Ends in 11 months (July 2027)" },
  ],
  venkatReceivableEmis: [
    { id: "kreditbee", name: "KreditBee", amount: 3860, ends: "Jan 2027", endMonth: "2027-01", direction: "collect-from-venkat" },
    { id: "venkat-navi", name: "Navi", amount: 1100, ends: "Sep 2027", endMonth: "2027-09", direction: "collect-from-venkat" },
    {
      id: "dmi",
      name: "DMI",
      amount: 5280,
      ends: "Jun 2028",
      endMonth: "2028-06",
      direction: "collect-from-venkat",
      note: "24-month tenure from July 5, 2026",
    },
    {
      id: "bike-loan",
      name: "Bike",
      amount: 5786,
      ends: "Jun 2028 assumed",
      endMonth: "2028-06",
      direction: "collect-from-venkat",
      note: "Assumed 36-month loan from July 2025; confirm exact paid-count later",
    },
    { id: "kotak", name: "Kotak", amount: 3360, ends: "May 2027", endMonth: "2027-05", direction: "collect-from-venkat" },
  ],
  futureOneTimeExpenses: [
    { month: "2026-10", name: "Gym balance from September", amount: 2500 },
  ],
  expenses: [
    { id: "rent", name: "Room rent", amount: 6000, kind: "fixed" },
    { id: "bike", name: "Bike expenses", amount: 3000, kind: "variable" },
    { id: "gym", name: "Gym partial", amount: 2500, kind: "fixed" },
    { id: "groceries", name: "Groceries", amount: 3000, kind: "variable" },
    { id: "electricity", name: "Electricity", amount: 500, kind: "fixed" },
    { id: "misc", name: "Misc", amount: 3000, kind: "variable" },
  ],
  creditCardBill: 22587,
  lazyPay: 0,
  repayments: [
    { id: "daddy", name: "Daddy", amount: 30000, required: true },
    { id: "venkat", name: "Venkat", amount: 50000, required: false },
  ],
  cards: [
    { name: "HDFC Bank (3 Cards)", limit: 40000, available: 29399 },
    { name: "Axis Bank (3 Cards)", limit: 15000, available: 9965 },
    { name: "YES Bank Uni (2 Cards)", limit: 27000, available: 25360 },
  ],
};

export const initialSeptemberSpends: SpendEntry[] = [
  { id: "spend-sep8-chelli-jewellery", date: "2026-09-08", amount: 650, categoryId: "misc", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Chelli jewellery" },
  { id: "spend-sep8-chicken", date: "2026-09-08", amount: 370, categoryId: "groceries", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Chicken" },
  { id: "spend-sep8-eggs", date: "2026-09-08", amount: 240, categoryId: "groceries", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "36 eggs" },
  { id: "spend-sep8-internet", date: "2026-09-08", amount: 1000, categoryId: "electricity", paidBy: "upi", note: "Internet bill" },
  { id: "spend-sep8-bikewash", date: "2026-09-08", amount: 100, categoryId: "misc", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Bike wash" },
  { id: "spend-sep8-recharge", date: "2026-09-08", amount: 180, categoryId: "misc", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Chelli recharge" },
  { id: "spend-sep5-movie", date: "2026-09-05", amount: 300, categoryId: "misc", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Movie ticket" },
  { id: "spend-sep5-envato", date: "2026-09-05", amount: 300, categoryId: "misc", paidBy: "upi", note: "Envato transfer" },
  { id: "spend-sep5-shampoo", date: "2026-09-05", amount: 312, categoryId: "groceries", paidBy: "axis", cardId: "axis-flipkart", note: "Flipkart Minutes - Sister shampoo" },
  { id: "spend-sep4-powerbill", date: "2026-09-04", amount: 1349, categoryId: "electricity", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Electricity power bill" },
  { id: "spend-sep4-milk", date: "2026-09-04", amount: 33, categoryId: "groceries", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Milk packet" },
  { id: "spend-sep4-namecheap", date: "2026-09-04", amount: 1450, categoryId: "misc", paidBy: "yes-bank", cardId: "yes-uni-gold", note: "Namecheap domain (Reimbursed by client via PhonePe)", isReimbursed: true },
  { id: "spend-sep3-instamart", date: "2026-09-03", amount: 343, categoryId: "groceries", paidBy: "hdfc", cardId: "hdfc-phonepe", note: "Instamart groceries" },
  { id: "spend-sep3-noodles", date: "2026-09-03", amount: 120, categoryId: "groceries", paidBy: "cash", note: "Noodles" },
  { id: "spend-sep3-icecream", date: "2026-09-03", amount: 20, categoryId: "misc", paidBy: "cash", note: "Ice cream" },
  { id: "spend-sep2-ac", date: "2026-09-02", amount: 3000, categoryId: "misc", paidBy: "upi", note: "AC installation & miscellaneous", isOneTime: true },
  { id: "spend-sep1-water", date: "2026-09-01", amount: 10, categoryId: "groceries", paidBy: "cash", note: "Water tin" },
];

export type FactualBankCardGroup = {
  bankName: string;
  sharedLimit: number;
  totalOutstandingSpend: number;
  colorTheme: string;
  cardImage: string;
  cards: Array<{
    id: string;
    name: string;
    brandTag: string;
    spendAmount: number;
    sinceDate: string;
  }>;
};

export const factualBankCardGroups: FactualBankCardGroup[] = [
  {
    bankName: "Axis Bank Cards Group",
    sharedLimit: 15000,
    totalOutstandingSpend: 13144.80,
    colorTheme: "bg-[#800020] text-white",
    cardImage: "/images/axis_card.jpg",
    cards: [
      { id: "axis-indianoil", name: "Axis Bank Indian Oil", brandTag: "Indian Oil Fuel (....7380)", spendAmount: 7887.40, sinceDate: "20 Aug" },
      { id: "axis-flipkart", name: "Axis Bank Flipkart", brandTag: "Flipkart Co-Branded (....9691)", spendAmount: 4688.00, sinceDate: "14 Aug" },
      { id: "axis-myzone", name: "Axis Bank MyZone", brandTag: "MyZone Rewards (....6415)", spendAmount: 569.40, sinceDate: "15 Aug" },
    ],
  },
  {
    bankName: "HDFC Bank Cards Group",
    sharedLimit: 40000,
    totalOutstandingSpend: 12638.87,
    colorTheme: "bg-[#0A2540] text-white",
    cardImage: "/images/hdfc_card.jpg",
    cards: [
      { id: "hdfc-phonepe", name: "HDFC PhonePe / PayZapp", brandTag: "PhonePe Cashbacks (....8020)", spendAmount: 12638.87, sinceDate: "12 Aug" },
      { id: "hdfc-tataneu", name: "Tata Neu HDFC Card", brandTag: "Tata Neu Plus (....7192)", spendAmount: 0.00, sinceDate: "11 Aug" },
      { id: "hdfc-rupay", name: "HDFC RuPay Credit Card", brandTag: "UPI RuPay Link (....6666)", spendAmount: 0.00, sinceDate: "12 Aug" },
    ],
  },
  {
    bankName: "YES Bank (Uni Cards Group)",
    sharedLimit: 27000,
    totalOutstandingSpend: 3054.15,
    colorTheme: "bg-[#0077B6] text-white",
    cardImage: "/images/uni_card.jpg",
    cards: [
      { id: "yes-uni-gold", name: "Uni X Gold (YES Bank)", brandTag: "Uni Gold Edition (....0976)", spendAmount: 1640.00, sinceDate: "12 Aug" },
      { id: "yes-uni-rupay", name: "Uni RuPay Card (YES Bank)", brandTag: "Uni RuPay UPI (....5456)", spendAmount: 1414.15, sinceDate: "12 Aug" },
    ],
  },
];

export function sumAmounts<T extends { amount: number }>(items: T[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function isEmiActiveForMonth(emi: Emi, targetMonth: string): boolean {
  if (!emi.endMonth) return true;
  return targetMonth <= emi.endMonth;
}

export function getActiveEmisForMonth(items: Emi[], targetMonth: string): Emi[] {
  return items.filter((emi) => isEmiActiveForMonth(emi, targetMonth));
}

function addMonths(month: string, amount: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
  );
}

function getStatus(balanceAfterBuffer: number, activeEmiCount: number): MonthPreviewStatus {
  if (activeEmiCount === 0) return "emi-zero";
  if (balanceAfterBuffer >= 20000) return "free";
  if (balanceAfterBuffer >= 8000) return "stable";
  return "tight";
}

function getMilestone(month: string, activeEmiCount: number, previousActiveEmiCount?: number): string {
  if (activeEmiCount === 0) return "All tracked EMIs are zero from this month.";
  if (previousActiveEmiCount !== undefined && activeEmiCount < previousActiveEmiCount) {
    return `${previousActiveEmiCount - activeEmiCount} EMI${previousActiveEmiCount - activeEmiCount === 1 ? "" : "s"} dropped this month.`;
  }
  if (month === "2026-11") return "First salary-only month preview after October cleanup.";
  return "Stay steady and keep card usage at ₹0.";
}

export function generateMonthPreviews(data: MonthlyBudgetData): MonthPreview[] {
  const allEmis = [
    ...data.personalEmis,
    ...data.venkatPayableEmis,
    ...data.venkatReceivableEmis,
  ];
  const lastKnownEndMonth = allEmis
    .map((emi) => emi.endMonth)
    .filter((month): month is string => Boolean(month))
    .sort()
    .at(-1);
  const stopMonth = lastKnownEndMonth ? addMonths(lastKnownEndMonth, 1) : addMonths(data.forecastStartMonth, 24);
  const previews: MonthPreview[] = [];
  let cursor = data.forecastStartMonth;
  let previousActiveEmiCount: number | undefined;

  while (cursor <= stopMonth) {
    const personalEmis = getActiveEmisForMonth(data.personalEmis, cursor);
    const venkatPayableEmis = getActiveEmisForMonth(data.venkatPayableEmis, cursor);
    const venkatOnYourNameEmis = getActiveEmisForMonth(data.venkatReceivableEmis, cursor);
    const oneTimeExpenses = data.futureOneTimeExpenses.filter((expense) => expense.month === cursor);
    const personalEmisTotal = sumAmounts(personalEmis);
    const venkatPayableTotal = sumAmounts(venkatPayableEmis);
    const venkatOnYourNameTotal = sumAmounts(venkatOnYourNameEmis);
    const oneTimeTotal = sumAmounts(oneTimeExpenses);
    const activeEmiCount = personalEmis.length + venkatPayableEmis.length + venkatOnYourNameEmis.length;
    const outgoingEmis = personalEmisTotal + venkatPayableTotal;
    const totalCashOut = outgoingEmis + data.futureMonthlyLivingBudget + oneTimeTotal + data.bufferTarget;
    const youKeepThisMonth = data.defaultMonthlySalary - totalCashOut;
    const endedThisMonth = allEmis.filter(
      (emi) => emi.endMonth && addMonths(emi.endMonth, -1) === cursor,
    );

    previews.push({
      month: cursor,
      label: formatMonthLabel(cursor),
      salaryIncome: data.defaultMonthlySalary,
      emisGoingOut: outgoingEmis,
      personalEmis: personalEmisTotal,
      personalEmisList: personalEmis,
      venkatPayableEmis: venkatPayableTotal,
      venkatPayableList: venkatPayableEmis,
      venkatOnYourNameDebit: venkatOnYourNameTotal,
      venkatOnYourNameList: venkatOnYourNameEmis,
      livingBudget: data.futureMonthlyLivingBudget,
      oneTimeExpenses,
      oneTimeTotal,
      bufferTarget: data.bufferTarget,
      totalCashOut,
      youKeepThisMonth,
      activeEmiCount,
      status: getStatus(youKeepThisMonth, activeEmiCount),
      milestone: getMilestone(cursor, activeEmiCount, previousActiveEmiCount),
      endedThisMonth,
    });

    previousActiveEmiCount = activeEmiCount;
    cursor = addMonths(cursor, 1);
  }

  return previews;
}

export function calculateMonthlyPlan(data: MonthlyBudgetData): MonthlyPlan {
  const totalIncome = sumAmounts(data.income);
  const incomeReceived = sumAmounts(data.income.filter((source) => source.status === "received"));
  const personalEmisTotal = sumAmounts(getActiveEmisForMonth(data.personalEmis, data.targetMonth));
  const venkatPayableEmisTotal = sumAmounts(getActiveEmisForMonth(data.venkatPayableEmis, data.targetMonth));
  const outgoingEmisTotal = personalEmisTotal + venkatPayableEmisTotal;
  const ownEmisTotal = outgoingEmisTotal;
  const venkatPayableFromBankEmisTotal = sumAmounts(getActiveEmisForMonth(data.venkatReceivableEmis, data.targetMonth));
  const nonEmiExpensesTotal = sumAmounts(data.expenses);
  const variableBudget = sumAmounts(data.expenses.filter((expense) => expense.kind === "variable"));
  const mandatoryRepaymentsTotal = sumAmounts(data.repayments.filter((repayment) => repayment.required));
  const venkatTarget = data.repayments.find((repayment) => repayment.id === "venkat")?.amount ?? 0;

  const coreObligationsBeforeVenkat =
    ownEmisTotal + nonEmiExpensesTotal + data.creditCardBill + data.lazyPay + mandatoryRepaymentsTotal;

  const maxVenkatPaymentWithoutBuffer = totalIncome - coreObligationsBeforeVenkat;
  const recommendedVenkatPayment = Math.max(
    0,
    Math.min(venkatTarget, maxVenkatPaymentWithoutBuffer - data.bufferTarget),
  );
  const deferredVenkatBalance = Math.max(0, venkatTarget - recommendedVenkatPayment);
  const finalBufferAfterRecommendedPlan =
    totalIncome - coreObligationsBeforeVenkat - recommendedVenkatPayment;
  const monthEndBalanceIfFullVenkat = totalIncome - coreObligationsBeforeVenkat - venkatTarget;

  return {
    totalIncome,
    incomeReceived,
    personalEmisTotal,
    venkatPayableEmisTotal,
    outgoingEmisTotal,
    ownEmisTotal,
    venkatPayableFromBankEmisTotal,
    nonEmiExpensesTotal,
    variableBudget,
    creditCardBill: data.creditCardBill,
    mandatoryRepaymentsTotal,
    coreObligationsBeforeVenkat,
    maxVenkatPaymentWithoutBuffer,
    recommendedVenkatPayment,
    deferredVenkatBalance,
    finalBufferAfterRecommendedPlan,
    monthEndBalanceIfFullVenkat,
  };
}

export function calculateSafeSpendPace({
  monthlyVariableBudget,
  spentSoFar,
  dayOfMonth,
  daysInMonth,
}: {
  monthlyVariableBudget: number;
  spentSoFar: number;
  dayOfMonth: number;
  daysInMonth: number;
}): SafeSpendPace {
  const dailySafeAmount = Math.floor(monthlyVariableBudget / daysInMonth);
  const allowedByToday = dailySafeAmount * dayOfMonth;
  const remainingToday = allowedByToday - spentSoFar;
  const monthRemaining = monthlyVariableBudget - spentSoFar;
  const projectedMonthEnd = allowedByToday === 0 ? 0 : Math.round((spentSoFar / dayOfMonth) * daysInMonth);
  const overPace = spentSoFar - allowedByToday;
  const status: PaceStatus = overPace <= 0 ? "green" : overPace < dailySafeAmount * 2 ? "yellow" : "red";

  const message =
    status === "green"
      ? "Inside safe zone. Spend slowly and keep the streak."
      : status === "yellow"
        ? "Slightly ahead of pace. Slow down for a day."
        : "Outside safe zone. Pause non-essential spending.";

  return {
    dailySafeAmount,
    allowedByToday,
    remainingToday,
    monthRemaining,
    projectedMonthEnd,
    status,
    message,
  };
}

export function getCardUsageStatus(card: CreditCard): {
  used: number;
  utilization: number;
  status: "freeze" | "safe-but-dont-use";
  message: string;
} {
  const used = card.limit - card.available;
  const utilization = used / card.limit;
  const status = utilization >= 0.3 ? "freeze" : "safe-but-dont-use";

  return {
    used,
    utilization,
    status,
    message:
      status === "freeze"
        ? "Freeze usage until this card drops below 30% utilization."
        : "Low utilization, but still avoid usage while rebuilding cashflow.",
  };
}

export type InvestmentRecommendation = {
  liquidFundName: string;
  liquidFundAmount: number;
  liquidFundNote: string;
  niftyIndexFundName: string;
  niftyIndexFundAmount: number;
  niftyIndexFundNote: string;
  flexiCapFundName: string;
  flexiCapFundAmount: number;
  flexiCapFundNote: string;
  totalInvestedThisMonth: number;
  stageName: string;
  strategyGuidance: string;
};

export function getInvestmentPlanForMonth(
  month: string,
  surplusAmount: number,
): InvestmentRecommendation {
  const liquidFundName = "Parag Parikh Liquid Fund (Direct - Growth)";
  const niftyIndexFundName = "UTI Nifty 50 Index Fund (Direct - Growth)";
  const flexiCapFundName = "Parag Parikh Flexi Cap Fund (Direct - Growth)";

  if (surplusAmount <= 0) {
    return {
      liquidFundName,
      liquidFundAmount: 0,
      liquidFundNote: "Maintain operational ₹5,000 cash buffer in bank account.",
      niftyIndexFundName,
      niftyIndexFundAmount: 0,
      niftyIndexFundNote: "Pause equity SIP until monthly cashflow stabilizes.",
      flexiCapFundName,
      flexiCapFundAmount: 0,
      flexiCapFundNote: "Pause active equity until core obligations are met.",
      totalInvestedThisMonth: 0,
      stageName: "Stabilization & Debt Cleanup",
      strategyGuidance: "Prioritize clearing mandatory family debts and credit card balance.",
    };
  }

  // Stage 1: Nov 2026 to Feb 2027 (Emergency Foundation)
  if (month <= "2027-02") {
    const liquidAmount = Math.round(surplusAmount * 0.60);
    const niftyAmount = Math.round(surplusAmount * 0.25);
    const flexiAmount = Math.max(0, surplusAmount - liquidAmount - niftyAmount);
    return {
      liquidFundName,
      liquidFundAmount: liquidAmount,
      liquidFundNote: "Build Emergency Fund to reach ₹30,000 (2 months living buffer).",
      niftyIndexFundName,
      niftyIndexFundAmount: niftyAmount,
      niftyIndexFundNote: "Top 50 Indian bluechip giants (12-14% CAGR compounding baseline).",
      flexiCapFundName,
      flexiCapFundAmount: flexiAmount,
      flexiCapFundNote: "Active Indian + Global tech compounding engine.",
      totalInvestedThisMonth: surplusAmount,
      stageName: "Stage 1: Emergency Foundation",
      strategyGuidance: "60% to Liquid Fund for safety, 40% to Equity Index & Flexi Cap SIPs.",
    };
  }

  // Stage 2: Mar 2027 to Sep 2027 (Dual Acceleration)
  if (month <= "2027-09") {
    const liquidAmount = Math.round(surplusAmount * 0.40);
    const niftyAmount = Math.round(surplusAmount * 0.30);
    const flexiAmount = Math.max(0, surplusAmount - liquidAmount - niftyAmount);
    return {
      liquidFundName,
      liquidFundAmount: liquidAmount,
      liquidFundNote: "Scale Emergency Runway to ₹75,000 (4.5 months buffer).",
      niftyIndexFundName,
      niftyIndexFundAmount: niftyAmount,
      niftyIndexFundNote: "Core India growth index (Low expense ratio 0.18%).",
      flexiCapFundName,
      flexiCapFundAmount: flexiAmount,
      flexiCapFundNote: "High alpha Indian + US tech holdings.",
      totalInvestedThisMonth: surplusAmount,
      stageName: "Stage 2: Dual Acceleration",
      strategyGuidance: "40% to Emergency Fund, 60% split across Nifty 50 and Parag Parikh Flexi Cap.",
    };
  }

  // Stage 3: Oct 2027 to Apr 2028 (MoneyView Free - Wealth Scaling)
  if (month <= "2028-04") {
    const liquidAmount = Math.min(5000, Math.round(surplusAmount * 0.15));
    const equityPool = surplusAmount - liquidAmount;
    const niftyAmount = Math.round(equityPool * 0.50);
    const flexiAmount = equityPool - niftyAmount;
    return {
      liquidFundName,
      liquidFundAmount: liquidAmount,
      liquidFundNote: "Final top-up to lock ₹1,00,000 full 6-month safety fortress.",
      niftyIndexFundName,
      niftyIndexFundAmount: niftyAmount,
      niftyIndexFundNote: "Aggressive passive wealth compounding (₹14k+/mo).",
      flexiCapFundName,
      flexiCapFundAmount: flexiAmount,
      flexiCapFundNote: "Aggressive multi-cap growth compounding (₹13k+/mo).",
      totalInvestedThisMonth: surplusAmount,
      stageName: "Stage 3: MoneyView Free Wealth Expansion",
      strategyGuidance: "Cap Emergency Fund at ₹1L, and channel 85%+ into equity compounding.",
    };
  }

  // Stage 4: May 2028 Onward (Zero EMI Wealth Freedom Machine)
  const niftyAmount = Math.round(surplusAmount * 0.50);
  const flexiAmount = surplusAmount - niftyAmount;
  return {
    liquidFundName,
    liquidFundAmount: 0,
    liquidFundNote: "Emergency Fund is already fully funded at ₹1,00,000. Any Day 30 unspent ₹5k buffer sweeps here.",
    niftyIndexFundName,
    niftyIndexFundAmount: niftyAmount,
    niftyIndexFundNote: "Automated wealth generation in India's top 50 businesses.",
    flexiCapFundName,
    flexiCapFundAmount: flexiAmount,
    flexiCapFundNote: "Global & Domestic equity alpha compounding at peak savings rate (65%).",
    totalInvestedThisMonth: surplusAmount,
    stageName: "Stage 4: Zero EMI Wealth Machine",
    strategyGuidance: "100% of monthly surplus (₹39,500+) invested 50/50 in UTI Nifty 50 and Parag Parikh Flexi Cap.",
  };
}

export function getAllForecastMonths(startMonth = "2026-09", endMonth = "2028-07"): Array<{ value: string; label: string }> {
  const months: Array<{ value: string; label: string }> = [];
  let cursor = startMonth;
  while (cursor <= endMonth) {
    months.push({
      value: cursor,
      label: formatMonthLabel(cursor),
    });
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export function addMonthsToDate(month: string, amount: number): string {
  return addMonths(month, amount);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
