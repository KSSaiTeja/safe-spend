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
  Calendar,
  Check,
  Zap,
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

const paymentMethods: Array<{ id: SpendEntry["paidBy"]; label: string; icon: string }> = [
  { id: "upi", label: "UPI", icon: "⚡" },
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "hdfc", label: "HDFC Card", icon: "💳" },
  { id: "axis", label: "Axis Card", icon: "💳" },
  { id: "yes-bank", label: "YES Bank Card", icon: "💳" },
];

const categoryOptions = [
  { id: "groceries", label: "Groceries & Daily Needs", icon: "🛒", budget: "₹3,000/mo", color: "from-amber-50 to-orange-50 border-amber-200" },
  { id: "bike", label: "Bike Fuel & Maintenance", icon: "⛽", budget: "₹3,000/mo", color: "from-blue-50 to-cyan-50 border-blue-200" },
  { id: "gym", label: "Gym & Fitness", icon: "🏋️", budget: "₹2,500/mo", color: "from-purple-50 to-pink-50 border-purple-200" },
  { id: "rent", label: "Room Rent", icon: "🏠", budget: "₹6,000/mo", color: "from-emerald-50 to-teal-50 border-emerald-200" },
  { id: "electricity", label: "Electricity", icon: "⚡", budget: "₹500/mo", color: "from-yellow-50 to-amber-50 border-yellow-200" },
  { id: "misc", label: "Miscellaneous Living", icon: "☕", budget: "₹3,000/mo", color: "from-slate-50 to-indigo-50 border-slate-200" },
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
    green: "Safe Zone",
    yellow: "Careful Pace",
    red: "Pause Non-Essential",
  }[status];

  return (
    <Badge
      className={cn(
        "border px-3 py-1 text-xs font-black rounded-lg shadow-xs transition-all",
        status === "green" && "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-emerald-100",
        status === "yellow" && "border-amber-300 bg-amber-100 text-amber-950 shadow-amber-100",
        status === "red" && "border-rose-300 bg-rose-100 text-rose-900 shadow-rose-100",
      )}
      variant="outline"
    >
      {copy}
    </Badge>
  );
}

