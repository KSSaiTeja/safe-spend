"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard as CreditCardIcon,
  Database,
  Dumbbell,
  FileText,
  Filter,
  Fuel,
  Home,
  IndianRupee,
  Info,
  Landmark,
  LayoutGrid,
  Mail,
  MoreHorizontal,
  Moon,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
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
  { id: "groceries", label: "Groceries & Daily Needs", icon: ShoppingBag, budget: "₹3,000/mo", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "bike", label: "Bike Fuel & Maintenance", icon: Fuel, budget: "₹3,000/mo", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { id: "gym", label: "Gym & Fitness", icon: Dumbbell, budget: "₹2,500/mo", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "rent", label: "Room Rent", icon: Home, budget: "₹6,000/mo", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "electricity", label: "Electricity", icon: Zap, budget: "₹500/mo", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { id: "misc", label: "Miscellaneous Living", icon: Coffee, budget: "₹3,000/mo", color: "text-slate-600 bg-slate-100 border-slate-200" },
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

  // Custom UI Popover / Modal states
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"spend" | "plan" | "invest" | "emis" | "cards">("spend");
  const [spendListFilter, setSpendListFilter] = useState<"all" | "today" | "yesterday">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Income entry form states
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeDate, setNewIncomeDate] = useState("");
  const [showAddIncome, setShowAddIncome] = useState(false);

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

  // Obligations
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
  const monthOneTimeTotal = useMemo(() => sumAmounts(currentOneTimeExpenses), [currentOneTimeExpenses]);

  const monthLivingBudget = selectedMonth === "2026-09" ? 18000 : 15500;
  const bufferTarget = 5000;

  const isInitialCleanupMonth = selectedMonth === "2026-09";
  const creditCardBill = useMemo(() => {
    if (monthlyCardBills[selectedMonth] !== undefined) {
      return monthlyCardBills[selectedMonth];
    }
    return isInitialCleanupMonth ? octoberSeedData.creditCardBill : 0;
  }, [monthlyCardBills, selectedMonth, isInitialCleanupMonth]);

  const daddyRepayment = isInitialCleanupMonth ? 30000 : 0;
  const venkatDirectPayment = isInitialCleanupMonth ? 46276 : selectedMonth === "2026-11" ? 3724 : 0;

  const totalCoreObligations =
    monthOutgoingEmis + monthLivingBudget + monthOneTimeTotal + creditCardBill + daddyRepayment + venkatDirectPayment + monthCustomDebtsTotal;

  const netMonthSurplus = Math.max(0, monthTotalIncome - totalCoreObligations - bufferTarget);

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

  const totalDebtsPaidSoFar = useMemo(
    () => debtPaymentStats.reduce((acc, d) => acc + d.paidSoFar, 0),
    [debtPaymentStats],
  );
  const totalRemainingPendingOutflows = useMemo(
    () => debtPaymentStats.reduce((acc, d) => acc + d.remainingBalance, 0),
    [debtPaymentStats],
  );

  const currentLiveBankBalance = Math.max(0, monthIncomeReceived - totalDebtsPaidSoFar);
  const liveCashNeededInBank = totalRemainingPendingOutflows + bufferTarget;

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

  const selectedCategoryObj = useMemo(() => {
    const livingCat = categoryOptions.find((c) => c.id === categoryId);
    if (livingCat) return { label: livingCat.label, Icon: livingCat.icon, sub: livingCat.budget, color: livingCat.color };
    const debtCat = debtPaymentStats.find((d) => d.id === categoryId);
    if (debtCat) return { label: debtCat.name, Icon: debtCat.priority === "high" ? AlertCircle : UserCheck, sub: debtCat.isCleared ? "Cleared" : formatInr(debtCat.remainingBalance), color: "text-amber-600 bg-amber-50" };
    return { label: "Select Category", Icon: Wallet, sub: "", color: "text-slate-700 bg-slate-50" };
  }, [categoryId, debtPaymentStats]);

  function startEditingEntry(entry: SpendEntry) {
    setEditingEntryId(entry.id);
    setAmount(String(entry.amount));
    setCategoryId(entry.categoryId);
    setPaidBy(entry.paidBy);
    setNote(entry.note ?? "");
    setSpendDate(entry.date);
    setShowSpendModal(true);
  }

  function cancelEditingEntry() {
    setEditingEntryId(null);
    setAmount("");
    setNote("");
    setSpendDate(getLocalDateString());
    setShowSpendModal(false);
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
    setShowSpendModal(false);
  }

  function resetLocalData() {
    setEntries([]);
    setMonthlyIncomes({});
    setMonthlyCardBills({});
    setCustomDebts({});
    setBufferSweeps({});
  }

  // Custom Calendar Grid Generator
  const calendarDays = useMemo(() => {
    const [year, month] = spendDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDayOfWeek = dateObj.getDay();

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

  // Finexy P&L Cashflow Chart Data (Jan - Aug)
  const cashflowBarData = [
    { month: "Jan", earnings: 45, spends: 28 },
    { month: "Feb", earnings: 52, spends: 32 },
    { month: "Mar", earnings: 48, spends: 30 },
    { month: "Apr", earnings: 58, spends: 35 },
    { month: "May", earnings: 60, spends: 25 },
    { month: "Jun", earnings: 55, spends: 29 },
    { month: "Jul", earnings: 62, spends: 26 },
    { month: "Aug", earnings: 60, spends: 24 },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Sleek Finexy Left Sidebar Dock (Desktop) */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-20 py-6 px-3 bg-white border-r border-slate-200/70 shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col items-center gap-6">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#ff5c38] text-white shadow-md shadow-[#ff5c38]/30 cursor-pointer">
            <Landmark className="size-5" />
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("spend")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "spend" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Spend Tracker"
            >
              <LayoutGrid className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowCalendarPopover(true)}
              className="size-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="Select Date"
            >
              <CalendarIcon className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "plan" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Overview & Plan"
            >
              <FileText className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("emis")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "emis" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="EMIs Ledger"
            >
              <CreditCardIcon className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "cards" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Credit Cards"
            >
              <Wallet className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="size-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title="Settings"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 pb-20">
        {/* Top Finexy Navigation Header */}
        <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200/80 px-4 py-3 backdrop-blur-md shadow-2xs sm:px-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo & Finexy Pill Navigation Bar */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-[#ff5c38] text-white shadow-sm shadow-[#ff5c38]/30">
                  <Landmark className="size-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900">Finexy<span className="text-[#ff5c38]">.</span></span>
              </div>

              {/* Navigation Pills (Finexy Exact Style) */}
              <nav className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/90 rounded-full border border-slate-200/60 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("spend")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "spend" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Spend Tracker
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("plan")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "plan" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Overview & Plan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invest")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "invest" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Invest
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("emis")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "emis" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  EMIs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cards")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "cards" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Cards
                </button>
              </nav>
            </div>

            {/* Right Header Utility Cluster */}
            <div className="flex items-center gap-2">
              {/* Primary Date Picker Pill */}
              <button
                type="button"
                onClick={() => setShowCalendarPopover(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-extrabold text-slate-900 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                <CalendarIcon className="size-3.5 text-[#ff5c38]" />
                <span className="truncate max-w-[130px] sm:max-w-none">{formatDateFormatted(spendDate)}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {/* Month Selector Pill */}
              <button
                type="button"
                onClick={() => setShowMonthDropdown(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-900 hover:bg-slate-200 cursor-pointer"
              >
                <span>{formatMonthLabel(selectedMonth)}</span>
                <ChevronDown className="size-3 text-slate-500" />
              </button>

              {/* User Profile Badge (Finexy Exact Style) */}
              <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                  SR
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-none">Sai Rahman</p>
                  <p className="text-[10px] text-slate-400 font-medium">sai@safe-spend.io</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE-FIRST CALENDAR MODAL OVERLAY */}
        {showCalendarPopover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowCalendarPopover(false)} />
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

        {/* MONTH SELECTOR MODAL OVERLAY */}
        {showMonthDropdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowMonthDropdown(false)} />
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

        {/* QUICK SPEND LOG MODAL (Opened from Primary CTA Button) */}
        {showSpendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowSpendModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="size-4 text-[#ff5c38]" /> {editingEntryId ? "Edit Transaction" : "Quick Add Spend / Debt"}
                </h3>
                <button
                  type="button"
                  className="size-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
                  onClick={() => setShowSpendModal(false)}
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={addSpend} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-amount" className="text-xs font-extrabold text-slate-700 block">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400 font-mono">₹</span>
                    <input
                      id="modal-amount"
                      inputMode="numeric"
                      min="1"
                      placeholder="e.g. 3500"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-sm h-11 pl-8 px-3 font-mono font-black text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 rounded-2xl h-11 px-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <optgroup label="Living Expenses">
                      {categoryOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({cat.budget})
                        </option>
                      ))}
                    </optgroup>
                    {debtPaymentStats.length > 0 && (
                      <optgroup label="Debt Payoffs">
                        {debtPaymentStats.map((debt) => (
                          <option key={debt.id} value={debt.id}>
                            {debt.name} ({debt.isCleared ? "Cleared" : formatInr(debt.remainingBalance)})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Payment Method</label>
                  <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    {paymentMethods.map((method) => {
                      const isSelected = paidBy === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaidBy(method.id)}
                          className={cn(
                            "flex-1 min-w-[70px] py-1.5 px-3 text-xs font-extrabold rounded-xl transition-all text-center",
                            isSelected ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900",
                          )}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-note" className="text-xs font-extrabold text-slate-700 block">Note (Optional)</label>
                  <input
                    id="modal-note"
                    placeholder="e.g. Grocery purchase..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs h-10 px-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button className="h-11 flex-1 text-sm font-extrabold bg-slate-900 text-white rounded-2xl shadow-xs" type="submit">
                    {editingEntryId ? "Update Entry" : "Save Spend / Payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 border-slate-200 text-slate-700 rounded-2xl font-bold"
                    onPress={() => setShowSpendModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Dashboard Workspace Grid */}
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 space-y-6">
          {/* Finexy Hero Overview Greeting & Balance Section */}
          <div className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Good morning, Sai
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                  Stay on top of your tasks, monitor progress, and track zero-EMI status.
                </p>
              </div>

              {/* Action Buttons (Finexy Exact Style) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSpendModal(true)}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="size-4 text-[#ff5c38]" /> Log Spend
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("plan")}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer"
                >
                  View Plan <ArrowUpRight className="size-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Total Balance Hero & Multi-Account Strip (Finexy Style) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-slate-100">
              <div className="md:col-span-6 space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Liquid Bank Balance</span>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">{formatInr(currentLiveBankBalance)}</p>
                  <Chip color="success" size="sm" variant="soft">
                    <TrendingUp className="size-3 mr-1" /> ↑ Safe Buffer
                  </Chip>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Must maintain <span className="font-mono font-bold text-slate-800">{formatInr(liveCashNeededInBank)}</span> in bank right now.
                </p>
              </div>

              {/* Wallets / Accounts Strip */}
              <div className="md:col-span-6 flex flex-col justify-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Account Allocations</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase">HDFC Main</p>
                    <p className="font-mono text-sm font-black text-slate-900 mt-0.5">{formatInr(monthIncomeReceived)}</p>
                    <span className="text-[10px] font-semibold text-emerald-600">Active</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase">Buffer Reserve</p>
                    <p className="font-mono text-sm font-black text-slate-900 mt-0.5">₹5,000</p>
                    <span className="text-[10px] font-semibold text-emerald-600">Locked</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase">Invest Target</p>
                    <p className="font-mono text-sm font-black text-slate-900 mt-0.5">{formatInr(netMonthSurplus)}</p>
                    <span className="text-[10px] font-semibold text-slate-500">Scheduled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Finexy Metric Widgets (2x2 Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Featured Solid Vibrant Coral Orange Card */}
            <div className="rounded-3xl bg-[#ff5c38] text-white p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-100">Total Earnings</span>
                <span className="rounded-full bg-white/20 p-2 text-white">
                  <IndianRupee className="size-4" />
                </span>
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight">{formatInr(monthTotalIncome)}</p>
                <p className="text-xs font-semibold text-orange-100 mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-white" />
                  <span>Received: {formatInr(monthIncomeReceived)}</span>
                </p>
              </div>
            </div>

            {/* Card 2: Outgoing EMIs */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Spending</span>
                <span className="rounded-full bg-slate-100 p-2 text-slate-700">
                  <CreditCardIcon className="size-4" />
                </span>
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(monthOutgoingEmis)}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {currentPersonalEmis.length} Personal · {currentVenkatPayableEmis.length} Venkat
                </p>
              </div>
            </div>

            {/* Card 3: Live Bank Balance */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Income</span>
                <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Landmark className="size-4" />
                </span>
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(currentLiveBankBalance)}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-emerald-600" />
                  <span>↑ Safe Buffer Intact</span>
                </p>
              </div>
            </div>

            {/* Card 4: Required Reserve */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Revenue</span>
                <span className="rounded-full bg-blue-50 p-2 text-blue-600">
                  <PiggyBank className="size-4" />
                </span>
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(liveCashNeededInBank)}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Pending: {formatInr(totalRemainingPendingOutflows)} + ₹5k
                </p>
              </div>
            </div>
          </div>

          {/* Finexy Layout: 2 Main Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Recent Activities Data Table & Monthly Limit Bar */}
            <div className="lg:col-span-8 space-y-6">
              {/* Monthly Spending Limit Bar Widget */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-slate-900">Monthly Variable Spending Limit</h3>
                  <span className="text-xs font-bold text-slate-500">
                    Day {dayOfMonth} of 30
                  </span>
                </div>
                <ProgressBar value={Math.min(100, (variableSpent / variableBudget) * 100)} className="h-3" />
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 pt-1">
                  <span>{formatInr(variableSpent)} spent</span>
                  <span>{formatInr(variableBudget)} monthly cap</span>
                </div>
              </div>

              {/* Finexy Activity Data Table (Recent Activities) */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Recent Activities</h3>
                    <p className="text-xs font-medium text-slate-500">
                      View your transaction logs for selected period
                    </p>
                  </div>

                  {/* Filter & Search Toolbar */}
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
                    No activity logs found. Tap "Log Spend" to add a transaction.
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
                            "flex items-center justify-between gap-3 rounded-2xl p-3.5 border transition-all bg-white hover:bg-slate-50/80",
                            isEditingThis ? "border-amber-300 bg-amber-50/60" : "border-slate-200/80",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("size-9 rounded-2xl flex items-center justify-center shrink-0", iconObj?.color || "bg-slate-100 text-slate-700")}>
                              <IconComponent className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs sm:text-sm font-extrabold text-slate-900">{displayName}</p>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {categoryLabel} · <span className="font-semibold text-slate-700">{method}</span> · <span className="font-mono text-slate-500">{entry.date}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <p className="font-mono text-xs sm:text-base font-black text-slate-900 mr-1">{formatInr(entry.amount)}</p>
                            <Button
                              aria-label="Edit spend entry"
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-xl min-w-0"
                              onPress={() => startEditingEntry(entry)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              aria-label="Delete spend entry"
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-xl min-w-0"
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

            {/* Right Column (4 cols): Cashflow Chart & My Credit Cards Stack */}
            <div className="lg:col-span-4 space-y-6">
              {/* Finexy Profit & Loss / Cashflow Chart Widget (Top Right) */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Total Income & Cashflow</h3>
                    <p className="text-xs text-slate-400 font-medium">Monthly trajectory overview</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-extrabold">
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#ff5c38]" /> Income</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-900" /> Outflows</span>
                  </div>
                </div>

                {/* Stacked Bar Visual Chart (Finexy Exact Style) */}
                <div className="flex items-end justify-between gap-1.5 h-36 pt-4 border-b border-slate-100">
                  {cashflowBarData.map((bar) => (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full max-w-[20px] flex flex-col gap-0.5 items-center">
                        <div
                          className="w-full rounded-t-md bg-[#ff5c38]"
                          style={{ height: `${bar.earnings * 1.2}px` }}
                        />
                        <div
                          className="w-full rounded-b-md bg-slate-900"
                          style={{ height: `${bar.spends * 1.1}px` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finexy Style: My Credit Cards Widget (Bottom Right) */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">My Cards</h3>
                  <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-[#ff5c38]">
                    + Add new
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Visual HDFC Dark Credit Card (Finexy Exact) */}
                  <div className="rounded-2xl bg-[#18181b] text-white p-4 space-y-3 shadow-md relative overflow-hidden">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold tracking-wider text-slate-300">HDFC Millennia</span>
                      <Chip color="success" size="sm" variant="soft">Active</Chip>
                    </div>
                    <p className="font-mono text-sm font-extrabold tracking-widest text-slate-300">•••• •••• 6782</p>
                    <div className="flex justify-between items-end text-xs pt-1 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Exp</p>
                        <p className="font-mono font-bold text-white">09/29</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">CVV</p>
                        <p className="font-mono font-bold text-white">611</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Limit</p>
                        <p className="font-mono font-bold text-white">₹75,000</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Axis Coral Credit Card (Finexy Exact) */}
                  <div className="rounded-2xl bg-[#ff5c38] text-white p-4 space-y-3 shadow-md relative overflow-hidden">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold tracking-wider text-orange-100">Axis MyZone</span>
                      <Chip color="success" size="sm" variant="soft">Active</Chip>
                    </div>
                    <p className="font-mono text-sm font-extrabold tracking-widest text-orange-100">•••• •••• 4356</p>
                    <div className="flex justify-between items-end text-xs pt-1 border-t border-white/20">
                      <div>
                        <p className="text-[10px] text-orange-100 uppercase font-bold">Exp</p>
                        <p className="font-mono font-bold text-white">11/28</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-orange-100 uppercase font-bold">Limit</p>
                        <p className="font-mono font-bold text-white">₹50,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
