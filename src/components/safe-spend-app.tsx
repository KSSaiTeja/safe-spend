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

  // Active view tab (Spend Tracker is default #1)
  const [activeTab, setActiveTab] = useState<"spend" | "plan" | "invest" | "emis" | "cards">("spend");
  const [spendListFilter, setSpendListFilter] = useState<"all" | "today" | "yesterday">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Income entry form states for selected month
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeDate, setNewIncomeDate] = useState("");
  const [showAddIncome, setShowAddIncome] = useState(false);

  // Custom Debt form states
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtLender, setNewDebtLender] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newDebtPriority, setNewDebtPriority] = useState<"high" | "normal">("high");

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

  // Current month incomes (Sai's real income sources)
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

    // Priority People Debts (Daddy & Venkat)
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

  const isBufferSweepActive = bufferSweeps[selectedMonth] ?? false;
  const netBufferSweepSurplus = isBufferSweepActive ? bufferTarget : 0;
  const projectedSurplusAboveBuffer = netMonthSurplus + netBufferSweepSurplus;

  const investmentPlan = useMemo(
    () => getInvestmentPlanForMonth(selectedMonth, projectedSurplusAboveBuffer > 0 ? projectedSurplusAboveBuffer : netMonthSurplus),
    [selectedMonth, projectedSurplusAboveBuffer, netMonthSurplus],
  );

  const monthPreviews = useMemo(() => generateMonthPreviews(octoberSeedData), []);
  const firstZeroEmiMonth = monthPreviews.find((preview) => preview.status === "emi-zero");

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

  function handleAddDebt(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(newDebtAmount);
    if (!newDebtName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;

    const newDebt: CustomDebt = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: newDebtName.trim(),
      lender: newDebtLender.trim() || "Private Lender",
      totalAmount: Math.round(parsed),
      category: "person",
      priority: newDebtPriority,
      month: selectedMonth,
    };

    setCustomDebts((prev) => ({
      ...prev,
      [selectedMonth]: [...(prev[selectedMonth] ?? []), newDebt],
    }));

    setNewDebtName("");
    setNewDebtLender("");
    setNewDebtAmount("");
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

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Finexy Vertical Left Sidebar Dock */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-20 py-5 px-3 bg-white border-r border-slate-200/70 shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col items-center gap-6">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#ff5c38] text-white shadow-md shadow-[#ff5c38]/30 cursor-pointer">
            <Landmark className="size-5" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("spend")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "spend" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Spend Tracker"
            >
              <LayoutGrid className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowCalendarPopover(true)}
              className="size-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="Date Picker"
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
              title="Overview & Plan"
            >
              <FileText className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invest")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "invest" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
              )}
              title="Investments"
            >
              <PiggyBank className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("emis")}
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "emis" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
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
                activeTab === "cards" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
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
            onClick={resetLocalData}
            className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Reset Local Data"
          >
            <RefreshCcw className="size-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 pb-20">
        {/* Finexy Header Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200/70 px-4 py-3 backdrop-blur-md shadow-2xs sm:px-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo & Navigation Menu Pills */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#ff5c38] text-white shadow-sm shadow-[#ff5c38]/30">
                  <Landmark className="size-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900">SafeSpend<span className="text-[#ff5c38]">.</span></span>
              </div>

              <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/60 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("spend")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "spend" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Spend Tracker
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("plan")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "plan" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Overview & Plan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invest")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "invest" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Invest
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("emis")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "emis" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  EMIs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cards")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all",
                    activeTab === "cards" ? "bg-[#18181b] text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  Cards
                </button>
              </nav>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2">
              {/* Primary Header Date Picker Pill */}
              <button
                type="button"
                onClick={() => setShowCalendarPopover(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-extrabold text-slate-900 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                <CalendarIcon className="size-3.5 text-[#ff5c38]" />
                <span>{formatDateFormatted(spendDate)}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {/* Month Selector Pill */}
              <button
                type="button"
                onClick={() => setShowMonthDropdown(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-900 hover:bg-slate-200 cursor-pointer"
              >
                <span>{formatMonthLabel(selectedMonth)}</span>
                <ChevronDown className="size-3 text-slate-500" />
              </button>

              {/* User Avatar Badge */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="size-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                  SK
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-extrabold text-slate-900">Sai Teja</p>
                  <p className="text-[10px] text-slate-400">Zenerative Minds</p>
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

        {/* FORECAST MONTH SELECTOR MODAL OVERLAY */}
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
                  {m.value === "2028-05" && <Chip color="accent" size="sm" variant="soft">Zero EMI Target</Chip>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUICK SPEND MODAL OVERLAY */}
        {showSpendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowSpendModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="size-4 text-[#ff5c38]" /> {editingEntryId ? "Edit Transaction" : "Quick Add Spend / Debt Payoff"}
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
                  <label htmlFor="quick-modal-amount" className="text-xs font-extrabold text-slate-700 block">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400 font-mono">₹</span>
                    <input
                      id="quick-modal-amount"
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
                  <label className="text-xs font-extrabold text-slate-700 block">Category / Debt</label>
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
                  <label htmlFor="quick-modal-note" className="text-xs font-extrabold text-slate-700 block">Note (Optional)</label>
                  <input
                    id="quick-modal-note"
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

        {/* Dashboard Workspace */}
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 space-y-6">
          {/* Greeting Banner */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Financial Overview 👋
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                Safe spend pace, live bank liquidity, and zero-EMI roadmap for {formatMonthLabel(selectedMonth)}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 px-4 text-xs font-extrabold bg-[#ff5c38] text-white rounded-full shadow-xs hover:bg-orange-600"
                onPress={() => setShowSpendModal(true)}
              >
                <Plus className="mr-1 size-3.5" /> Log Spend
              </Button>
            </div>
          </div>

          {/* TAB 1: SPEND TRACKER (DEFAULT VIEW #1) */}
          {activeTab === "spend" && (
            <div className="space-y-6">
              {/* Top 4 Finexy Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Featured Coral Card: Total Monthly Income */}
                <div className="rounded-3xl bg-[#ff5c38] text-white p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-100">Total Income</span>
                    <span className="rounded-full bg-white/20 p-1.5 text-white">
                      <IndianRupee className="size-3.5" />
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

                {/* White Card: Outgoing EMIs */}
                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Outgoing EMIs</span>
                    <span className="rounded-full bg-slate-100 p-1.5 text-slate-700">
                      <CreditCardIcon className="size-3.5" />
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(monthOutgoingEmis)}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {currentPersonalEmis.length} Personal · {currentVenkatPayableEmis.length} Venkat
                    </p>
                  </div>
                </div>

                {/* White Card: Live Bank Balance */}
                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Live Bank Balance</span>
                    <span className="rounded-full bg-emerald-50 p-1.5 text-emerald-600">
                      <Landmark className="size-3.5" />
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black font-mono tracking-tight text-slate-900">{formatInr(currentLiveBankBalance)}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">
                      {currentLiveBankBalance >= liveCashNeededInBank ? "✓ Safety Buffer Intact" : "⚠️ Cash Needed"}
                    </p>
                  </div>
                </div>

                {/* White Card: Required Reserve */}
                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Must Keep in Bank</span>
                    <span className="rounded-full bg-blue-50 p-1.5 text-blue-600">
                      <PiggyBank className="size-3.5" />
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

              {/* Main Content Grid: Left Column (8 cols) & Right Column (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 Cols: Tracked Debts Ledger & Recent Activities Table */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Tracked Obligations & Priority Debt Ledger */}
                  <div className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">Priority Debt & Obligation Ledger</h3>
                        <p className="text-xs text-slate-400 font-medium">Track repayments for {formatMonthLabel(selectedMonth)}</p>
                      </div>
                      <Chip color="warning" size="sm" variant="soft">
                        Pending: {formatInr(totalRemainingPendingOutflows)}
                      </Chip>
                    </div>

                    <div className="space-y-3">
                      {debtPaymentStats.map((debt) => (
                        <div key={debt.id} className="rounded-2xl border border-slate-200/70 p-3.5 bg-slate-50/50 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-900 flex items-center gap-2">
                              {debt.priority === "high" ? (
                                <AlertCircle className="size-4 text-[#ff5c38]" />
                              ) : (
                                <UserCheck className="size-4 text-emerald-600" />
                              )}
                              {debt.name}
                            </span>
                            <span className="font-mono font-black text-slate-900">
                              {debt.isCleared ? "CLEARED ✓" : `${formatInr(debt.paidSoFar)} / ${formatInr(debt.totalAmount)}`}
                            </span>
                          </div>

                          <ProgressBar
                            value={Math.min(100, (debt.paidSoFar / debt.totalAmount) * 100)}
                            className="h-2"
                          />

                          <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-0.5">
                            <span>Lender: {debt.lender} {debt.note ? `(${debt.note})` : ""}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryId(debt.id);
                                if (debt.remainingBalance > 0) setAmount(String(debt.remainingBalance));
                                setShowSpendModal(true);
                              }}
                              className="text-[#ff5c38] font-extrabold hover:underline"
                            >
                              {debt.isCleared ? "Logged" : "+ Pay & Log"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activities Data Table */}
                  <div className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h3 className="text-base font-extrabold text-slate-900">Recent Transactions</h3>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                          <input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 pr-3 text-xs bg-slate-100 border border-slate-200/80 rounded-full w-36 sm:w-44 focus:outline-none"
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

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-extrabold pb-2">
                            <th className="pb-2">ID</th>
                            <th className="pb-2">Activity / Note</th>
                            <th className="pb-2">Method</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2 pr-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredEntries.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                                No logged spends found. Tap "+ Log Spend" to record transaction.
                              </td>
                            </tr>
                          ) : (
                            filteredEntries.slice(0, 12).map((entry, idx) => {
                              const category = octoberSeedData.expenses.find((item) => item.id === entry.categoryId);
                              const debtCategory = debtPaymentStats.find((item) => item.id === entry.categoryId);
                              const method = paymentMethods.find((item) => item.id === entry.paidBy)?.label;
                              const displayName = entry.note || debtCategory?.name || category?.name || "Spend";
                              const orderId = `INV_00${80 - idx}`;

                              const iconObj = categoryOptions.find((c) => c.id === entry.categoryId);
                              const IconComponent = iconObj?.icon || Wallet;

                              return (
                                <tr key={entry.id} className="hover:bg-slate-50/80 transition-all font-semibold">
                                  <td className="py-3 font-mono font-bold text-slate-400 text-[11px]">{orderId}</td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", iconObj?.color || "bg-sky-50 text-sky-600")}>
                                        <IconComponent className="size-3.5" />
                                      </div>
                                      <span className="font-extrabold text-slate-900">{displayName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-slate-600 font-medium">{method}</td>
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
                                      <Pencil className="size-3.5" />
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

                {/* Right 4 Cols: Cards & Pace Widget */}
                <div className="lg:col-span-4 space-y-6">
                  {/* My Credit Cards Widget */}
                  <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-slate-900">My Credit Cards</h3>
                      <span className="text-xs font-bold text-slate-400">Limits</span>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl bg-[#18181b] text-white p-4 space-y-3 shadow-md">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold tracking-wider text-slate-300">HDFC Millennia</span>
                          <Chip color="success" size="sm" variant="soft">Active</Chip>
                        </div>
                        <p className="font-mono text-xs font-extrabold tracking-widest text-slate-300">•••• •••• 6782</p>
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

                      <div className="rounded-2xl bg-[#ff5c38] text-white p-4 space-y-3 shadow-md">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold tracking-wider text-orange-100">Axis MyZone</span>
                          <Chip color="success" size="sm" variant="soft">Active</Chip>
                        </div>
                        <p className="font-mono text-xs font-extrabold tracking-widest text-orange-100">•••• •••• 4356</p>
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
                  <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-4">
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
                          <span>Variable Spend ({dayOfMonth}/30 days)</span>
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
          )}

          {/* TAB 2: OVERVIEW & PLAN */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs space-y-5">
                <h3 className="text-xl font-extrabold text-slate-900">Income Sources for {formatMonthLabel(selectedMonth)}</h3>
                <div className="space-y-2">
                  {currentIncomes.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{source.name}</p>
                        <p className="text-xs text-slate-500">{source.expectedDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-black text-slate-900">{formatInr(source.amount)}</span>
                        <Button
                          size="sm"
                          variant={source.status === "received" ? "secondary" : "outline"}
                          className={cn("text-xs font-bold", source.status === "received" ? "bg-emerald-100 text-emerald-800" : "border-slate-300 text-amber-700")}
                          onPress={() => toggleIncomeStatus(source.id)}
                        >
                          {source.status === "received" ? "Received ✓" : "Expected"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-EMI Forecast Preview Roadmap */}
              <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900">Zero-EMI Trajectory Roadmap</h3>
                <p className="text-xs text-slate-500">Target zero EMI debt clearance by May 2028</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {monthPreviews.slice(0, 6).map((prev) => (
                    <div key={prev.month} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-1">
                      <p className="text-xs font-black text-slate-900">{formatMonthLabel(prev.month)}</p>
                      <p className="text-xs font-mono font-bold text-slate-700">EMI: {formatInr(prev.emisGoingOut)}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold">Surplus: {formatInr(prev.youKeepThisMonth)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVEST */}
          {activeTab === "invest" && (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs space-y-5">
              <h3 className="text-xl font-extrabold text-slate-900">Investment Strategy for {formatMonthLabel(selectedMonth)}</h3>
              <p className="text-xs text-slate-500">Recommended allocation of monthly surplus cash above ₹5,000 buffer</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl border border-slate-200 p-4 bg-emerald-50/50 space-y-2">
                  <p className="text-xs font-extrabold text-emerald-800">Liquid Emergency Reserve</p>
                  <p className="font-mono text-2xl font-black text-emerald-900">{formatInr(investmentPlan.liquidFundAmount)}</p>
                  <p className="text-xs text-emerald-700 font-medium">{investmentPlan.liquidFundName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-sky-50/50 space-y-2">
                  <p className="text-xs font-extrabold text-sky-800">Mutual Funds / SIP</p>
                  <p className="font-mono text-2xl font-black text-sky-900">{formatInr(investmentPlan.niftyIndexFundAmount)}</p>
                  <p className="text-xs text-sky-700 font-medium">{investmentPlan.niftyIndexFundName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-amber-50/50 space-y-2">
                  <p className="text-xs font-extrabold text-amber-800">Flexi Cap SIP</p>
                  <p className="font-mono text-2xl font-black text-amber-900">{formatInr(investmentPlan.flexiCapFundAmount)}</p>
                  <p className="text-xs text-amber-700 font-medium">{investmentPlan.flexiCapFundName}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMIS */}
          {activeTab === "emis" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900">Personal EMIs ({currentPersonalEmis.length})</h3>
                <div className="space-y-2">
                  {currentPersonalEmis.map((emi) => (
                    <div key={emi.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{emi.name}</p>
                        <p className="text-xs text-slate-500">Matures: {emi.ends}</p>
                      </div>
                      <span className="font-mono text-base font-black text-slate-900">{formatInr(emi.amount)}/mo</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900">Venkat Payable EMIs ({currentVenkatPayableEmis.length})</h3>
                <div className="space-y-2">
                  {currentVenkatPayableEmis.map((emi) => (
                    <div key={emi.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{emi.name} (to Venkat)</p>
                        <p className="text-xs text-slate-500">Matures: {emi.ends}</p>
                      </div>
                      <span className="font-mono text-base font-black text-slate-900">{formatInr(emi.amount)}/mo</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CARDS */}
          {activeTab === "cards" && (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs space-y-6">
              <h3 className="text-xl font-extrabold text-slate-900">Credit Cards & Usage Limits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-[#18181b] text-white p-6 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-300">HDFC Millennia Credit Card</span>
                    <Chip color="success" size="sm">Active</Chip>
                  </div>
                  <p className="font-mono text-xl font-black tracking-widest text-slate-200">•••• •••• •••• 6782</p>
                  <div className="flex justify-between items-end border-t border-slate-800 pt-3 text-xs">
                    <div>
                      <p className="text-slate-400">Total Credit Limit</p>
                      <p className="font-mono font-bold text-white text-base">₹75,000</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Due Status</p>
                      <p className="font-bold text-emerald-400">No Dues Pending</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#ff5c38] text-white p-6 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-orange-100">Axis MyZone Credit Card</span>
                    <Chip color="success" size="sm">Active</Chip>
                  </div>
                  <p className="font-mono text-xl font-black tracking-widest text-orange-100">•••• •••• •••• 4356</p>
                  <div className="flex justify-between items-end border-t border-white/20 pt-3 text-xs">
                    <div>
                      <p className="text-orange-200">Total Credit Limit</p>
                      <p className="font-mono font-bold text-white text-base">₹50,000</p>
                    </div>
                    <div>
                      <p className="text-orange-200">Due Status</p>
                      <p className="font-bold text-white">No Dues Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
