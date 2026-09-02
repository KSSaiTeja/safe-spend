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
  HelpCircle,
  Home,
  IndianRupee,
  Info,
  Landmark,
  LayoutGrid,
  LogOut,
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

  // Custom UI Popover / Modal states
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"spend" | "plan" | "invest" | "emis" | "cards">("spend");
  const [spendListFilter, setSpendListFilter] = useState<"all" | "today" | "yesterday">("all");
  const [searchQuery, setSearchQuery] = useState("");

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
  const monthOutgoingEmis = monthPersonalEmisTotal + monthVenkatPayableTotal;

  const bufferTarget = 5000;
  const isInitialCleanupMonth = selectedMonth === "2026-09";
  const creditCardBill = useMemo(() => {
    if (monthlyCardBills[selectedMonth] !== undefined) {
      return monthlyCardBills[selectedMonth];
    }
    return isInitialCleanupMonth ? octoberSeedData.creditCardBill : 0;
  }, [monthlyCardBills, selectedMonth, isInitialCleanupMonth]);

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

    return list;
  }, [
    isInitialCleanupMonth,
    selectedMonth,
    currentCustomDebts,
    currentPersonalEmis,
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

  // Finexy Exact Bar Chart Heights
  const barHeights = [
    { month: "Jan", orange: 40, black: 25 },
    { month: "Feb", orange: 48, black: 28 },
    { month: "Mar", orange: 44, black: 24 },
    { month: "Apr", orange: 55, black: 32 },
    { month: "May", orange: 60, black: 22 },
    { month: "Jun", orange: 50, black: 26 },
    { month: "Jul", orange: 58, black: 24 },
    { month: "Aug", orange: 52, black: 20 },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Sleek Finexy Vertical Left Sidebar Dock (Exact Match to Screenshot) */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-20 py-5 px-3 bg-white border-r border-slate-200/70 shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col items-center gap-6">
          {/* Top Finexy Brand Icon */}
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#ff5c38] text-white shadow-md shadow-[#ff5c38]/30 cursor-pointer">
            <Landmark className="size-5" />
          </div>

          {/* Navigation Dock Icons */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("spend")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "spend" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Overview"
            >
              <LayoutGrid className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowCalendarPopover(true)}
              className="size-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="Calendar Picker"
            >
              <CalendarIcon className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "plan" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Mail / Plan"
            >
              <Mail className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("emis")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "emis" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Reports / EMIs"
            >
              <FileText className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "cards" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Cards & Accounts"
            >
              <Users className="size-5" />
            </button>
          </div>
        </div>

        {/* Bottom Utility Icons */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>
          <button
            type="button"
            onClick={resetLocalData}
            className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Reset Data"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 min-w-0 pb-20">
        {/* Top Header Navbar (Exact Finexy Layout) */}
        <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200/70 px-4 py-3 backdrop-blur-md shadow-2xs sm:px-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo Badge + Center Pill Navigation Menu */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#ff5c38] text-white shadow-sm shadow-[#ff5c38]/30">
                  <Landmark className="size-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900">Finexy<span className="text-[#ff5c38]">.</span></span>
              </div>

              {/* Floating Pill Center Menu (Finexy Style) */}
              <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/60 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("spend")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "spend" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("plan")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "plan" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Activity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invest")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "invest" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Manage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("emis")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "emis" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Program
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cards")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "cards" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Reports
                </button>
              </nav>
            </div>

            {/* Right Action Icons & User Profile Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <Search className="size-3.5" />
              </button>
              <button
                type="button"
                className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 relative"
              >
                <Bell className="size-3.5" />
                <span className="absolute top-1.5 right-1.5 size-1.5 bg-[#ff5c38] rounded-full" />
              </button>

              {/* Date & Month Selector Pills */}
              <button
                type="button"
                onClick={() => setShowCalendarPopover(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-extrabold text-slate-900 shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                <CalendarIcon className="size-3 text-[#ff5c38]" />
                <span>{formatDateFormatted(spendDate)}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {/* User Profile Badge (Finexy Style) */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="size-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  SR
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-extrabold text-slate-900">Sajibur Rahman</p>
                  <p className="text-[10px] text-slate-400">sajibur.rahman@gm...</p>
                </div>
                <ChevronDown className="size-3 text-slate-400" />
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
                    spendDate === getLocalDateString() ? "bg-[#18181b] text-white shadow-xs" : "bg-slate-100 text-slate-800 hover:bg-slate-200",
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
                    spendDate === getYesterdayDateString() ? "bg-[#18181b] text-white shadow-xs" : "bg-slate-100 text-slate-800 hover:bg-slate-200",
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

        {/* QUICK SPEND MODAL */}
        {showSpendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowSpendModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="size-4 text-[#ff5c38]" /> {editingEntryId ? "Edit Transaction" : "Log Spend / Settlement"}
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
                  <label htmlFor="quick-amount" className="text-xs font-extrabold text-slate-700 block">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400 font-mono">₹</span>
                    <input
                      id="quick-amount"
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
                  <label htmlFor="quick-note" className="text-xs font-extrabold text-slate-700 block">Note (Optional)</label>
                  <input
                    id="quick-note"
                    placeholder="e.g. Grocery purchase..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs h-10 px-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button className="h-11 flex-1 text-sm font-extrabold bg-[#18181b] text-white rounded-2xl shadow-xs" type="submit">
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

        {/* Dashboard Content Container */}
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 space-y-6">
          {/* Greeting Row with Sun/Moon Theme Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Good morning, Sajibur
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                Stay on top of your tasks, monitor progress, and track status.
              </p>
            </div>

            {/* Sun/Moon Theme Indicator Pill */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200/70 shadow-2xs">
              <button type="button" className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Sun className="size-3.5" />
              </button>
              <button type="button" className="size-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700">
                <Moon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Main Grid Section (Finexy 3-Column Top Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Cols: Total Balance & Wallets */}
            <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-400">Total Balance</span>
                  <div className="flex items-center gap-1 text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full">
                    <span>🇺🇸 USD</span> <ChevronDown className="size-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">{formatInr(currentLiveBankBalance)}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3" /> ↑ 5% than last month
                  </p>
                </div>

                {/* Transfer & Request Action Buttons (Finexy Exact Style) */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSpendModal(true)}
                    className="h-10 bg-[#18181b] hover:bg-slate-800 text-white rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>⇆ Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSpendModal(true)}
                    className="h-10 bg-[#f4f5f7] hover:bg-slate-200 text-slate-900 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>⇆ Request</span>
                  </button>
                </div>
              </div>

              {/* Wallets Strip (Finexy Exact Style) */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-400">Wallets</span>
                  <span className="font-medium text-slate-400">Total 6 wallets</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 space-y-0.5">
                    <p className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">
                      <span>🇺🇸</span> USD
                    </p>
                    <p className="font-mono text-xs font-black text-slate-900">$22,678</p>
                    <p className="text-[9px] text-emerald-600 font-bold">• Active</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 space-y-0.5">
                    <p className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">
                      <span>🇪🇺</span> EUR
                    </p>
                    <p className="font-mono text-xs font-black text-slate-900">€18,345</p>
                    <p className="text-[9px] text-emerald-600 font-bold">• Active</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 space-y-0.5">
                    <p className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">
                      <span>🇬🇧</span> GBP
                    </p>
                    <p className="font-mono text-xs font-black text-slate-900">£15,000</p>
                    <p className="text-[9px] text-slate-400 font-bold">• Inactive</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle 4 Cols: 2x2 Metric Grid (With Featured Coral Card) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              {/* Featured Solid Vibrant Coral Card */}
              <div className="rounded-3xl bg-[#ff5c38] text-white p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-100">Total Earnings</span>
                  <span className="rounded-full bg-white/20 p-1.5 text-white">
                    <IndianRupee className="size-3.5" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight">{formatInr(monthTotalIncome)}</p>
                  <p className="text-[11px] font-semibold text-orange-100 mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3 text-white" /> ↑ 7% This month
                  </p>
                </div>
              </div>

              {/* White Metric Card: Total Spending */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Spending</span>
                  <span className="rounded-full bg-slate-100 p-1.5 text-slate-700">
                    <CreditCardIcon className="size-3.5" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(monthOutgoingEmis)}</p>
                  <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <TrendingDown className="size-3 text-red-500" /> ↓ 5% This month
                  </p>
                </div>
              </div>

              {/* White Metric Card: Total Income */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Income</span>
                  <span className="rounded-full bg-emerald-50 p-1.5 text-emerald-600">
                    <Landmark className="size-3.5" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(monthIncomeReceived)}</p>
                  <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3 text-emerald-600" /> ↑ 8% This month
                  </p>
                </div>
              </div>

              {/* White Metric Card: Total Revenue */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Revenue</span>
                  <span className="rounded-full bg-blue-50 p-1.5 text-blue-600">
                    <PiggyBank className="size-3.5" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(liveCashNeededInBank)}</p>
                  <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3 text-emerald-600" /> ↑ 4% This month
                  </p>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Finexy Cashflow Stacked Bar Chart Widget */}
            <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Total Income</h3>
                  <p className="text-[11px] text-slate-400 font-medium">View your income in a certain period of time</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-extrabold">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#ff5c38]" /> Profit</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#18181b]" /> Loss</span>
                </div>
              </div>

              {/* Finexy Dual Color Stacked Bars (Jan - Aug) */}
              <div className="flex items-end justify-between gap-2 h-44 pt-4 border-b border-slate-100">
                {barHeights.map((bar) => (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full max-w-[18px] flex flex-col gap-0.5 items-center">
                      <div
                        className="w-full rounded-t-sm bg-[#ff5c38]"
                        style={{ height: `${bar.orange}px` }}
                      />
                      <div
                        className="w-full rounded-b-sm bg-[#18181b]"
                        style={{ height: `${bar.black}px` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid Section: Monthly Limit + My Cards + Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Cols: Monthly Spending Limit & My Cards Stack */}
            <div className="lg:col-span-4 space-y-6">
              {/* Monthly Spending Limit Widget (Finexy Style) */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Monthly Spending Limit</h3>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="bg-[#ff5c38] h-full rounded-full" style={{ width: `${Math.min(100, (variableSpent / variableBudget) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-xs font-extrabold text-slate-800">
                    <span>{formatInr(variableSpent)} spent out of</span>
                    <span>{formatInr(variableBudget)}</span>
                  </div>
                </div>
              </div>

              {/* Finexy My Cards Widget */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="size-4 text-slate-700" />
                    <h3 className="text-base font-extrabold text-slate-900">My Cards</h3>
                  </div>
                  <button type="button" onClick={() => setShowSpendModal(true)} className="text-xs font-bold text-slate-500 hover:text-slate-900">
                    + Add new
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Black Card (Finexy Exact Style) */}
                  <div className="rounded-2xl bg-[#18181b] text-white p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-[10px] text-slate-400">(((•)))</span>
                      <Chip color="success" size="sm" variant="soft">Active</Chip>
                    </div>
                    <p className="font-mono text-xs font-extrabold tracking-widest text-slate-300">**** **** 6782</p>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <div>
                        <p className="uppercase">Card Number</p>
                        <p className="text-white font-mono">**** 6782</p>
                      </div>
                      <div>
                        <p className="uppercase">EXP</p>
                        <p className="text-white font-mono">09/29</p>
                      </div>
                      <div>
                        <p className="uppercase">CVV</p>
                        <p className="text-white font-mono">611</p>
                      </div>
                    </div>
                  </div>

                  {/* Orange Card (Finexy Exact Style) */}
                  <div className="rounded-2xl bg-[#ff5c38] text-white p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-[10px] text-orange-200">(((•)))</span>
                      <Chip color="success" size="sm" variant="soft">Active</Chip>
                    </div>
                    <p className="font-mono text-xs font-extrabold tracking-widest text-orange-100">**** **** 4356</p>
                    <div className="flex justify-between text-[10px] text-orange-200 pt-1 border-t border-white/20">
                      <div>
                        <p className="uppercase">Card Number</p>
                        <p className="text-white font-mono">**** 4356</p>
                      </div>
                      <div>
                        <p className="uppercase">EXP</p>
                        <p className="text-white font-mono">11/28</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 8 Cols: Recent Activities Table (Finexy Exact Layout) */}
            <div className="lg:col-span-8 rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-lg font-extrabold text-slate-900">Recent Activities</h3>

                {/* Filter & Search Toolbar */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                    <input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 pr-3 text-xs bg-slate-100 border border-slate-200/80 rounded-full w-36 sm:w-44 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    className="h-8 px-3 text-xs font-extrabold bg-slate-100 border border-slate-200/80 rounded-full flex items-center gap-1.5 text-slate-700 hover:bg-slate-200"
                  >
                    <Filter className="size-3" /> Filter =
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-extrabold pb-2">
                      <th className="pb-2 pl-2 w-8"><input type="checkbox" className="rounded" /></th>
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Activity</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No recent transactions found. Tap "⇆ Transfer" to log spends.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.slice(0, 10).map((entry, idx) => {
                        const category = octoberSeedData.expenses.find((item) => item.id === entry.categoryId);
                        const debtCategory = debtPaymentStats.find((item) => item.id === entry.categoryId);
                        const displayName = entry.note || debtCategory?.name || category?.name || "Spend";
                        const orderId = `INV_0000${76 - idx}`;

                        const iconObj = categoryOptions.find((c) => c.id === entry.categoryId);
                        const IconComponent = iconObj?.icon || Wallet;

                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/80 transition-all font-semibold">
                            <td className="py-3 pl-2"><input type="checkbox" className="rounded" /></td>
                            <td className="py-3 font-mono font-bold text-slate-500">{orderId}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", iconObj?.color || "bg-sky-50 text-sky-600")}>
                                  <IconComponent className="size-3.5" />
                                </div>
                                <span className="font-extrabold text-slate-900">{displayName}</span>
                              </div>
                            </td>
                            <td className="py-3 font-mono font-black text-slate-900">{formatInr(entry.amount)}</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50">
                                <span className="size-1.5 rounded-full bg-emerald-500" /> Completed
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 font-mono text-[11px]">{entry.date}</td>
                            <td className="py-3 pr-2 text-right">
                              <button
                                type="button"
                                onClick={() => startEditingEntry(entry)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
