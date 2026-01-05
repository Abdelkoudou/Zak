'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Link href="https://fmc-app-two.vercel.app" className="flex items-center gap-3">
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
              <p className="text-xs text-emerald-400 font-medium">Premium Medical Learning</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex items-center justify-center p-4 pb-16">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Paiement Échoué
          </h1>
          
          <p className="text-slate-600 mb-8">
            Le paiement n&apos;a pas pu être effectué. Veuillez réessayer ou utiliser un autre moyen de paiement.
          </p>

          <div className="space-y-3">
            <Link
              href="/buy"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réessayer le paiement
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Besoin d&apos;aide ?
              </h3>
              <p className="text-sm text-slate-600">
                Si le problème persiste, vérifiez que votre carte est activée pour les paiements en ligne ou contactez votre banque.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
