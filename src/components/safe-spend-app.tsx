"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard as CreditCardIcon,
  IndianRupee,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
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
  { id: "hdfc", label: "HDFC Card" },
  { id: "axis", label: "Axis Card" },
  { id: "yes-bank", label: "YES Bank Card" },
];

const categoryOptions = [
  { id: "groceries", label: "Groceries & Daily Needs", icon: "🛒", budget: "₹3,000/mo" },
  { id: "bike", label: "Bike Fuel & Maintenance", icon: "⛽", budget: "₹3,000/mo" },
  { id: "gym", label: "Gym & Fitness", icon: "🏋️", budget: "₹2,500/mo" },
  { id: "rent", label: "Room Rent", icon: "🏠", budget: "₹6,000/mo" },
  { id: "electricity", label: "Electricity", icon: "⚡", budget: "₹500/mo" },
  { id: "misc", label: "Miscellaneous Living", icon: "☕", budget: "₹3,000/mo" },
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
    green: "Safe Pace",
    yellow: "Careful",
    red: "Over Pace",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border",
        status === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "yellow" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "red" && "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {copy}
    </span>
  );
}

function ForecastBadge({ status }: { status: "tight" | "stable" | "free" | "emi-zero" }) {
  const copy = {
    tight: "Tight Budget",
    stable: "Stable",
    free: "Freeing Up",
    "emi-zero": "Zero EMI",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border",
        status === "tight" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "stable" && "border-slate-200 bg-slate-100 text-slate-700",
        status === "free" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "emi-zero" && "border-emerald-300 bg-emerald-100 text-emerald-800 font-bold",
      )}
    >
      {copy}
    </span>
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
    <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">{value}</p>
            <p className="mt-1 text-xs text-slate-600 font-medium">{detail}</p>
          </div>
          <div
            className={cn(
              "rounded-lg border p-2.5 shrink-0",
              tone === "default" && "border-slate-200 bg-slate-50 text-slate-700",
              tone === "safe" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
              tone === "danger" && "border-red-200 bg-red-50 text-red-700",
              tone === "info" && "border-slate-200 bg-slate-100 text-slate-700",
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
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Clean Fintech Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-slate-900 p-2 text-white shadow-xs">
              <Landmark className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SafeSpend</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                  Live
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Financial Guardrail</h1>
            </div>
          </div>

          {/* Clean Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-slate-600 hover:bg-white rounded-md"
              disabled={!prevMonth}
              onClick={() => prevMonth && setSelectedMonth(prevMonth)}
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {allForecastMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {m.value === "2028-05" ? "• Zero EMI" : ""}
                </option>
              ))}
            </select>

            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-slate-600 hover:bg-white rounded-md"
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
      <section className="space-y-4 px-4 py-4 sm:px-6">
        {/* Month Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">{formatMonthLabel(selectedMonth)}</span>
              <ForecastBadge
                status={activeEmiCount === 0 ? "emi-zero" : netMonthSurplus >= 20000 ? "free" : netMonthSurplus >= 8000 ? "stable" : "tight"}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {activeEmiCount === 0
                ? "Zero outgoing EMI obligations."
                : `${activeEmiCount} active outgoing EMIs (${formatInr(monthOutgoingEmis)}/mo).`}
            </p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900"
            onClick={resetLocalData}
          >
            <RefreshCcw className="mr-1.5 size-3.5" /> Reset Data
          </Button>
        </div>

        {/* Top Metric Widgets */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            detail={currentLiveBankBalance >= liveCashNeededInBank ? "Safety buffer intact" : "Needs cash injection"}
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

        {/* Clean Segmented Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 sm:grid-cols-6 bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <TabsTrigger value="plan" className="text-xs font-semibold rounded-md py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-slate-600">Plan</TabsTrigger>
            <TabsTrigger value="invest" className="text-xs font-semibold rounded-md py-1.5 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-2xs text-slate-600">Invest</TabsTrigger>
            <TabsTrigger value="spend" className="text-xs font-semibold rounded-md py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-slate-600">Spend</TabsTrigger>
            <TabsTrigger value="runway" className="text-xs font-semibold rounded-md py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-slate-600">Runway</TabsTrigger>
            <TabsTrigger value="emis" className="text-xs font-semibold rounded-md py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-slate-600">EMIs</TabsTrigger>
            <TabsTrigger value="cards" className="text-xs font-semibold rounded-md py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-slate-600">Cards</TabsTrigger>
          </TabsList>

          {/* TAB 1: MONTH PLAN & CASHFLOW */}
          <TabsContent value="plan" className="mt-4 space-y-4">
            {/* Live Bank Liquidity Manager */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className="size-4 text-slate-700" />
                    <p className="text-sm font-bold text-slate-900">
                      Live Bank Balance & Liquidity Manager ({formatMonthLabel(selectedMonth)})
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Automatically subtracts debts, EMIs, card bills, and living spends as paid.
                  </p>
                </div>
                <div className="text-left sm:text-right bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Bank Reserve</p>
                  <p className="font-mono text-xl font-extrabold text-slate-900">{formatInr(liveCashNeededInBank)}</p>
                  <p className="text-[11px] font-medium text-slate-600">
                    {totalRemainingPendingOutflows > 0
                      ? `${formatInr(totalRemainingPendingOutflows)} pending + ₹5k buffer`
                      : "All outflows cleared! ₹5k buffer intact"}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Outflows Settled</span>
                  <span className="font-mono">
                    {formatInr(totalDebtsPaidSoFar)} / {formatInr(totalDebtsOriginalTotal)}
                  </span>
                </div>
                <Progress value={totalDebtsOriginalTotal > 0 ? (totalDebtsPaidSoFar / totalDebtsOriginalTotal) * 100 : 100} className="h-2 bg-slate-200" />
              </div>
            </div>

            {/* Income Streams */}
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Income Streams ({formatMonthLabel(selectedMonth)})</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Toggle switch when salary/freelance money is received.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowAddIncome(!showAddIncome)}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Income
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                {showAddIncome && (
                  <form onSubmit={handleAddIncome} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                    <p className="text-xs font-bold text-slate-900">Add Income Stream</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Input
                        placeholder="Source (e.g. Freelance)"
                        value={newIncomeName}
                        onChange={(e) => setNewIncomeName(e.target.value)}
                        className="bg-white border-slate-200 text-xs h-9"
                      />
                      <Input
                        placeholder="Amount (₹)"
                        type="number"
                        value={newIncomeAmount}
                        onChange={(e) => setNewIncomeAmount(e.target.value)}
                        className="bg-white border-slate-200 text-xs h-9"
                      />
                      <Input
                        placeholder="Expected date (e.g. Mid Sep)"
                        value={newIncomeDate}
                        onChange={(e) => setNewIncomeDate(e.target.value)}
                        className="bg-white border-slate-200 text-xs h-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" type="submit" className="h-8 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white">Save</Button>
                      <Button size="sm" type="button" variant="ghost" className="h-8 text-xs text-slate-600" onClick={() => setShowAddIncome(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {currentIncomes.map((source) => (
                    <div key={source.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 bg-white hover:bg-slate-50/80 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{source.name}</p>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border", source.status === "received" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                            {source.status === "received" ? "Received" : `Pending (${source.expectedDate})`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm font-bold text-slate-900">{formatInr(source.amount)}</p>
                        <Switch
                          checked={source.status === "received"}
                          onCheckedChange={() => toggleIncomeStatus(source.id)}
                          aria-label={`Toggle status for ${source.name}`}
                        />
                        {monthlyIncomes[selectedMonth] && (
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600" onClick={() => deleteIncome(source.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Debts */}
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Custom Debts ({formatMonthLabel(selectedMonth)})</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Track loans from friends or lenders.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowAddDebt(!showAddDebt)}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Debt
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                {showAddDebt && (
                  <form onSubmit={handleAddDebt} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                    <p className="text-xs font-bold text-slate-900">Add Custom Debt</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Input placeholder="Debt name" value={newDebtName} onChange={(e) => setNewDebtName(e.target.value)} className="bg-white border-slate-200 text-xs h-9" />
                      <Input placeholder="Lender name" value={newDebtLender} onChange={(e) => setNewDebtLender(e.target.value)} className="bg-white border-slate-200 text-xs h-9" />
                      <Input placeholder="Total Amount (₹)" type="number" value={newDebtAmount} onChange={(e) => setNewDebtAmount(e.target.value)} className="bg-white border-slate-200 text-xs h-9" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" type="submit" className="h-8 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white">Save</Button>
                      <Button size="sm" type="button" variant="ghost" className="h-8 text-xs text-slate-600" onClick={() => setShowAddDebt(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {currentCustomDebts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No custom debts for {formatMonthLabel(selectedMonth)}.</p>
                ) : (
                  <div className="space-y-2">
                    {currentCustomDebts.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 bg-white">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{d.name} ({d.lender})</p>
                          {d.note && <p className="text-xs text-slate-500">{d.note}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-sm font-bold text-slate-900">{formatInr(d.totalAmount)}</p>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600" onClick={() => deleteDebt(d.id)}>
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
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl overflow-hidden">
              <div className="bg-slate-900 p-4 sm:p-5 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-400" />
                  <h2 className="text-base font-bold">{investmentPlan.stageName} ({formatMonthLabel(selectedMonth)})</h2>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-normal">{investmentPlan.strategyGuidance}</p>
              </div>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Monthly Surplus Invested</span>
                    <span className="font-mono text-2xl font-extrabold text-emerald-700">{formatInr(investmentPlan.totalInvestedThisMonth)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Fund Allocation Breakdown:</p>

                  <div className="rounded-lg border border-slate-200 p-3.5 bg-white space-y-1">
                    <div className="flex justify-between text-sm font-bold text-slate-900">
                      <span>{investmentPlan.liquidFundName}</span>
                      <span className="font-mono text-emerald-700">{formatInr(investmentPlan.liquidFundAmount)}</span>
                    </div>
                    <p className="text-xs text-slate-500">{investmentPlan.liquidFundNote}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3.5 bg-white space-y-1">
                    <div className="flex justify-between text-sm font-bold text-slate-900">
                      <span>{investmentPlan.niftyIndexFundName}</span>
                      <span className="font-mono text-emerald-700">{formatInr(investmentPlan.niftyIndexFundAmount)}</span>
                    </div>
                    <p className="text-xs text-slate-500">{investmentPlan.niftyIndexFundNote}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3.5 bg-white space-y-1">
                    <div className="flex justify-between text-sm font-bold text-slate-900">
                      <span>{investmentPlan.flexiCapFundName}</span>
                      <span className="font-mono text-emerald-700">{formatInr(investmentPlan.flexiCapFundAmount)}</span>
                    </div>
                    <p className="text-xs text-slate-500">{investmentPlan.flexiCapFundNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SPEND TRACKER & PARTIAL PAYMENT ENGINE */}
          <TabsContent value="spend" className="mt-4 space-y-4">
            {/* Form Card */}
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  {editingEntryId ? (
                    <>
                      <Pencil className="size-4 text-amber-600" /> Edit Spend Entry
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 text-slate-900" /> Add Spend or Debt Payment
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {editingEntryId ? "Update entry details below." : "Log daily expenses or debt payoffs."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2">
                <form className="space-y-4" onSubmit={addSpend}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="spendDate" className="text-xs font-semibold text-slate-700">Date</Label>
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
                        className="bg-white border-slate-200 text-sm h-10 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">Amount (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400 font-mono">₹</span>
                        <Input
                          id="amount"
                          inputMode="numeric"
                          min="1"
                          placeholder="e.g. 3500"
                          type="number"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="bg-white border-slate-200 text-sm h-10 pl-7 font-mono font-bold text-slate-900 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clean Category Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="categorySelect" className="text-xs font-semibold text-slate-700">Expense Category</Label>
                    <select
                      id="categorySelect"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-sm font-medium text-slate-900 rounded-lg h-10 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                    >
                      <optgroup label="Living Expenses">
                        {categoryOptions.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.label} ({cat.budget})
                          </option>
                        ))}
                      </optgroup>
                      {debtPaymentStats.length > 0 && (
                        <optgroup label="Debt & EMI Payoffs">
                          {debtPaymentStats.map((debt) => (
                            <option key={debt.id} value={debt.id}>
                              {debt.priority === "high" ? "🚨" : "🤝"} {debt.name} ({debt.isCleared ? "Cleared" : formatInr(debt.remainingBalance)})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Payment Method</Label>
                    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      {paymentMethods.map((method) => {
                        const isSelected = paidBy === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaidBy(method.id)}
                            className={cn(
                              "flex-1 min-w-[70px] py-1.5 px-3 text-xs font-medium rounded-md transition-colors text-center",
                              isSelected
                                ? "bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
                            )}
                          >
                            {method.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="note" className="text-xs font-semibold text-slate-700">Note / Remarks (Optional)</Label>
                    <Input
                      id="note"
                      placeholder="e.g. Grocery store purchase..."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="bg-white border-slate-200 text-xs h-10 rounded-lg"
                    />
                  </div>

                  {paidBy !== "upi" && paidBy !== "cash" && (
                    <Alert className="border-amber-200 bg-amber-50 rounded-lg">
                      <AlertCircle className="size-4 text-amber-800" />
                      <AlertTitle className="text-xs font-bold text-amber-900">Card Warning</AlertTitle>
                      <AlertDescription className="text-xs text-amber-800 font-medium">
                        Card usage should remain ₹0 until utilization drops below 30%.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button className="h-10 flex-1 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs" type="submit">
                      {editingEntryId ? "Update Entry" : "Save Spend / Payment"}
                    </Button>
                    {editingEntryId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-slate-200 text-slate-700 rounded-lg"
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
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900">Budget Pace</CardTitle>
                  <StatusBadge status={pace.status} />
                </div>
                <CardDescription className="text-xs text-slate-500 font-medium">{pace.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5 pt-2">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Monthly Variable Spend</span>
                    <span className="font-mono">
                      {formatInr(variableSpent)} / {formatInr(variableBudget)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (variableSpent / variableBudget) * 100)} className="h-2 bg-slate-100" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-slate-500 font-medium">Day</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{dayOfMonth}/30</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-slate-500 font-medium">Allowed Today</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{formatInr(pace.allowedByToday)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-slate-500 font-medium">Projected End</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{formatInr(pace.projectedMonthEnd)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spend History */}
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Spend History</CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-medium">
                      {filteredEntries.length
                        ? `Showing ${filteredEntries.length} of ${entries.length} entries`
                        : "No spends logged."}
                    </CardDescription>
                  </div>

                  {/* Date Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "all" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-semibold px-2.5 rounded-md", spendListFilter === "all" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => setSpendListFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "today" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-semibold px-2.5 rounded-md", spendListFilter === "today" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => setSpendListFilter("today")}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "yesterday" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-semibold px-2.5 rounded-md", spendListFilter === "yesterday" && "bg-white text-slate-900 shadow-2xs")}
                      onClick={() => setSpendListFilter("yesterday")}
                    >
                      Yesterday
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={spendListFilter === "custom" ? "default" : "ghost"}
                      className={cn("h-7 text-xs font-semibold px-2.5 rounded-md", spendListFilter === "custom" && "bg-white text-slate-900 shadow-2xs")}
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
                      className="h-8 text-xs bg-white max-w-[180px] rounded-md"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2">
                {filteredEntries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-medium">
                    No spend entries found for the selected filter.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEntries.slice(0, 15).map((entry) => {
                      const category = octoberSeedData.expenses.find((item) => item.id === entry.categoryId);
                      const debtCategory = debtPaymentStats.find((item) => item.id === entry.categoryId);
                      const method = paymentMethods.find((item) => item.id === entry.paidBy)?.label;
                      const displayName = entry.note || debtCategory?.name || category?.name || "Spend";
                      const categoryLabel = debtCategory?.name ? `Debt: ${debtCategory.name}` : category?.name;
                      const isEditingThis = editingEntryId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors bg-white",
                            isEditingThis ? "border-amber-300 bg-amber-50" : "border-slate-200 hover:bg-slate-50/80",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {categoryLabel} · {method} · <span className="font-mono text-slate-700">{entry.date}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="font-mono text-sm font-bold text-slate-900 mr-1">{formatInr(entry.amount)}</p>
                            <Button
                              aria-label="Edit spend entry"
                              size="icon"
                              type="button"
                              variant="ghost"
                              className="size-7 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-md"
                              onClick={() => startEditingEntry(entry)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              aria-label="Delete spend entry"
                              size="icon"
                              type="button"
                              variant="ghost"
                              className="size-7 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-md"
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
              CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: RUNWAY & TIMELINE */}
          <TabsContent value="runway" className="mt-4 space-y-4">
            <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-base font-bold text-slate-900">Salary-Only Runway Forecast</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">Trajectory towards Zero EMI freedom.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-medium">Living budget</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{formatInr(octoberSeedData.futureMonthlyLivingBudget)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-medium">Zero EMI Month</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{firstZeroEmiMonth?.label ?? "TBD"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-medium">Free Months (&gt;₹20k)</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-emerald-700">{monthPreviews.filter((p) => p.youKeepThisMonth >= 20000).length} mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: EMIS LEDGER */}
          <TabsContent value="emis" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-bold text-slate-900">Personal EMIs</CardTitle>
                  <CardDescription className="text-xs font-mono font-semibold text-slate-700">{formatInr(monthPersonalEmisTotal)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {currentPersonalEmis.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs p-2 rounded-md bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">{e.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatInr(e.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-bold text-slate-900">Venkat Payable EMIs</CardTitle>
                  <CardDescription className="text-xs font-mono font-semibold text-slate-700">{formatInr(monthVenkatPayableTotal)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {currentVenkatPayableEmis.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs p-2 rounded-md bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">{e.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatInr(e.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-2xs rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-bold text-slate-900">Venkat Receivable (On Name)</CardTitle>
                  <CardDescription className="text-xs font-mono font-semibold text-slate-700">{formatInr(monthVenkatDebitOnNameTotal)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {currentVenkatOnYourNameEmis.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs p-2 rounded-md bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">{e.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatInr(e.amount)}</span>
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
                  <Card key={card.name} className="border-slate-200 bg-white shadow-2xs rounded-xl">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-bold text-slate-900">{card.name}</CardTitle>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", cardStatus.status === "freeze" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
                          {cardStatus.status === "freeze" ? "FREEZE" : "SAFE"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Limit Utilized</span>
                          <span className="font-mono font-bold text-slate-900">{Math.round(cardStatus.utilization * 100)}%</span>
                        </div>
                        <Progress value={cardStatus.utilization * 100} className="h-2 bg-slate-100" />
                      </div>
                      <div className="flex justify-between text-xs font-medium text-slate-500">
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
