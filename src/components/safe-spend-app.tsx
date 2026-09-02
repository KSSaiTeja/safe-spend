"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard as CreditCardIcon,
  IndianRupee,
  Landmark,
  PiggyBank,
  Plus,
  Pencil,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addMonthsToDate,
  calculateMonthlyPlan,
  calculateSafeSpendPace,
  formatInr,
  formatMonthLabel,
  getActiveEmisForMonth,
  getAllForecastMonths,
  getCardUsageStatus,
  getInvestmentPlanForMonth,
  generateMonthPreviews,
  octoberSeedData,
  sumAmounts,
  CustomDebt,
  IncomeSource,
  SpendEntry,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

const SPEND_STORAGE_KEY = "safe-spend-october-v2-spend";
const MONTHLY_INCOME_KEY = "safe-spend-monthly-incomes-v2";
const BUFFER_SWEEP_KEY = "safe-spend-buffer-sweeps-v1";
const MONTHLY_CARD_BILL_KEY = "safe-spend-monthly-card-bills-v1";
const CUSTOM_DEBT_KEY = "safe-spend-custom-debts-v1";

const paymentMethods: Array<{ id: SpendEntry["paidBy"]; label: string }> = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "hdfc", label: "HDFC card" },
  { id: "axis", label: "Axis card" },
  { id: "yes-bank", label: "Yes Bank card" },
];

function loadSpendEntries(): SpendEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SPEND_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SpendEntry[]) : [];
  } catch {
    return [];
  }
}

function loadMonthlyIncomes(): Record<string, IncomeSource[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MONTHLY_INCOME_KEY);
    return raw ? (JSON.parse(raw) as Record<string, IncomeSource[]>) : {};
  } catch {
    return {};
  }
}

function loadMonthlyCardBills(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MONTHLY_CARD_BILL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function loadCustomDebts(): Record<string, CustomDebt[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_DEBT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CustomDebt[]>) : {};
  } catch {
    return {};
  }
}

function loadBufferSweeps(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BUFFER_SWEEP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
}

function getSeptemberDay() {
  const now = new Date();
  if (now.getFullYear() === 2026 && now.getMonth() === 8) {
    return Math.min(Math.max(now.getDate(), 1), 30);
  }
  return 1;
}

function StatusBadge({ status }: { status: "green" | "yellow" | "red" }) {
  const copy = {
    green: "Safe",
    yellow: "Careful",
    red: "Stop",
  }[status];

  return (
    <Badge
      className={cn(
        "border px-2.5 py-1 text-xs font-semibold",
        status === "green" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        status === "yellow" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
        status === "red" && "border-red-500/30 bg-red-500/10 text-red-200",
      )}
      variant="outline"
    >
      {copy}
    </Badge>
  );
}

