"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchUserDevices, deleteUserDevice } from "@/lib/activation-codes";
import type { DeviceSession } from "@/types/database";

interface DeviceManagerModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

// Helper function to detect access type from device info
function getAccessType(device: DeviceSession): {
  type: "app" | "browser" | "unknown";
  label: string;
  icon: string;
} {
  const name = device.device_name?.toLowerCase() || "";
  const id = device.device_id?.toLowerCase() || "";

  // Browser detection
  if (
    name.includes("chrome") ||
    name.includes("safari") ||
    name.includes("firefox") ||
    name.includes("edge")
  ) {
    return { type: "browser", label: "Navigateur", icon: "🌐" };
  }
  if (id.startsWith("web_")) {
    return { type: "browser", label: "Navigateur", icon: "🌐" };
  }

  // App detection
  if (
    name.includes("android") ||
    name.includes("ios") ||
    name.includes("iphone") ||
    name.includes("ipad")
  ) {
    return { type: "app", label: "Application", icon: "📱" };
  }
  if (
    name.includes("samsung") ||
    name.includes("pixel") ||
    name.includes("oppo") ||
    name.includes("redmi") ||
    name.includes("galaxy")
  ) {
    return { type: "app", label: "Application", icon: "📱" };
  }

  return { type: "unknown", label: "Inconnu", icon: "❓" };
}

export default function DeviceManagerModal({
  userId,
  userName,
  onClose,
}: DeviceManagerModalProps) {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchUserDevices(userId);
    if (!error) {
      setDevices(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleDelete = async (deviceId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet appareil ? L'utilisateur pourra en connecter un nouveau.",
      )
    ) {
      return;
    }

    setDeletingId(deviceId);
    const { error } = await deleteUserDevice(deviceId);

    if (error) {
      alert(`Erreur: ${error}`);
    } else {
      await loadDevices();
    }
    setDeletingId(null);
  };

  const toggleExpand = (deviceId: string) => {
    setExpandedDevice(expandedDevice === deviceId ? null : deviceId);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Appareils Connectés
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {userName} • {devices.length}/2 appareils
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            ❌
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Chargement...
            </p>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
            <span className="text-4xl mb-4">📵</span>
            <p className="font-medium text-slate-900 dark:text-white mb-1">
              Aucun appareil connecté
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cet utilisateur n&apos;a connecté aucun appareil.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device, index) => {
              const accessInfo = getAccessType(device);
              const isExpanded = expandedDevice === device.id;

              return (
                <div
                  key={device.id}
                  className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Main row - clickable to expand */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-inset"
                    onClick={() => toggleExpand(device.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpand(device.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-lg">
                        {accessInfo.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm">
                          Appareil {index + 1}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              accessInfo.type === "app"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : accessInfo.type === "browser"
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {accessInfo.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 font-black uppercase tracking-wider rounded-md">
                            Actif
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-slate-400 text-sm transition-transform duration-200"
                        style={{
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-white/5 space-y-3 bg-white/50 dark:bg-slate-950/30">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Nom de l&apos;appareil
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium break-all">
                            {device.device_name || "Inconnu"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Type d&apos;accès
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            {accessInfo.icon} {accessInfo.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Dernière activité
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            {new Date(device.last_active_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Première connexion
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            {device.created_at
                              ? new Date(device.created_at).toLocaleDateString(
                                  "fr-FR",
                                  { day: "numeric", month: "short" },
                                )
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(device.id);
                        }}
                        disabled={deletingId === device.id}
                        className="w-full mt-2 py-2 px-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-50 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {deletingId === device.id
                          ? "⏳ Suppression..."
                          : "🗑️ Supprimer cet appareil"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
            📱 = Application mobile • 🌐 = Navigateur web
            <br />
            La limite est fixée à <strong>2 appareils physiques</strong> par
            utilisateur.
          </p>
        </div>
      </div>
    </div>
  );
}
