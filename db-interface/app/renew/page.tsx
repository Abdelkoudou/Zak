"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ============================================================================
// Types
// ============================================================================

interface UserIdentity {
  found: boolean;
  fullName: string;
  expiresAt: string | null;
  daysLeft: number;
  isExpired: boolean;
  isPaid: boolean;
}

interface Plan {
  id: string;
  name: string;
  duration: string;
  durationDays: number;
  amount: number;
  amountFormatted: string;
  label: string;
  isFeatured: boolean;
  description: string | null;
}

// ============================================================================
// Duration label helper
// ============================================================================

function formatDuration(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 an" : `${years} ans`;
  }
  if (days >= 30) {
    const months = Math.round(days / 30);
    return `${months} mois`;
  }
  return `${days} jours`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ============================================================================
// Step indicators
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Email" },
    { num: 2, label: "Identité" },
    { num: 3, label: "Renouvellement" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentStep === step.num
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : currentStep > step.num
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800/50 text-slate-500 border border-slate-700/30"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep > step.num
                  ? "bg-emerald-500 text-white"
                  : currentStep === step.num
                    ? "bg-amber-500 text-white"
                    : "bg-slate-700 text-slate-400"
              }`}
            >
              {currentStep > step.num ? "✓" : step.num}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                currentStep > step.num ? "bg-emerald-500/50" : "bg-slate-700/50"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

function RenewPageContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  // Step management
  const [step, setStep] = useState(1);

  // Step 1: Email
  const [email, setEmail] = useState(emailParam);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Step 2: Identity
  const [identity, setIdentity] = useState<UserIdentity | null>(null);

  // Step 3: Renewal - Tab A (Code)
  const [activeTab, setActiveTab] = useState<"code" | "payment">("code");
  const [keyCode, setKeyCode] = useState("");
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [renewSuccess, setRenewSuccess] = useState<{
    newExpiresAt: string;
    durationDays: number;
  } | null>(null);

  // Step 3: Renewal - Tab B (Payment)
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Auto-submit if email param is present
  useEffect(() => {
    if (emailParam) {
      handleEmailSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch plans when entering step 3
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const response = await fetch("/api/payments/create-checkout");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      if (data.plans && data.plans.length > 0) {
        setPlans(data.plans);
        const featured = data.plans.find((p: Plan) => p.isFeatured);
        setSelectedPlan(featured || data.plans[0]);
      }
    } catch {
      console.error("Failed to fetch plans");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Step 1: Look up email
  async function handleEmailSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) return;

    setEmailLoading(true);
    setEmailError(null);

    try {
      const response = await fetch(
        `/api/renew?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      );
      const data = await response.json();

      if (!response.ok || !data.found) {
        setEmailError(data.error || "Aucun compte trouvé avec cet email.");
        return;
      }

      setIdentity(data);
      setStep(2);
    } catch {
      setEmailError("Erreur de connexion. Réessayez.");
    } finally {
      setEmailLoading(false);
    }
  }

  // Step 2: Confirm identity → go to step 3
  function handleIdentityConfirm() {
    setStep(3);
    fetchPlans();
  }

  function handleIdentityDeny() {
    setIdentity(null);
    setEmail("");
    setStep(1);
  }

  // Step 3A: Code renewal
  async function handleCodeRenewal(e: React.FormEvent) {
    e.preventDefault();
    if (!keyCode.trim()) return;

    setRenewLoading(true);
    setRenewError(null);

    try {
      const response = await fetch("/api/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          keyCode: keyCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setRenewError(data.error || "Erreur lors du renouvellement.");
        return;
      }

      setRenewSuccess({
        newExpiresAt: data.newExpiresAt,
        durationDays: data.durationDays,
      });
    } catch {
      setRenewError("Erreur de connexion. Réessayez.");
    } finally {
      setRenewLoading(false);
    }
  }

  // Step 3B: Payment
  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email.trim().toLowerCase(),
          customerName: identity?.fullName || undefined,
          duration: selectedPlan.duration,
          locale: "fr",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du paiement");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
      setPaymentLoading(false);
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="https://www.fmcplatform.com"
            className="flex items-center group rounded-xl"
          >
            <Image
              src="/images/Header1.png"
              alt="FMC APP"
              width={180}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <Link
            href="/buy"
            className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <span>Nouvel abonnement</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative px-4 pb-16">
        <div className="max-w-xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <span className="text-xl">🔄</span>
              <span className="text-amber-400 text-sm font-medium">
                Renouvellement d&apos;abonnement
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Renouvelez votre
              <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                abonnement
              </span>
            </h1>
            <p className="text-slate-400 max-w-md mx-auto">
              Continuez à accéder à tous vos QCMs et ressources de médecine
            </p>
          </div>

          {/* Steps */}
          <StepIndicator currentStep={renewSuccess ? 4 : step} />

          {/* Success State */}
          {renewSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center backdrop-blur-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Abonnement renouvelé ! 🎉
              </h3>
              <p className="text-slate-300 mb-2">
                Votre abonnement a été étendu de{" "}
                <span className="text-emerald-400 font-semibold">
                  {formatDuration(renewSuccess.durationDays)}
                </span>
              </p>
              <p className="text-slate-400 text-sm mb-6">
                Nouvelle date d&apos;expiration :{" "}
                <span className="text-white font-medium">
                  {formatDate(renewSuccess.newExpiresAt)}
                </span>
              </p>
              <p className="text-slate-500 text-sm">
                Retournez à l&apos;application et connectez-vous pour continuer.
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              {/* === STEP 1: Email === */}
              {step === 1 && (
                <form onSubmit={handleEmailSubmit} className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Identifiez-vous
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Entrez l&apos;email utilisé lors de votre inscription
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Adresse email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre.email@example.com"
                        required
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        autoFocus
                      />
                    </div>

                    {emailError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {emailError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={emailLoading || !email.trim()}
                      className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25"
                    >
                      {emailLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin w-5 h-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Recherche...
                        </span>
                      ) : (
                        "Continuer"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* === STEP 2: Identity Confirmation === */}
              {step === 2 && identity && (
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Confirmez votre identité
                  </h3>

                  {/* Identity Card */}
                  <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {identity.fullName}
                        </p>
                        <p className="text-slate-400 text-sm">{email}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-700/30 pt-4">
                      {identity.isExpired ? (
                        <div className="flex items-center gap-2 text-red-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Abonnement expiré
                            {identity.expiresAt &&
                              ` le ${formatDate(identity.expiresAt)}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Expire dans{" "}
                            <span className="font-semibold">
                              {identity.daysLeft} jours
                            </span>
                            {identity.expiresAt &&
                              ` (${formatDate(identity.expiresAt)})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm text-center mb-6">
                    Est-ce bien vous ?
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleIdentityDeny}
                      className="py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all"
                    >
                      Non, ce n&apos;est pas moi
                    </button>
                    <button
                      onClick={handleIdentityConfirm}
                      className="py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25"
                    >
                      Oui, c&apos;est moi
                    </button>
                  </div>
                </div>
              )}

              {/* === STEP 3: Renewal Options === */}
              {step === 3 && (
                <div>
                  {/* Tab Switcher */}
                  <div className="flex border-b border-slate-700/50">
                    <button
                      onClick={() => {
                        setActiveTab("code");
                        setPaymentError(null);
                      }}
                      className={`flex-1 py-4 px-4 text-sm font-medium transition-all relative ${
                        activeTab === "code"
                          ? "text-amber-400"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      🔑 Code d&apos;activation
                      {activeTab === "code" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("payment");
                        setRenewError(null);
                      }}
                      className={`flex-1 py-4 px-4 text-sm font-medium transition-all relative ${
                        activeTab === "payment"
                          ? "text-amber-400"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      💳 Payer en ligne
                      {activeTab === "payment" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                      )}
                    </button>
                  </div>

                  {/* Tab A: Code Entry */}
                  {activeTab === "code" && (
                    <form
                      onSubmit={handleCodeRenewal}
                      className="p-6 sm:p-8 space-y-4"
                    >
                      <p className="text-slate-400 text-sm">
                        Entrez votre code d&apos;activation pour renouveler
                        votre abonnement
                      </p>

                      <div>
                        <label
                          htmlFor="keyCode"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Code d&apos;activation
                        </label>
                        <input
                          id="keyCode"
                          type="text"
                          value={keyCode}
                          onChange={(e) =>
                            setKeyCode(e.target.value.toUpperCase())
                          }
                          placeholder="EX: ABC123XYZ"
                          required
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono tracking-wider text-center text-lg"
                          autoFocus
                        />
                      </div>

                      {renewError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {renewError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={renewLoading || !keyCode.trim()}
                        className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25"
                      >
                        {renewLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin w-5 h-5"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Renouvellement...
                          </span>
                        ) : (
                          "Renouveler mon abonnement"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setIdentity(null);
                          setEmail("");
                        }}
                        className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      >
                        ← Changer d&apos;email
                      </button>
                    </form>
                  )}

                  {/* Tab B: Online Payment */}
                  {activeTab === "payment" && (
                    <form
                      onSubmit={handlePayment}
                      className="p-6 sm:p-8 space-y-4"
                    >
                      <p className="text-slate-400 text-sm">
                        Choisissez un abonnement et payez en ligne
                      </p>

                      {plansLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <svg
                            className="animate-spin w-8 h-8 text-amber-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        </div>
                      ) : plans.length > 0 ? (
                        <div className="space-y-3">
                          {plans.map((plan) => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => setSelectedPlan(plan)}
                              className={`relative flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all text-left ${
                                selectedPlan?.id === plan.id
                                  ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                                  : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50"
                              }`}
                            >
                              {/* Radio */}
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  selectedPlan?.id === plan.id
                                    ? "border-amber-500"
                                    : "border-slate-500"
                                }`}
                              >
                                {selectedPlan?.id === plan.id && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">
                                    {plan.name}
                                  </span>
                                  {plan.isFeatured && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      ⭐ Populaire
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-400 mt-0.5">
                                  {formatDuration(plan.durationDays)}
                                  {plan.description && ` • ${plan.description}`}
                                </p>
                              </div>

                              {/* Price */}
                              <div className="flex-shrink-0 text-right">
                                <span className="text-xl font-bold text-white">
                                  {plan.amount}
                                </span>
                                <span className="text-slate-400 text-sm ml-1">
                                  DA
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-8">
                          Aucun abonnement disponible pour le moment.
                        </p>
                      )}

                      {paymentError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {paymentError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={paymentLoading || !selectedPlan}
                        className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25"
                      >
                        {paymentLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin w-5 h-5"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Redirection vers le paiement...
                          </span>
                        ) : selectedPlan ? (
                          `Payer ${selectedPlan.amount} DA`
                        ) : (
                          "Sélectionnez un abonnement"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setIdentity(null);
                          setEmail("");
                        }}
                        className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      >
                        ← Changer d&apos;email
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RenewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin w-10 h-10 text-amber-500 mx-auto mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-slate-400">Chargement...</p>
          </div>
        </div>
      }
    >
      <RenewPageContent />
    </Suspense>
  );
}
