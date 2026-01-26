"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SubscriptionCard } from "@/components/SubscriptionCard";

interface PaymentStatus {
  status: "pending" | "paid" | "failed" | "canceled";
  activationCode: string | null;
  customerEmail: string;
  amount: number;
  currency: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const checkoutId =
    searchParams.get("checkout_id") ||
    searchParams.get("id") ||
    searchParams.get("checkoutId");
  const MAX_POLLS = 30;

  const fetchPaymentStatus = useCallback(async (): Promise<boolean> => {
    if (!checkoutId) {
      setError("Aucun ID de paiement trouvé");
      setLoading(false);
      return true;
    }

    try {
      const response = await fetch(
        `/api/payments/poll-chargily?checkout_id=${checkoutId}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        throw new Error("Erreur lors de la vérification du paiement");
      }

      const data: PaymentStatus & { source?: string } = await response.json();

      if (!mountedRef.current) return true;

      setPaymentStatus(data);

      if (data.activationCode) {
        setLoading(false);
        return true;
      }

      if (data.status === "paid") {
        return false;
      }

      if (data.status === "failed" || data.status === "canceled") {
        setLoading(false);
        setError("Le paiement a échoué ou a été annulé");
        return true;
      }

      return false;
    } catch (err) {
      console.error("[Success Page] Error:", err);
      return false;
    }
  }, [checkoutId]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setLoading(true);
    setPollCount(0);
    setError(null);

    let count = 0;

    const poll = async () => {
      if (!mountedRef.current) return;

      count++;
      setPollCount(count);

      const done = await fetchPaymentStatus();

      if (done || count >= MAX_POLLS) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (!done && count >= MAX_POLLS) {
          setLoading(false);
        }
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 2000);
  }, [fetchPaymentStatus]);

  useEffect(() => {
    mountedRef.current = true;

    if (checkoutId) {
      startPolling();
    } else {
      setLoading(false);
      setError("Aucun ID de paiement trouvé");
    }

    return () => {
      mountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkoutId, startPolling]);

  const copyToClipboard = async () => {
    if (paymentStatus?.activationCode) {
      await navigator.clipboard.writeText(paymentStatus.activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const openInApp = () => {
    if (paymentStatus?.activationCode) {
      const webAppUrl = `https://fmc-app-two.vercel.app/register?code=${encodeURIComponent(paymentStatus.activationCode)}`;
      window.location.href = webAppUrl;
    }
  };

  if (error && !paymentStatus?.activationCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erreur</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/buy"
            className="block w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Link
            href="https://fmc-app-two.vercel.app"
            className="flex items-center gap-3"
          >
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="FMC APP"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FMC APP</h1>
              <p className="text-xs text-emerald-400 font-medium">
                Premium Medical Learning
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex items-center justify-center p-4 pb-16">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {loading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600"></div>
            ) : (
              <svg
                className="w-10 h-10 text-emerald-600"
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
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {loading ? "Traitement en cours..." : "Paiement Réussi !"}
          </h1>

          <p className="text-slate-600 mb-6">
            {loading
              ? "Veuillez patienter pendant que nous générons votre code d'activation..."
              : paymentStatus?.activationCode
                ? "Merci pour votre achat. Votre code d'activation est prêt !"
                : "Merci pour votre achat."}
          </p>

          {loading && (
            <div className="mb-6">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((pollCount / MAX_POLLS) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Génération du code... (
                {Math.round((pollCount / MAX_POLLS) * 100)}%)
              </p>
            </div>
          )}

          {paymentStatus?.activationCode && (
            <div className="mb-8 w-full">
              <SubscriptionCard activationCode={paymentStatus.activationCode} />
            </div>
          )}

          {paymentStatus?.activationCode && (
            <div className="space-y-3">
              <button
                onClick={openInApp}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl flex items-center justify-center gap-3"
              >
                <svg
                  className="w-6 h-6"
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
                S&apos;inscrire sur FMC App
              </button>
              <p className="text-xs text-slate-500">
                Le code sera automatiquement rempli sur la page
                d&apos;inscription
              </p>
            </div>
          )}

          {paymentStatus?.activationCode && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-amber-50 rounded-xl p-4 text-left border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Instructions
                </h3>
                <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
                  <li>Cliquez sur &quot;S&apos;inscrire sur FMC App&quot;</li>
                  <li>Créez un compte avec votre email</li>
                  <li>Le code d&apos;activation sera automatiquement rempli</li>
                  <li>
                    Téléchargez l&apos;application mobile pour accéder aux QCM
                  </li>
                </ol>
              </div>
            </div>
          )}

          {!paymentStatus?.activationCode && !loading && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
              <p className="text-sm text-slate-700 mb-3">
                Le code n&apos;a pas encore été généré. Cliquez pour réessayer.
              </p>
              <button
                onClick={startPolling}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                Rafraîchir
              </button>
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/buy"
              className="text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Chargement...
            </h1>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
