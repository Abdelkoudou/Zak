"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  fetchAllUsers,
  fetchUserStats,
  exportUsersToCsv,
  type ManagedUser,
  type UserStats,
  type UserRole,
} from "@/lib/users";
import type { YearLevel } from "@/types/database";
import UserEditModal from "@/components/UserEditModal";
import DeviceManagerModal from "@/components/DeviceManagerModal";

export default function UsersPage() {
  // Auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Data state
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [fetching, setFetching] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">(
    "dashboard",
  );
  const [filters, setFilters] = useState({
    role: "" as UserRole | "",
    isPaid: "" as "true" | "false" | "",
    yearOfStudy: "" as YearLevel | "",
    search: "",
  });

  // Modal state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deviceManagerUser, setDeviceManagerUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Check user role
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (user) {
          setUserRole(user.role);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setFetching(true);

    const [usersResult, statsResult] = await Promise.all([
      fetchAllUsers({
        role: filters.role || undefined,
        isPaid:
          filters.isPaid === "true"
            ? true
            : filters.isPaid === "false"
              ? false
              : undefined,
        yearOfStudy: filters.yearOfStudy || undefined,
        search: filters.search || undefined,
      }),
      fetchUserStats(),
    ]);

    if (!usersResult.error) {
      setUsers(usersResult.data);
    }
    setStats(statsResult);
    setFetching(false);
  }, [filters]);

  useEffect(() => {
    if (userRole === "owner") {
      loadData();
    }
  }, [userRole, loadData]);

  // Filter users locally for search (in addition to server-side)
  const filteredUsers = useMemo(() => {
    if (!filters.search) return users;
    const search = filters.search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(search) ||
        u.fullName?.toLowerCase().includes(search),
    );
  }, [users, filters.search]);

  // Export to CSV
  const handleExport = () => {
    const csv = exportUsersToCsv(filteredUsers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get subscription status
  const getSubscriptionStatus = (user: ManagedUser) => {
    if (!user.isPaid) return { label: "Non activé", color: "bg-slate-500" };
    if (!user.subscriptionExpiresAt)
      return { label: "Payé", color: "bg-green-500" };

    const now = new Date();
    const expires = new Date(user.subscriptionExpiresAt);
    const daysLeft = Math.ceil(
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysLeft < 0) return { label: "Expiré", color: "bg-red-500" };
    if (daysLeft <= 7) return { label: `${daysLeft}j`, color: "bg-orange-500" };
    return { label: "Actif", color: "bg-green-500" };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Access denied
  if (userRole !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Accès Refusé
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-center">
          Cette page est réservée aux propriétaires.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors"
        >
          Retour au Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">👥</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Gestion des Utilisateurs
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Gérez les utilisateurs, leurs abonnements et appareils connectés.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === "dashboard"
              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span>📊</span> Dashboard
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === "users"
              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span>👤</span> Liste des Utilisateurs
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">👥</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💳</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payés
                </span>
              </div>
              <p className="text-3xl font-black text-green-500">
                {stats.paidUsers}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">✅</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actifs
                </span>
              </div>
              <p className="text-3xl font-black text-primary-500">
                {stats.activeSubscriptions}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⏰</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Expirés
                </span>
              </div>
              <p className="text-3xl font-black text-red-500">
                {stats.expiredUsers}
              </p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Non activés
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.freeUsers}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Appareils
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalDevices}
              </p>
            </div>
            <div
              className={`rounded-2xl p-4 border ${stats.pendingPayments > 0 ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20" : "bg-slate-50 dark:bg-slate-800/50 border-transparent"}`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider mb-1 ${stats.pendingPayments > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-500 dark:text-slate-400"}`}
              >
                Paiements en attente (24h)
              </p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-2xl font-black ${stats.pendingPayments > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}
                >
                  {stats.pendingPayments}
                </p>
                {stats.pendingPayments > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                1ère Année
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.year1Users}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                2ème Année
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.year2Users}
              </p>
            </div>
          </div>

          {/* Year Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              📊 Répartition par Année
            </h3>
            <div className="space-y-3">
              {[
                {
                  year: "1ère année",
                  count: stats.year1Users,
                  color: "bg-blue-500",
                },
                {
                  year: "2ème année",
                  count: stats.year2Users,
                  color: "bg-green-500",
                },
                {
                  year: "3ème année",
                  count: stats.year3Users,
                  color: "bg-purple-500",
                },
              ].map((item) => (
                <div key={item.year} className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-24">
                    {item.year}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users List Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par email ou nom..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <select
                value={filters.isPaid}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    isPaid: e.target.value as typeof filters.isPaid,
                  })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="true">Payés</option>
                <option value="false">Non activés</option>
              </select>

              <select
                value={filters.yearOfStudy}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    yearOfStudy: e.target.value as YearLevel | "",
                  })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="">Toutes les années</option>
                <option value="1">1ère année</option>
                <option value="2">2ème année</option>
                <option value="3">3ème année</option>
              </select>

              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    role: e.target.value as UserRole | "",
                  })
                }
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="">Tous les rôles</option>
                <option value="student">Étudiants</option>
                <option value="manager">Managers</option>
                <option value="admin">Admins</option>
                <option value="owner">Owners</option>
              </select>

              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                📤 Exporter
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            {fetching ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-4">🔍</span>
                <p className="font-medium text-slate-900 dark:text-white mb-1">
                  Aucun utilisateur trouvé
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Essayez de modifier vos filtres de recherche.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Année
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Abonnement
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Appareils
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Inscrit
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const status = getSubscriptionStatus(user);
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">
                                {user.fullName || "Sans nom"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {user.email}
                              </p>
                              {user.role !== "student" && (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold rounded-md uppercase">
                                  {user.role}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {user.yearOfStudy
                                ? `${user.yearOfStudy}ère`
                                : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] px-2 py-1 ${status.color} text-white font-bold rounded-md uppercase`}
                            >
                              {status.label}
                            </span>
                            {user.subscriptionExpiresAt && user.isPaid && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(
                                  user.subscriptionExpiresAt,
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setDeviceManagerUser({
                                  id: user.id,
                                  name: user.fullName || user.email,
                                })
                              }
                              className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 hover:text-primary-500 transition-colors"
                            >
                              📱 {user.deviceCount}/2
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(user.createdAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              ✏️ Gérer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {filteredUsers.length} utilisateur
            {filteredUsers.length > 1 ? "s" : ""} trouvé
            {filteredUsers.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingUserId && (
        <UserEditModal
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
          onUpdate={loadData}
        />
      )}

      {/* Device Manager Modal */}
      {deviceManagerUser && (
        <DeviceManagerModal
          userId={deviceManagerUser.id}
          userName={deviceManagerUser.name}
          onClose={() => setDeviceManagerUser(null)}
        />
      )}
    </div>
  );
}
