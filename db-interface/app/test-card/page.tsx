"use client";

import { SubscriptionCard } from "@/components/SubscriptionCard";

export default function TestCardPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-white mb-12">
        Prévisualisation de la Carte
      </h1>

      <div className="w-full max-w-2xl">
        <SubscriptionCard activationCode="ACTIVATION-1234-5678-DEMO" />
      </div>

      <p className="text-slate-400 mt-12 text-center max-w-lg">
        Ceci est une page de test pour visualiser le composant sans effectuer de
        paiement réel.
      </p>
    </div>
  );
}
