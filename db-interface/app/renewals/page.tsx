"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getExpiredUsers,
  searchUserByEmail,
  renewSubscription,
  uploadReceipt,
  fetchActivePlans,
  getRenewalHistory,
  getReceiptUrl,
  type ExpiredUser,
  type UserLookupResult,
  type RenewalHistoryItem,
} from "./actions";

// ============================================================================
// Types
// ============================================================================

interface PlanOption {
  id: string;
  name: string;
  durationDays: number;
  price: number;
}

type WizardStep = "email" | "confirm" | "renew" | "success";

// ============================================================================
// WebP compression utility
// ============================================================================

function compressToWebP(
  file: File,
  quality = 0.8,
  maxWidth = 1920,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let w = img.width;
      let h = img.height;

      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("WebP conversion failed"));
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

// ============================================================================
// French ordinal helper (1ère, 2ème, ...)
// ============================================================================

function formatOrdinalFr(n: string | number): string {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  if (Number.isNaN(num)) return "";
  return num === 1 ? "1ère" : `${num}ème`;
}

// ============================================================================
// Component
// ============================================================================

export default function RenewalsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<"expired" | "renew" | "history">(
    "expired",
  );

  // History
  const [historyItems, setHistoryItems] = useState<RenewalHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<RenewalHistoryItem | null>(null);
  const [receiptImgUrl, setReceiptImgUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Expired users
  const [expiredUsers, setExpiredUsers] = useState<ExpiredUser[]>([]);
  const [expiredLoading, setExpiredLoading] = useState(false);
  const [expiredSearch, setExpiredSearch] = useState("");

  // Wizard state
  const [step, setStep] = useState<WizardStep>("email");
  const [emailInput, setEmailInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundUser, setFoundUser] = useState<UserLookupResult | null>(null);

  // Renewal form
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [notes, setNotes] = useState("");
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState("");

  // Success state
  const [resultKeyCode, setResultKeyCode] = useState("");
  const [resultExpiresAt, setResultExpiresAt] = useState("");

  // ============================================================================
  // Auth check
  // ============================================================================

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (user) setUserRole(user.role);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // ============================================================================
  // Load expired users
  // ============================================================================

  const loadExpired = useCallback(async () => {
    setExpiredLoading(true);
    const { data, error } = await getExpiredUsers();
    if (!error) setExpiredUsers(data);
    setExpiredLoading(false);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data, error } = await getRenewalHistory();
    if (!error) setHistoryItems(data);
    setHistoryLoading(false);
  }, []);

  const openTxDetail = async (item: RenewalHistoryItem) => {
    setSelectedTx(item);
    setReceiptImgUrl(null);
    if (item.receiptPath) {
      setReceiptLoading(true);
      const { url } = await getReceiptUrl(item.receiptPath);
      setReceiptImgUrl(url || null);
      setReceiptLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "owner") {
      loadExpired();
      fetchActivePlans().then((p) => {
        setPlans(p);
        if (p.length > 0) setSelectedPlanId(p[0].id);
      });
    }
  }, [userRole, loadExpired]);

  // ============================================================================
  // Filtered expired users
  // ============================================================================

  const filteredExpired = expiredSearch
    ? expiredUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(expiredSearch.toLowerCase()) ||
          u.fullName?.toLowerCase().includes(expiredSearch.toLowerCase()),
      )
    : expiredUsers;

  // ============================================================================
  // Wizard: search user
  // ============================================================================

  const handleSearch = async () => {
    if (!emailInput.trim()) return;
    setSearchLoading(true);
    setSearchError("");

    const { data, error } = await searchUserByEmail(emailInput.trim());

    if (error || !data) {
      setSearchError(error || "Utilisateur introuvable");
      setSearchLoading(false);
      return;
    }

    setFoundUser(data);
    setStep("confirm");
    setSearchLoading(false);
  };

  // ============================================================================
  // Handle file selection + compress
  // ============================================================================

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous preview URL to avoid memory leaks
    setReceiptPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setReceiptFile(file);
    setOriginalSize(file.size);
    setCompressing(true);

    try {
      const webpBlob = await compressToWebP(file);
      setCompressedBlob(webpBlob);
      setCompressedSize(webpBlob.size);
      setReceiptPreview(URL.createObjectURL(webpBlob));
    } catch {
      // Fallback: use original
      setCompressedBlob(null);
      setCompressedSize(file.size);
      setReceiptPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  // Revoke object URL on unmount or when preview becomes null
  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptPreview]);

  // ============================================================================
  // Submit renewal
  // ============================================================================

  const handleRenew = async () => {
    if (!foundUser || !selectedPlanId) return;
    setRenewLoading(true);
    setRenewError("");

    let receiptFileName: string | undefined;

    // Upload receipt if provided
    if (receiptFile) {
      const uploadData = new FormData();

      if (compressedBlob) {
        const webpFile = new File(
          [compressedBlob],
          receiptFile.name.replace(/\.[^.]+$/, ".webp"),
          { type: "image/webp" },
        );
        uploadData.set("receipt", webpFile);
      } else {
        uploadData.set("receipt", receiptFile);
      }

      const { path, error: uploadError } = await uploadReceipt(uploadData);
      if (uploadError) {
        setRenewError(uploadError);
        setRenewLoading(false);
        return;
      }
      receiptFileName = path;
    }

    const result = await renewSubscription({
      userId: foundUser.id,
      planId: selectedPlanId,
      receiptFileName,
      notes: notes || undefined,
    });

    if (result.error) {
      setRenewError(result.error);
      setRenewLoading(false);
      return;
    }

    setResultKeyCode(result.keyCode || "");
    setResultExpiresAt(result.expiresAt || "");
    setStep("success");
    setRenewLoading(false);
  };

  // ============================================================================
  // Reset wizard
  // ============================================================================

  const resetWizard = () => {
    setStep("email");
    setEmailInput("");
    setFoundUser(null);
    setSearchError("");
    setReceiptFile(null);
    setReceiptPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCompressedBlob(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setNotes("");
    setRenewError("");
    setResultKeyCode("");
    setResultExpiresAt("");
  };

  // Start renew from expired table
  const startRenewFromExpired = (user: ExpiredUser) => {
    setActiveTab("renew");
    setEmailInput(user.email);
    setFoundUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      faculty: user.faculty,
      yearOfStudy: user.yearOfStudy,
      region: null,
      isPaid: true,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      lastActivationCode: user.lastActivationCode,
      lastDurationDays: user.lastDurationDays,
    });
    setStep("confirm");
  };

  // ============================================================================
  // Guards
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (userRole !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Accès Refusé
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-center">
          Cette page est réservée aux propriétaires.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors"
        >
          Retour au Dashboard
        </button>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔄</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Renouvellements
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Gérez les renouvellements d&apos;abonnements, consultez les comptes
          expirés et ceux qui expirent bientôt.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("expired")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === "expired"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span>⏰</span> Abonnements
          {expiredUsers.length > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "expired"
                  ? "bg-white/20 text-white"
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}
            >
              {expiredUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("renew");
            if (step === "success") resetWizard();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === "renew"
              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span>🔄</span> Renouveler
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            loadHistory();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === "history"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span>📜</span> Historique
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB: Expired Users */}
      {/* ================================================================ */}
      {activeTab === "expired" && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="🔍 Rechercher par email ou nom..."
                value={expiredSearch}
                onChange={(e) => setExpiredSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              {/* Quick stats */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  ⛔ {expiredUsers.filter((u) => u.status === "expired").length}{" "}
                  expirés
                </span>
                <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  ⚠️{" "}
                  {expiredUsers.filter((u) => u.status === "expiring").length}{" "}
                  bientôt
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            {expiredLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredExpired.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-4">🎉</span>
                <p className="font-medium text-slate-900 dark:text-white mb-1">
                  Aucun compte expiré ou en voie d&apos;expiration
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tous les abonnements sont à jour.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Dernier code
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpired.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {user.fullName || "Sans nom"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                          {user.faculty && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {user.faculty}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.status === "expired" ? (
                            <>
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded-md ${
                                  user.daysSinceExpiry > 30
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                }`}
                              >
                                ⛔ Expiré il y a {user.daysSinceExpiry}j
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(
                                  user.subscriptionExpiresAt,
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                                ⚠️ Expire dans {Math.abs(user.daysSinceExpiry)}j
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(
                                  user.subscriptionExpiresAt,
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.lastActivationCode ? (
                            <div>
                              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                                {user.lastActivationCode}
                              </code>
                              {user.lastDurationDays && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {user.lastDurationDays}j
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => startRenewFromExpired(user)}
                            className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            🔄 Renouveler
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {filteredExpired.length} compte
            {filteredExpired.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: Renew Wizard */}
      {/* ================================================================ */}
      {activeTab === "renew" && (
        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(
              [
                { key: "email", label: "Email", icon: "📧" },
                { key: "confirm", label: "Confirmer", icon: "👤" },
                { key: "renew", label: "Renouveler", icon: "🔄" },
                { key: "success", label: "Terminé", icon: "✅" },
              ] as const
            ).map((s, i) => {
              const steps: WizardStep[] = [
                "email",
                "confirm",
                "renew",
                "success",
              ];
              const currentIdx = steps.indexOf(step);
              const isActive = step === s.key;
              const isPast = steps.indexOf(s.key) < currentIdx;

              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                        : isPast
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-6 h-0.5 rounded ${
                        isPast
                          ? "bg-green-400"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ---- Step 1: Email ---- */}
          {step === "email" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">📧</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Rechercher un utilisateur
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Entrez l&apos;email de l&apos;utilisateur à renouveler
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="email@exemple.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || !emailInput.trim()}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  {searchLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "🔍"
                  )}
                  Rechercher
                </button>
              </div>

              {searchError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                  ❌ {searchError}
                </div>
              )}
            </div>
          )}

          {/* ---- Step 2: Confirm User ---- */}
          {step === "confirm" && foundUser && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">👤</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Confirmer l&apos;utilisateur
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Vérifiez que c&apos;est bien le bon compte
                </p>
              </div>

              {/* User card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white truncate">
                      {foundUser.fullName || "Sans nom"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {foundUser.email}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Faculté
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {foundUser.faculty || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Année
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {foundUser.yearOfStudy
                            ? formatOrdinalFr(foundUser.yearOfStudy)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Statut
                        </p>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            foundUser.isPaid &&
                            foundUser.subscriptionExpiresAt &&
                            new Date(foundUser.subscriptionExpiresAt) >
                              new Date()
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              : foundUser.isPaid
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {foundUser.isPaid &&
                          foundUser.subscriptionExpiresAt &&
                          new Date(foundUser.subscriptionExpiresAt) > new Date()
                            ? "Actif"
                            : foundUser.isPaid
                              ? "Expiré"
                              : "Non activé"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Expiration
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {foundUser.subscriptionExpiresAt
                            ? new Date(
                                foundUser.subscriptionExpiresAt,
                              ).toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {foundUser.lastActivationCode && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                          Dernier code d&apos;activation
                        </p>
                        <code className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-mono block">
                          {foundUser.lastActivationCode}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("email");
                    setFoundUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setStep("renew")}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors"
                >
                  Confirmer →
                </button>
              </div>
            </div>
          )}

          {/* ---- Step 3: Renewal Form ---- */}
          {step === "renew" && foundUser && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">🔄</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Renouveler l&apos;abonnement
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {foundUser.fullName || foundUser.email}
                </p>
              </div>

              <div className="space-y-5">
                {/* Plan selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Choix de l&apos;offre
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPlanId === plan.id
                            ? "border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <p className="font-black text-lg text-slate-900 dark:text-white">
                          {plan.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {plan.durationDays} jours • {plan.price} DA
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Receipt upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Reçu de paiement (optionnel)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 transition-all"
                    >
                      {compressing ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                          <p className="text-sm text-slate-500">
                            Compression en WebP...
                          </p>
                        </div>
                      ) : receiptPreview ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={receiptPreview}
                            alt="Reçu"
                            className="max-h-40 rounded-lg object-contain"
                          />
                          <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {receiptFile?.name}
                            </p>
                            {compressedBlob ? (
                              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1">
                                ✅ Compressé :{" "}
                                {(originalSize / 1024).toFixed(0)}KB  → 
                                {(compressedSize / 1024).toFixed(0)}KB (
                                {originalSize > 0
                                  ? Math.round(
                                      (1 - compressedSize / originalSize) * 100,
                                    )
                                  : 0}
                                % réduit)
                              </p>
                            ) : (
                              <p className="text-[10px] text-orange-500 font-bold mt-1">
                                ⚠️ Compression échouée — fichier original
                                utilisé
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl mb-2">📸</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Cliquez pour ajouter un reçu
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Auto-compressé en WebP
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes sur le renouvellement..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                  />
                </div>

                {renewError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                    ❌ {renewError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep("confirm")}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleRenew}
                    disabled={renewLoading || !selectedPlanId}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-green-500 hover:from-primary-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {renewLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>✅ Renouveler — {selectedPlan?.price || 0} DA</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- Step 4: Success ---- */}
          {step === "success" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  🎉
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Renouvellement réussi !
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  L&apos;abonnement de{" "}
                  <strong>{foundUser?.fullName || foundUser?.email}</strong> a
                  été renouvelé.
                </p>
              </div>

              {/* Result card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 mb-6 inline-block w-full max-w-md">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-400 font-bold mb-1">
                      Code d&apos;activation
                    </p>
                    <code className="text-xl font-mono font-black text-green-700 dark:text-green-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg block">
                      {resultKeyCode}
                    </code>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-400 font-bold mb-1">
                      Nouvelle date d&apos;expiration
                    </p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {resultExpiresAt
                        ? new Date(resultExpiresAt).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    resetWizard();
                    loadExpired();
                  }}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors"
                >
                  🔄 Nouveau renouvellement
                </button>
                <button
                  onClick={() => {
                    setActiveTab("expired");
                    loadExpired();
                    resetWizard();
                  }}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                >
                  📋 Voir les expirés
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: History */}
      {/* ================================================================ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-4">📭</span>
                <p className="font-medium text-slate-900 dark:text-white mb-1">
                  Aucun renouvellement manuel
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Les renouvellements effectués ici apparaîtront dans cet
                  historique.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Durée
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Reçu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => openTxDetail(item)}
                        className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-900 dark:text-white font-medium">
                            {item.usedAt
                              ? new Date(item.usedAt).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.usedAt
                              ? new Date(item.usedAt).toLocaleTimeString(
                                  "fr-FR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.user?.fullName || "—"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.user?.email || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                            {item.keyCode}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {item.durationDays}j
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.pricePaid ? `${item.pricePaid} DA` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.receiptPath ? (
                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                              📎 Oui
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {historyItems.length} transaction
            {historyItems.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Modal: Transaction Detail */}
      {/* ================================================================ */}
      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  📜 Détails du renouvellement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedTx.usedAt
                    ? new Date(selectedTx.usedAt).toLocaleString("fr-FR", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })
                    : "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* User */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                  Utilisateur
                </p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedTx.user?.fullName || "—"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedTx.user?.email || "—"}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Code d&apos;activation
                  </p>
                  <code className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {selectedTx.keyCode}
                  </code>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Prix payé
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedTx.pricePaid ? `${selectedTx.pricePaid} DA` : "—"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Durée totale
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedTx.durationDays} jours
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Expire le
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedTx.expiresAt
                      ? new Date(selectedTx.expiresAt).toLocaleDateString(
                          "fr-FR",
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedTx.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedTx.notes}
                  </p>
                </div>
              )}

              {/* Receipt image */}
              {selectedTx.receiptPath && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">
                    📸 Reçu de paiement
                  </p>
                  {receiptLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                  ) : receiptImgUrl ? (
                    <a
                      href={receiptImgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptImgUrl}
                        alt="Reçu de paiement"
                        className="rounded-lg max-h-80 w-full object-contain border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <p className="text-sm text-red-500">
                      Impossible de charger l&apos;image
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
