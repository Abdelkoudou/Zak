"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CaisseExpenseCategory, CaisseCategory } from "@/types/supabase";
import {
  Wallet,
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Ban,
  Filter,
  CalendarDays,
  List,
  History,
  Info,
  Banknote,
  SearchX,
} from "lucide-react";

// ============================================================================
// Constants
// ============================================================================

const EXPENSE_CATEGORIES: { value: CaisseExpenseCategory; label: string }[] = [
  { value: "rent", label: "Loyer" },
  { value: "server", label: "Serveur" },
  { value: "marketing", label: "Marketing" },
  { value: "salaries", label: "Salaires" },
  { value: "supplies", label: "Fournitures" },
  { value: "transport", label: "Transport" },
  { value: "food", label: "Nourriture" },
  { value: "printing", label: "Impression" },
  { value: "other", label: "Autre" },
];

const ACTIVATION_KEY_PRICES: Record<number, number> = {
  30: 1000,
  60: 1000,
  90: 1000,
  180: 1000,
  365: 1000,
};
const getKeyPrice = (durationDays: number): number =>
  ACTIVATION_KEY_PRICES[durationDays] || 1000;

const SOURCE_LABELS: Record<string, string> = {
  online: "En ligne",
  cash: "Espèce",
  point_de_vente: "Point de Vente",
  renewal: "Renouvellement",
  other: "Autre",
  rent: "Loyer",
  server: "Serveur",
  marketing: "Marketing",
  salaries: "Salaires",
  supplies: "Fournitures",
  transport: "Transport",
  food: "Nourriture",
  printing: "Impression",
};

const SOURCE_COLORS: Record<string, string> = {
  online: "#0ea5e9", // Sky 500
  cash: "#10b981", // Emerald 500
  point_de_vente: "#f59e0b", // Amber 500
  renewal: "#8b5cf6", // Violet 500
  rent: "#ef4444", // Red 500
  server: "#3b82f6", // Blue 500
  marketing: "#ec4899", // Pink 500
  salaries: "#f97316", // Orange 500
  supplies: "#6366f1", // Indigo 500
  transport: "#14b8a6", // Teal 500
  food: "#a855f7", // Purple 500
  printing: "#64748b", // Slate 500
  other: "#6b7280", // Gray 500
};

// ============================================================================
// Types
// ============================================================================

interface UnifiedTransaction {
  id: string;
  type: "income" | "expense";
  source: string;
  amount: number;
  description: string | null;
  date: Date;
  origin: "auto" | "manual";
}

