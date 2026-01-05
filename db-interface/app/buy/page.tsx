'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function BuyPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: email,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          duration: '365',
          locale: 'fr',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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

      {/* Main Content */}
      <main className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-emerald-400 text-sm font-medium">Offre Spéciale Étudiants</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Accès Premium
              <span className="block text-emerald-400">1 An Complet</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Préparez vos examens de médecine avec plus de 10 000 QCM organisés par année, module et type d&apos;examen
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 order-2 lg:order-1">
              <div className="text-center mb-8">
                <div className="inline-block bg-emerald-500/10 rounded-2xl px-6 py-3 mb-4">
                  <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Abonnement Annuel</span>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold text-white">1000</span>
                  <span className="text-2xl text-slate-400">DA</span>
                </div>
                <p className="text-slate-500 mt-2">Paiement unique • Accès 365 jours</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: '📚', text: 'Accès à toutes les questions QCM' },
                  { icon: '🎓', text: '1ère, 2ème et 3ème année médecine' },
                  { icon: '📊', text: 'Tous les modules et types d\'examens' },
                  { icon: '📁', text: 'Ressources de cours (Drive, Telegram)' },
                  { icon: '📈', text: 'Suivi de progression et statistiques' },
                  { icon: '📱', text: 'Application mobile Android & iOS' },
                  { icon: '💾', text: 'Sauvegarde des questions difficiles' },
                  { icon: '🔄', text: 'Mises à jour régulières du contenu' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-slate-300 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-sm font-medium">CIB</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-sm font-medium">EDAHABIA</span>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Finaliser l&apos;achat</h3>
              <p className="text-slate-500 mb-6">Entrez vos informations pour recevoir votre code d&apos;activation</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Le code d&apos;activation sera affiché après le paiement
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555 123 456"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Abonnement 1 an</span>
                    <span className="font-semibold text-slate-900">1000 DA</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-emerald-600">1000 DA</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Redirection vers le paiement...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Payer 1000 DA
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-slate-500">
                  Paiement sécurisé par Chargily Pay
                </p>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Questions Fréquentes</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  q: 'Comment recevoir mon code d\'activation ?',
                  a: 'Après le paiement, votre code s\'affichera immédiatement. Vous pourrez le copier et l\'utiliser pour créer votre compte.'
                },
                {
                  q: 'Quels moyens de paiement sont acceptés ?',
                  a: 'Nous acceptons les cartes CIB et EDAHABIA via la plateforme sécurisée Chargily Pay.'
                },
                {
                  q: 'Sur combien d\'appareils puis-je utiliser mon compte ?',
                  a: 'Vous pouvez utiliser votre compte sur 2 appareils maximum simultanément.'
                },
                {
                  q: 'Le contenu est-il mis à jour ?',
                  a: 'Oui, nous ajoutons régulièrement de nouvelles questions et ressources tout au long de l\'année.'
                },
              ].map((faq, i) => (
                <div key={i} className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                  <p className="text-slate-400 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © 2026 FMC APP. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
