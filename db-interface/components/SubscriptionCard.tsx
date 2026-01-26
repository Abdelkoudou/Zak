"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface SubscriptionCardProps {
  activationCode: string;
}

export function SubscriptionCard({ activationCode }: SubscriptionCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto perspective-1000">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="relative aspect-[1.86/1] w-full group"
      >
        {/* Card Image */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 transition-transform duration-500 group-hover:scale-[1.02]">
          <Image
            src="/assets/images/subscription-card.png"
            alt="Carte d'abonnement Premium"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[shine_3s_ease-in-out_infinite]" />
        </div>

        {/* Activation Code Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pt-[8%]">
          <div
            className="relative group/code cursor-pointer"
            onClick={copyToClipboard}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="px-6 py-2 rounded-xl backdrop-blur-sm bg-white/10 border border-emerald-500/20 hover:bg-white/20 transition-all duration-300"
            >
              <code className="text-2xl md:text-3xl lg:text-4xl font-mono font-bold text-slate-800 tracking-widest drop-shadow-sm select-all">
                {activationCode}
              </code>
            </motion.div>

            {/* Click to copy tooltip */}
            <div
              className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-white text-xs rounded-full transition-all duration-200 ${copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 group-hover/code:opacity-100 group-hover/code:translate-y-0"}`}
            >
              {copied ? "Copié !" : "Cliquer pour copier"}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