interface CaisseExpense {
  id: string;
  type: "expense";
  category: CaisseCategory;
  amount: number;
  description: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

interface CaisseCheckout {
  id: string;
  period_start: string;
  period_end: string;
  total_income: number;
  total_expenses: number;
  net_amount: number;
  amount_withdrawn: number;
  notes: string | null;
  is_voided: boolean;
  voided_at: string | null;
  created_at: string;
  created_by: string;
}

interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return `${value.toLocaleString("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} DA`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================================
// Component
// ============================================================================

export default function CaissePage() {
  const router = useRouter();

  // Auth
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data State
  const [autoIncomeTransactions, setAutoIncomeTransactions] = useState<
    UnifiedTransaction[]
  >([]);
  const [manualExpenses, setManualExpenses] = useState<CaisseExpense[]>([]);
  const [checkouts, setCheckouts] = useState<CaisseCheckout[]>([]);

  // Config
  const [analyticsMode, setAnalyticsMode] = useState<"dev" | "production">(
    "dev",
  );
  const [productionSalesPoints, setProductionSalesPoints] = useState<string[]>(
    [],
  );

  // UI State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CaisseExpense | null>(
    null,
  );
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showVoidConfirm, setShowVoidConfirm] = useState<string | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<string>("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");

  // ============================================================================
  // Toast
  // ============================================================================
  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  // ============================================================================
  // Data Fetching
  // ============================================================================
  const fetchIncomeData = useCallback(
    async (mode: "dev" | "production", prodSalesPoints: string[]) => {
      // 1. Online payments
      const { data: onlinePayments, error: onlineErr } = await supabase
        .from("online_payments")
        .select("id, amount, paid_at, customer_email")
        .eq("status", "paid");

      if (onlineErr) {
        console.error("[Caisse] Online payments error:", onlineErr);
        addToast("error", "Erreur chargement paiements en ligne");
      }

      // 2. Activation keys
      let keysQuery = supabase
        .from("activation_keys")
        .select(
          "id, duration_days, used_at, notes, price_paid, payment_source, sales_point:sales_points(name, id)",
        )
        .eq("is_used", true)
        .not("used_at", "is", null)
        .neq("payment_source", "online");

      if (mode === "production" && prodSalesPoints.length > 0) {
        keysQuery = keysQuery.in("sales_point_id", prodSalesPoints);
      }

      const { data: usedKeys, error: keysErr } = await keysQuery;
      if (keysErr) {
        console.error("[Caisse] Activation keys error:", keysErr);
        addToast("error", "Erreur chargement clés d'activation");
      }

      const incomeRows: UnifiedTransaction[] = [];

      (onlinePayments || []).forEach((p) => {
        incomeRows.push({
          id: `online-${p.id}`,
          type: "income",
          source: "online",
          amount: p.amount || 0,
          description: p.customer_email || null,
          date: new Date(p.paid_at),
          origin: "auto",
        });
      });

      (usedKeys || []).forEach((k: any) => {
        const isRenewal =
          k.notes &&
          typeof k.notes === "string" &&
          k.notes.startsWith("Renouvellement manuel");
        incomeRows.push({
          id: `key-${k.id}`,
          type: "income",
          source: isRenewal ? "renewal" : "point_de_vente",
          amount: k.price_paid || getKeyPrice(k.duration_days),
          description: isRenewal ? k.notes : k.sales_point?.name || null,
          date: new Date(k.used_at),
          origin: "auto",
        });
      });

      setAutoIncomeTransactions(incomeRows);
    },
    [addToast],
  );

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from("caisse_transactions")
      .select("*")
      .eq("type", "expense")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Caisse] Expenses error:", error);
      addToast("error", "Erreur chargement dépenses");
    } else {
      setManualExpenses((data || []) as CaisseExpense[]);
    }
  }, [addToast]);

  const fetchCheckouts = useCallback(async () => {
    const { data, error } = await supabase
      .from("caisse_checkouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Caisse] Checkouts error:", error);
      addToast("error", "Erreur chargement checkouts");
    } else {
      setCheckouts(data || []);
    }
  }, [addToast]);

  const fetchAllData = useCallback(
    async (mode: "dev" | "production", prodSalesPoints: string[]) => {
      setLoading(true);
      await Promise.all([
        fetchIncomeData(mode, prodSalesPoints),
        fetchExpenses(),
        fetchCheckouts(),
      ]);
      setLoading(false);
    },
    [fetchIncomeData, fetchExpenses, fetchCheckouts],
  );

  // ============================================================================
  // Init
  // ============================================================================
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (!user || user.role !== "owner") {
        router.push("/");
        return;
      }

      setUserId(session.user.id);

      const { data: modeConfig } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "analytics_mode")
        .single();
      const { data: salesPointsConfig } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "production_sales_points")
        .single();

      const mode = (modeConfig?.value as "dev" | "production") || "dev";
      let prodPoints: string[] = [];
      try {
        prodPoints = salesPointsConfig?.value
          ? JSON.parse(salesPointsConfig.value)
          : [];
      } catch {
        prodPoints = [];
      }

      setAnalyticsMode(mode);
      setProductionSalesPoints(prodPoints);

      await fetchAllData(mode, prodPoints);
    };
    checkAuth();
  }, [router, fetchAllData]);

  // ============================================================================
  // Computed
  // ============================================================================
  const lastCheckout = useMemo(
    () => checkouts.find((c) => !c.is_voided) || null,
    [checkouts],
  );

  const allTransactions = useMemo((): UnifiedTransaction[] => {
    const expenseRows: UnifiedTransaction[] = manualExpenses.map((e) => ({
      id: e.id,
      type: "expense" as const,
      source: e.category,
      amount: e.amount,
      description: e.description,
      date: new Date(e.created_at),
      origin: "manual" as const,
    }));

    return [...autoIncomeTransactions, ...expenseRows].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }, [autoIncomeTransactions, manualExpenses]);

  const transactionsSinceCheckout = useMemo(() => {
    if (!lastCheckout) return allTransactions;
    const checkoutDate = new Date(lastCheckout.created_at);
    return allTransactions.filter((t) => t.date > checkoutDate);
  }, [allTransactions, lastCheckout]);

  const stats = useMemo(() => {
    const src = transactionsSinceCheckout;
    const totalIncome = src
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = src
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const carryOver = lastCheckout
      ? Number(lastCheckout.net_amount) - Number(lastCheckout.amount_withdrawn)
      : 0;
    const net = totalIncome - totalExpenses + carryOver;

    const incomeBySource: Record<string, number> = {};
    src
      .filter((t) => t.type === "income")
      .forEach((t) => {
        incomeBySource[t.source] = (incomeBySource[t.source] || 0) + t.amount;
      });

    return { totalIncome, totalExpenses, net, carryOver, incomeBySource };
  }, [transactionsSinceCheckout, lastCheckout]);

  const filteredTransactions = useMemo(() => {
    let list = allTransactions;
    if (filterType !== "all") list = list.filter((t) => t.type === filterType);
    if (filterMonth !== "all")
      list = list.filter((t) => getMonthKey(t.date) === filterMonth);
    return list;
  }, [allTransactions, filterType, filterMonth]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allTransactions.forEach((t) => months.add(getMonthKey(t.date)));
    return Array.from(months).sort().reverse();
  }, [allTransactions]);

  const daysSinceCheckout = lastCheckout
    ? Math.floor(
        (Date.now() - new Date(lastCheckout.created_at).getTime()) / 86400000,
      )
    : null;

  // ============================================================================
  // Actions
  // ============================================================================
  const handleAddExpense = async () => {
    if (!userId || !formCategory || !formAmount) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast("error", "Le montant doit être positif");
      return;
    }
    if (formDescription && formDescription.length > 500) {
      addToast("error", "Description trop longue (max 500)");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("caisse_transactions").insert({
      type: "expense",
      category: formCategory as CaisseCategory,
      amount,
      description: formDescription || null,
      created_by: userId,
    });

    if (error) {
      addToast("error", "Erreur: " + error.message);
    } else {
      addToast("success", "Dépense ajoutée ✓");
      setShowAddExpenseModal(false);
      resetForm();
      await fetchExpenses();
    }
    setSaving(false);
  };

  const handleEditExpense = async () => {
    if (!editingExpense || !formCategory || !formAmount) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast("error", "Le montant doit être positif");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("caisse_transactions")
      .update({
        category: formCategory as CaisseCategory,
        amount,
        description: formDescription || null,
      })
      .eq("id", editingExpense.id);

    if (error) {
      addToast("error", "Erreur: " + error.message);
    } else {
      addToast("success", "Dépense modifiée ✓");
      setShowEditModal(false);
      setEditingExpense(null);
      resetForm();
      await fetchExpenses();
    }
    setSaving(false);
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase
      .from("caisse_transactions")
      .delete()
      .eq("id", id);
    if (error) {
      addToast("error", "Erreur: " + error.message);
    } else {
      addToast("success", "Dépense supprimée ✓");
      await fetchExpenses();
    }
    setShowDeleteConfirm(null);
  };

  const handleCheckout = async () => {
    if (!userId) return;
    const withdrawn = parseFloat(checkoutAmount);
    if (isNaN(withdrawn) || withdrawn < 0) {
      addToast("error", "Montant invalide");
      return;
    }
    if (transactionsSinceCheckout.length === 0) {
      addToast("error", "Aucune transaction depuis le dernier checkout");
      return;
    }

    // Optimistic locking
    const { data: latestCo } = await supabase
      .from("caisse_checkouts")
      .select("created_at")
      .eq("is_voided", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (
      latestCo &&
      lastCheckout &&
      latestCo.created_at !== lastCheckout.created_at
    ) {
      addToast(
        "error",
        "Un checkout concurrent détecté. Rafraîchissez la page.",
      );
      await fetchAllData(analyticsMode, productionSalesPoints);
      setShowCheckoutModal(false);
      return;
    }

    setSaving(true);
    const periodStart = lastCheckout
      ? lastCheckout.created_at
      : transactionsSinceCheckout[
          transactionsSinceCheckout.length - 1
        ]?.date.toISOString() || new Date().toISOString();

    const { error } = await supabase.from("caisse_checkouts").insert({
      period_start: periodStart,
      total_income: stats.totalIncome,
      total_expenses: stats.totalExpenses,
      net_amount: stats.net,
      amount_withdrawn: withdrawn,
      notes: checkoutNotes || null,
      created_by: userId,
    });

    if (error) {
      addToast("error", "Erreur: " + error.message);
    } else {
      addToast(
        "success",
        `Checkout de ${formatCurrency(withdrawn)} enregistré ✓`,
      );
      setShowCheckoutModal(false);
      setCheckoutAmount("");
      setCheckoutNotes("");
      await fetchCheckouts();
    }
    setSaving(false);
  };

  const handleVoidCheckout = async (id: string) => {
    const { error } = await supabase
      .from("caisse_checkouts")
      .update({ is_voided: true, voided_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      addToast("error", "Erreur: " + error.message);
    } else {
      addToast("success", "Checkout annulé ✓");
      await fetchCheckouts();
    }
    setShowVoidConfirm(null);
  };

  const resetForm = () => {
    setFormCategory("");
    setFormAmount("");
    setFormDescription("");
  };

  const openEditModal = (expense: CaisseExpense) => {
    setEditingExpense(expense);
    setFormCategory(expense.category);
    setFormAmount(String(expense.amount));
    setFormDescription(expense.description || "");
    setShowEditModal(true);
  };

  const openCheckoutModal = () => {
    setCheckoutAmount(String(Math.max(0, stats.net)));
    setCheckoutNotes("");
    setShowCheckoutModal(true);
  };

  const canEditExpense = (e: CaisseExpense): boolean => {
    if (!lastCheckout) return true;
    return new Date(e.created_at) > new Date(lastCheckout.created_at);
  };

  // ============================================================================
  // Render Loading
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          <p className="text-theme-muted text-sm font-medium">
            Chargement de la caisse...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render Main
  // ============================================================================
  return (
    <div className="min-h-screen bg-theme text-theme py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-semibold pointer-events-auto transform transition-all duration-300 translate-x-0 ${t.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
            >
              {t.type === "success" ? (
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              ) : (
                <Info className="w-5 h-5" />
              )}
              {t.message}
            </div>
          ))}
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Landmark className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-theme tracking-tight font-display">
                Caisse
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${analyticsMode === "dev" ? "bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20" : "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"}`}
              >
                {analyticsMode === "dev" ? "Environnement Dev" : "Production"}
              </span>
            </div>
            <p className="mt-3 text-theme-muted flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4" />
              {lastCheckout
                ? `Dernier checkout le ${formatShortDate(lastCheckout.created_at)} (${daysSinceCheckout} jour${daysSinceCheckout !== 1 ? "s" : ""})`
                : "Aucun checkout enregistré"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAllData(analyticsMode, productionSalesPoints)}
              className="p-3 bg-theme-card border border-theme rounded-xl text-theme hover:bg-theme-secondary hover:text-primary transition-all cursor-pointer shadow-sm group"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button
              onClick={openCheckoutModal}
              className="flex items-center gap-2 px-5 py-3 bg-theme-card border border-theme hover:border-primary/50 text-theme rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <Wallet className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              Checkout
            </button>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Dépense
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Solde Net */}
          <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest">
                Solde Net
              </p>
            </div>
            <p
              className={`text-3xl font-black relative ${stats.net >= 0 ? "text-primary" : "text-red-500"}`}
            >
              {formatCurrency(stats.net)}
            </p>
            <p className="text-xs text-theme-muted mt-2 inline-flex items-center gap-1.5 relative">
              <Activity className="w-3.5 h-3.5" />
              {stats.carryOver !== 0
                ? `Report: ${formatCurrency(stats.carryOver)}`
                : "Depuis dernier checkout"}
            </p>
          </div>

          {/* Revenus */}
          <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest">
                Revenus
              </p>
            </div>
            <p className="text-3xl font-black text-emerald-500 relative">
              {formatCurrency(stats.totalIncome)}
            </p>
            <p className="text-xs text-theme-muted mt-2 inline-flex items-center gap-1.5 relative">
              <RefreshCw className="w-3.5 h-3.5" /> Auto-importés (BDD)
            </p>
          </div>

          {/* Dépenses */}
          <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest">
                Dépenses
              </p>
            </div>
            <p className="text-3xl font-black text-red-500 relative">
              {formatCurrency(stats.totalExpenses)}
            </p>
            <p className="text-xs text-theme-muted mt-2 inline-flex items-center gap-1.5 relative">
              <Edit2 className="w-3.5 h-3.5" /> Ajoutées manuellement
            </p>
          </div>

          {/* Transactions Count */}
          <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-theme-secondary rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-theme-secondary flex items-center justify-center border border-theme">
                <List className="w-5 h-5 text-theme" />
              </div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest">
                Transactions
              </p>
            </div>
            <p className="text-3xl font-black text-theme relative">
              {transactionsSinceCheckout.length}
            </p>
            <p className="text-xs text-theme-muted mt-2 inline-flex items-center gap-1.5 relative">
              <Info className="w-3.5 h-3.5" /> En attente de checkout
            </p>
          </div>
        </div>

        {/* Income Source Breakdown Row */}
        {Object.keys(stats.incomeBySource).length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-bold text-theme-muted uppercase tracking-widest mr-2 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Détail des sources :
            </div>
            {Object.entries(stats.incomeBySource).map(([src, amount]) => (
              <div
                key={src}
                className="flex items-center gap-2 bg-theme-card border border-theme rounded-full px-4 py-1.5 shadow-sm"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[src] || "#6b7280" }}
                />
                <span className="text-xs font-semibold text-theme-secondary">
                  {SOURCE_LABELS[src] || src}
                </span>
                <span className="text-sm font-bold text-theme ml-1">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="inline-flex bg-theme-secondary rounded-xl p-1 border border-theme shadow-inner">
                {(["all", "income", "expense"] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val)}
                    className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${filterType === val ? "bg-theme-card text-theme shadow-sm border border-theme" : "text-theme-muted hover:text-theme hover:bg-theme-card/50"}`}
                  >
                    {val === "all"
                      ? "Toutes"
                      : val === "income"
                        ? "Revenus"
                        : "Dépenses"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-theme-card border border-theme text-theme text-sm font-medium cursor-pointer shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="all">Tous les mois</option>
                  {availableMonths.map((m) => {
                    const [y, mo] = m.split("-");
                    const label = new Date(
                      parseInt(y),
                      parseInt(mo) - 1,
                    ).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <option key={m} value={m}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <Filter className="w-4 h-4 text-theme-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-theme-card rounded-2xl border border-theme shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-theme bg-theme-secondary/20 flex items-center justify-between">
                <h2 className="text-base font-bold text-theme flex items-center gap-2">
                  <List className="w-5 h-5 text-theme-muted" /> Liste des
                  transactions
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-theme-secondary text-theme-muted border border-theme">
                  {filteredTransactions.length} entrées
                </span>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <div className="w-16 h-16 bg-theme-secondary rounded-full flex items-center justify-center mb-4">
                    <SearchX className="w-8 h-8 text-theme-muted" />
                  </div>
                  <p className="text-theme font-semibold text-lg">
                    Aucune transaction
                  </p>
                  <p className="text-theme-muted text-sm mt-1">
                    Essayez de modifier vos filtres.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-theme bg-theme-secondary/30">
                        <th className="px-5 py-3 text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                          Type
                        </th>
                        <th className="px-5 py-3 text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                          Source
                        </th>
                        <th className="px-5 py-3 text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                          Description
                        </th>
                        <th className="px-5 py-3 text-[10px] font-bold text-theme-muted uppercase tracking-widest text-right">
                          Montant
                        </th>
                        <th className="px-5 py-3 text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                          Date
                        </th>
                        <th className="px-5 py-3 text-[10px] font-bold text-theme-muted uppercase tracking-widest text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-light">
                      {filteredTransactions.map((t) => {
                        const expenseObj =
                          t.origin === "manual"
                            ? manualExpenses.find((e) => e.id === t.id)
                            : null;
                        const isIncome = t.type === "income";

                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-theme-secondary/50 transition-colors group"
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isIncome ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"}`}
                              >
                                {isIncome ? (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                                {isIncome ? "Revenu" : "Dépense"}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      SOURCE_COLORS[t.source] || "#6B7280",
                                  }}
                                />
                                <span className="text-sm font-semibold text-theme">
                                  {SOURCE_LABELS[t.source] || t.source}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className="text-sm text-theme-muted line-clamp-1 max-w-[200px]"
                                title={t.description || ""}
                              >
                                {t.description || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <span
                                className={`text-sm font-bold ${isIncome ? "text-emerald-500" : "text-red-500"}`}
                              >
                                {isIncome ? "+" : "-"}
                                {formatCurrency(t.amount)}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-sm text-theme-secondary font-medium">
                                {formatDate(t.date)}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              {t.origin === "auto" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                  Auto (BDD)
                                </span>
                              ) : expenseObj && canEditExpense(expenseObj) ? (
                                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditModal(expenseObj)}
                                    className="p-1.5 rounded-lg hover:bg-theme border border-transparent hover:border-theme text-theme-muted hover:text-primary transition-all cursor-pointer"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(t.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-theme-muted hover:text-red-500 transition-all cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-theme-secondary text-theme-muted border border-theme">
                                  Verrouillé
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area - 1/3 width */}
          <div className="space-y-6">
            <div className="bg-theme-card rounded-2xl border border-theme shadow-sm overflow-hidden sticky top-6">
              <div className="p-5 border-b border-theme bg-theme-secondary/20 flex items-center justify-between">
                <h2 className="text-base font-bold text-theme flex items-center gap-2">
                  <History className="w-5 h-5 text-theme-muted" /> Checkouts
                </h2>
                <span className="text-xs font-medium text-theme-muted">
                  {checkouts.length} total
                </span>
              </div>

              {checkouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Banknote className="w-8 h-8 text-theme-secondary mb-3" />
                  <p className="text-theme-muted text-sm font-medium">
                    L&apos;historique est vide.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-theme-light max-h-[600px] overflow-y-auto">
                  {checkouts.map((c) => (
                    <div
                      key={c.id}
                      className={`p-5 hover:bg-theme-secondary/30 transition-colors ${c.is_voided ? "opacity-50 grayscale" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-theme flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-theme-muted" />
                          {formatShortDate(c.period_end)}
                        </span>
                        {c.is_voided ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <Ban className="w-3 h-3" /> Annulé
                          </span>
                        ) : (
                          <button
                            onClick={() => setShowVoidConfirm(c.id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-theme-muted hover:text-red-500 cursor-pointer transition-colors"
                            title="Annuler le checkout"
                          >
                            Annuler
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-theme-secondary">Période</span>
                          <span className="text-theme font-medium text-xs">
                            {formatShortDate(c.period_start)} au{" "}
                            {formatShortDate(c.period_end)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-theme-secondary">
                            Net calculé
                          </span>
                          <span
                            className={`font-semibold ${c.net_amount >= 0 ? "text-theme" : "text-red-500"}`}
                          >
                            {formatCurrency(c.net_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-theme border-dashed flex items-center justify-between">
                        <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">
                          Montant Retiré
                        </span>
                        <span className="text-lg font-black text-secondary">
                          {formatCurrency(c.amount_withdrawn)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODALS                                                             */}
      {/* ================================================================== */}

      {/* Add/Edit Expense Modal uses same structure, handled dynamically conceptually but separated here for clarity */}
      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddExpenseModal(false)}
        >
          <div
            className="bg-theme-card rounded-3xl border border-theme shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-red-500/10 border-b border-theme flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-theme">
                Ajouter une Dépense
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                  Catégorie
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm cursor-pointer focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none appearance-none"
                >
                  <option value="">Sélectionner une catégorie...</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                  Libellé
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Achat imprimante, Facture internet, Réparation..."
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none placeholder:text-theme-muted/50"
                />
                <p className="text-[11px] text-theme-muted mt-1.5">
                  Tapez librement le nom ou le détail de la dépense
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                  Montant (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted text-sm font-bold">
                    DA
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-theme bg-theme-secondary/50 flex gap-3">
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-theme text-theme font-bold text-sm hover:bg-theme-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleAddExpense}
                disabled={saving || !formCategory || !formAmount}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowEditModal(false);
            setEditingExpense(null);
          }}
        >
          <div
            className="bg-theme-card rounded-3xl border border-theme shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-primary/10 border-b border-theme flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Edit2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-theme">
                Modifier la Dépense
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                  Catégorie
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none appearance-none"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                  Libellé
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Achat imprimante, Facture internet, Réparation..."
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none placeholder:text-theme-muted/50"
                />
                <p className="text-[11px] text-theme-muted mt-1.5">
                  Tapez librement le nom ou le détail de la dépense
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                  Montant (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted text-sm font-bold">
                    DA
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-theme bg-theme-secondary/50 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingExpense(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-theme text-theme font-bold text-sm hover:bg-theme-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleEditExpense}
                disabled={saving || !formCategory || !formAmount}
                className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  "Mettre à jour"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCheckoutModal(false)}
        >
          <div
            className="bg-theme-card rounded-3xl border border-theme shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-secondary/10 border-b border-theme flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-theme">
                Faire le Checkout
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-theme-secondary rounded-2xl p-5 border border-theme space-y-3">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-theme-muted font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> Période concernée
                  </span>
                  <span className="font-semibold text-theme">
                    {lastCheckout
                      ? formatShortDate(lastCheckout.created_at)
                      : "Début"}{" "}
                    <span className="text-theme-muted mx-1">→</span> Maintenant
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-theme-muted font-medium">
                    Revenus totaux (auto)
                  </span>
                  <span className="font-bold text-emerald-500">
                    {formatCurrency(stats.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-theme-muted font-medium">
                    Dépenses totales
                  </span>
                  <span className="font-bold text-red-500">
                    {formatCurrency(stats.totalExpenses)}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t border-theme border-dashed flex justify-between items-center">
                  <span className="font-bold text-theme uppercase tracking-widest text-xs">
                    Bilan Net calculé
                  </span>
                  <span
                    className={`font-black text-xl ${stats.net >= 0 ? "text-primary" : "text-red-500"}`}
                  >
                    {formatCurrency(stats.net)}
                  </span>
                </div>

                {Object.keys(stats.incomeBySource).length > 0 && (
                  <div className="pt-3 mt-3 border-t border-theme border-dashed space-y-2">
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Sources des revenus
                    </p>
                    {Object.entries(stats.incomeBySource).map(([src, amt]) => (
                      <div
                        key={src}
                        className="flex justify-between text-xs items-center pl-5 relative"
                      >
                        <div
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: SOURCE_COLORS[src] || "#6b7280",
                          }}
                        ></div>
                        <span className="text-theme-muted font-medium">
                          {SOURCE_LABELS[src] || src}
                        </span>
                        <span className="font-semibold text-theme">
                          {formatCurrency(amt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {stats.net < 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 font-medium flex items-start gap-3">
                  <Ban className="w-5 h-5 shrink-0" />
                  Attention : Le solde net est négatif. Êtes-vous sûr de vouloir
                  effectuer un retrait ?
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                    Montant final à retirer
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={checkoutAmount}
                      onChange={(e) => setCheckoutAmount(e.target.value)}
                      className="w-full pl-5 pr-14 py-4 rounded-xl font-black text-2xl bg-theme-secondary border border-theme text-theme focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none text-right"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-lg">
                      DA
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2 block">
                    Notes ou remarques{" "}
                    <span className="font-normal normal-case">(Optionnel)</span>
                  </label>
                  <textarea
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex: Reste 5000 DA dans la caisse pour la monnaie..."
                    className="w-full px-4 py-3 rounded-xl bg-theme-secondary border border-theme text-theme text-sm resize-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-theme bg-theme-secondary/50 flex gap-3">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 px-4 py-3.5 rounded-xl border border-theme text-theme font-bold text-sm hover:bg-theme-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCheckout}
                disabled={saving || transactionsSinceCheckout.length === 0}
                className="flex-1 px-4 py-3.5 rounded-xl bg-secondary hover:bg-secondary-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  "Valider le Checkout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Void Confirms (Simplified Glassmorphism) */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-theme-card rounded-3xl border border-theme shadow-2xl w-full max-w-sm overflow-hidden text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-8 pb-6 px-6">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-theme mb-2">
                Supprimer la dépense ?
              </h3>
              <p className="text-sm text-theme-muted">
                Cette action supprimera définitivement cette transaction de la
                base de données.
              </p>
            </div>
            <div className="flex border-t border-theme divide-x divide-theme">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-4 text-theme font-bold text-sm hover:bg-theme-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteExpense(showDeleteConfirm)}
                className="flex-1 px-4 py-4 text-red-500 hover:bg-red-500/10 font-bold text-sm transition-colors cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showVoidConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowVoidConfirm(null)}
        >
          <div
            className="bg-theme-card rounded-3xl border border-theme shadow-2xl w-full max-w-sm overflow-hidden text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-8 pb-6 px-6">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-theme mb-2">
                Annuler ce Checkout ?
              </h3>
              <p className="text-sm text-theme-muted">
                Le checkout sera conservé dans l&apos;historique mais marqué
                comme annulé.
              </p>
            </div>
            <div className="flex border-t border-theme divide-x divide-theme">
              <button
                onClick={() => setShowVoidConfirm(null)}
                className="flex-1 px-4 py-4 text-theme font-bold text-sm hover:bg-theme-secondary transition-colors cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={() => handleVoidCheckout(showVoidConfirm)}
                className="flex-1 px-4 py-4 text-red-500 hover:bg-red-500/10 font-bold text-sm transition-colors cursor-pointer animate-pulse-slow"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
