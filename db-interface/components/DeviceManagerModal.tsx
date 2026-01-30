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

  const handleDelete = async (sessionId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette session ? L'utilisateur pourra en reconnecter une nouvelle.",
      )
    ) {
      return;
    }

    setDeletingId(sessionId);
    const { error } = await deleteUserDevice(sessionId);

    if (error) {
      alert(`Erreur: ${error}`);
    } else {
      await loadDevices();
    }
    setDeletingId(null);
  };

  const handleDeleteDevice = async (
    fingerprint: string,
    sessions: DeviceSession[],
  ) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer cet appareil (${sessions.length} sessions) ? Cela libérera un emplacement pour un nouvel appareil.`,
      )
    ) {
      return;
    }

    setLoading(true);
    let hasError = false;

    // Delete all sessions for this fingerprint
    for (const session of sessions) {
      const { error } = await deleteUserDevice(session.id);
      if (error) {
        alert(`Erreur lors de la suppression d'une session: ${error}`);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      await loadDevices();
    }
    setLoading(false);
  };

  const toggleExpand = (deviceId: string) => {
    setExpandedDevice(expandedDevice === deviceId ? null : deviceId);
  };

  // Grouping logic: Group sessions by fingerprint
  // If fingerprint is missing, use device_id as a fallback
  const groupedDevices = devices.reduce(
    (acc, device, i) => {
      const key = device.fingerprint || device.device_id || `__unknown_${i}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(device);
      return acc;
    },
    {} as Record<string, DeviceSession[]>,
  );

  // Convert to array and sort by most recently active session
  const physicalDevices = Object.entries(groupedDevices)
    .map(([fingerprint, sessions]) => ({
      fingerprint,
      sessions: sessions.sort(
        (a, b) =>
          new Date(b.last_active_at).getTime() -
          new Date(a.last_active_at).getTime(),
      ),
      lastActive: new Date(
        Math.max(...sessions.map((s) => new Date(s.last_active_at).getTime())),
      ),
    }))
    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Gestion des Appareils
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {userName} • {physicalDevices.length}/2 appareils physiques
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
        ) : physicalDevices.length === 0 ? (
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
            {physicalDevices.map((device, index) => {
              const isExpanded = expandedDevice === device.fingerprint;
              const mainSession = device.sessions[0];
              const sessionCount = device.sessions.length;

              return (
                <div
                  key={device.fingerprint}
                  className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden transition-all"
                >
                  {/* Physical Device Header */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950/70 transition-colors"
                    onClick={() => toggleExpand(device.fingerprint)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-xl shadow-inner">
                        {index === 0 ? "➊" : "➋"}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Appareil {index + 1}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mt-0.5">
                          {sessionCount} session{sessionCount > 1 ? "s" : ""}{" "}
                          active{sessionCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(
                            device.fingerprint,
                            device.sessions,
                          );
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                        title="Supprimer cet appareil"
                      >
                        🗑️
                      </button>
                      <span
                        className="text-slate-400 text-xs transition-transform duration-300"
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

                  {/* Sessions List */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-3 bg-white/40 dark:bg-slate-950/20 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                      {device.sessions.map((session) => {
                        const accessInfo = getAccessType(session);
                        return (
                          <div
                            key={session.id}
                            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {accessInfo.icon}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  {accessInfo.label}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                {new Date(
                                  session.last_active_at,
                                ).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div className="mb-3">
                              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold break-all">
                                {session.device_name || "Appareil Inconnu"}
                              </p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 opacity-60">
                                ID: {session.device_id.substring(0, 16)}...
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(session.id);
                              }}
                              disabled={deletingId === session.id}
                              className="w-full py-1.5 px-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              {deletingId === session.id
                                ? "..."
                                : "🗑️ Supprimer la session"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
            Un <strong>appareil physique</strong> peut avoir plusieurs sessions
            (App + Web).
            <br />
            Chaque utilisateur est limité à{" "}
            <strong>2 appareils physiques</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
