"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard as CreditCardIcon,
  Dumbbell,
  Fuel,
  Home,
  IndianRupee,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import {
  Button,
  Card,
  Chip,
  ProgressBar,
  Switch,
} from "@heroui/react";

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
  { id: "groceries", label: "Groceries & Daily Needs", icon: ShoppingBag, budget: "₹3,000/mo", color: "text-amber-600 bg-amber-50" },
  { id: "bike", label: "Bike Fuel & Maintenance", icon: Fuel, budget: "₹3,000/mo", color: "text-sky-600 bg-sky-50" },
  { id: "gym", label: "Gym & Fitness", icon: Dumbbell, budget: "₹2,500/mo", color: "text-purple-600 bg-purple-50" },
  { id: "rent", label: "Room Rent", icon: Home, budget: "₹6,000/mo", color: "text-emerald-600 bg-emerald-50" },
  { id: "electricity", label: "Electricity", icon: Zap, budget: "₹500/mo", color: "text-yellow-600 bg-yellow-50" },
  { id: "misc", label: "Miscellaneous Living", icon: Coffee, budget: "₹3,000/mo", color: "text-slate-600 bg-slate-100" },
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

function formatDateFormatted(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  if (dateStr === todayStr) return `Today, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (dateStr === yesterdayStr) return `Yesterday, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getSeptemberDay() {
  const now = new Date();
  if (now.getFullYear() === 2026 && now.getMonth() === 8) {
    return Math.min(Math.max(now.getDate(), 1), 30);
  }
  return 1;
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

  // Custom UI Popover / Picker states
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Spend list filter states
  const [spendListFilter, setSpendListFilter] = useState<"all" | "today" | "yesterday">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Spend is active by default as requested
  const [activeTab, setActiveTab] = useState("spend");

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

  // Date-oriented filtered entries with search query
  const filteredEntries = useMemo(() => {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();

    let list = entries;
    if (spendListFilter === "today") {
      list = entries.filter((e) => e.date === todayStr);
    } else if (spendListFilter === "yesterday") {
      list = entries.filter((e) => e.date === yesterdayStr);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.note?.toLowerCase().includes(q) ||
          e.amount.toString().includes(q) ||
          e.date.includes(q) ||
          e.paidBy.toLowerCase().includes(q),
      );
    }

    return list;
  }, [entries, spendListFilter, searchQuery]);

  // Currently selected category object
  const selectedCategoryObj = useMemo(() => {
    const livingCat = categoryOptions.find((c) => c.id === categoryId);
    if (livingCat) return { label: livingCat.label, Icon: livingCat.icon, sub: livingCat.budget, color: livingCat.color };
    const debtCat = debtPaymentStats.find((d) => d.id === categoryId);
    if (debtCat) return { label: debtCat.name, Icon: debtCat.priority === "high" ? AlertCircle : UserCheck, sub: debtCat.isCleared ? "Cleared" : formatInr(debtCat.remainingBalance), color: "text-amber-600 bg-amber-50" };
    return { label: "Select Category", Icon: Wallet, sub: "", color: "text-slate-700 bg-slate-50" };
  }, [categoryId, debtPaymentStats]);

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
    setActiveTab("spend");
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

  // Custom Calendar Grid Generator
  const calendarDays = useMemo(() => {
    const [year, month] = spendDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDayOfWeek = dateObj.getDay(); // 0 = Sun

    const todayStr = getLocalDateString();
    const list: Array<{ day: number; dateStr: string; isToday: boolean; isSelected: boolean; isDisabled: boolean }> = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      list.push({
        day: i,
        dateStr: dStr,
        isToday: dStr === todayStr,
        isSelected: dStr === spendDate,
        isDisabled: dStr > todayStr,
      });
    }

    return { daysInMonth, startDayOfWeek, days: list };
  }, [spendDate]);

  return (
    <main className="min-h-screen w-full bg-[#f4f5f7] text-slate-900 font-sans pb-20">
      {/* Top Mobile-First Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200/80 px-3 py-2.5 backdrop-blur-md shadow-2xs sm:px-8 sm:py-3">
        <div className="mx-auto max-w-6xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          {/* Mobile Header Row 1: Logo & Date Action Pills */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 sm:size-9 items-center justify-center rounded-2xl bg-[#ff5c38] text-white shadow-sm shadow-[#ff5c38]/30 shrink-0">
                <Landmark className="size-4" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">Finexy<span className="text-[#ff5c38]">.</span></span>
            </div>

            {/* Date & Month Action Pills */}
            <div className="flex items-center gap-1.5">
              {/* Primary Date Picker Button */}
              <button
                type="button"
                onClick={() => setShowCalendarPopover(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-extrabold text-slate-900 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                <CalendarIcon className="size-3.5 text-[#ff5c38] shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none">{formatDateFormatted(spendDate)}</span>
                <ChevronDown className="size-3 text-slate-400 shrink-0" />
              </button>

              {/* Month Selector Pill */}
              <button
                type="button"
                onClick={() => setShowMonthDropdown(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-900 hover:bg-slate-200 cursor-pointer shrink-0"
              >
                <span>{formatMonthLabel(selectedMonth)}</span>
                <ChevronDown className="size-3 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Swipeable Mobile Tab Navigation Bar */}
          <nav className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/90 rounded-full border border-slate-200/60 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("spend")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shrink-0",
                activeTab === "spend" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              Spend Tracker
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shrink-0",
                activeTab === "plan" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              Overview & Plan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("invest")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shrink-0",
                activeTab === "invest" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              Invest
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("emis")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shrink-0",
                activeTab === "emis" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              EMIs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shrink-0",
                activeTab === "cards" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              Cards
            </button>
          </nav>
        </div>
      </header>

      {/* MOBILE-FIRST CALENDAR MODAL OVERLAY */}
      {showCalendarPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowCalendarPopover(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="size-4 text-[#ff5c38]" /> Select Spend Date
              </span>
              <button
                type="button"
                className="size-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
                onClick={() => setShowCalendarPopover(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Date Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSpendDate(getLocalDateString());
                  setShowCalendarPopover(false);
                }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center",
                  spendDate === getLocalDateString() ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-800 hover:bg-slate-200",
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpendDate(getYesterdayDateString());
                  setShowCalendarPopover(false);
                }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center",
                  spendDate === getYesterdayDateString() ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-800 hover:bg-slate-200",
                )}
              >
                Yesterday
              </button>
            </div>

            {/* Month Calendar Grid */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-400 pb-1">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: calendarDays.startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}
                {calendarDays.days.map((item) => (
                  <button
                    key={item.dateStr}
                    type="button"
                    disabled={item.isDisabled}
                    onClick={() => {
                      setSpendDate(item.dateStr);
                      setShowCalendarPopover(false);
                    }}
                    className={cn(
                      "h-9 w-full rounded-xl text-xs font-extrabold flex items-center justify-center transition-all min-h-[36px]",
                      item.isSelected && "bg-[#ff5c38] text-white shadow-xs",
                      !item.isSelected && item.isToday && "border border-[#ff5c38] text-[#ff5c38] bg-orange-50 font-bold",
                      !item.isSelected && !item.isToday && !item.isDisabled && "text-slate-800 hover:bg-slate-100 active:scale-95",
                      item.isDisabled && "text-slate-300 opacity-40 cursor-not-allowed",
                    )}
                  >
                    {item.day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE-FIRST MONTH SELECTOR MODAL OVERLAY */}
      {showMonthDropdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowMonthDropdown(false)}
          />
          <div className="relative z-10 w-full max-w-xs max-h-80 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl space-y-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2">
              <span className="text-xs font-extrabold text-slate-900">Select Forecast Month</span>
              <button
                type="button"
                className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold"
                onClick={() => setShowMonthDropdown(false)}
              >
                <X className="size-3.5" />
              </button>
            </div>
            {allForecastMonths.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setSelectedMonth(m.value);
                  setShowMonthDropdown(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors",
                  selectedMonth === m.value ? "bg-slate-900 font-bold text-white" : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <span>{m.label}</span>
                {m.value === "2028-05" && <Chip color="accent" size="sm" variant="soft">Zero EMI</Chip>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-8 space-y-5 sm:space-y-6">
        {/* Welcome & Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Good day, Sai 👋
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
              Stay on top of daily spends, monitor liquid bank buffer, and track zero-EMI path.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="tertiary"
              className="h-8 sm:h-9 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full bg-white border border-slate-200 shadow-2xs"
              onPress={resetLocalData}
            >
              <RefreshCcw className="mr-1.5 size-3.5 text-slate-400" /> Reset Data
            </Button>
          </div>
        </div>

        {/* 4 Finexy Widget Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Featured Coral Orange Card */}
          <div className="col-span-2 sm:col-span-1 rounded-3xl bg-[#ff5c38] text-white p-4 sm:p-5 shadow-sm space-y-2 sm:space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-100">Total Income</span>
              <span className="rounded-full bg-white/20 p-1.5 sm:p-2 text-white">
                <IndianRupee className="size-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight">{formatInr(monthTotalIncome)}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-orange-100 mt-1 flex items-center gap-1">
                <TrendingUp className="size-3.5 text-white shrink-0" />
                <span className="truncate">Received: {formatInr(monthIncomeReceived)}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Outgoing EMIs */}
          <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Outgoing EMIs</span>
              <span className="rounded-full bg-slate-100 p-1.5 sm:p-2 text-slate-700">
                <CreditCardIcon className="size-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(monthOutgoingEmis)}</p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1 truncate">
                {currentPersonalEmis.length} Personal · {currentVenkatPayableEmis.length} Venkat
              </p>
            </div>
          </div>

          {/* Card 3: Live Bank Balance */}
          <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Live Bank</span>
              <span className="rounded-full bg-emerald-50 p-1.5 sm:p-2 text-emerald-600">
                <Landmark className="size-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(currentLiveBankBalance)}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-600 mt-1 truncate">
                {currentLiveBankBalance >= liveCashNeededInBank ? "✓ Safety Intact" : "⚠️ Cash Needed"}
              </p>
            </div>
          </div>

          {/* Card 4: Required Reserve */}
          <div className="col-span-2 sm:col-span-1 rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Must Keep</span>
              <span className="rounded-full bg-blue-50 p-1.5 sm:p-2 text-blue-600">
                <PiggyBank className="size-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(liveCashNeededInBank)}</p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1 truncate">
                Pending: {formatInr(totalRemainingPendingOutflows)} + ₹5k
              </p>
            </div>
          </div>
        </div>

        {/* Finexy Layout: 2 Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Quick Spend Logger & Activity Table */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Spend Logger Card */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    {editingEntryId ? (
                      <>
                        <Pencil className="size-4 text-amber-600" /> Edit Transaction
                      </>
                    ) : (
                      <>
                        <Plus className="size-4 text-[#ff5c38]" /> Quick Add Spend
                      </>
                    )}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Logging for <span className="font-extrabold text-slate-900">{formatDateFormatted(spendDate)}</span>.
                  </p>
                </div>
                <Chip color="success" size="sm" variant="soft">Live Sync</Chip>
              </div>

              <form onSubmit={addSpend} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Amount Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="amount" className="text-xs font-extrabold text-slate-700 block">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400 font-mono">₹</span>
                      <input
                        id="amount"
                        inputMode="numeric"
                        min="1"
                        placeholder="e.g. 3500"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-50/80 border border-slate-200/90 text-sm h-11 pl-8 px-3 font-mono font-black text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Target Date Selector Banner */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">Date</label>
                    <div className="flex items-center justify-between h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-900">
                      <span className="flex items-center gap-2 truncate">
                        <CalendarIcon className="size-4 text-[#ff5c38] shrink-0" />
                        <span className="truncate">{formatDateFormatted(spendDate)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCalendarPopover(true)}
                        className="text-[11px] font-extrabold text-[#ff5c38] hover:underline shrink-0 ml-1"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Category Selector Component */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-extrabold text-slate-700 block">Category</label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full flex items-center justify-between bg-slate-50/80 border border-slate-200/90 text-sm font-semibold text-slate-900 rounded-2xl h-11 px-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer hover:bg-white"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <selectedCategoryObj.Icon className="size-4 shrink-0 text-slate-700" />
                      <span className="font-extrabold text-slate-900 truncate">{selectedCategoryObj.label}</span>
                      {selectedCategoryObj.sub && (
                        <span className="text-xs text-slate-500 font-normal truncate">({selectedCategoryObj.sub})</span>
                      )}
                    </span>
                    <ChevronDown className="size-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Category Selection Modal / Popover */}
                  {showCategoryDropdown && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in sm:absolute sm:inset-auto sm:left-0 sm:top-16 sm:w-full">
                      <div className="fixed inset-0 sm:hidden" onClick={() => setShowCategoryDropdown(false)} />
                      <div className="relative z-10 w-full max-w-sm sm:max-w-none max-h-80 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl space-y-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2 sm:hidden">
                          <span className="text-xs font-extrabold text-slate-900">Select Category</span>
                          <button
                            type="button"
                            className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold"
                            onClick={() => setShowCategoryDropdown(false)}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">Living Expenses</p>
                        {categoryOptions.map((cat) => {
                          const IconComponent = cat.icon;
                          const isSel = categoryId === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(cat.id);
                                setShowCategoryDropdown(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all",
                                isSel ? "bg-slate-900 text-white" : "text-slate-800 hover:bg-slate-100",
                              )}
                            >
                              <span className="flex items-center gap-2.5">
                                <IconComponent className={cn("size-4", isSel ? "text-white" : "text-slate-600")} />
                                <span>{cat.label}</span>
                              </span>
                              <span className={cn("text-[11px]", isSel ? "text-slate-300" : "text-slate-500")}>
                                {cat.budget}
                              </span>
                            </button>
                          );
                        })}

                        {debtPaymentStats.length > 0 && (
                          <>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1 pt-2">Debt Payoffs</p>
                            {debtPaymentStats.map((debt) => {
                              const isSel = categoryId === debt.id;
                              const DebtIcon = debt.priority === "high" ? AlertCircle : UserCheck;
                              return (
                                <button
                                  key={debt.id}
                                  type="button"
                                  onClick={() => {
                                    setCategoryId(debt.id);
                                    if (!amount && debt.remainingBalance > 0) setAmount(String(debt.remainingBalance));
                                    setShowCategoryDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all",
                                    isSel ? "bg-[#ff5c38] text-white" : "text-slate-800 hover:bg-slate-100",
                                  )}
                                >
                                  <span className="flex items-center gap-2.5">
                                    <DebtIcon className={cn("size-4", isSel ? "text-white" : "text-[#ff5c38]")} />
                                    <span>{debt.name}</span>
                                  </span>
                                  <span className={cn("text-[11px]", isSel ? "text-orange-100" : "text-slate-500")}>
                                    {debt.isCleared ? "Cleared" : formatInr(debt.remainingBalance)}
                                  </span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Payment Method</label>
                  <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
                    {paymentMethods.map((method) => {
                      const isSelected = paidBy === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaidBy(method.id)}
                          className={cn(
                            "flex-1 min-w-[65px] py-1.5 px-2.5 text-xs font-extrabold rounded-xl transition-all text-center",
                            isSelected
                              ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60",
                          )}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="note" className="text-xs font-extrabold text-slate-700 block">Note (Optional)</label>
                  <input
                    id="note"
                    placeholder="e.g. Grocery store purchase..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200/90 text-xs h-10 px-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button className="h-11 flex-1 text-sm font-extrabold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xs" type="submit">
                    {editingEntryId ? "Update Transaction" : "Log Spend / Payment"}
                  </Button>
                  {editingEntryId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 border-slate-200 text-slate-700 rounded-2xl font-bold"
                      onPress={cancelEditingEntry}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Finexy Activity Table (Recent Transactions) */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Recent Transactions</h3>
                  <p className="text-xs font-medium text-slate-500">
                    {filteredEntries.length} logged entries
                  </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                    <input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 pr-3 text-xs bg-slate-100 border border-slate-200/80 rounded-full w-full sm:w-36 focus:outline-none focus:w-44 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSpendListFilter("all")}
                      className={cn(
                        "px-2.5 py-0.5 text-[11px] font-extrabold rounded-full transition-all",
                        spendListFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600",
                      )}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpendListFilter("today")}
                      className={cn(
                        "px-2.5 py-0.5 text-[11px] font-extrabold rounded-full transition-all",
                        spendListFilter === "today" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600",
                      )}
                    >
                      Today
                    </button>
                  </div>
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 font-medium">
                  No transaction records found.
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

                    const iconObj = categoryOptions.find((c) => c.id === entry.categoryId);
                    const IconComponent = iconObj?.icon || Wallet;

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl p-3 sm:p-3.5 border transition-all bg-white hover:bg-slate-50/80",
                          isEditingThis ? "border-amber-300 bg-amber-50/60" : "border-slate-200/80",
                        )}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className={cn("size-8 sm:size-9 rounded-2xl flex items-center justify-center shrink-0", iconObj?.color || "bg-slate-100 text-slate-700")}>
                            <IconComponent className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs sm:text-sm font-extrabold text-slate-900">{displayName}</p>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                              {categoryLabel} · <span className="font-semibold text-slate-700">{method}</span> · <span className="font-mono text-slate-500">{entry.date}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <p className="font-mono text-xs sm:text-base font-black text-slate-900 mr-0.5">{formatInr(entry.amount)}</p>
                          <Button
                            aria-label="Edit spend entry"
                            size="sm"
                            variant="ghost"
                            className="size-7 sm:size-8 p-0 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-xl min-w-0"
                            onPress={() => startEditingEntry(entry)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            aria-label="Delete spend entry"
                            size="sm"
                            variant="ghost"
                            className="size-7 sm:size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-xl min-w-0"
                            onPress={() => {
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
            </div>
          </div>

          {/* Right Column (4 cols): Credit Cards & Budget Pace */}
          <div className="lg:col-span-4 space-y-6">
            {/* Finexy Style: My Cards Widget */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">My Credit Cards</h3>
                <span className="text-xs font-bold text-slate-400">Limits</span>
              </div>

              <div className="space-y-3">
                {/* Visual HDFC Dark Credit Card */}
                <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-3 shadow-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold tracking-wider text-slate-300">HDFC Millennia</span>
                    <Chip color="success" size="sm" variant="soft">Safe Limit</Chip>
                  </div>
                  <p className="font-mono text-xs sm:text-sm font-extrabold tracking-widest text-slate-300">•••• •••• 6782</p>
                  <div className="flex justify-between items-end text-xs pt-1 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Used</p>
                      <p className="font-mono font-bold text-white">₹0</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Limit</p>
                      <p className="font-mono font-bold text-white">₹75,000</p>
                    </div>
                  </div>
                </div>

                {/* Visual Axis Coral Credit Card */}
                <div className="rounded-2xl bg-[#ff5c38] text-white p-4 space-y-3 shadow-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold tracking-wider text-orange-100">Axis MyZone</span>
                    <Chip color="success" size="sm" variant="soft">Active</Chip>
                  </div>
                  <p className="font-mono text-xs sm:text-sm font-extrabold tracking-widest text-orange-100">•••• •••• 4356</p>
                  <div className="flex justify-between items-end text-xs pt-1 border-t border-white/20">
                    <div>
                      <p className="text-[10px] text-orange-100 uppercase font-bold">Used</p>
                      <p className="font-mono font-bold text-white">₹0</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-orange-100 uppercase font-bold">Limit</p>
                      <p className="font-mono font-bold text-white">₹50,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Pace Widget */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Safe Spend Pace</h3>
                <Chip color={pace.status === "green" ? "success" : pace.status === "yellow" ? "warning" : "danger"} size="sm" variant="soft">
                  {pace.status === "green" ? "Safe" : "Warning"}
                </Chip>
              </div>
              <p className="text-xs font-medium text-slate-500">{pace.message}</p>

              <div className="space-y-3 pt-1">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Variable ({dayOfMonth}/30 days)</span>
                    <span className="font-mono font-black text-slate-900">
                      {formatInr(variableSpent)} / {formatInr(variableBudget)}
                    </span>
                  </div>
                  <ProgressBar value={Math.min(100, (variableSpent / variableBudget) * 100)} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5">
                    <p className="text-slate-500 font-bold">Allowed Today</p>
                    <p className="mt-0.5 font-mono text-sm font-black text-slate-900">{formatInr(pace.allowedByToday)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5">
                    <p className="text-slate-500 font-bold">Projected End</p>
                    <p className="mt-0.5 font-mono text-sm font-black text-slate-900">{formatInr(pace.projectedMonthEnd)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