function ForecastBadge({ status }: { status: "tight" | "stable" | "free" | "emi-zero" }) {
  const copy = {
    tight: "Tight",
    stable: "Stable",
    free: "Freeing up",
    "emi-zero": "Zero EMI",
  }[status];

  return (
    <Badge
      className={cn(
        "border px-2.5 py-1 text-xs font-semibold",
        status === "tight" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
        status === "stable" && "border-sky-500/30 bg-sky-500/10 text-sky-200",
        status === "free" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        status === "emi-zero" && "border-violet-500/30 bg-violet-500/10 text-violet-200",
      )}
      variant="outline"
    >
      {copy}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof IndianRupee;
  tone?: "default" | "safe" | "warn" | "danger";
}) {
  return (
    <Card className="overflow-hidden border-white/10 bg-card/80 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
          </div>
          <div
            className={cn(
              "rounded-full border p-2",
              tone === "default" && "border-white/10 bg-muted text-muted-foreground",
              tone === "safe" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
              tone === "warn" && "border-amber-500/20 bg-amber-500/10 text-amber-200",
              tone === "danger" && "border-red-500/20 bg-red-500/10 text-red-200",
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LineItem({ name, value, helper }: { name: string; value: string; helper?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{name}</p>
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </div>
      <p className="shrink-0 font-mono text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function BreakdownItem({
  name,
  amount,
  detail,
  tag,
}: {
  name: string;
  amount: string;
  detail?: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-xs">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-muted-foreground/60">•</span>
        <span className="truncate font-medium text-foreground/90">{name}</span>
        {detail ? <span className="text-[11px] text-muted-foreground">({detail})</span> : null}
        {tag ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
        ) : null}
      </div>
      <span className="shrink-0 font-mono text-muted-foreground">{amount}</span>
    </div>
  );
}

function BreakdownGroup({
  title,
  total,
  subtitle,
  children,
  badge,
  tone = "default",
}: {
  title: string;
  total: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: string;
  tone?: "default" | "safe" | "warn" | "danger" | "info";
}) {
  return (
    <div
      className={cn(
        "space-y-2.5 rounded-xl border p-3.5",
        tone === "default" && "border-white/10 bg-muted/20",
        tone === "safe" && "border-emerald-500/20 bg-emerald-500/5",
        tone === "warn" && "border-amber-500/20 bg-amber-500/5",
        tone === "danger" && "border-red-500/20 bg-red-500/5",
        tone === "info" && "border-sky-500/20 bg-sky-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {badge ? (
              <Badge className="px-1.5 py-0 text-[10px]" variant="outline">
                {badge}
              </Badge>
            ) : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <p className="shrink-0 font-mono text-sm font-semibold text-foreground">{total}</p>
      </div>
      <div className="space-y-1 border-l-2 border-white/15 pl-3 pt-0.5">{children}</div>
    </div>
  );
}

export function SafeSpendApp() {
  const allForecastMonths = useMemo(() => getAllForecastMonths("2026-09", "2028-07"), []);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [entries, setEntries] = useState<SpendEntry[]>(() => loadSpendEntries());
  const [monthlyIncomes, setMonthlyIncomes] = useState<Record<string, IncomeSource[]>>(() => loadMonthlyIncomes());
  const [monthlyCardBills, setMonthlyCardBills] = useState<Record<string, number>>(() => loadMonthlyCardBills());
  const [customDebts, setCustomDebts] = useState<Record<string, CustomDebt[]>>(() => loadCustomDebts());
  const [bufferSweeps, setBufferSweeps] = useState<Record<string, boolean>>(() => loadBufferSweeps());

  // Spend form states
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("groceries");
  const [paidBy, setPaidBy] = useState<SpendEntry["paidBy"]>("upi");
  const [note, setNote] = useState("");
  const [spendDate, setSpendDate] = useState<string>(() => getLocalDateString());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Spend list filter states
  const [spendListFilter, setSpendListFilter] = useState<"all" | "today" | "yesterday" | "custom">("all");
  const [spendListCustomDate, setSpendListCustomDate] = useState<string>("");

  // Income entry form states for selected month
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeDate, setNewIncomeDate] = useState("");
  const [showAddIncome, setShowAddIncome] = useState(false);

  // Card bill customizer state
  const [editCardBill, setEditCardBill] = useState(false);
  const [cardBillInput, setCardBillInput] = useState("");

  // Custom Debt entry form states
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtLender, setNewDebtLender] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newDebtCategory, setNewDebtCategory] = useState<"person" | "bank" | "app">("person");
  const [newDebtPriority, setNewDebtPriority] = useState<"high" | "normal">("high");
  const [newDebtNote, setNewDebtNote] = useState("");

  // Active tab state
  const [activeTab, setActiveTab] = useState("plan");

  useEffect(() => {
    window.localStorage.setItem(SPEND_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    window.localStorage.setItem(MONTHLY_INCOME_KEY, JSON.stringify(monthlyIncomes));
  }, [monthlyIncomes]);

  useEffect(() => {
    window.localStorage.setItem(MONTHLY_CARD_BILL_KEY, JSON.stringify(monthlyCardBills));
  }, [monthlyCardBills]);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_DEBT_KEY, JSON.stringify(customDebts));
  }, [customDebts]);

  useEffect(() => {
    window.localStorage.setItem(BUFFER_SWEEP_KEY, JSON.stringify(bufferSweeps));
  }, [bufferSweeps]);

  // Current month incomes
  const currentIncomes: IncomeSource[] = useMemo(() => {
    if (monthlyIncomes[selectedMonth]) {
      return monthlyIncomes[selectedMonth];
    }
    if (selectedMonth === "2026-09") {
      return octoberSeedData.income;
    }
    return [
      {
        id: `salary-${selectedMonth}`,
        name: "Zenerative Minds Salary",
        amount: 60000,
        expectedDate: "Day 1 EOD",
        status: "expected",
      },
    ];
  }, [monthlyIncomes, selectedMonth]);

  // Current month obligations & EMIs
  const currentPersonalEmis = useMemo(
    () => getActiveEmisForMonth(octoberSeedData.personalEmis, selectedMonth),
    [selectedMonth],
  );
  const currentVenkatPayableEmis = useMemo(
    () => getActiveEmisForMonth(octoberSeedData.venkatPayableEmis, selectedMonth),
    [selectedMonth],
  );
  const currentVenkatOnYourNameEmis = useMemo(
    () => getActiveEmisForMonth(octoberSeedData.venkatReceivableEmis, selectedMonth),
    [selectedMonth],
  );
  const currentOneTimeExpenses = useMemo(
    () => octoberSeedData.futureOneTimeExpenses.filter((e) => e.month === selectedMonth),
    [selectedMonth],
  );
  const currentCustomDebts = useMemo(
    () => customDebts[selectedMonth] ?? [],
    [customDebts, selectedMonth],
  );

  // Month calculations
  const monthTotalIncome = useMemo(() => sumAmounts(currentIncomes), [currentIncomes]);
  const monthIncomeReceived = useMemo(
    () => sumAmounts(currentIncomes.filter((i) => i.status === "received")),
    [currentIncomes],
  );
  const monthPersonalEmisTotal = useMemo(() => sumAmounts(currentPersonalEmis), [currentPersonalEmis]);
  const monthVenkatPayableTotal = useMemo(() => sumAmounts(currentVenkatPayableEmis), [currentVenkatPayableEmis]);
  const monthCustomDebtsTotal = useMemo(() => sumAmounts(currentCustomDebts.map(d => ({ amount: d.totalAmount }))), [currentCustomDebts]);
  const monthOutgoingEmis = monthPersonalEmisTotal + monthVenkatPayableTotal;
  const monthVenkatDebitOnNameTotal = useMemo(() => sumAmounts(currentVenkatOnYourNameEmis), [currentVenkatOnYourNameEmis]);
  const monthOneTimeTotal = useMemo(() => sumAmounts(currentOneTimeExpenses), [currentOneTimeExpenses]);

  const monthLivingBudget = selectedMonth === "2026-09" ? 18000 : 15500;
  const bufferTarget = 5000;

  // September specific reserve calculation vs Future Months
  const isInitialCleanupMonth = selectedMonth === "2026-09";
  const creditCardBill = useMemo(() => {
    if (monthlyCardBills[selectedMonth] !== undefined) {
      return monthlyCardBills[selectedMonth];
    }
    return isInitialCleanupMonth ? octoberSeedData.creditCardBill : 0;
  }, [monthlyCardBills, selectedMonth, isInitialCleanupMonth]);

  const daddyRepayment = isInitialCleanupMonth ? 30000 : 0;
  const venkatDirectPayment = isInitialCleanupMonth ? 46276 : selectedMonth === "2026-11" ? 3724 : 0;

  // Total required amount to maintain in bank account
  const mustKeepInBank =
    monthOutgoingEmis + monthLivingBudget + monthOneTimeTotal + creditCardBill + daddyRepayment + venkatDirectPayment + monthCustomDebtsTotal + bufferTarget;

  const totalCoreObligations =
    monthOutgoingEmis + monthLivingBudget + monthOneTimeTotal + creditCardBill + daddyRepayment + venkatDirectPayment + monthCustomDebtsTotal;

  const netMonthSurplus = Math.max(0, monthTotalIncome - totalCoreObligations - bufferTarget);
  const netRetainedInBank = netMonthSurplus + bufferTarget;

  // Card Spends logged this month
  const cardSpendsThisMonth = useMemo(() => {
    const cardMethods = new Set(["hdfc", "axis", "yes-bank"]);
    return entries.filter((e) => cardMethods.has(e.paidBy));
  }, [entries]);

  const hdfcSpent = useMemo(() => sumAmounts(entries.filter((e) => e.paidBy === "hdfc")), [entries]);
  const axisSpent = useMemo(() => sumAmounts(entries.filter((e) => e.paidBy === "axis")), [entries]);
  const yesBankSpent = useMemo(() => sumAmounts(entries.filter((e) => e.paidBy === "yes-bank")), [entries]);
  const totalNewCardSpent = hdfcSpent + axisSpent + yesBankSpent;

  // Tracked Debts & Obligations Ledger for selected month
  const allTrackedDebts = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      lender: string;
      totalAmount: number;
      categoryType: "person" | "emi" | "card";
      priority: "high" | "normal";
      note?: string;
    }> = [];

    // 1. Priority People Debts
    if (isInitialCleanupMonth) {
      list.push({
        id: "debt-daddy",
        name: "Daddy Repayment",
        lender: "Family",
        totalAmount: 30000,
        categoryType: "person",
        priority: "high",
        note: "Mandatory family repayment",
      });
      list.push({
        id: "debt-venkat-direct",
        name: "Venkat Direct Settlement",
        lender: "Venkat",
        totalAmount: 50000,
        categoryType: "person",
        priority: "high",
        note: "Target balance repayment (₹46,276 safe)",
      });
    } else if (selectedMonth === "2026-11") {
      list.push({
        id: "debt-venkat-deferred",
        name: "Venkat Deferred Balance",
        lender: "Venkat",
        totalAmount: 3724,
        categoryType: "person",
        priority: "high",
        note: "Settlement of deferred balance",
      });
    }

    // 2. Custom User-Added Debts
    currentCustomDebts.forEach((d) => {
      list.push({
        id: `custom-debt-${d.id}`,
        name: d.name,
        lender: d.lender,
        totalAmount: d.totalAmount,
        categoryType: d.category === "person" ? "person" : "emi",
        priority: d.priority,
        note: d.note,
      });
    });

    // 3. Outgoing EMIs
    currentPersonalEmis.forEach((emi) => {
      list.push({
        id: `emi-${emi.id}`,
        name: `${emi.name} (Personal EMI)`,
        lender: emi.name,
        totalAmount: emi.amount,
        categoryType: "emi",
        priority: "normal",
        note: `Ends ${emi.ends}`,
      });
    });

    currentVenkatPayableEmis.forEach((emi) => {
      list.push({
        id: `emi-${emi.id}`,
        name: `${emi.name} (Pay to Venkat)`,
        lender: "Venkat",
        totalAmount: emi.amount,
        categoryType: "emi",
        priority: "normal",
        note: `Ends ${emi.ends}`,
      });
    });

    // 4. Credit Card Statement
    if (creditCardBill > 0) {
      list.push({
        id: "card-statement-total",
        name: "Credit Card Statement Dues",
        lender: "HDFC / Axis / YES",
        totalAmount: creditCardBill,
        categoryType: "card",
        priority: "high",
        note: "Statement bill payment",
      });
    }

    return list;
  }, [isInitialCleanupMonth, selectedMonth, currentCustomDebts, currentPersonalEmis, currentVenkatPayableEmis, creditCardBill]);

  // Debt payment tracking helper
  const debtPaymentStats = useMemo(() => {
    return allTrackedDebts.map((debt) => {
      const paidSoFar = sumAmounts(entries.filter((e) => e.categoryId === debt.id));
      const remainingBalance = Math.max(0, debt.totalAmount - paidSoFar);
      const percentCleared = Math.min(100, Math.round((paidSoFar / debt.totalAmount) * 100));
      const isCleared = remainingBalance === 0 && paidSoFar >= debt.totalAmount;
      return {
        ...debt,
        paidSoFar,
        remainingBalance,
        percentCleared,
        isCleared,
      };
    });
  }, [allTrackedDebts, entries]);

  // Dynamic Bank Debits & Live Account Balance Calculations
  const bankDebitedEntries = useMemo(() => {
    return entries.filter((e) => e.paidBy === "upi" || e.paidBy === "cash");
  }, [entries]);

  const totalDebitedFromBank = useMemo(() => sumAmounts(bankDebitedEntries), [bankDebitedEntries]);

  const totalDebtAndEmiPaid = useMemo(() => {
    return sumAmounts(
      entries.filter(
        (e) =>
          (e.paidBy === "upi" || e.paidBy === "cash") &&
          (e.categoryId.startsWith("debt-") ||
            e.categoryId.startsWith("emi-") ||
            e.categoryId.startsWith("card-") ||
            e.categoryId.startsWith("custom-debt-")),
      ),
    );
  }, [entries]);

  const totalLivingPaid = useMemo(() => {
    const livingCategoryIds = new Set(["groceries", "bike", "gym", "rent", "electricity", "misc"]);
    return sumAmounts(
      entries.filter(
        (e) => (e.paidBy === "upi" || e.paidBy === "cash") && livingCategoryIds.has(e.categoryId),
      ),
    );
  }, [entries]);

  // Remaining Unpaid Outflows for the selected month
  const remainingDebtsToPay = useMemo(() => {
    return debtPaymentStats.reduce((sum, d) => sum + d.remainingBalance, 0);
  }, [debtPaymentStats]);

  const remainingLivingToPay = useMemo(() => {
    return Math.max(0, monthLivingBudget - totalLivingPaid);
  }, [monthLivingBudget, totalLivingPaid]);

  const remainingOneTimeToPay = monthOneTimeTotal;

  const totalRemainingPendingOutflows = remainingDebtsToPay + remainingLivingToPay + remainingOneTimeToPay;

  // Live required balance to maintain in bank right now
  const liveCashNeededInBank = totalRemainingPendingOutflows + bufferTarget;
  const initialGrossPlanRequired = totalCoreObligations + bufferTarget;

  // Live bank balance
  const activeInflowBaseline = monthIncomeReceived > 0 ? monthIncomeReceived : monthTotalIncome;
  const currentLiveBankBalance = Math.max(0, activeInflowBaseline - totalDebitedFromBank);

  // Projected Month-End Bank Balance
  const projectedMonthEndBalance = currentLiveBankBalance - totalRemainingPendingOutflows;
  const projectedSurplusAboveBuffer = Math.max(0, projectedMonthEndBalance - bufferTarget);

  const totalRemainingHighPriorityDebt = useMemo(() => {
    return debtPaymentStats
      .filter((d) => d.priority === "high")
      .reduce((sum, d) => sum + d.remainingBalance, 0);
  }, [debtPaymentStats]);

  // Investment Allocation Recommendation for the selected month
  const investmentPlan = useMemo(
    () => getInvestmentPlanForMonth(selectedMonth, projectedSurplusAboveBuffer > 0 ? projectedSurplusAboveBuffer : netMonthSurplus),
    [selectedMonth, projectedSurplusAboveBuffer, netMonthSurplus],
  );

  // Multi-month previews
  const monthPreviews = useMemo(() => generateMonthPreviews(octoberSeedData), []);
  const firstZeroEmiMonth = monthPreviews.find((preview) => preview.status === "emi-zero");

  // Spend pacing (for current active month variable spend)
  const variableCategoryIds = new Set(
    octoberSeedData.expenses.filter((expense) => expense.kind === "variable").map((expense) => expense.id),
  );
  const variableSpent = entries
    .filter((entry) => variableCategoryIds.has(entry.categoryId))
    .reduce((total, entry) => total + entry.amount, 0);
  const dayOfMonth = getSeptemberDay();
  const variableBudget = 9000;
  const pace = calculateSafeSpendPace({
    monthlyVariableBudget: variableBudget,
    spentSoFar: variableSpent,
    dayOfMonth,
    daysInMonth: 30,
  });

  const categorySpend = octoberSeedData.expenses.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = entries
      .filter((entry) => entry.categoryId === category.id)
      .reduce((total, entry) => total + entry.amount, 0);
    return acc;
  }, {});

  // Date-oriented filtered entries
  const filteredEntries = useMemo(() => {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();

    if (spendListFilter === "today") {
      return entries.filter((e) => e.date === todayStr);
    }
    if (spendListFilter === "yesterday") {
      return entries.filter((e) => e.date === yesterdayStr);
    }
    if (spendListFilter === "custom" && spendListCustomDate) {
      return entries.filter((e) => e.date === spendListCustomDate);
    }
    return entries;
  }, [entries, spendListFilter, spendListCustomDate]);

  // Month navigation helpers
  const currentMonthIndex = allForecastMonths.findIndex((m) => m.value === selectedMonth);
  const prevMonth = currentMonthIndex > 0 ? allForecastMonths[currentMonthIndex - 1].value : null;
  const nextMonth = currentMonthIndex < allForecastMonths.length - 1 ? allForecastMonths[currentMonthIndex + 1].value : null;

  function handleSaveCardBill(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(cardBillInput);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setMonthlyCardBills((prev) => ({
      ...prev,
      [selectedMonth]: Math.round(parsed),
    }));
    setEditCardBill(false);
  }

  function handleAddIncome(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(newIncomeAmount);
    if (!newIncomeName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;

    const newSource: IncomeSource = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: newIncomeName.trim(),
      amount: Math.round(parsed),
      expectedDate: newIncomeDate.trim() || "Expected this month",
      status: "expected",
    };

    setMonthlyIncomes((prev) => ({
      ...prev,
      [selectedMonth]: [...(prev[selectedMonth] ?? currentIncomes), newSource],
    }));

    setNewIncomeName("");
    setNewIncomeAmount("");
    setNewIncomeDate("");
    setShowAddIncome(false);
  }

  function toggleIncomeStatus(sourceId: string) {
    setMonthlyIncomes((prev) => {
      const list = prev[selectedMonth] ?? currentIncomes;
      const updated = list.map((item) =>
        item.id === sourceId
          ? { ...item, status: item.status === "received" ? ("expected" as const) : ("received" as const) }
          : item,
      );
      return { ...prev, [selectedMonth]: updated };
    });
  }

  function deleteIncome(sourceId: string) {
    setMonthlyIncomes((prev) => {
      const list = prev[selectedMonth] ?? currentIncomes;
      return { ...prev, [selectedMonth]: list.filter((item) => item.id !== sourceId) };
    });
  }

  function startEditingEntry(entry: SpendEntry) {
    setEditingEntryId(entry.id);
    setAmount(String(entry.amount));
    setCategoryId(entry.categoryId);
    setPaidBy(entry.paidBy);
    setNote(entry.note ?? "");
    setSpendDate(entry.date);
  }

  function cancelEditingEntry() {
    setEditingEntryId(null);
    setAmount("");
    setNote("");
    setSpendDate(getLocalDateString());
  }

  function addSpend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    const todayStr = getLocalDateString();
    // Restrict date: cannot be after current date
    const targetDate = spendDate && spendDate <= todayStr ? spendDate : todayStr;

    if (editingEntryId) {
      setEntries((current) =>
        current.map((item) =>
          item.id === editingEntryId
            ? {
                ...item,
                date: targetDate,
                amount: Math.round(parsedAmount),
                categoryId,
                paidBy,
                note: note.trim() || undefined,
              }
            : item,
        ),
      );
      setEditingEntryId(null);
    } else {
      const entry: SpendEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: targetDate,
        amount: Math.round(parsedAmount),
        categoryId,
        paidBy,
        note: note.trim() || undefined,
      };
      setEntries((current) => [entry, ...current]);
    }

    setAmount("");
    setNote("");
    setSpendDate(todayStr);
  }

  function handleAddDebt(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(newDebtAmount);
    if (!newDebtName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;

    const newDebt: CustomDebt = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: newDebtName.trim(),
      lender: newDebtLender.trim() || "Private Lender / Person",
      totalAmount: Math.round(parsed),
      category: newDebtCategory,
      priority: newDebtPriority,
      note: newDebtNote.trim() || undefined,
    };

    setCustomDebts((prev) => ({
      ...prev,
      [selectedMonth]: [...(prev[selectedMonth] ?? []), newDebt],
    }));

    setNewDebtName("");
    setNewDebtLender("");
    setNewDebtAmount("");
    setNewDebtNote("");
    setShowAddDebt(false);
  }

  function deleteDebt(debtId: string) {
    setCustomDebts((prev) => {
      const list = prev[selectedMonth] ?? [];
      return { ...prev, [selectedMonth]: list.filter((item) => item.id !== debtId) };
    });
  }

  function handleQuickPayDebt(debtId: string, remainingBalance: number) {
    setCategoryId(debtId);
    setAmount(remainingBalance > 0 ? String(remainingBalance) : "");
    setActiveTab("spend");
  }

  function toggleBufferSweep(monthKey: string) {
    setBufferSweeps((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  }

  function resetLocalData() {
    setEntries([]);
    setMonthlyIncomes({});
    setMonthlyCardBills({});
    setCustomDebts({});
    setBufferSweeps({});
  }

  const activeEmiCount = currentPersonalEmis.length + currentVenkatPayableEmis.length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-12 text-foreground sm:max-w-5xl">
      {/* Sticky Header & Month Selector */}
      <section className="sticky top-0 z-20 border-b border-white/10 bg-background/95 px-4 py-3.5 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">SafeSpend Pro</p>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]">
                Active Engine
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Financial Command Center</h1>
          </div>

          {/* Month Dropdown & Fast Navigation */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="size-9 shrink-0 border-white/10"
              disabled={!prevMonth}
              onClick={() => prevMonth && setSelectedMonth(prevMonth)}
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[170px] font-medium border-white/15 bg-card text-xs sm:text-sm">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allForecastMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs sm:text-sm">
                    {m.label} {m.value === "2028-05" ? "🎉 Zero EMI" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="icon"
              variant="outline"
              className="size-9 shrink-0 border-white/10"
              disabled={!nextMonth}
              onClick={() => nextMonth && setSelectedMonth(nextMonth)}
              title="Next Month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="space-y-4 px-4 py-4 sm:px-6">
        {/* Month Status & Highlight Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/90 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{formatMonthLabel(selectedMonth)}</span>
              <ForecastBadge
                status={activeEmiCount === 0 ? "emi-zero" : netMonthSurplus >= 20000 ? "free" : netMonthSurplus >= 8000 ? "stable" : "tight"}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {activeEmiCount === 0
                ? "🎉 Complete Financial Freedom! Zero outgoing EMI obligations."
                : `${activeEmiCount} active outgoing EMIs (${formatInr(monthOutgoingEmis)}/mo).`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Surplus to Invest</p>
              <p className="font-mono text-xl font-extrabold text-emerald-400">{formatInr(netMonthSurplus)}</p>
            </div>
          </div>
        </div>

        {/* Metric Cards for the Selected Month */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            title="Total Inflow"
            value={formatInr(activeInflowBaseline)}
            detail={`${formatInr(monthIncomeReceived)} confirmed received`}
            icon={ArrowDownToLine}
            tone="safe"
          />
          <MetricCard
            title="Debited So Far"
            value={formatInr(totalDebitedFromBank)}
            detail={`Debts: ${formatInr(totalDebtAndEmiPaid)} · Spends: ${formatInr(totalLivingPaid)}`}
            icon={TrendingDown}
            tone={totalDebitedFromBank > 0 ? "warn" : "safe"}
          />
          <MetricCard
            title="Live Bank Balance"
            value={formatInr(currentLiveBankBalance)}
            detail={`Pending to pay: ${formatInr(totalRemainingPendingOutflows)}`}
            icon={Landmark}
            tone={currentLiveBankBalance >= liveCashNeededInBank ? "safe" : "warn"}
          />
          <MetricCard
            title="Must Keep in Bank"
            value={formatInr(liveCashNeededInBank)}
            detail={`Pending: ${formatInr(totalRemainingPendingOutflows)} + ₹5k buffer`}
            icon={PiggyBank}
            tone="safe"
          />
        </div>

        {/* Comprehensive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-6 bg-muted/70 p-1">
            <TabsTrigger value="plan" className="text-[11px] sm:text-xs">Plan</TabsTrigger>
            <TabsTrigger value="invest" className="text-[11px] sm:text-xs font-semibold text-emerald-400">Invest</TabsTrigger>
            <TabsTrigger value="spend" className="text-[11px] sm:text-xs">Spend</TabsTrigger>
            <TabsTrigger value="runway" className="text-[11px] sm:text-xs">Runway</TabsTrigger>
            <TabsTrigger value="emis" className="text-[11px] sm:text-xs">EMIs</TabsTrigger>
            <TabsTrigger value="cards" className="text-[11px] sm:text-xs">Cards</TabsTrigger>
          </TabsList>

          {/* TAB 1: MONTH PLAN & CASHFLOW */}
          <TabsContent value="plan" className="mt-4 space-y-4">
            {/* Dynamic Live Bank Account & Month-End Liquidity Command Card */}
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className="size-4 text-sky-400" />
                    <p className="text-sm font-bold text-sky-200">
                      Live Bank Balance & Liquidity Manager ({formatMonthLabel(selectedMonth)})
                    </p>
                  </div>
                  <p className="text-xs text-sky-200/80 mt-0.5">
                    Automatically subtracts debts, EMIs, card bills, and living spends as you pay them.
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-sky-200/70 uppercase">Must Maintain in Bank Right Now</p>
                  <p className="font-mono text-2xl font-black text-sky-300">{formatInr(liveCashNeededInBank)}</p>
                  <p className="text-[11px] text-sky-200/70">
                    {totalRemainingPendingOutflows > 0
                      ? `${formatInr(totalRemainingPendingOutflows)} pending + ₹5k buffer`
                      : "✓ All outflows cleared! ₹5k buffer intact"}
                  </p>
                </div>
              </div>

              {/* Progress: Cleared vs Remaining Required */}
              <div className="space-y-1.5 rounded-xl bg-black/20 p-3 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Obligations Cleared: <strong className="text-emerald-300 font-mono">{formatInr(totalDebitedFromBank)}</strong> of <span className="font-mono">{formatInr(initialGrossPlanRequired)}</span>
                  </span>
                  <span className="font-mono font-bold text-sky-300">
                    {initialGrossPlanRequired > 0 ? Math.min(100, Math.round((totalDebitedFromBank / initialGrossPlanRequired) * 100)) : 100}% Cleared
                  </span>
                </div>
                <Progress
                  value={initialGrossPlanRequired > 0 ? Math.min(100, Math.round((totalDebitedFromBank / initialGrossPlanRequired) * 100)) : 100}
                  className="h-2"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>Current Bank Balance: <strong className="text-foreground font-mono">{formatInr(currentLiveBankBalance)}</strong></span>
                  <span>
                    Projected Month-End Balance:{" "}
                    <strong className={cn("font-mono font-semibold", projectedMonthEndBalance >= bufferTarget ? "text-emerald-300" : "text-amber-300")}>
                      {formatInr(projectedMonthEndBalance)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Sub-grid of Remaining Unpaid Balances */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-2">
                  <p className="text-muted-foreground text-[10px]">1. Remaining Debts & EMIs</p>
                  <p className="font-mono font-semibold text-foreground">{formatInr(remainingDebtsToPay)}</p>
                </div>
                <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-2">
                  <p className="text-muted-foreground text-[10px]">2. Remaining Living Spends</p>
                  <p className="font-mono font-semibold text-foreground">{formatInr(remainingLivingToPay)}</p>
                </div>
                <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-2">
                  <p className="text-muted-foreground text-[10px]">3. Emergency Buffer</p>
                  <p className="font-mono font-semibold text-amber-200">{formatInr(bufferTarget)}</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                  <p className="text-emerald-300 text-[10px]">4. Projected Surplus</p>
                  <p className="font-mono font-semibold text-emerald-400">{formatInr(projectedSurplusAboveBuffer)}</p>
                </div>
              </div>
            </div>

            {/* LIVE DEBTS & PARTIAL PAYMENTS LEDGER */}
            <Card className="border-white/10 shadow-none overflow-hidden">
              <CardHeader className="p-4 pb-2 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="size-4 text-amber-400" />
                      <CardTitle className="text-lg">Active Debts & Partial Payments Ledger</CardTitle>
                    </div>
                    <CardDescription>
                      Live tracking of payments made vs remaining balance for {formatMonthLabel(selectedMonth)}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 text-amber-200 text-xs"
                    onClick={() => setShowAddDebt(!showAddDebt)}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Debt / Loan
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 p-4 pt-2">
                {/* Add Custom Debt Inline Form */}
                {showAddDebt && (
                  <form onSubmit={handleAddDebt} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                    <p className="text-xs font-semibold text-amber-200">Add New Debt / Borrowing for {formatMonthLabel(selectedMonth)}</p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <Input
                        placeholder="Debt / Loan Name (e.g. Loan from Friend X)"
                        value={newDebtName}
                        onChange={(e) => setNewDebtName(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Lender / Person Name (e.g. Friend X / Bank)"
                        value={newDebtLender}
                        onChange={(e) => setNewDebtLender(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Total Amount Due (₹)"
                        type="number"
                        min="1"
                        value={newDebtAmount}
                        onChange={(e) => setNewDebtAmount(e.target.value)}
                        className="text-xs"
                      />
                      <Select value={newDebtPriority} onValueChange={(val) => setNewDebtPriority(val as "high" | "normal")}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">🚨 High Priority (Clear before investments)</SelectItem>
                          <SelectItem value="normal">📌 Normal Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Note / Reason (e.g. Emergency borrowing)"
                      value={newDebtNote}
                      onChange={(e) => setNewDebtNote(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddDebt(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-500 text-xs text-white">
                        Save Debt
                      </Button>
                    </div>
                  </form>
                )}

                {/* Debt Cards List with Live Balance and Pay Buttons */}
                <div className="space-y-2.5">
                  {debtPaymentStats.map((debt) => (
                    <div
                      key={debt.id}
                      className={cn(
                        "rounded-xl border p-3.5 space-y-2 transition",
                        debt.isCleared
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : debt.priority === "high"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-white/10 bg-muted/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{debt.name}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] px-1.5 py-0 font-medium",
                                debt.isCleared && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                                !debt.isCleared && debt.priority === "high" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
                                !debt.isCleared && debt.priority === "normal" && "border-sky-500/30 bg-sky-500/10 text-sky-200",
                              )}
                            >
                              {debt.isCleared ? "✓ Cleared" : debt.priority === "high" ? "High Priority" : "Normal"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Target: <span className="font-mono font-medium text-foreground">{formatInr(debt.totalAmount)}</span> · Paid this month: <span className="font-mono text-emerald-300 font-semibold">{formatInr(debt.paidSoFar)}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground uppercase">Remaining Balance</p>
                          <p className={cn(
                            "font-mono text-base font-black",
                            debt.isCleared ? "text-emerald-400" : "text-amber-300",
                          )}>
                            {formatInr(debt.remainingBalance)}
                          </p>
                        </div>
                      </div>

                      <Progress value={debt.percentCleared} className="h-1.5" />

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {debt.percentCleared}% paid ({debt.note || debt.lender})
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!debt.isCleared && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 text-[10px] px-2 font-medium bg-secondary hover:bg-secondary/80 text-foreground"
                              onClick={() => handleQuickPayDebt(debt.id, debt.remainingBalance)}
                            >
                              Pay / Log Partial
                            </Button>
                          )}
                          {debt.id.startsWith("custom-debt-") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6 text-muted-foreground hover:text-red-400"
                              onClick={() => deleteDebt(debt.id.replace("custom-debt-", ""))}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {formatMonthLabel(selectedMonth)} Inflows & Incomes
                    </CardTitle>
                    <CardDescription>
                      All income sources configured for this month.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/15 text-xs"
                    onClick={() => setShowAddIncome(!showAddIncome)}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Income
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 p-4 pt-2">
                {/* Add Income Inline Form */}
                {showAddIncome && (
                  <form onSubmit={handleAddIncome} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-3">
                    <p className="text-xs font-semibold text-emerald-300">Add Income Source for {formatMonthLabel(selectedMonth)}</p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <Input
                        placeholder="e.g., Freelance Project X"
                        value={newIncomeName}
                        onChange={(e) => setNewIncomeName(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Amount (₹)"
                        type="number"
                        min="1"
                        value={newIncomeAmount}
                        onChange={(e) => setNewIncomeAmount(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Expected Date (e.g. Sep 15)"
                        value={newIncomeDate}
                        onChange={(e) => setNewIncomeDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddIncome(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs">
                        Save Inflow
                      </Button>
                    </div>
                  </form>
                )}

                {/* 1. Incomes Breakdown */}
                <BreakdownGroup
                  title="Total Expected Inflow"
                  total={formatInr(monthTotalIncome)}
                  subtitle="Salary + configured freelance sources for this month"
                  badge="Inflow"
                  tone="safe"
                >
                  {currentIncomes.map((source) => (
                    <div key={source.id} className="flex items-center justify-between gap-2 py-1 text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <Switch
                          size="sm"
                          checked={source.status === "received"}
                          onCheckedChange={() => toggleIncomeStatus(source.id)}
                          aria-label={`Toggle received status for ${source.name}`}
                        />
                        <span className="font-medium truncate">{source.name}</span>
                        <span className="text-[11px] text-muted-foreground">({source.expectedDate})</span>
                        {source.status === "received" ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-[9px] px-1 py-0">
                            Received
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatInr(source.amount)}</span>
                        {currentIncomes.length > 1 ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 text-muted-foreground hover:text-red-400"
                            onClick={() => deleteIncome(source.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </BreakdownGroup>

                {/* 2. Outgoing EMIs Breakdown */}
                <BreakdownGroup
                  title="Outgoing EMI Transfers"
                  total={formatInr(monthOutgoingEmis)}
                  subtitle="Personal EMIs + payments sent to Venkat"
                  badge={monthOutgoingEmis === 0 ? "Zero Debt" : "Debited from Bank"}
                  tone={monthOutgoingEmis === 0 ? "safe" : "warn"}
                >
                  {monthOutgoingEmis === 0 ? (
                    <p className="text-xs text-emerald-300 font-medium py-1">
                      🎉 No active outgoing EMIs in this month!
                    </p>
                  ) : (
                    <>
                      {currentPersonalEmis.length > 0 && (
                        <>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 mb-0.5">
                            Personal EMIs ({formatInr(monthPersonalEmisTotal)})
                          </p>
                          {currentPersonalEmis.map((emi) => (
                            <BreakdownItem
                              key={emi.id}
                              name={emi.name}
                              amount={formatInr(emi.amount)}
                              detail={`Ends ${emi.ends}`}
                            />
                          ))}
                        </>
                      )}

                      {currentVenkatPayableEmis.length > 0 && (
                        <>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-0.5">
                            Pay to Venkat ({formatInr(monthVenkatPayableTotal)})
                          </p>
                          {currentVenkatPayableEmis.map((emi) => (
                            <BreakdownItem
                              key={emi.id}
                              name={emi.name}
                              amount={formatInr(emi.amount)}
                              detail={`Ends ${emi.ends}`}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </BreakdownGroup>

                {/* 3. Credit Cards Breakdown Group */}
                <BreakdownGroup
                  title="Credit Card Statement Dues & Spends"
                  total={formatInr(creditCardBill)}
                  subtitle="Card bill payments made separately from bank account"
                  badge={creditCardBill > 0 ? "Card Payment" : "Clean"}
                  tone={creditCardBill > 0 ? "warn" : "safe"}
                >
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-muted-foreground">Statement bill due this month:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{formatInr(creditCardBill)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setCardBillInput(String(creditCardBill));
                          setEditCardBill(!editCardBill);
                        }}
                      >
                        {editCardBill ? "Close" : "Edit"}
                      </Button>
                    </div>
                  </div>

                  {editCardBill && (
                    <form onSubmit={handleSaveCardBill} className="flex items-center gap-2 py-1.5">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Card Bill Due (₹)"
                        value={cardBillInput}
                        onChange={(e) => setCardBillInput(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Button type="submit" size="sm" className="h-7 text-xs px-2.5">
                        Save
                      </Button>
                    </form>
                  )}

                  {isInitialCleanupMonth ? (
                    <>
                      <BreakdownItem name="HDFC Credit Card Bill" amount={formatInr(10000)} detail="Statement due" />
                      <BreakdownItem name="Axis Bank Credit Card Bill" amount={formatInr(5000)} detail="Statement due" />
                      <BreakdownItem name="YES Bank Credit Card Bill" amount={formatInr(5000)} detail="Statement due" />
                    </>
                  ) : creditCardBill > 0 ? (
                    <BreakdownItem name="Configured Card Statement Total" amount={formatInr(creditCardBill)} detail="Paid from bank" />
                  ) : (
                    <p className="text-xs text-emerald-300 py-0.5">
                      ✓ No revolving card bill. Card rule: ₹0 new debt.
                    </p>
                  )}

                  {totalNewCardSpent > 0 && (
                    <div className="mt-1 pt-1 border-t border-white/10 text-xs text-amber-200">
                      <p className="font-medium">Recent Card Spends Logged in App ({formatInr(totalNewCardSpent)}):</p>
                      {hdfcSpent > 0 && <BreakdownItem name="HDFC Card Spend" amount={formatInr(hdfcSpent)} tag="Logged" />}
                      {axisSpent > 0 && <BreakdownItem name="Axis Card Spend" amount={formatInr(axisSpent)} tag="Logged" />}
                      {yesBankSpent > 0 && <BreakdownItem name="YES Bank Card Spend" amount={formatInr(yesBankSpent)} tag="Logged" />}
                    </div>
                  )}
                </BreakdownGroup>

                {/* 4. Living & Overhead Bills */}
                <BreakdownGroup
                  title="Monthly Living Spends & Bills"
                  total={formatInr(monthLivingBudget)}
                  subtitle="Fixed rent/utilities + daily variable living cash"
                >
                  <BreakdownItem name="Room Rent & Overhead Bills" amount={formatInr(6500)} tag="Fixed" />
                  <BreakdownItem name="Gym & Fitness" amount={formatInr(2500)} tag="Fixed" />
                  <BreakdownItem name="Variable Groceries & Daily Needs" amount={formatInr(3000)} tag="Variable" />
                  <BreakdownItem name="Fuel & Bike Maintenance" amount={formatInr(3000)} tag="Variable" />
                  <BreakdownItem
                    name="Miscellaneous Variable Expenses"
                    amount={formatInr(isInitialCleanupMonth ? 3000 : 500)}
                    tag="Misc"
                  />
                </BreakdownGroup>

                {/* 5. Priority Debts (for Sep / Nov) */}
                {(daddyRepayment > 0 || venkatDirectPayment > 0) && (
                  <BreakdownGroup
                    title="Priority Debt Settlements"
                    total={formatInr(daddyRepayment + venkatDirectPayment)}
                    subtitle="Mandatory priority family & personal settlements"
                    badge="Priority"
                    tone="danger"
                  >
                    {daddyRepayment > 0 && <BreakdownItem name="Daddy Repayment" amount={formatInr(daddyRepayment)} detail="Must pay fully" />}
                    {venkatDirectPayment > 0 && <BreakdownItem name="Venkat Direct Settlement" amount={formatInr(venkatDirectPayment)} detail="Clears balance" />}
                  </BreakdownGroup>
                )}

                {/* 6. Buffer & Net Surplus Summary */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Inflow vs Outflows (including cards):</span>
                    <span className="font-mono">{formatInr(monthTotalIncome)} − {formatInr(totalCoreObligations)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Emergency Buffer (Stays safe in bank):</span>
                    <span className="font-mono font-medium text-amber-200">− {formatInr(bufferTarget)}</span>
                  </div>
                  <Separator className="my-1.5 bg-emerald-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-300">Net Surplus to Invest:</span>
                    <span className="font-mono text-xl font-extrabold text-emerald-400">{formatInr(netMonthSurplus)}</span>
                  </div>
                </div>

                {/* Dedicated Venkat Statement & Debit Tracker */}
                {monthVenkatDebitOnNameTotal > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-amber-200">Venkat Statement & Bank Debit Tracker</p>
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] px-1.5 py-0">
                            Tracking only
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          On your name · Auto-debits your account · Venkat pays back before due date
                        </p>
                      </div>
                      <p className="font-mono text-xs font-bold text-amber-200">
                        {formatInr(monthVenkatDebitOnNameTotal)}
                      </p>
                    </div>
                    <div className="border-l-2 border-amber-500/20 pl-2.5 space-y-1 pt-0.5">
                      {currentVenkatOnYourNameEmis.map((emi) => (
                        <BreakdownItem
                          key={emi.id}
                          name={emi.name}
                          amount={formatInr(emi.amount)}
                          detail={emi.note ? `${emi.ends} · ${emi.note}` : `Ends ${emi.ends}`}
                          tag="Reimbursement"
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic">
                      ℹ️ For statement tracking to tell Venkat the exact amount each month. Does not reduce your personal spendable cash.
                    </p>
                  </div>
                )}

                {/* Advance to Next Month Button */}
                {nextMonth && (
                  <Button
                    className="w-full h-11 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground"
                    onClick={() => setSelectedMonth(nextMonth)}
                  >
                    Finish {formatMonthLabel(selectedMonth)} & Plan {formatMonthLabel(nextMonth)} <ArrowRight className="ml-2 size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: EXACT INVESTMENT ENGINE (NO DIPLOMACY) */}
          <TabsContent value="invest" className="mt-4 space-y-4">
            <Card className="border-white/10 shadow-none overflow-hidden">
              <CardHeader className="p-4 pb-2 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-emerald-400" />
                      <CardTitle className="text-lg">Exact Investment Allocation</CardTitle>
                    </div>
                    <CardDescription>
                      Straightaway wealth engine for {formatMonthLabel(selectedMonth)} · No vague options
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs">
                    {investmentPlan.stageName}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-2">
                {/* Clear Debt First Alert if any high-priority debt remains */}
                {totalRemainingHighPriorityDebt > 0 && (
                  <Alert className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-100">
                    <ShieldAlert className="size-4 text-amber-400" />
                    <AlertTitle className="font-bold text-amber-300">Debt Clearance First Priority</AlertTitle>
                    <AlertDescription className="mt-1 text-muted-foreground leading-relaxed">
                      You have <strong className="text-amber-200 font-mono">{formatInr(totalRemainingHighPriorityDebt)}</strong> in active high-priority debt remaining for {formatMonthLabel(selectedMonth)} (e.g. Daddy / Venkat / Card Bills). Allocate your available surplus cash to clear these debts first before locking funds into long-term SIPs!
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-100">
                  <Coins className="size-4" />
                  <AlertTitle className="font-semibold text-emerald-300">The 3-Bucket Battle-Tested Strategy</AlertTitle>
                  <AlertDescription className="mt-1 text-muted-foreground leading-relaxed">
                    {investmentPlan.strategyGuidance} Every rupee is accounted for.
                  </AlertDescription>
                </Alert>

                {/* Exact Funds Breakdown */}
                <div className="space-y-3">
                  {/* Fund 1: Liquid Fund / Emergency */}
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-sky-200">1. {investmentPlan.liquidFundName}</span>
                          <Badge variant="outline" className="border-sky-500/30 text-sky-300 text-[10px] px-1.5 py-0">
                            Emergency Fortress
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{investmentPlan.liquidFundNote}</p>
                      </div>
                      <p className="font-mono text-base font-extrabold text-sky-300">
                        {formatInr(investmentPlan.liquidFundAmount)}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic">
                      Zero market risk · T+1 instant withdrawal to bank · Earns ~7% CAGR vs 2.7% savings.
                    </p>
                  </div>

                  {/* Fund 2: Core Nifty 50 Index */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-200">2. {investmentPlan.niftyIndexFundName}</span>
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0">
                            Core India Index
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{investmentPlan.niftyIndexFundNote}</p>
                      </div>
                      <p className="font-mono text-base font-extrabold text-emerald-300">
                        {formatInr(investmentPlan.niftyIndexFundAmount)}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic">
                      India&apos;s top 50 bluechip giants (Reliance, HDFC, TCS, Infosys) · Lowest 0.18% expense ratio · 13-14% CAGR.
                    </p>
                  </div>

                  {/* Fund 3: Flexi Cap Alpha Engine */}
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-violet-200">3. {investmentPlan.flexiCapFundName}</span>
                          <Badge variant="outline" className="border-violet-500/30 text-violet-300 text-[10px] px-1.5 py-0">
                            Global & Multi-Cap Alpha
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{investmentPlan.flexiCapFundNote}</p>
                      </div>
                      <p className="font-mono text-base font-extrabold text-violet-300">
                        {formatInr(investmentPlan.flexiCapFundAmount)}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic">
                      India&apos;s #1 consistent mutual fund · Indian leaders + Global tech (Alphabet/Microsoft) · 16-18% CAGR track record.
                    </p>
                  </div>
                </div>

                {/* Buffer Sweep Protocol Card */}
                <div className="rounded-xl border border-white/10 bg-muted/30 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">30-Day Buffer Sweep Protocol</p>
                      <p className="text-[11px] text-muted-foreground">
                        On Day 30, transfer any unspent balance from your ₹5,000 buffer into Parag Parikh Liquid Fund.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(bufferSweeps[selectedMonth])}
                      onCheckedChange={() => toggleBufferSweep(selectedMonth)}
                      aria-label="Mark 30-day buffer sweep as executed"
                    />
                  </div>
                  {bufferSweeps[selectedMonth] ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="size-3.5" /> Buffer sweep executed for {formatMonthLabel(selectedMonth)}. Zero cash wasted!
                    </div>
                  ) : null}
                </div>

                {/* Wealth Compounding Projection Calculator */}
                <div className="rounded-xl border border-white/10 bg-muted/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Wealth Compounding Projection (at 13% CAGR)</p>
                    <TrendingUp className="size-4 text-emerald-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-white/10 bg-card/60 p-2.5">
                      <p className="text-muted-foreground text-[10px]">In 3 Years</p>
                      <p className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                        {formatInr(netMonthSurplus >= 30000 ? 1550000 : netMonthSurplus >= 15000 ? 820000 : 450000)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-card/60 p-2.5">
                      <p className="text-muted-foreground text-[10px]">In 5 Years</p>
                      <p className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                        {formatInr(netMonthSurplus >= 30000 ? 2980000 : netMonthSurplus >= 15000 ? 1650000 : 920000)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-card/60 p-2.5">
                      <p className="text-muted-foreground text-[10px]">In 10 Years</p>
                      <p className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                        {formatInr(netMonthSurplus >= 30000 ? 8250000 : netMonthSurplus >= 15000 ? 4600000 : 2550000)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SPEND TRACKER & PARTIAL PAYMENT ENGINE */}
          <TabsContent value="spend" className="mt-4 space-y-4">
            {/* Quick-Pay Debts Chips */}
            {debtPaymentStats.some((d) => !d.isCleared) && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                    Quick-Pay Unpaid Debts ({formatMonthLabel(selectedMonth)})
                  </p>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-[10px]">
                    Tap to auto-fill
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {debtPaymentStats
                    .filter((d) => !d.isCleared)
                    .map((debt) => (
                      <Button
                        key={debt.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-8 text-xs font-medium border-white/15",
                          categoryId === debt.id && "border-amber-400 bg-amber-500/20 text-amber-100 ring-1 ring-amber-400",
                        )}
                        onClick={() => handleQuickPayDebt(debt.id, debt.remainingBalance)}
                      >
                        {debt.name}: <span className="ml-1 font-mono font-bold">{formatInr(debt.remainingBalance)} left</span>
                      </Button>
                    ))}
                </div>
              </div>
            )}

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {editingEntryId ? (
                    <>
                      <Pencil className="size-4 text-amber-400" /> Edit spend or payment
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" /> Add spend or partial debt payment
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {editingEntryId
                    ? "Modify details for this expense and save changes."
                    : "Select living expense or a debt/EMI category to log payments."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <form className="space-y-3" onSubmit={addSpend}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="spendDate">Date</Label>
                      <Input
                        id="spendDate"
                        type="date"
                        max={getLocalDateString()}
                        value={spendDate}
                        onChange={(event) => {
                          const val = event.target.value;
                          const today = getLocalDateString();
                          setSpendDate(val > today ? today : val);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        inputMode="numeric"
                        min="1"
                        placeholder="e.g. 35000"
                        type="number"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paid by</Label>
                      <Select value={paidBy} onValueChange={(value) => setPaidBy(value as SpendEntry["paidBy"])}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>{method.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Spend / Debt Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[320px]">
                        <SelectItem value="groceries">🛒 Groceries & Daily Needs (₹3,000/mo)</SelectItem>
                        <SelectItem value="bike">⛽ Bike Fuel & Maintenance (₹3,000/mo)</SelectItem>
                        <SelectItem value="gym">🏋️ Gym & Fitness (₹2,500/mo)</SelectItem>
                        <SelectItem value="rent">🏠 Room Rent (₹6,000/mo)</SelectItem>
                        <SelectItem value="electricity">⚡ Electricity (₹500/mo)</SelectItem>
                        <SelectItem value="misc">☕ Miscellaneous Living</SelectItem>

                        {/* Debts & Repayments Category Group */}
                        {debtPaymentStats.map((debt) => (
                          <SelectItem key={debt.id} value={debt.id}>
                            {debt.priority === "high" ? "🚨" : "🤝"} {debt.name} ({debt.isCleared ? "Fully Cleared" : `${formatInr(debt.remainingBalance)} balance left`})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note / Remarks</Label>
                    <Input
                      id="note"
                      placeholder="e.g. Partial repayment, UPI transaction..."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </div>

                  {paidBy !== "upi" && paidBy !== "cash" ? (
                    <Alert className="border-amber-500/20 bg-amber-500/10">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Card warning</AlertTitle>
                      <AlertDescription>
                        Current rule is card usage ₹0 until limits recover. Use UPI/cash unless unavoidable.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex items-center gap-2 pt-1">
                    <Button className="h-11 flex-1 text-sm font-semibold" type="submit">
                      {editingEntryId ? "Update Spend Entry" : "Save Spend / Payment"}
                    </Button>
                    {editingEntryId ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 border-white/15"
                        onClick={cancelEditingEntry}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Budget pace</CardTitle>
                <CardDescription>{pace.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Monthly variable spend</span>
                    <span className="font-mono text-muted-foreground">
                      {formatInr(variableSpent)} / {formatInr(variableBudget)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (variableSpent / variableBudget) * 100)} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-white/10 p-3">
                    <p className="text-muted-foreground">Day</p>
                    <p className="mt-1 font-mono text-base">{dayOfMonth}/30</p>
                  </div>
                  <div className="rounded-lg border border-white/10 p-3">
                    <p className="text-muted-foreground">Allowed</p>
                    <p className="mt-1 font-mono text-base">{formatInr(pace.allowedByToday)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 p-3">
                    <p className="text-muted-foreground">Projected</p>
                    <p className="mt-1 font-mono text-base">{formatInr(pace.projectedMonthEnd)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Spend Ledger & History</CardTitle>
                    <CardDescription>
                      {filteredEntries.length
                        ? `Showing ${filteredEntries.length} of ${entries.length} entries`
                        : entries.length
                        ? `No entries match selected date filter (${entries.length} total)`
                        : "No spends yet."}
                    </CardDescription>
                  </div>
                  {/* Date Filter Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "all" ? "default" : "outline"}
                      className="h-7 text-xs px-2.5"
                      onClick={() => setSpendListFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "today" ? "default" : "outline"}
                      className="h-7 text-xs px-2.5"
                      onClick={() => setSpendListFilter("today")}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "yesterday" ? "default" : "outline"}
                      className="h-7 text-xs px-2.5"
                      onClick={() => setSpendListFilter("yesterday")}
                    >
                      Yesterday
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "custom" ? "default" : "outline"}
                      className="h-7 text-xs px-2.5"
                      onClick={() => {
                        setSpendListFilter("custom");
                        if (!spendListCustomDate) setSpendListCustomDate(getLocalDateString());
                      }}
                    >
                      Pick Date
                    </Button>
                  </div>
                </div>

                {/* Custom Date Selector Input */}
                {spendListFilter === "custom" && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="customFilterDate" className="text-xs text-muted-foreground shrink-0">
                        Filter by date:
                      </Label>
                      <Input
                        id="customFilterDate"
                        type="date"
                        max={getLocalDateString()}
                        value={spendListCustomDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const today = getLocalDateString();
                          setSpendListCustomDate(val > today ? today : val);
                        }}
                        className="h-8 text-xs max-w-[180px]"
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {filteredEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                    {entries.length === 0
                      ? "Your spend list is empty. The first entry will start the safe-zone meter."
                      : "No spend entries logged for the selected date filter."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEntries.slice(0, 15).map((entry) => {
                      const category = octoberSeedData.expenses.find((item) => item.id === entry.categoryId);
                      const debtCategory = debtPaymentStats.find((item) => item.id === entry.categoryId);
                      const method = paymentMethods.find((item) => item.id === entry.paidBy)?.label;
                      const displayName = entry.note || debtCategory?.name || category?.name || "Spend";
                      const categoryLabel = debtCategory?.name ? `🤝 Debt: ${debtCategory.name}` : category?.name;
                      const isEditingThis = editingEntryId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                            isEditingThis ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/50" : "border-white/10",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {categoryLabel} · {method} · <span className="font-mono text-foreground/80">{entry.date}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="font-mono text-sm font-semibold mr-1">{formatInr(entry.amount)}</p>
                            <Button
                              aria-label="Edit spend entry"
                              size="icon"
                              type="button"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-amber-300 hover:bg-amber-400/10"
                              onClick={() => startEditingEntry(entry)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              aria-label="Delete spend entry"
                              size="icon"
                              type="button"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                              onClick={() => {
                                if (editingEntryId === entry.id) cancelEditingEntry();
                                setEntries((current) => current.filter((item) => item.id !== entry.id));
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: MULTI-MONTH RUNWAY (2026 - 2028) */}
          <TabsContent value="runway" className="mt-4 space-y-4">
            <Card className="overflow-hidden border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="size-4" /> Salary-only Runway & Roadmap to Zero EMI
                </CardTitle>
                <CardDescription>
                  Shows month-by-month trajectory until 100% of tracked loans expire.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-2">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/10 bg-muted/40 p-3">
                    <p className="text-muted-foreground">Future living budget</p>
                    <p className="mt-1 font-mono text-lg">{formatInr(octoberSeedData.futureMonthlyLivingBudget)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-muted/40 p-3">
                    <p className="text-muted-foreground">Zero EMI month</p>
                    <p className="mt-1 font-mono text-lg">{firstZeroEmiMonth?.label ?? "TBD"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-muted/40 p-3">
                    <p className="text-muted-foreground">Free cash (&gt;₹20k)</p>
                    <p className="mt-1 font-mono text-lg">{monthPreviews.filter((p) => p.youKeepThisMonth >= 20000).length} months</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {monthPreviews.map((preview) => (
                <Card
                  key={preview.month}
                  className={cn(
                    "border-white/10 bg-card/80 shadow-none transition hover:border-white/20 cursor-pointer",
                    selectedMonth === preview.month && "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30",
                  )}
                  onClick={() => setSelectedMonth(preview.month)}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold tracking-tight">{preview.label}</p>
                          {selectedMonth === preview.month && (
                            <Badge className="bg-emerald-600 text-[10px] px-1.5 py-0">Active View</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{preview.milestone}</p>
                      </div>
                      <ForecastBadge status={preview.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                      <div className="rounded-lg border border-white/10 p-2">
                        <p className="text-muted-foreground text-[10px]">Salary</p>
                        <p className="mt-1 font-mono text-xs font-semibold">{formatInr(preview.salaryIncome)}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2">
                        <p className="text-muted-foreground text-[10px]">My EMI</p>
                        <p className="mt-1 font-mono text-xs font-semibold">{formatInr(preview.personalEmis)}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2">
                        <p className="text-muted-foreground text-[10px]">Pay Venkat</p>
                        <p className="mt-1 font-mono text-xs font-semibold">{formatInr(preview.venkatPayableEmis)}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2">
                        <p className="text-muted-foreground text-[10px]">Living</p>
                        <p className="mt-1 font-mono text-xs font-semibold">{formatInr(preview.livingBudget)}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2">
                        <p className="text-muted-foreground text-[10px]">Buffer</p>
                        <p className="mt-1 font-mono text-xs font-semibold">{formatInr(preview.bufferTarget)}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                        <p className="text-emerald-300 text-[10px]">Surplus</p>
                        <p className="mt-1 font-mono text-xs font-bold text-emerald-400">{formatInr(preview.youKeepThisMonth)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 5: EMIs DIRECTORY */}
          <TabsContent value="emis" className="mt-4 space-y-4">
            <Alert className="border-sky-500/20 bg-sky-500/10">
              <TrendingDown className="size-4" />
              <AlertTitle>EMI classification & tracking overview</AlertTitle>
              <AlertDescription>
                Personal EMIs and Pay-to-Venkat EMIs are outgoing from your salary. The EMIs on your name for Venkat ({formatInr(monthVenkatDebitOnNameTotal)}) debit from your bank account and are reimbursed by Venkat before due dates.
              </AlertDescription>
            </Alert>

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingDown className="size-4" /> My personal EMIs
                </CardTitle>
                <CardDescription>Only the EMIs that are purely yours. Total: {formatInr(sumAmounts(octoberSeedData.personalEmis))} / month</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {octoberSeedData.personalEmis.map((emi) => (
                  <LineItem key={emi.id} name={emi.name} value={formatInr(emi.amount)} helper={`Ends ${emi.ends}`} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bike className="size-4" /> I pay Venkat monthly
                </CardTitle>
                <CardDescription>These are the EMI amounts you send to Venkat. Total: {formatInr(sumAmounts(octoberSeedData.venkatPayableEmis))} / month</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {octoberSeedData.venkatPayableEmis.map((emi) => (
                  <LineItem key={emi.id} name={emi.name} value={formatInr(emi.amount)} helper={`Ends ${emi.ends}`} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-none">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bike className="size-4" /> Venkat pays me monthly (statement tracker)
                  </CardTitle>
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px]">
                    Reimbursement
                  </Badge>
                </div>
                <CardDescription>
                  Loans on your name that auto-debit your bank. Track them here to tell Venkat to reimburse before due dates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {octoberSeedData.venkatReceivableEmis.map((emi) => (
                  <LineItem key={emi.id} name={emi.name} value={formatInr(emi.amount)} helper={emi.note ? `${emi.ends} · ${emi.note}` : `Ends ${emi.ends}`} />
                ))}
              </CardContent>
            </Card>

            <Button className="w-full" type="button" variant="outline" onClick={resetLocalData}>
              <RefreshCcw className="size-4 mr-2" /> Reset local app data
            </Button>
          </TabsContent>

          {/* TAB 6: CREDIT CARD OPTIMIZER & LIMIT MULTIPLIER */}
          <TabsContent value="cards" className="mt-4 space-y-4">
            {/* Header / Strategy Mode Banner */}
            <Card className="border-white/10 shadow-none overflow-hidden">
              <CardHeader className="p-4 pb-2 bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-emerald-400" />
                      <CardTitle className="text-lg">Credit Profile & Limit Multiplier Suite</CardTitle>
                    </div>
                    <CardDescription>
                      Master strategy for 800+ CIBIL score & automatic limit increases
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs w-fit">
                    Target: 800+ CIBIL Profile
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 p-4 pt-2">
                {/* Aggregate Limit & Utilization Speedometer */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                  <div className="rounded-xl border border-white/10 bg-muted/40 p-3">
                    <p className="text-muted-foreground text-[10px]">Combined Credit Limit</p>
                    <p className="mt-1 font-mono text-base font-bold text-foreground">{formatInr(82000)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">3 Active Cards</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-muted/40 p-3">
                    <p className="text-muted-foreground text-[10px]">Current Available</p>
                    <p className="mt-1 font-mono text-base font-bold text-emerald-300">{formatInr(57561)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">70.2% Available</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-muted/40 p-3">
                    <p className="text-muted-foreground text-[10px]">September Strategy</p>
                    <p className="mt-1 font-mono text-base font-bold text-amber-300">100% Freeze</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">₹0 Card Usage</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-emerald-300 text-[10px]">Future Safe Monthly Cap</p>
                    <p className="mt-1 font-mono text-base font-bold text-emerald-400">{formatInr(10000)}/mo</p>
                    <p className="text-[10px] text-emerald-300/80 mt-0.5">12.2% Sweet Spot</p>
                  </div>
                </div>

                {/* Strategy Phase Guidance (Von Restorff Effect & Law of Common Region) */}
                <Alert className={cn(
                  "border",
                  isInitialCleanupMonth
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
                )}>
                  <ShieldAlert className="size-4" />
                  <AlertTitle className="font-semibold">
                    {isInitialCleanupMonth
                      ? "Phase 1 (Sep – Oct 2026): Total Freeze & Limit Restoration"
                      : "Phase 2 (Nov 2026 Onward): The 12% Sweet Spot Limit Multiplier"}
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {isInitialCleanupMonth ? (
                      <>
                        <strong className="text-amber-200">Rule: ₹0 new card usage.</strong> Axis is at 50% utilization (penalty zone) and HDFC is at 37.5%. Clearing the ₹20,000 statement in October restores 100% of limits and triggers an immediate 25–40 point CIBIL score jump!
                      </>
                    ) : (
                      <>
                        <strong className="text-emerald-200">Optimal Spend: ₹10,000 / month across all cards.</strong> This maintains 12.2% utilization (the golden zone for automatic credit limit enhancements and pre-approved zero-fee upgrades).
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* CARD-BY-CARD EXACT SPEND ALLOCATION (Hick's Law & Law of Proximity) */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Exact Card-by-Card Spend Allocation (From Nov 2026 Onward)
              </p>

              {/* CARD 1: HDFC BANK CREDIT CARD */}
              <Card className="border-sky-500/30 bg-card shadow-none overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-sky-300">1. HDFC Bank Credit Card</span>
                        <Badge variant="outline" className="border-sky-500/30 text-sky-200 text-[10px] px-1.5 py-0">
                          Primary Card
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Credit Limit: <span className="font-mono font-semibold text-foreground">{formatInr(40000)}</span> · Available: <span className="font-mono">{formatInr(25000)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Safe Monthly Cap</p>
                      <p className="font-mono text-lg font-black text-sky-300">{formatInr(6000)}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">15.0% Utilization</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-sky-500/5 border border-sky-500/15 p-2.5 space-y-1 text-xs">
                    <p className="font-semibold text-sky-200">🛒 Best Category to Route: Fuel & Grocery Purchases</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      • Spend ₹3,000 on Fuel + ₹3,000 on Groceries monthly.<br />
                      • <strong>Limit Growth Strategy:</strong> HDFC algorithms trigger automatic limit increases (up to ₹75,000–₹1,00,000) every 6–9 months when card utilization remains steady at 12–15% and paid 100% in full.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: YES BANK CREDIT CARD */}
              <Card className="border-emerald-500/30 bg-card shadow-none overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-emerald-300">2. YES Bank Credit Card</span>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0">
                          Utility & Bills
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Credit Limit: <span className="font-mono font-semibold text-foreground">{formatInr(27000)}</span> · Available: <span className="font-mono">{formatInr(25061)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Safe Monthly Cap</p>
                      <p className="font-mono text-lg font-black text-emerald-300">{formatInr(2500)}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">9.2% Utilization</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-2.5 space-y-1 text-xs">
                    <p className="font-semibold text-emerald-200">⚡ Best Category to Route: Electricity, Gym, & Subscriptions</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      • Set up autopay for your Gym partial (₹2,500) or Room Electricity bills.<br />
                      • <strong>Limit Growth Strategy:</strong> Consistent recurring utility billing builds an unbroken 100% on-time payment track record on CIBIL.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: AXIS BANK CREDIT CARD */}
              <Card className="border-violet-500/30 bg-card shadow-none overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-violet-300">3. Axis Bank Credit Card</span>
                        <Badge variant="outline" className="border-violet-500/30 text-violet-200 text-[10px] px-1.5 py-0">
                          Dining & Online
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Credit Limit: <span className="font-mono font-semibold text-foreground">{formatInr(15000)}</span> · Available: <span className="font-mono">{formatInr(7500)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Safe Monthly Cap</p>
                      <p className="font-mono text-lg font-black text-violet-300">{formatInr(1500)}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">10.0% Utilization</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-violet-500/5 border border-violet-500/15 p-2.5 space-y-1 text-xs">
                    <p className="font-semibold text-violet-200">🍽️ Best Category to Route: Dining, Food Delivery, or Small Online Buys</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      • <strong>Crucial Warning:</strong> Because Axis limit is ₹15,000, spending even ₹4,500 exceeds 30% utilization and hurts your score. Keep spend capped strictly at ₹1,500.<br />
                      • <strong>Limit Growth Strategy:</strong> Keeping Axis under ₹1,500 prompts Axis to upgrade your limit to ₹40,000–₹50,000.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* INTEGRATION WITH MONTHLY LIVING BUDGET (Law of Closure & Prägnanz) */}
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Budget Substitution Breakdown (Zero Extra Expense)
                </p>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-[10px]">
                  Inside Living Budget
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Card spending is <strong>never additional money</strong>. You simply route ₹10,000 of your existing ₹15,500 living expenses through cards to harvest points and boost CIBIL, then settle 100% on Day 1 from your salary:
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border border-white/10 bg-card/60 p-2.5">
                  <p className="text-muted-foreground text-[10px]">Total Living Budget</p>
                  <p className="mt-1 font-mono font-bold text-foreground text-sm">{formatInr(15500)}</p>
                </div>
                <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2.5">
                  <p className="text-sky-200 text-[10px]">Routed via 3 Cards</p>
                  <p className="mt-1 font-mono font-bold text-sky-300 text-sm">{formatInr(10000)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-card/60 p-2.5">
                  <p className="text-muted-foreground text-[10px]">Remaining UPI / Cash</p>
                  <p className="mt-1 font-mono font-bold text-foreground text-sm">{formatInr(5500)}</p>
                </div>
              </div>
            </div>

            {/* THE 4 PILLARS FOR 800+ CIBIL SCORE & RAPID LIMIT DOUBLING */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-400" />
                <p className="font-bold text-emerald-300">The 4 Golden Rules for Rapid Limit Doubling</p>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px] leading-relaxed pl-1">
                <li>• <strong>1. The 15% Sweet Spot:</strong> Never let any single card statement exceed 15–20% of its limit.</li>
                <li>• <strong>2. 100% Total Amount Due Payment:</strong> Never pay only &quot;Minimum Due&quot; (which triggers 42% APR interest and penalizes CIBIL).</li>
                <li>• <strong>3. Zero Rolling Revolving Balance:</strong> Pay statements before the due date so credit bureau reports 0 overdue days.</li>
                <li>• <strong>4. 6-Month Review Timing:</strong> After 6 months of steady Phase 2 usage (around May 2027), request limit enhancements directly via HDFC/Axis NetBanking apps.</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

