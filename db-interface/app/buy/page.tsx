"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

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
// Constants
// ============================================================================

const FEATURES = [
  {
    icon: "📚",
    text: "Accès à tous les QCMs de l'année choisie",
    highlight: true,
  },
  {
    icon: "📊",
    text: "Accès pour les QCMs de tous les unités/modules (5 U.E.I + 2 modules)",
  },
  { icon: "📁", text: "Des ressources importantes (Drive, Chaîne Telegram)" },
  { icon: "📈", text: "Suivi de progression et statistiques" },
  {
    icon: "📱",
    text: "Application mobile Android, Web App sur iOS et site web",
  },
  { icon: "💻", text: "Accès sur 2 appareils différents" },
  { icon: "💾", text: "Sauvegarde des questions difficiles" },
  { icon: "🔄", text: "Mises à jour du contenu" },
];

// Fallback plan if API fails
const FALLBACK_PLANS: Plan[] = [
  {
    id: "fallback-365",
    name: "1 An",
    duration: "365",
    durationDays: 365,
    amount: 1000,
    amountFormatted: "1000 DA",
    label: "1 An - 1000 DA",
    isFeatured: true,
    description: "Accès pendant 1 an",
  },
];

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

// ============================================================================
// Component
// ============================================================================

export default function BuyPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch plans on mount
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/payments/create-checkout");
        if (!response.ok) throw new Error("Failed to fetch plans");
        const data = await response.json();

        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
          // Default to featured plan, or first
          const featured = data.plans.find((p: Plan) => p.isFeatured);
          setSelectedPlan(featured || data.plans[0]);
        } else {
          setPlans(FALLBACK_PLANS);
          setSelectedPlan(FALLBACK_PLANS[0]);
        }
      } catch {
        setPlans(FALLBACK_PLANS);
        setSelectedPlan(FALLBACK_PLANS[0]);
      } finally {
        setPlansLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setError(null);
    setLoading(true);

    try {
      // Get current user session if logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // OPTION 2: Smart Auto-Activation
      // Only auto-activate if the logged-in user is purchasing for themselves (email match).
      // This prevents admin/owner accounts from hijacking auto-activation for other customers.
      const userId =
        session?.user?.id && session?.user?.email === email
          ? session.user.id
          : undefined;

      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          duration: selectedPlan.duration,
          locale: "fr",
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du paiement");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="https://www.fmcplatform.com"
            className="flex items-center group rounded-xl "
          >
            <Image
              src="/images/Header1.png"
              alt="FMC APP"
              width={180}
              height={48}
              className="h-12 w-auto object-contain "
            />
          </Link>
          <Link
            href="https://www.fmcplatform.com"
            className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <span>Retour à l&apos;app</span>
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

      {/* Main Content */}
      <main className="relative px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-sm font-medium">
                Paiement unique • Activation instantanée
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Accès Premium
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Endo, Neuro, Immuno et Génétique
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Préparez vos examens de médecine avec des QCMs biennes organisées
              par cours, module ou par promo et type d&apos;examen
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Features Card - Left Side */}
            <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
              {/* Plan Selector Cards */}
              {!plansLoading && plans.length > 1 && (
                <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </span>
                    Choisissez votre offre
                  </h3>
                  <div className="grid gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPlan?.id === plan.id
                            ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                            : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50"
                        }`}
                      >
                        {/* Radio circle */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedPlan?.id === plan.id
                              ? "border-emerald-500"
                              : "border-slate-500"
                          }`}
                        >
                          {selectedPlan?.id === plan.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          )}
                        </div>

                        {/* Plan info */}
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
                          <span className="text-sm text-slate-400 ml-1">
                            DA
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-teal-400"
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
                  </span>
                  Ce qui est inclus
                </h3>
                <div className="grid gap-3">
                  {FEATURES.map((feature, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${
                        feature.highlight
                          ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                          : "bg-slate-800/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">
                        {feature.icon}
                      </span>
                      <span
                        className={`${feature.highlight ? "text-emerald-300 font-medium" : "text-slate-300"}`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/40 backdrop-blur rounded-xl p-4 text-center border border-slate-700/30">
                  <div className="text-2xl mb-1">🔒</div>
                  <p className="text-xs text-slate-400">
                    Paiement
                    <br />
                    Sécurisé
                  </p>
                </div>
                <div className="bg-slate-800/40 backdrop-blur rounded-xl p-4 text-center border border-slate-700/30">
                  <div className="text-2xl mb-1">⚡</div>
                  <p className="text-xs text-slate-400">
                    Activation
                    <br />
                    Instantanée
                  </p>
                </div>
                <div className="bg-slate-800/40 backdrop-blur rounded-xl p-4 text-center border border-slate-700/30">
                  <div className="text-2xl mb-1">💬</div>
                  <p className="text-xs text-slate-400">
                    Support
                    <br />
                    Disponible
                  </p>
                </div>
              </div>
            </div>

            {/* Form Card - Right Side */}
            <div className="lg:col-span-2 order-1 lg:order-2 lg:sticky lg:top-8">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20">
                {/* Price Display */}
                <div className="text-center mb-6 pb-6 border-b border-slate-100">
                  {plansLoading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-slate-200 rounded-full w-32 mx-auto mb-3" />
                      <div className="h-12 bg-slate-200 rounded-lg w-24 mx-auto mb-1" />
                      <div className="h-4 bg-slate-100 rounded w-40 mx-auto" />
                    </div>
                  ) : selectedPlan ? (
                    <>
                      <div className="inline-block bg-emerald-50 rounded-full px-4 py-1.5 mb-3">
                        <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">
                          {selectedPlan.name}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-slate-900">
                          {selectedPlan.amount}
                        </span>
                        <span className="text-xl text-slate-500 font-medium">
                          DA
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">
                        Paiement unique •{" "}
                        {formatDuration(selectedPlan.durationDays)}
                      </p>
                    </>
                  ) : null}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Le code d&apos;activation sera affiché après le paiement
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0555 123 456"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Order Summary */}
                  {selectedPlan && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-slate-600">
                          {selectedPlan.name} (
                          {formatDuration(selectedPlan.durationDays)})
                        </span>
                        <span className="font-medium text-slate-900">
                          {selectedPlan.amount} DA
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {selectedPlan.amount} DA
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email || !selectedPlan}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Redirection...
                      </>
                    ) : (
                      <>
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
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Payer {selectedPlan?.amount ?? ""} DA
                      </>
                    )}
                  </button>

                  {/* Payment Methods */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs">Sécurisé</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      CIB
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      EDAHABIA
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Questions Fréquentes
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  q: "Comment recevoir mon code d'activation ?",
                  a: "Après le paiement, votre code s'affichera immédiatement. Vous pourrez le copier et l'utiliser pour créer votre compte.",
                },
                {
                  q: "Quels moyens de paiement sont acceptés ?",
                  a: "Nous acceptons les cartes CIB et EDAHABIA via la plateforme sécurisée Chargily Pay.",
                },
                {
                  q: "Sur combien d'appareils puis-je utiliser mon compte ?",
                  a: "Vous pouvez utiliser votre compte sur 2 appareils maximum simultanément (Android, iOS Web App, ou site web).",
                },
                {
                  q: "Le contenu est-il mis à jour ?",
                  a: "Oui, nous ajoutons régulièrement de nouvelles questions et ressources tout au long de l'année.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                >
                  <h4 className="font-semibold text-white mb-2 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs font-bold">
                        ?
                      </span>
                    </span>
                    {faq.q}
                  </h4>
                  <p className="text-slate-400 text-sm pl-9">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © 2026 FMC APP. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