function ForecastBadge({ status }: { status: "tight" | "stable" | "free" | "emi-zero" }) {
  const copy = {
    tight: "Tight Budget",
    stable: "Stable Cashflow",
    free: "Freeing Up",
    "emi-zero": "Zero EMI Freedom 🎉",
  }[status];

  return (
    <Badge
      className={cn(
        "border px-3 py-1 text-xs font-black rounded-lg shadow-xs transition-all",
        status === "tight" && "border-amber-300 bg-amber-100 text-amber-950",
        status === "stable" && "border-sky-300 bg-sky-100 text-sky-950",
        status === "free" && "border-emerald-300 bg-emerald-100 text-emerald-950",
        status === "emi-zero" && "border-violet-300 bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-950 shadow-violet-100 font-extrabold",
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
  tone?: "default" | "safe" | "warn" | "danger" | "info";
}) {
  return (
    <Card className={cn(
      "overflow-hidden border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-2xl bg-white",
      tone === "default" && "border-slate-200/90",
      tone === "safe" && "border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30",
      tone === "warn" && "border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30",
      tone === "danger" && "border-rose-200 bg-gradient-to-br from-rose-50/60 via-white to-pink-50/30",
      tone === "info" && "border-sky-200 bg-gradient-to-br from-sky-50/60 via-white to-blue-50/30",
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{value}</p>
            <p className="mt-1.5 text-xs font-semibold text-slate-600 leading-relaxed">{detail}</p>
          </div>
          <div
            className={cn(
              "rounded-xl border p-2.5 shadow-sm shrink-0",
              tone === "default" && "border-slate-200 bg-slate-100 text-slate-700",
              tone === "safe" && "border-emerald-300 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
              tone === "warn" && "border-amber-300 bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/20",
              tone === "danger" && "border-rose-300 bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/20",
              tone === "info" && "border-sky-300 bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sky-500/20",
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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
  const totalCoreObligations =
    monthOutgoingEmis + monthLivingBudget + monthOneTimeTotal + creditCardBill + daddyRepayment + venkatDirectPayment + monthCustomDebtsTotal;

  const netMonthSurplus = Math.max(0, monthTotalIncome - totalCoreObligations - bufferTarget);

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
        note: "Remaining Venkat balance payoff",
      });
    }

    // 2. Custom User Added Debts for Selected Month
    currentCustomDebts.forEach((d) => {
      list.push({
        id: `custom-debt-${d.id}`,
        name: d.name,
        lender: d.lender,
        totalAmount: d.totalAmount,
        categoryType: "person",
        priority: d.priority,
        note: d.note,
      });
    });

    // 3. Outgoing EMIs
    currentPersonalEmis.forEach((e) => {
      list.push({
        id: `emi-personal-${e.id}`,
        name: `${e.name} EMI`,
        lender: "Bank/App",
        totalAmount: e.amount,
        categoryType: "emi",
        priority: "normal",
        note: `Ends ${e.ends}`,
      });
    });

    currentVenkatPayableEmis.forEach((e) => {
      list.push({
        id: `emi-venkat-payable-${e.id}`,
        name: `${e.name} EMI (to Venkat)`,
        lender: "Venkat Shared EMI",
        totalAmount: e.amount,
        categoryType: "emi",
        priority: "normal",
        note: `Ends ${e.ends}`,
      });
    });

    // 4. Credit Card Cleared Bill
    if (creditCardBill > 0) {
      list.push({
        id: `card-bill-${selectedMonth}`,
        name: `Credit Card Settlement`,
        lender: "Banks (HDFC/Axis/Yes)",
        totalAmount: creditCardBill,
        categoryType: "card",
        priority: "high",
        note: "Clear card dues to stop high interest",
      });
    }

    return list;
  }, [
    isInitialCleanupMonth,
    selectedMonth,
    currentCustomDebts,
    currentPersonalEmis,
    currentVenkatPayableEmis,
    creditCardBill,
  ]);

  // Debt Payment tracker calculations
  const debtPaymentStats = useMemo(() => {
    return allTrackedDebts.map((debt) => {
      const paid = entries
        .filter((entry) => entry.categoryId === debt.id)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const remainingBalance = Math.max(0, debt.totalAmount - paid);
      const isCleared = remainingBalance === 0;

      return {
        ...debt,
        paidSoFar: paid,
        remainingBalance,
        isCleared,
      };
    });
  }, [allTrackedDebts, entries]);

  const totalDebtsOriginalTotal = useMemo(
    () => debtPaymentStats.reduce((acc, d) => acc + d.totalAmount, 0),
    [debtPaymentStats],
  );
  const totalDebtsPaidSoFar = useMemo(
    () => debtPaymentStats.reduce((acc, d) => acc + d.paidSoFar, 0),
    [debtPaymentStats],
  );
  const totalRemainingPendingOutflows = useMemo(
    () => debtPaymentStats.reduce((acc, d) => acc + d.remainingBalance, 0),
    [debtPaymentStats],
  );

  // Live Bank Liquidity Manager calculation
  const currentLiveBankBalance = Math.max(0, monthIncomeReceived - totalDebtsPaidSoFar);
  const liveCashNeededInBank = totalRemainingPendingOutflows + bufferTarget;

  // Buffer sweep surplus status
  const isBufferSweepActive = bufferSweeps[selectedMonth] ?? false;
  const netBufferSweepSurplus = isBufferSweepActive ? bufferTarget : 0;
  const projectedSurplusAboveBuffer = netMonthSurplus + netBufferSweepSurplus;

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
      month: selectedMonth,
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

  function resetLocalData() {
    setEntries([]);
    setMonthlyIncomes({});
    setMonthlyCardBills({});
    setCustomDebts({});
    setBufferSweeps({});
  }

  const activeEmiCount = currentPersonalEmis.length + currentVenkatPayableEmis.length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 text-slate-900 pb-20 font-sans">
      {/* Vibrant Light Header & Month Pill Stepper */}
      <header className="sticky top-0 z-30 border-b border-indigo-100/80 bg-white/90 px-4 py-3.5 backdrop-blur-md shadow-xs sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-2.5 text-white shadow-md shadow-indigo-500/25">
              <Landmark className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">SafeSpend Pro</span>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                  Active Engine
                </Badge>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Financial Command Center</h1>
            </div>
          </div>

          {/* Interactive Month Picker Pill */}
          <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-slate-700 hover:bg-white hover:shadow-xs rounded-xl"
              disabled={!prevMonth}
              onClick={() => prevMonth && setSelectedMonth(prevMonth)}
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Quick Month Dropdown / Selector Pill */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-xl border border-indigo-200 text-xs sm:text-sm font-extrabold text-indigo-950 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {allForecastMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {m.value === "2028-05" ? "🎉 Zero EMI" : ""}
                </option>
              ))}
            </select>

            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-slate-700 hover:bg-white hover:shadow-xs rounded-xl"
              disabled={!nextMonth}
              onClick={() => nextMonth && setSelectedMonth(nextMonth)}
              title="Next Month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <section className="space-y-5 px-4 py-6 sm:px-6">
        {/* Month Highlight Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/20 to-white p-4 sm:p-5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900">{formatMonthLabel(selectedMonth)}</span>
              <ForecastBadge
                status={activeEmiCount === 0 ? "emi-zero" : netMonthSurplus >= 20000 ? "free" : netMonthSurplus >= 8000 ? "stable" : "tight"}
              />
            </div>
            <p className="text-xs font-semibold text-slate-600">
              {activeEmiCount === 0
                ? "🎉 Complete Financial Freedom! Zero outgoing EMI obligations."
                : `${activeEmiCount} active outgoing EMIs (${formatInr(monthOutgoingEmis)}/mo).`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl"
              onClick={resetLocalData}
              title="Reset entries to default seed data"
            >
              <RefreshCcw className="mr-1.5 size-3.5 text-slate-500" /> Reset Seed Data
            </Button>
          </div>
        </div>

        {/* Top 4 Vibrant Metric Cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <MetricCard
            title="Total Income"
            value={formatInr(monthTotalIncome)}
            detail={`Received: ${formatInr(monthIncomeReceived)}`}
            icon={IndianRupee}
            tone="info"
          />
          <MetricCard
            title="Outgoing EMIs"
            value={formatInr(monthOutgoingEmis)}
            detail={`${currentPersonalEmis.length} Personal · ${currentVenkatPayableEmis.length} Venkat`}
            icon={CreditCardIcon}
            tone={monthOutgoingEmis > 20000 ? "warn" : "default"}
          />
          <MetricCard
            title="Live Bank Balance"
            value={formatInr(currentLiveBankBalance)}
            detail={currentLiveBankBalance >= liveCashNeededInBank ? "✓ Safety buffer intact" : "⚠️ Needs cash injection"}
            icon={Landmark}
            tone={currentLiveBankBalance >= liveCashNeededInBank ? "safe" : "danger"}
          />
          <MetricCard
            title="Must Keep in Bank"
            value={formatInr(liveCashNeededInBank)}
            detail={`Pending: ${formatInr(totalRemainingPendingOutflows)} + ₹5k buffer`}
            icon={PiggyBank}
            tone="safe"
          />
        </div>

        {/* HeroUI-Inspired Vibrant Light Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 sm:grid-cols-6 bg-slate-200/80 p-1.5 rounded-2xl gap-1.5 border border-slate-200/90 shadow-2xs">
            <TabsTrigger value="plan" className="text-xs sm:text-sm font-bold rounded-xl py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/20 transition-all text-slate-700 hover:text-slate-900">Plan</TabsTrigger>
            <TabsTrigger value="invest" className="text-xs sm:text-sm font-black rounded-xl py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/20 transition-all text-emerald-800 hover:text-emerald-950">Invest</TabsTrigger>
            <TabsTrigger value="spend" className="text-xs sm:text-sm font-bold rounded-xl py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/20 transition-all text-slate-700 hover:text-slate-900">Spend</TabsTrigger>
            <TabsTrigger value="runway" className="text-xs sm:text-sm font-bold rounded-xl py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/20 transition-all text-slate-700 hover:text-slate-900">Runway</TabsTrigger>
            <TabsTrigger value="emis" className="text-xs sm:text-sm font-bold rounded-xl py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/20 transition-all text-slate-700 hover:text-slate-900">EMIs</TabsTrigger>
            <TabsTrigger value="cards" className="text-xs sm:text-sm font-bold rounded-xl py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/20 transition-all text-slate-700 hover:text-slate-900">Cards</TabsTrigger>
          </TabsList>

          {/* TAB 1: MONTH PLAN & CASHFLOW */}
          <TabsContent value="plan" className="mt-4 space-y-4">
            {/* Dynamic Live Bank Account Card */}
            <div className="rounded-2xl border border-sky-300/80 bg-gradient-to-br from-sky-50 via-white to-blue-50/40 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className="size-5 text-sky-600" />
                    <p className="text-base font-extrabold text-sky-950">
                      Live Bank Balance & Liquidity Manager ({formatMonthLabel(selectedMonth)})
                    </p>
                  </div>
                  <p className="text-xs text-sky-800 mt-0.5 font-semibold">
                    Automatically subtracts debts, EMIs, card bills, and living spends as you pay them.
                  </p>
                </div>
                <div className="text-left sm:text-right bg-white p-3.5 rounded-xl border border-sky-200 shadow-2xs">
                  <p className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider">Must Maintain in Bank Right Now</p>
                  <p className="font-mono text-2xl font-black text-sky-950">{formatInr(liveCashNeededInBank)}</p>
                  <p className="text-[11px] font-bold text-sky-700">
                    {totalRemainingPendingOutflows > 0
                      ? `${formatInr(totalRemainingPendingOutflows)} pending + ₹5k buffer`
                      : "✓ All outflows cleared! ₹5k buffer intact"}
                  </p>
                </div>
              </div>

              {/* Progress: Cleared vs Remaining Required */}
              <div className="space-y-2 rounded-xl bg-white p-4 border border-sky-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-extrabold text-sky-950">
                  <span>Outflows Settled vs Pending</span>
                  <span className="font-mono text-slate-800">
                    {formatInr(totalDebtsPaidSoFar)} cleared / {formatInr(totalDebtsOriginalTotal)} total
                  </span>
                </div>
                <Progress value={totalDebtsOriginalTotal > 0 ? (totalDebtsPaidSoFar / totalDebtsOriginalTotal) * 100 : 100} className="h-2.5 bg-sky-100" />
              </div>
            </div>

            {/* Income Manager */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-900">Income Streams ({formatMonthLabel(selectedMonth)})</CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-medium">Toggle switch when salary/freelance money lands in bank.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
                    onClick={() => setShowAddIncome(!showAddIncome)}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Income
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                {showAddIncome && (
                  <form onSubmit={handleAddIncome} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                    <p className="text-xs font-extrabold text-indigo-950">Add Extra Income Stream for {formatMonthLabel(selectedMonth)}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Input
                        placeholder="Source name (e.g. Freelance)"
                        value={newIncomeName}
                        onChange={(e) => setNewIncomeName(e.target.value)}
                        className="bg-white border-slate-200 text-xs rounded-xl"
                      />
                      <Input
                        placeholder="Amount (₹)"
                        type="number"
                        value={newIncomeAmount}
                        onChange={(e) => setNewIncomeAmount(e.target.value)}
                        className="bg-white border-slate-200 text-xs rounded-xl"
                      />
                      <Input
                        placeholder="Expected date (e.g. Mid Sep)"
                        value={newIncomeDate}
                        onChange={(e) => setNewIncomeDate(e.target.value)}
                        className="bg-white border-slate-200 text-xs rounded-xl"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" type="submit" className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Save Income</Button>
                      <Button size="sm" type="button" variant="ghost" className="h-8 text-xs text-slate-600 rounded-xl" onClick={() => setShowAddIncome(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {currentIncomes.map((source) => (
                    <div key={source.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 bg-white hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900">{source.name}</p>
                          <Badge variant="outline" className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-md", source.status === "received" ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-slate-300 bg-slate-100 text-slate-700")}>
                            {source.status === "received" ? "✓ Received" : `Pending (${source.expectedDate})`}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm font-black text-slate-900">{formatInr(source.amount)}</p>
                        <Switch
                          checked={source.status === "received"}
                          onCheckedChange={() => toggleIncomeStatus(source.id)}
                          aria-label={`Toggle status for ${source.name}`}
                        />
                        {monthlyIncomes[selectedMonth] && (
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600 rounded-lg" onClick={() => deleteIncome(source.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Debts Manager */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-900">Custom Debts & Loans ({formatMonthLabel(selectedMonth)})</CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-medium">Track loans from friends, private lenders, or apps.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold border-amber-200 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl"
                    onClick={() => setShowAddDebt(!showAddDebt)}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Debt
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                {showAddDebt && (
                  <form onSubmit={handleAddDebt} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                    <p className="text-xs font-extrabold text-amber-950">Add New Debt / Loan Item</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Input placeholder="Debt name (e.g. Friend Loan)" value={newDebtName} onChange={(e) => setNewDebtName(e.target.value)} className="bg-white border-slate-200 text-xs rounded-xl" />
                      <Input placeholder="Lender name" value={newDebtLender} onChange={(e) => setNewDebtLender(e.target.value)} className="bg-white border-slate-200 text-xs rounded-xl" />
                      <Input placeholder="Total Amount (₹)" type="number" value={newDebtAmount} onChange={(e) => setNewDebtAmount(e.target.value)} className="bg-white border-slate-200 text-xs rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" type="submit" className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl">Save Debt</Button>
                      <Button size="sm" type="button" variant="ghost" className="h-8 text-xs text-slate-600 rounded-xl" onClick={() => setShowAddDebt(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {currentCustomDebts.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium italic">No custom debts logged for {formatMonthLabel(selectedMonth)}.</p>
                ) : (
                  <div className="space-y-2">
                    {currentCustomDebts.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 bg-white">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{d.name} ({d.lender})</p>
                          {d.note && <p className="text-xs text-slate-500">{d.note}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-sm font-black text-slate-900">{formatInr(d.totalAmount)}</p>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600 rounded-lg" onClick={() => deleteDebt(d.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: WEALTH INVESTMENT ENGINE */}
          <TabsContent value="invest" className="mt-4 space-y-4">
            <Card className="overflow-hidden border-emerald-200 shadow-sm rounded-2xl bg-white">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-yellow-300" />
                  <h2 className="text-lg font-black">{investmentPlan.stageName} ({formatMonthLabel(selectedMonth)})</h2>
                </div>
                <p className="text-xs text-emerald-100 mt-1 font-semibold">{investmentPlan.strategyGuidance}</p>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">Total Monthly Surplus Invested</span>
                    <span className="font-mono text-2xl font-black text-emerald-900">{formatInr(investmentPlan.totalInvestedThisMonth)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Fund Allocation Breakdown:</p>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/80 space-y-1.5">
                    <div className="flex justify-between text-sm font-extrabold text-slate-900">
                      <span>{investmentPlan.liquidFundName}</span>
                      <span className="font-mono text-emerald-700">{formatInr(investmentPlan.liquidFundAmount)}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">{investmentPlan.liquidFundNote}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/80 space-y-1.5">
                    <div className="flex justify-between text-sm font-extrabold text-slate-900">
                      <span>{investmentPlan.niftyIndexFundName}</span>
                      <span className="font-mono text-emerald-700">{formatInr(investmentPlan.niftyIndexFundAmount)}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">{investmentPlan.niftyIndexFundNote}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/80 space-y-1.5">
                    <div className="flex justify-between text-sm font-extrabold text-slate-900">
                      <span>{investmentPlan.flexiCapFundName}</span>
                      <span className="font-mono text-emerald-700">{formatInr(investmentPlan.flexiCapFundAmount)}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">{investmentPlan.flexiCapFundNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SPEND TRACKER & PARTIAL PAYMENT ENGINE */}
          <TabsContent value="spend" className="mt-4 space-y-4">
            {/* Form Card */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                  {editingEntryId ? (
                    <>
                      <Pencil className="size-5 text-amber-600" /> Edit Spend or Payment Entry
                    </>
                  ) : (
                    <>
                      <Plus className="size-5 text-indigo-600" /> Add Spend or Debt Payment
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  {editingEntryId ? "Update entry details below and save changes." : "Log daily expenses or debt payoffs. Interactive category & payment pills below!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2">
                <form className="space-y-4" onSubmit={addSpend}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="spendDate" className="text-xs font-bold text-slate-700">Date of Expense</Label>
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
                        className="bg-white border-slate-200 text-sm h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amount" className="text-xs font-bold text-slate-700">Amount (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm font-bold text-indigo-600">₹</span>
                        <Input
                          id="amount"
                          inputMode="numeric"
                          min="1"
                          placeholder="e.g. 3500"
                          type="number"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="bg-white border-slate-200 text-sm h-10 pl-7 font-mono font-bold text-slate-900 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Practical Category Selection Cards (Replaces Select Dropdown) */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Select Expense Category</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categoryOptions.map((cat) => {
                        const isSelected = categoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoryId(cat.id)}
                            className={cn(
                              "flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                              isSelected
                                ? "bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border-2 border-indigo-600 text-indigo-950 font-bold shadow-xs ring-2 ring-indigo-500/20"
                                : "bg-white border-slate-200/90 text-slate-700 hover:border-indigo-300 hover:bg-slate-50",
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-bold">{cat.icon} {cat.label}</span>
                              {isSelected && <Check className="size-4 text-indigo-600 shrink-0" />}
                            </div>
                            <span className={cn("text-[11px] mt-1 font-semibold", isSelected ? "text-indigo-700" : "text-slate-500")}>
                              {cat.budget}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Debt Category Chips */}
                    {debtPaymentStats.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Or Select Debt / Repayment Category:</p>
                        <div className="flex flex-wrap gap-2">
                          {debtPaymentStats.map((debt) => {
                            const isSelected = categoryId === debt.id;
                            return (
                              <button
                                key={debt.id}
                                type="button"
                                onClick={() => {
                                  setCategoryId(debt.id);
                                  if (!amount && debt.remainingBalance > 0) setAmount(String(debt.remainingBalance));
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                                  isSelected
                                    ? "bg-amber-100 border-2 border-amber-500 text-amber-950 shadow-xs"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                                )}
                              >
                                <span>{debt.priority === "high" ? "🚨" : "🤝"}</span>
                                <span>{debt.name}</span>
                                <span className="font-mono text-[11px] opacity-80">({debt.isCleared ? "Cleared" : formatInr(debt.remainingBalance)})</span>
                                {isSelected && <Check className="size-3.5 text-amber-700 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Practical Payment Method Segmented Control */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Payment Method</Label>
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
                      {paymentMethods.map((method) => {
                        const isSelected = paidBy === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaidBy(method.id)}
                            className={cn(
                              "flex-1 min-w-[80px] py-2 px-3 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1",
                              isSelected
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70",
                            )}
                          >
                            <span>{method.icon}</span>
                            <span>{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="note" className="text-xs font-bold text-slate-700">Note / Remarks (Optional)</Label>
                    <Input
                      id="note"
                      placeholder="e.g. Grocery store purchase, UPI transaction..."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="bg-white border-slate-200 text-xs h-10 rounded-xl"
                    />
                  </div>

                  {paidBy !== "upi" && paidBy !== "cash" && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="size-4 text-amber-800" />
                      <AlertTitle className="text-xs font-bold text-amber-950">Credit Card Usage Warning</AlertTitle>
                      <AlertDescription className="text-xs font-semibold text-amber-900">
                        Rule: Card usage should remain ₹0 until credit utilization drops below 30%.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button className="h-11 flex-1 text-sm font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 rounded-xl" type="submit">
                      {editingEntryId ? "Update Spend Entry" : "Save Spend / Payment"}
                    </Button>
                    {editingEntryId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 border-slate-200 text-slate-700 rounded-xl font-bold"
                        onClick={cancelEditingEntry}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Budget Pace Meter */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-black text-slate-900">Safe Spend Pace Meter</CardTitle>
                  <StatusBadge status={pace.status} />
                </div>
                <CardDescription className="text-xs font-semibold text-slate-500">{pace.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5 pt-2">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Monthly Variable Spend</span>
                    <span className="font-mono">
                      {formatInr(variableSpent)} / {formatInr(variableBudget)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (variableSpent / variableBudget) * 100)} className="h-2.5 bg-slate-100" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-bold">Day</p>
                    <p className="mt-1 font-mono text-base font-black text-slate-900">{dayOfMonth}/30</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-bold">Allowed Today</p>
                    <p className="mt-1 font-mono text-base font-black text-slate-900">{formatInr(pace.allowedByToday)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-bold">Projected End</p>
                    <p className="mt-1 font-mono text-base font-black text-slate-900">{formatInr(pace.projectedMonthEnd)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spend Ledger & Filterable History */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-black text-slate-900">Spend History & Ledger</CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-medium">
                      {filteredEntries.length
                        ? `Showing ${filteredEntries.length} of ${entries.length} entries`
                        : entries.length
                        ? `No entries for selected filter`
                        : "No spends logged yet."}
                    </CardDescription>
                  </div>

                  {/* Date Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "all" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-bold px-2.5 rounded-lg", spendListFilter === "all" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => setSpendListFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "today" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-bold px-2.5 rounded-lg", spendListFilter === "today" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => setSpendListFilter("today")}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "yesterday" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-bold px-2.5 rounded-lg", spendListFilter === "yesterday" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => setSpendListFilter("yesterday")}
                    >
                      Yesterday
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "custom" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-bold px-2.5 rounded-lg", spendListFilter === "custom" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => {
                        setSpendListFilter("custom");
                        if (!spendListCustomDate) setSpendListCustomDate(getLocalDateString());
                      }}
                    >
                      Pick Date
                    </Button>
                  </div>
                </div>

                {spendListFilter === "custom" && (
                  <div className="pt-2">
                    <Input
                      type="date"
                      max={getLocalDateString()}
                      value={spendListCustomDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const today = getLocalDateString();
                        setSpendListCustomDate(val > today ? today : val);
                      }}
                      className="h-8 text-xs bg-white max-w-[180px] rounded-lg"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2">
                {filteredEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-semibold">
                    No spend entries found for the selected filter.
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
                            "flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors bg-white",
                            isEditingThis ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400/50" : "border-slate-200 hover:bg-slate-50",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">{displayName}</p>
                            <p className="text-xs text-slate-500 font-semibold">
                              {categoryLabel} · {method} · <span className="font-mono text-slate-700">{entry.date}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="font-mono text-sm font-black text-slate-900 mr-1">{formatInr(entry.amount)}</p>
                            <Button
                              aria-label="Edit spend entry"
                              size="icon"
                              type="button"
                              variant="ghost"
                              className="size-8 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-lg"
                              onClick={() => startEditingEntry(entry)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              aria-label="Delete spend entry"
                              size="icon"
                              type="button"
                              variant="ghost"
                              className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg"
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

          {/* TAB 4: RUNWAY & TIMELINE */}
          <TabsContent value="runway" className="mt-4 space-y-4">
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-base font-black text-slate-900">Salary-Only Runway Forecast</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">Trajectory towards Zero EMI freedom.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-bold">Living budget</p>
                    <p className="mt-1 font-mono text-base font-black text-slate-900">{formatInr(octoberSeedData.futureMonthlyLivingBudget)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-bold">Zero EMI Month</p>
                    <p className="mt-1 font-mono text-base font-black text-indigo-700">{firstZeroEmiMonth?.label ?? "TBD"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-bold">Free Months (&gt;₹20k)</p>
                    <p className="mt-1 font-mono text-base font-black text-emerald-700">{monthPreviews.filter((p) => p.youKeepThisMonth >= 20000).length} mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: EMIS LEDGER */}
          <TabsContent value="emis" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Personal EMIs</CardTitle>
                  <CardDescription className="text-xs font-mono font-bold text-indigo-600">{formatInr(monthPersonalEmisTotal)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {currentPersonalEmis.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{e.name}</span>
                      <span className="font-mono font-black text-slate-900">{formatInr(e.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Venkat Payable EMIs</CardTitle>
                  <CardDescription className="text-xs font-mono font-bold text-amber-700">{formatInr(monthVenkatPayableTotal)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {currentVenkatPayableEmis.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{e.name}</span>
                      <span className="font-mono font-black text-slate-900">{formatInr(e.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Venkat Receivable (On Name)</CardTitle>
                  <CardDescription className="text-xs font-mono font-bold text-sky-700">{formatInr(monthVenkatDebitOnNameTotal)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {currentVenkatOnYourNameEmis.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{e.name}</span>
                      <span className="font-mono font-black text-slate-900">{formatInr(e.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: CARDS DASHBOARD */}
          <TabsContent value="cards" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {octoberSeedData.cards.map((card) => {
                const cardStatus = getCardUsageStatus(card);
                return (
                  <Card key={card.name} className="border-slate-200 shadow-sm rounded-2xl bg-white">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-black text-slate-900">{card.name}</CardTitle>
                        <Badge variant="outline" className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-md", cardStatus.status === "freeze" ? "border-rose-300 bg-rose-100 text-rose-900" : "border-emerald-300 bg-emerald-100 text-emerald-900")}>
                          {cardStatus.status === "freeze" ? "FREEZE" : "SAFE"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Limit Utilized</span>
                          <span className="font-mono font-black text-slate-900">{Math.round(cardStatus.utilization * 100)}%</span>
                        </div>
                        <Progress value={cardStatus.utilization * 100} className="h-2 bg-slate-100" />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Used: {formatInr(cardStatus.used)}</span>
                        <span>Available: {formatInr(card.available)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
