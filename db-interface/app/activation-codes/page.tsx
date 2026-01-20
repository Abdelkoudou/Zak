"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  fetchActivationKeys,
  fetchFaculties,
  fetchSalesPoints,
  fetchDashboardStats,
  fetchSalesPointStats,
  generateBatchCodes,
  createSalesPoint,
  updateSalesPoint,
  revokeActivationKey,
  exportToCsv,
  updateActivationKeysExpiration,
  updateActivationKeySalesPoint,
} from "@/lib/activation-codes";
import type {
  ActivationKey,
  Faculty,
  SalesPoint,
  SalesPointStats,
  YearLevel,
} from "@/types/database";
import DeviceManagerModal from "@/components/DeviceManagerModal";

export default function ActivationCodesPage() {
  // Auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data state
  const [codes, setCodes] = useState<ActivationKey[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([]);
  const [salesPointStats, setSalesPointStats] = useState<SalesPointStats[]>([]);
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0,
    expiredCodes: 0,
    totalRevenue: 0,
  });
  const router = useRouter();

  // UI state
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "generate" | "codes" | "points"
  >("dashboard");
  const [filters, setFilters] = useState({
    year: "" as YearLevel | "",
    facultyId: "",
    salesPointId: "",
    status: "" as "active" | "used" | "expired" | "",
    search: "",
  });

  // Form state (simplified - year/faculty removed as user fills these during registration)
  const [generateForm, setGenerateForm] = useState({
    salesPointId: "",
    durationDays: 365,
    expirationMode: "duration" as "duration" | "exact",
    expirationDate: "",
    quantity: 1,
    notes: "",
    pricePaid: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Sales point form
  const [showSalesPointForm, setShowSalesPointForm] = useState(false);
  const [editingSalesPointId, setEditingSalesPointId] = useState<string | null>(null);
  const [salesPointForm, setSalesPointForm] = useState({
    code: "",
    name: "",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    commissionRate: 0,
    notes: "",
  });

  // Code detail modal
  const [selectedCode, setSelectedCode] = useState<ActivationKey | null>(null);

  // Device manager modal
  const [deviceManagerUser, setDeviceManagerUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Selection mode state (always active)
  const [selectionMode] = useState(true);
  const [selectedCodeIds, setSelectedCodeIds] = useState<Set<string>>(
    new Set()
  );

  // Bulk expiration update state
  const [showBulkExpirationModal, setShowBulkExpirationModal] = useState(false);
  const [bulkExpirationDate, setBulkExpirationDate] = useState("");
  const [isEditingSalesPoint, setIsEditingSalesPoint] = useState(false);
  const [newSalesPointId, setNewSalesPointId] = useState("");
  
  // Expanded stats card state
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  // Check user role
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: user } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (user) {
          setUserRole(user.role);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    const [codesRes, facultiesRes, pointsRes, statsRes, pointStatsRes] =
      await Promise.all([
        fetchActivationKeys({
          year: filters.year || undefined,
          facultyId: filters.facultyId || undefined,
          salesPointId: filters.salesPointId || undefined,
          isUsed:
            filters.status === "used"
              ? true
              : filters.status === "active"
              ? false
              : undefined,
          search: filters.search || undefined,
        }),
        fetchFaculties(),
        fetchSalesPoints(),
        fetchDashboardStats(),
        fetchSalesPointStats(),
      ]);

    setCodes(codesRes.data);
    setFaculties(facultiesRes.data);
    setSalesPoints(pointsRes.data);
    setStats(statsRes);
    setSalesPointStats(pointStatsRes.data);
  }, [filters]);

  useEffect(() => {
    if (userRole === "owner") {
      loadData();
    }
  }, [userRole, loadData]);

  // Generate codes (simplified - no year/faculty, user fills these during registration)
  const handleGenerate = async () => {
    if (!userId || !generateForm.salesPointId) {
      alert("Veuillez sélectionner un point de vente");
      return;
    }

    // Validate expiration date if in exact mode
    if (
      generateForm.expirationMode === "exact" &&
      !generateForm.expirationDate
    ) {
      alert("Veuillez sélectionner une date d'expiration");
      return;
    }

    setGenerating(true);
    const salesPoint = salesPoints.find(
      (sp) => sp.id === generateForm.salesPointId
    );

    if (!salesPoint) {
      alert("Point de vente invalide");
      setGenerating(false);
      return;
    }

    const result = await generateBatchCodes(
      {
        salesPointId: generateForm.salesPointId,
        durationDays: generateForm.durationDays,
        expirationDate:
          generateForm.expirationMode === "exact"
            ? generateForm.expirationDate
            : undefined,
        notes: generateForm.notes,
        pricePaid: generateForm.pricePaid,
        quantity: generateForm.quantity,
      },
      salesPoint.code,
      userId
    );

    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      setGeneratedCodes(result.codes);
      loadData();
    }
    setGenerating(false);
  };

  // Edit sales point
  const handleEditSalesPoint = (sp: SalesPoint) => {
    setEditingSalesPointId(sp.id);
    setSalesPointForm({
      code: sp.code,
      name: sp.name,
      location: sp.location || "",
      contactName: sp.contactName || "",
      contactPhone: sp.contactPhone || "",
      contactEmail: sp.contactEmail || "",
      commissionRate: sp.commissionRate,
      notes: sp.notes || "",
    });
    setShowSalesPointForm(true);
  };

  // Save sales point (Create or Update)
  const handleSaveSalesPoint = async () => {
    if (!userId || !salesPointForm.code || !salesPointForm.name) {
      alert("Code et nom sont obligatoires");
      return;
    }

    if (editingSalesPointId) {
      // Update
      const result = await updateSalesPoint(editingSalesPointId, {
        code: salesPointForm.code,
        name: salesPointForm.name,
        location: salesPointForm.location,
        contactName: salesPointForm.contactName,
        contactPhone: salesPointForm.contactPhone,
        contactEmail: salesPointForm.contactEmail,
        commissionRate: salesPointForm.commissionRate,
        notes: salesPointForm.notes,
      });

      if (result.error) {
        alert(`Erreur: ${result.error}`);
      } else {
        closeSalesPointForm();
        loadData();
      }
    } else {
      // Create
      const result = await createSalesPoint(
        {
          code: salesPointForm.code,
          name: salesPointForm.name,
          location: salesPointForm.location,
          contactName: salesPointForm.contactName,
          contactPhone: salesPointForm.contactPhone,
          contactEmail: salesPointForm.contactEmail,
          isActive: true,
          commissionRate: salesPointForm.commissionRate,
          notes: salesPointForm.notes,
        },
        userId
      );

      if (result.error) {
        alert(`Erreur: ${result.error}`);
      } else {
        closeSalesPointForm();
        loadData();
      }
    }
  };

  const closeSalesPointForm = () => {
    setShowSalesPointForm(false);
    setEditingSalesPointId(null);
    setSalesPointForm({
      code: "",
      name: "",
      location: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      commissionRate: 0,
      notes: "",
    });
  };

  // Revoke code
  const handleRevoke = async (id: string, keyCode: string) => {
    if (!confirm(`Voulez-vous vraiment révoquer le code ${keyCode}?`)) return;

    const result = await revokeActivationKey(id);
    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      loadData();
    }
  };

  // Bulk revoke codes
  const handleBulkRevoke = async () => {
    if (selectedCodeIds.size === 0) return;

    // Filter to only unused codes
    const unusedCodes = codes.filter(
      (code) => selectedCodeIds.has(code.id) && !code.isUsed
    );

    if (unusedCodes.length === 0) {
      alert(
        "Aucun code non utilisé sélectionné. Seuls les codes non utilisés peuvent être révoqués."
      );
      return;
    }

    const count = unusedCodes.length;
    if (
      !confirm(
        `Voulez-vous vraiment révoquer ${count} code(s) non utilisé(s) sélectionné(s)?`
      )
    )
      return;

    const results = await Promise.all(
      unusedCodes.map((code) => revokeActivationKey(code.id))
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      alert(`Erreur lors de la révocation de ${errors.length} code(s)`);
    } else {
      alert(`${count} code(s) révoqué(s) avec succès`);
      setSelectedCodeIds(new Set());
      loadData();
    }
  };

  // Bulk update expiration date
  const handleBulkUpdateExpiration = async () => {
    if (selectedCodeIds.size === 0) return;
    if (!bulkExpirationDate) {
      alert("Veuillez sélectionner une date d'expiration");
      return;
    }

    // Filter to only unused codes
    const unusedCodes = codes.filter(
      (code) => selectedCodeIds.has(code.id) && !code.isUsed
    );

    if (unusedCodes.length === 0) {
      alert(
        "Aucun code non utilisé sélectionné. Seuls les codes non utilisés peuvent être modifiés."
      );
      return;
    }

    const count = unusedCodes.length;
    const formattedDate = new Date(bulkExpirationDate).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    if (
      !confirm(
        `Voulez-vous vraiment mettre à jour la date d'expiration de ${count} code(s) au ${formattedDate}?`
      )
    )
      return;

    const result = await updateActivationKeysExpiration(
      unusedCodes.map((c) => c.id),
      bulkExpirationDate
    );

    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else if (result.errorCount > 0) {
      alert(
        `${result.successCount} code(s) mis à jour avec succès, ${result.errorCount} échec(s)`
      );
    } else {
      alert(`${result.successCount} code(s) mis à jour avec succès`);
      setShowBulkExpirationModal(false);
      setBulkExpirationDate("");
      setSelectedCodeIds(new Set());
      loadData();
    }
  };

  // Update sales point
  const handleUpdateSalesPoint = async () => {
    if (!selectedCode || !newSalesPointId) return;

    const result = await updateActivationKeySalesPoint(
      selectedCode.id,
      newSalesPointId
    );

    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      alert("Point de vente mis à jour avec succès");
      setIsEditingSalesPoint(false);
      
      // Update local selectedCode
      const updatedSP = salesPoints.find((sp) => sp.id === newSalesPointId);
      if (updatedSP) {
        setSelectedCode({
          ...selectedCode,
          salesPointId: newSalesPointId,
          salesPoint: updatedSP,
        });
      }
      
      setNewSalesPointId("");
      loadData();
    }
  };

  // Export selected codes
  const handleExportSelected = () => {
    if (selectedCodeIds.size === 0) return;

    const selectedCodes = codes.filter((code) => selectedCodeIds.has(code.id));
    const csv = exportToCsv(selectedCodes);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activation-codes-selected-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Toggle code selection
  const toggleCodeSelection = (codeId: string) => {
    const newSelection = new Set(selectedCodeIds);
    if (newSelection.has(codeId)) {
      newSelection.delete(codeId);
    } else {
      newSelection.add(codeId);
    }
    setSelectedCodeIds(newSelection);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedCodeIds.size === codes.length) {
      setSelectedCodeIds(new Set());
    } else {
      setSelectedCodeIds(new Set(codes.map((code) => code.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCodeIds(new Set());
  };

  // Export
  const handleExport = () => {
    const csv = exportToCsv(codes);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activation-codes-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  // Access denied
  if (userRole !== "owner") {
    return (
      <div className="max-w-7xl mx-auto py-20">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-12 text-center shadow-sm">
          <span className="text-6xl mb-6 block">🔒</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
            Accès Réservé
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Cette page est exclusivement réservée aux propriétaires du système.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 px-8 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Codes d&apos;Activation
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Génération & Gestion de Licences • FMC APP
          </p>
        </div>
        <button
          onClick={() => router.push("/payments")}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
        >
          <span>💳</span>
          <span>Paiements en Ligne</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-white/5 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-white/5">
        {[
          { id: "dashboard", label: "Dashboard", icon: "📊" },
          { id: "generate", label: "Générer", icon: "🔑" },
          { id: "codes", label: "Liste des Codes", icon: "📋" },
          { id: "points", label: "Points de Vente", icon: "🏪" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Cards - Interactive */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                id: "total",
                label: "Total Codes",
                value: stats.totalCodes,
                icon: "📊",
                color: "primary",
                details: [
                  { label: "Actifs", value: stats.activeCodes, color: "text-green-500" },
                  { label: "Utilisés", value: stats.usedCodes, color: "text-purple-500" },
                  { label: "Expirés", value: stats.expiredCodes, color: "text-red-500" },
                ],
                insight: stats.totalCodes > 0 
                  ? `${Math.round((stats.usedCodes / stats.totalCodes) * 100)}% des codes ont été utilisés`
                  : "Aucun code généré"
              },
              {
                id: "active",
                label: "Actifs",
                value: stats.activeCodes,
                icon: "✅",
                color: "blue",
                details: [
                  { label: "Prêts à vendre", value: stats.activeCodes, color: "text-blue-500" },
                  { label: "% du total", value: `${stats.totalCodes > 0 ? Math.round((stats.activeCodes / stats.totalCodes) * 100) : 0}%`, color: "text-slate-500" },
                ],
                insight: stats.activeCodes > 50 
                  ? "Stock suffisant pour les ventes" 
                  : stats.activeCodes > 0 
                  ? "Pensez à générer plus de codes" 
                  : "Aucun code actif disponible"
              },
              {
                id: "used",
                label: "Utilisés",
                value: stats.usedCodes,
                icon: "👤",
                color: "purple",
                details: [
                  { label: "Codes activés", value: stats.usedCodes, color: "text-purple-500" },
                  { label: "Taux conversion", value: `${stats.totalCodes > 0 ? Math.round((stats.usedCodes / stats.totalCodes) * 100) : 0}%`, color: "text-slate-500" },
                ],
                insight: stats.usedCodes > 0 
                  ? `${stats.usedCodes} utilisateur(s) avec abonnement actif`
                  : "Aucun code n'a encore été utilisé"
              },
              {
                id: "expired",
                label: "Expirés",
                value: stats.expiredCodes,
                icon: "⏰",
                color: "red",
                details: [
                  { label: "Non utilisés", value: stats.expiredCodes, color: "text-red-500" },
                  { label: "Perte potentielle", value: `${stats.expiredCodes * 500} DA`, color: "text-orange-500" },
                ],
                insight: stats.expiredCodes > 0 
                  ? "Ces codes n'ont pas été vendus à temps"
                  : "Aucun code expiré - Excellent!"
              },
              {
                id: "revenue",
                label: "Revenus",
                value: `${stats.totalRevenue.toLocaleString()} DA`,
                icon: "💰",
                color: "green",
                details: [
                  { label: "Total encaissé", value: `${stats.totalRevenue.toLocaleString()} DA`, color: "text-green-500" },
                  { label: "Moy. par code", value: stats.usedCodes > 0 ? `${Math.round(stats.totalRevenue / stats.usedCodes).toLocaleString()} DA` : "0 DA", color: "text-slate-500" },
                ],
                insight: stats.totalRevenue > 0 
                  ? `Revenu moyen: ${stats.usedCodes > 0 ? Math.round(stats.totalRevenue / stats.usedCodes) : 0} DA/code`
                  : "Aucun revenu enregistré"
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setExpandedStat(expandedStat === item.id ? null : item.id)}
                className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  expandedStat === item.id 
                    ? 'col-span-2 lg:col-span-2 p-6' 
                    : 'p-5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl transition-transform duration-300 ${expandedStat === item.id ? 'scale-125' : ''}`}>
                      {item.icon}
                    </span>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {item.label}
                    </p>
                  </div>
                  <span className={`text-slate-400 transition-transform duration-300 ${expandedStat === item.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                <p className={`font-black text-slate-900 dark:text-white truncate transition-all duration-300 ${
                  expandedStat === item.id ? 'text-3xl mb-4' : 'text-xl md:text-2xl'
                }`}>
                  {item.value}
                </p>
                
                {/* Expanded Details */}
                {expandedStat === item.id && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="h-px bg-slate-100 dark:bg-white/5" />
                    <div className="grid grid-cols-2 gap-3">
                      {item.details.map((detail, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{detail.label}</p>
                          <p className={`text-lg font-black ${detail.color}`}>{detail.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 border border-primary-100 dark:border-primary-800/30">
                      <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                        💡 {item.insight}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden mb-12">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                🏆 Performance des Points de Vente
              </h2>
            </div>
            <div className="p-6 md:p-8">
              {salesPointStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <span className="text-4xl mb-4">🏪</span>
                  <p className="font-medium">Aucun point de vente configuré</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-slate-100 dark:divide-white/5">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/50">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Point de Vente
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Total
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Vendus
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Actifs
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Taux
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Revenus
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {salesPointStats
                        .sort((a, b) => b.usedCodes - a.usedCodes)
                        .map((sp) => (
                          <tr
                            key={sp.id}
                            className="group hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                          >
                            <td className="px-6 py-5">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {sp.name}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                                {sp.location}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                              {sp.totalCodes}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                                {sp.usedCodes}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                              {sp.activeCodes}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                  sp.totalCodes > 0 &&
                                  sp.usedCodes / sp.totalCodes > 0.5
                                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                                    : "bg-slate-100 dark:bg-white/5 text-slate-500"
                                }`}
                              >
                                {sp.totalCodes > 0
                                  ? Math.round(
                                      (sp.usedCodes / sp.totalCodes) * 100
                                    )
                                  : 0}
                                %
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                              {sp.totalRevenue.toLocaleString()} DA
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "generate" && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Generation Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔐</span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Générer des Codes
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
              L&apos;année et la faculté seront renseignées par
              l&apos;utilisateur lors de son inscription. Ces codes sont valides
              pour n&apos;importe quelle année/faculté.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  Point de Vente *
                </label>
                <select
                  value={generateForm.salesPointId}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      salesPointId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900">
                    Sélectionner un point de vente
                  </option>
                  {salesPoints
                    .filter((sp) => sp.isActive)
                    .map((sp) => (
                      <option
                        key={sp.id}
                        value={sp.id}
                        className="bg-white dark:bg-slate-900"
                      >
                        {sp.name} - {sp.location}
                      </option>
                    ))}
                </select>
              </div>

              {/* Expiration Mode Toggle */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  Mode d&apos;expiration
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950/50 rounded-2xl">
                  <button
                    type="button"
                    onClick={() =>
                      setGenerateForm({
                        ...generateForm,
                        expirationMode: "duration",
                      })
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      generateForm.expirationMode === "duration"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    📅 Durée
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGenerateForm({
                        ...generateForm,
                        expirationMode: "exact",
                      })
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      generateForm.expirationMode === "exact"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    🎯 Date exacte
                  </button>
                </div>
              </div>

              {/* Duration or Exact Date based on mode */}
              {generateForm.expirationMode === "duration" ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Durée
                    </label>
                    <select
                      value={generateForm.durationDays}
                      onChange={(e) =>
                        setGenerateForm({
                          ...generateForm,
                          durationDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value={30} className="bg-white dark:bg-slate-900">
                        30 jours
                      </option>
                      <option value={90} className="bg-white dark:bg-slate-900">
                        90 jours
                      </option>
                      <option
                        value={180}
                        className="bg-white dark:bg-slate-900"
                      >
                        180 jours
                      </option>
                      <option
                        value={365}
                        className="bg-white dark:bg-slate-900"
                      >
                        1 an
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={generateForm.quantity}
                      onChange={(e) =>
                        setGenerateForm({
                          ...generateForm,
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Date d&apos;expiration *
                    </label>
                    <input
                      type="date"
                      value={generateForm.expirationDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setGenerateForm({
                          ...generateForm,
                          expirationDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none cursor-pointer"
                    />
                    {generateForm.expirationDate && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
                        Expire le:{" "}
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          {new Date(
                            generateForm.expirationDate
                          ).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={generateForm.quantity}
                      onChange={(e) =>
                        setGenerateForm({
                          ...generateForm,
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  Prix par code (DA)
                </label>
                <input
                  type="number"
                  min={0}
                  value={generateForm.pricePaid}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      pricePaid: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                  placeholder="Prix de vente..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  Notes
                </label>
                <textarea
                  value={generateForm.notes}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                  rows={2}
                  placeholder="Notes optionnelles..."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !generateForm.salesPointId}
                className="w-full px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
              >
                {generating
                  ? "⏳ Génération..."
                  : `🔑 Générer ${generateForm.quantity} Code(s)`}
              </button>
            </div>
          </div>

          {/* Generated Codes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Codes Générés
                </h2>
              </div>
              {generatedCodes.length > 0 && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCodes.join("\n"));
                    alert("Codes copiés!");
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                  📋 Copier tout
                </button>
              )}
            </div>

            {generatedCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 text-center px-6">
                <span className="text-4xl mb-4">🔑</span>
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">
                  Prêt à générer
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Les nouveaux codes apparaîtront ici après la génération.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {generatedCodes.map((code, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl transition-all hover:bg-slate-100 dark:hover:bg-slate-950"
                  >
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white tracking-widest">
                      {code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        alert("Code copié!");
                      }}
                      className="text-slate-400 hover:text-primary-500 transition-colors"
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "codes" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un code..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none md:w-64"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
              </div>

              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    year: e.target.value as YearLevel | "",
                  })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">
                  Toutes les années
                </option>
                <option value="1" className="bg-white dark:bg-slate-900">
                  1ère Année
                </option>
                <option value="2" className="bg-white dark:bg-slate-900">
                  2ème Année
                </option>
                <option value="3" className="bg-white dark:bg-slate-900">
                  3ème Année
                </option>
              </select>

              <select
                value={filters.facultyId}
                onChange={(e) =>
                  setFilters({ ...filters, facultyId: e.target.value })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">
                  Toutes les facultés
                </option>
                {faculties.map((f) => (
                  <option
                    key={f.id}
                    value={f.id}
                    className="bg-white dark:bg-slate-900"
                  >
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.salesPointId}
                onChange={(e) =>
                  setFilters({ ...filters, salesPointId: e.target.value })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">
                  🏪 Tous les points de vente
                </option>
                {salesPoints.map((sp) => (
                  <option
                    key={sp.id}
                    value={sp.id}
                    className="bg-white dark:bg-slate-900"
                  >
                    {sp.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as typeof filters.status,
                  })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">
                  Tous les statuts
                </option>
                <option value="active" className="bg-white dark:bg-slate-900">
                  ✅ Actifs
                </option>
                <option value="used" className="bg-white dark:bg-slate-900">
                  👤 Utilisés
                </option>
                <option value="expired" className="bg-white dark:bg-slate-900">
                  ⏰ Expirés
                </option>
              </select>

              <div className="ml-auto flex items-center gap-2">
                {selectedCodeIds.size > 0 ? (
                  <>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {selectedCodeIds.size} sélectionné(s)
                    </span>
                    <button
                      onClick={handleExportSelected}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all active:scale-95"
                    >
                      <span>📥</span> Exporter
                    </button>
                    <button
                      onClick={() => setShowBulkExpirationModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all active:scale-95"
                    >
                      <span>📅</span> Modifier Expiration
                    </button>
                    <button
                      onClick={handleBulkRevoke}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-95"
                    >
                      <span>🗑️</span> Révoquer
                    </button>
                    <button
                      onClick={clearSelection}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
                    >
                      <span>✖️</span> Effacer
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
                  >
                    <span>📥</span> Exporter CSV
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100 dark:divide-white/5">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50">
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <input
                      type="checkbox"
                      checked={
                        selectedCodeIds.size === codes.length &&
                        codes.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Code
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Année
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Point de Vente
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Création
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="text-3xl">📭</span>
                        <p className="text-slate-500 dark:text-slate-400 font-bold">
                          Aucun code trouvé
                        </p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Essayez de modifier vos filtres.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => {
                    const isExpired =
                      code.expiresAt && new Date(code.expiresAt) < new Date();
                    const status = code.isUsed
                      ? "used"
                      : isExpired
                      ? "expired"
                      : "active";
                    const user = code.usedByUser;
                    const isSelected = selectedCodeIds.has(code.id);

                    return (
                      <tr
                        key={code.id}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer ${
                          code.isUsed ? "bg-primary-500/5" : ""
                        } ${
                          isSelected
                            ? "bg-primary-500/10 dark:bg-primary-500/5"
                            : ""
                        }`}
                        onClick={() => setSelectedCode(code)}
                      >
                        <td
                          className="px-6 py-5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCodeSelection(code.id)}
                            className="w-4 h-4 text-primary-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <code className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-black font-mono text-slate-900 dark:text-white tracking-widest group-hover:bg-primary-500/10 group-hover:text-primary-600 transition-colors">
                            {code.keyCode}
                          </code>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                            {code.year}ère
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            {code.salesPoint?.name || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                              status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : status === "used"
                                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {status === "active"
                              ? "✅ Actif"
                              : status === "used"
                              ? "👤 Utilisé"
                              : "⏰ Expiré"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {user ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-[10px] font-black text-primary-600 uppercase">
                                {user.fullName
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {user.fullName || "User"}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  {user.email}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeviceManagerUser({
                                    id: user.id,
                                    name: user.fullName || "User",
                                  });
                                }}
                                className="ml-2 p-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                title="Gérer les appareils"
                              >
                                📱
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                              Disponible
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">
                          <div>
                            {new Date(code.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                          {code.usedAt && (
                            <div className="text-primary-600 dark:text-primary-400 mt-0.5">
                              Utilisé:{" "}
                              {new Date(code.usedAt).toLocaleDateString(
                                "fr-FR"
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            Affichage de {codes.length} code(s) actif(s)
          </div>
        </div>
      )}

      {activeTab === "points" && (
        <div className="space-y-8">
          {/* Add button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowSalesPointForm(true)}
              className="px-8 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95"
            >
              ➕ Nouveau Point de Vente
            </button>
          </div>

          {/* Sales Points List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesPoints.map((sp) => (
              <div
                key={sp.id}
                className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-primary-500/5 ${
                  !sp.isActive ? "opacity-50 grayscale" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary-600 transition-colors">
                      {sp.name}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      {sp.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSalesPoint(sp)}
                      className="p-1 text-slate-400 hover:text-primary-500 transition-colors"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        sp.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-white/5 text-slate-500"
                      }`}
                    >
                      {sp.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span>Code</span>
                    <span className="bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded font-mono text-slate-900 dark:text-white">
                      {sp.code}
                    </span>
                  </div>
                  {sp.contactName && (
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span>Contact</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {sp.contactName}
                      </span>
                    </div>
                  )}
                  {sp.contactPhone && (
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span>Tél</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {sp.contactPhone}
                      </span>
                    </div>
                  )}
                  {sp.commissionRate > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span>Commission</span>
                      <span className="px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md">
                        {sp.commissionRate}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Sales Point Modal */}
          {showSalesPointForm && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-2xl">🏪</span>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {editingSalesPointId
                      ? "Modifier Point de Vente"
                      : "Nouveau Point de Vente"}
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                        Code *
                      </label>
                      <input
                        type="text"
                        value={salesPointForm.code}
                        onChange={(e) =>
                          setSalesPointForm({
                            ...salesPointForm,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                        placeholder="ALG01"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                        Commission %
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={salesPointForm.commissionRate}
                        onChange={(e) =>
                          setSalesPointForm({
                            ...salesPointForm,
                            commissionRate: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={salesPointForm.name}
                      onChange={(e) =>
                        setSalesPointForm({
                          ...salesPointForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                      placeholder="Librairie El Ilm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={salesPointForm.location}
                      onChange={(e) =>
                        setSalesPointForm({
                          ...salesPointForm,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                      placeholder="Alger Centre"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Nom du Contact
                    </label>
                    <input
                      type="text"
                      value={salesPointForm.contactName}
                      onChange={(e) =>
                        setSalesPointForm({
                          ...salesPointForm,
                          contactName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={salesPointForm.contactPhone}
                      onChange={(e) =>
                        setSalesPointForm({
                          ...salesPointForm,
                          contactPhone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                      placeholder="0555 XX XX XX"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button
                    onClick={closeSalesPointForm}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveSalesPoint}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                    {editingSalesPointId ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Detail Modal */}
      {selectedCode && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                🔑 Détails du Code
              </h2>
              <button
                onClick={() => setSelectedCode(null)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold"
              >
                ×
              </button>
            </div>

            {/* Code Info */}
            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-3xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <code className="text-2xl font-black font-mono text-primary-600 dark:text-primary-400 tracking-[0.2em]">
                  {selectedCode.keyCode}
                </code>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedCode.isUsed
                      ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                      : selectedCode.expiresAt &&
                        new Date(selectedCode.expiresAt) < new Date()
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {selectedCode.isUsed
                    ? "👤 Utilisé"
                    : selectedCode.expiresAt &&
                      new Date(selectedCode.expiresAt) < new Date()
                    ? "⏰ Expiré"
                    : "✅ Actif"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-widest">
                  {new Date(selectedCode.createdAt).toLocaleDateString("fr-FR")}
                </span>
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-widest">
                  {selectedCode.durationDays} Jours
                </span>
                {selectedCode.year && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black uppercase tracking-widest">
                    {selectedCode.year}ère Année
                  </span>
                )}
              </div>
            </div>

            {/* Code Details */}
            <div className="space-y-4 mb-8">
              {isEditingSalesPoint ? (
                <div className="py-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                    Nouveau Point de Vente
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={newSalesPointId || selectedCode.salesPointId || ""}
                      onChange={(e) => setNewSalesPointId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">Sélectionner...</option>
                      {salesPoints.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateSalesPoint}
                      className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm hover:bg-emerald-600 transition-colors"
                      title="Enregistrer"
                    >
                      ✅
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSalesPoint(false);
                        setNewSalesPointId("");
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                      title="Annuler"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Point de Vente
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {selectedCode.salesPoint?.name || "-"}
                    </span>
                    <button
                      onClick={() => {
                        setNewSalesPointId(selectedCode.salesPointId || "");
                        setIsEditingSalesPoint(true);
                      }}
                      className="p-1 text-slate-400 hover:text-primary-500 transition-colors"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )}

              {selectedCode.expiresAt && (
                <DetailRow
                  label="Date d'Expiration"
                  value={new Date(selectedCode.expiresAt).toLocaleDateString(
                    "fr-FR"
                  )}
                />
              )}
              {selectedCode.notes && (
                <div className="pt-2">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 px-1">
                    Notes
                  </span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 italic">
                    &quot;{selectedCode.notes}&quot;
                  </div>
                </div>
              )}
            </div>

            {/* User Info (if used) */}
            {selectedCode.usedByUser ? (
              <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span>👤</span> Utilisateur Inscrit
                </h3>
                <div className="bg-primary-500/5 border border-primary-500/10 rounded-3xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-sm font-black text-primary-600 uppercase">
                      {selectedCode.usedByUser.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {selectedCode.usedByUser.fullName || "Sans nom"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {selectedCode.usedByUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedCode.usedByUser.faculty && (
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        🏛️ {selectedCode.usedByUser.faculty}
                      </span>
                    )}
                    {selectedCode.usedByUser.speciality && (
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        🎓 {selectedCode.usedByUser.speciality}
                      </span>
                    )}
                    {selectedCode.usedByUser.yearOfStudy && (
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        📚 {selectedCode.usedByUser.yearOfStudy}ère année
                      </span>
                    )}
                    {selectedCode.usedByUser.region && (
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        📍 {selectedCode.usedByUser.region}
                      </span>
                    )}
                  </div>

                  {selectedCode.usedAt && (
                    <div className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-6">
                      Activé le{" "}
                      {new Date(selectedCode.usedAt).toLocaleDateString(
                        "fr-FR"
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-8 border-t border-slate-100 dark:border-white/5 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-sm font-bold text-slate-500">
                  Code non encore activé
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  Disponible pour une nouvelle inscription.
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedCode(null)}
              className="w-full mt-10 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Device Manager Modal */}
      {deviceManagerUser && (
        <DeviceManagerModal
          userId={deviceManagerUser.id}
          userName={deviceManagerUser.name}
          onClose={() => setDeviceManagerUser(null)}
        />
      )}

      {/* Bulk Expiration Update Modal */}
      {showBulkExpirationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📅</span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Modifier l&apos;Expiration
              </h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Mettre à jour la date d&apos;expiration pour{" "}
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {
                  codes.filter(
                    (code) => selectedCodeIds.has(code.id) && !code.isUsed
                  ).length
                }
              </span>{" "}
              code(s) non utilisé(s) sélectionné(s).
            </p>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                Nouvelle Date d&apos;Expiration *
              </label>
              <input
                type="date"
                value={bulkExpirationDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setBulkExpirationDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none cursor-pointer"
              />
              {bulkExpirationDate && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
                  Les codes expireront le:{" "}
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {new Date(bulkExpirationDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkExpirationModal(false);
                  setBulkExpirationDate("");
                }}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkUpdateExpiration}
                disabled={!bulkExpirationDate}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mettre à Jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Detail Row Component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    red: "bg-red-50 border-red-200",
    yellow: "bg-yellow-50 border-yellow-200",
    orange: "bg-orange-50 border-orange-200",
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        colorClasses[color] || colorClasses.blue
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
