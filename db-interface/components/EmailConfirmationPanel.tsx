"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Unconfirmed user type from our API
interface UnconfirmedUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isPaid: boolean;
  subscriptionExpiresAt: string | null;
  yearOfStudy: string | null;
  speciality: string | null;
  confirmationSentAt: string | null;
  createdAt: string;
}

export default function EmailConfirmationPanel() {
  const [users, setUsers] = useState<UnconfirmedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>(
    {},
  );
  const [successMessages, setSuccessMessages] = useState<
    Record<string, string>
  >({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    const timers = timeoutsRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const fetchUnconfirmedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/unconfirmed-users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors du chargement");
        setLoading(false);
        return;
      }

      setUsers(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchUnconfirmedUsers();
  }, [fetchUnconfirmedUsers]);

  const handleConfirmEmail = async (userId: string, email: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "confirming" }));
    setSuccessMessages((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/admin/confirm-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur");
        return;
      }

      // Remove from list and show success
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMessages((prev) => ({
        ...prev,
        [userId]: `✅ ${email} confirmé avec succès`,
      }));

      // Clear success message after 5 seconds
      if (timeoutsRef.current[userId])
        clearTimeout(timeoutsRef.current[userId]);
      timeoutsRef.current[userId] = setTimeout(() => {
        setSuccessMessages((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        delete timeoutsRef.current[userId];
      }, 5000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleResendEmail = async (userId: string, email: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "resending" }));

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/admin/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur");
        return;
      }

      setSuccessMessages((prev) => ({
        ...prev,
        [userId]: `📧 Email de confirmation renvoyé à ${email}`,
      }));

      if (timeoutsRef.current[userId])
        clearTimeout(timeoutsRef.current[userId]);
      timeoutsRef.current[userId] = setTimeout(() => {
        setSuccessMessages((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        delete timeoutsRef.current[userId];
      }, 5000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleConfirmAll = async () => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir confirmer les ${users.length} utilisateur(s) ? Cette action est irréversible.`,
      )
    )
      return;

    for (const user of users) {
      await handleConfirmEmail(user.id, user.email || "");
    }
  };

  const paidUnconfirmed = users.filter((u) => u.isPaid);
  const freeUnconfirmed = users.filter((u) => !u.isPaid);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📧</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Non Confirmés
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {users.length}
          </p>
        </div>

        <div
          className={`border rounded-2xl p-5 ${
            paidUnconfirmed.length > 0
              ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🚨</span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                paidUnconfirmed.length > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Payés non confirmés
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p
              className={`text-3xl font-black ${
                paidUnconfirmed.length > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {paidUnconfirmed.length}
            </p>
            {paidUnconfirmed.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🆓</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gratuits non confirmés
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {freeUnconfirmed.length}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            ❌ {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Messages */}
      {Object.entries(successMessages).map(([userId, msg]) => (
        <div
          key={userId}
          className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3"
        >
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            {msg}
          </p>
        </div>
      ))}

      {/* Actions Bar */}
      {users.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleConfirmAll}
            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
          >
            ✅ Confirmer tous ({users.length})
          </button>
          <button
            onClick={fetchUnconfirmedUsers}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            🔄 Rafraîchir
          </button>
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Tous les emails sont confirmés !
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun utilisateur en attente de confirmation.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
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
                    Inscrit
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Dernier envoi
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isActioning = actionLoading[user.id];
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        user.isPaid ? "bg-red-50/50 dark:bg-red-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {user.fullName || "Sans nom"}
                            </p>
                            {user.isPaid && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-md">
                                PAYÉ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.isPaid ? (
                          <div>
                            <span className="text-[10px] px-2 py-1 bg-green-500 text-white font-bold rounded-md uppercase">
                              Payé
                            </span>
                            {user.subscriptionExpiresAt && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Exp:{" "}
                                {new Date(
                                  user.subscriptionExpiresAt,
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-1 bg-slate-500 text-white font-bold rounded-md uppercase">
                            Non activé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {user.confirmationSentAt
                            ? new Date(
                                user.confirmationSentAt,
                              ).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleConfirmEmail(user.id, user.email || "")
                            }
                            disabled={!!isActioning}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            {isActioning === "confirming" ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ...
                              </>
                            ) : (
                              <>✅ Confirmer</>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleResendEmail(user.id, user.email || "")
                            }
                            disabled={!!isActioning}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            {isActioning === "resending" ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ...
                              </>
                            ) : (
                              <>📧 Renvoyer</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
          💡 Informations
        </h4>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>
            <strong>Confirmer</strong> : confirme manuellement l&apos;email sans
            que l&apos;utilisateur clique sur le lien. Utilisé quand
            l&apos;email n&apos;existe pas ou quand l&apos;email est
            supprimé/bloqué.
          </li>
          <li>
            <strong>Renvoyer</strong> : envoie un nouvel email de confirmation.
            Ne fonctionne que si l&apos;adresse email est valide.
          </li>
          <li>
            Les utilisateurs <strong>payés</strong> sont mis en évidence en
            rouge car ils ne peuvent pas se connecter sans confirmation.
          </li>
        </ul>
      </div>
    </div>
  );
}
