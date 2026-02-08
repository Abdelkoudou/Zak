"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    fetchRealUsers,
    fetchRealUserStats,
    exportRealUsersToCsv,
    type RealUser,
    type RealUserStats,
} from "@/lib/real-users";
import { fetchSalesPoints } from "@/lib/activation-codes";
import type { SalesPoint } from "@/types/database";

export default function RealUsersPage() {
    // Auth state
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Analytics mode state
    const [analyticsMode, setAnalyticsMode] = useState<'dev' | 'production'>('dev');
    const [productionSalesPoints, setProductionSalesPoints] = useState<string[]>([]);
    const [productionSalesPointNames, setProductionSalesPointNames] = useState<string[]>([]);

    // Data state
    const [users, setUsers] = useState<RealUser[]>([]);
    const [stats, setStats] = useState<RealUserStats | null>(null);
    const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([]);
    const [fetching, setFetching] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        salesPointId: "",
        status: "" as "active" | "expired" | "",
        search: "",
    });

    // Check user role and fetch analytics config
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

                    // Fetch analytics config if owner
                    if (user.role === 'owner') {
                        const { data: modeConfig } = await supabase
                            .from('app_config')
                            .select('value')
                            .eq('key', 'analytics_mode')
                            .single();

                        const { data: salesPointsConfig } = await supabase
                            .from('app_config')
                            .select('value')
                            .eq('key', 'production_sales_points')
                            .single();

                        const mode = (modeConfig?.value as 'dev' | 'production') || 'dev';
                        const prodPoints: string[] = salesPointsConfig?.value
                            ? JSON.parse(salesPointsConfig.value)
                            : [];

                        // Fetch sales point names for display
                        let prodPointNames: string[] = [];
                        if (prodPoints.length > 0) {
                            const { data: salesPointsData } = await supabase
                                .from('sales_points')
                                .select('id, name')
                                .in('id', prodPoints);

                            prodPointNames = (salesPointsData || []).map(sp => sp.name);
                        }

                        setAnalyticsMode(mode);
                        setProductionSalesPoints(prodPoints);
                        setProductionSalesPointNames(prodPointNames);
                    }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // Load data
    const loadData = useCallback(async () => {
        setFetching(true);

        // Determine which sales points to filter by (production mode)
        const productionFilter = analyticsMode === 'production' && productionSalesPoints.length > 0
            ? productionSalesPoints
            : undefined;

        const [usersResult, statsResult, pointsResult] = await Promise.all([
            fetchRealUsers({
                salesPointId: filters.salesPointId || undefined,
                status: filters.status || undefined,
                search: filters.search || undefined,
                productionSalesPointIds: productionFilter,
            }),
            fetchRealUserStats(productionFilter),
            fetchSalesPoints(),
        ]);

        if (!usersResult.error) {
            setUsers(usersResult.data);
        }
        setStats(statsResult);
        setSalesPoints(pointsResult.data || []);
        setFetching(false);
    }, [filters, analyticsMode, productionSalesPoints]);

    useEffect(() => {
        if (userRole === "owner") {
            loadData();
        }
    }, [userRole, loadData]);

    // Local search filter
    const filteredUsers = useMemo(() => {
        if (!filters.search) return users;
        const search = filters.search.toLowerCase();
        return users.filter(
            (u) =>
                u.email.toLowerCase().includes(search) ||
                u.fullName?.toLowerCase().includes(search) ||
                u.salesPointName?.toLowerCase().includes(search) ||
                u.keyCode.toLowerCase().includes(search)
        );
    }, [users, filters.search]);

    // Export to CSV
    const handleExport = () => {
        const csv = exportRealUsersToCsv(filteredUsers);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `utilisateurs_reels_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Get status badge
    const getStatusBadge = (user: RealUser) => {
        if (user.isActive) {
            return { label: "Actif", color: "bg-green-500" };
        }
        return { label: "Expiré", color: "bg-red-500" };
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
                        Utilisateurs Réels
                    </h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        analyticsMode === 'dev'
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                        {analyticsMode === 'dev' ? '🔧 Mode Dev' : '🚀 Production'}
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    {analyticsMode === 'production'
                        ? productionSalesPointNames.length > 0
                            ? productionSalesPointNames.join(', ')
                            : 'Aucun point de vente sélectionné'
                        : 'Toutes les données (y compris les tests)'
                    }
                </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => router.push("/users")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <span>👤</span> Tous les Utilisateurs
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                >
                    <span>✅</span> Utilisateurs Réels
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">👥</span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Total Réels
                            </span>
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">
                            {stats.totalRealUsers}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">✅</span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Actifs
                            </span>
                        </div>
                        <p className="text-3xl font-black text-green-500">
                            {stats.activeUsers}
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

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🏪</span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Point de Vente
                            </span>
                        </div>
                        <p className="text-3xl font-black text-purple-500">
                            {stats.salesPointUsers}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">💳</span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Paiement en Ligne
                            </span>
                        </div>
                        <p className="text-3xl font-black text-blue-500">
                            {stats.onlinePaymentUsers}
                        </p>
                    </div>
                </div>
            )}

            {/* Top Sales Points */}
            {stats && stats.bySalesPoint.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 mb-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                        🏆 Top Points de Vente
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.bySalesPoint.slice(0, 5).map((sp) => (
                            <div
                                key={sp.name}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl"
                            >
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {sp.name}
                                </span>
                                <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-black rounded-md">
                                    {sp.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 mb-4">
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="🔍 Rechercher par email, nom ou point de vente..."
                            value={filters.search}
                            onChange={(e) =>
                                setFilters({ ...filters, search: e.target.value })
                            }
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <select
                        value={filters.salesPointId}
                        onChange={(e) =>
                            setFilters({ ...filters, salesPointId: e.target.value })
                        }
                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                        <option value="">Tous les points de vente</option>
                        {salesPoints.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                                {sp.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                status: e.target.value as typeof filters.status,
                            })
                        }
                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="expired">Expirés</option>
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
                            Aucun utilisateur réel trouvé
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
                                        Source
                                    </th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Activé le
                                    </th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Expire le
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const status = getStatusBadge(user);
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
                                                    {user.yearOfStudy && (
                                                        <span className="text-[10px] text-primary-500 font-bold">
                                                            {user.yearOfStudy}ère année
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    {user.source === 'sales_point' ? (
                                                        <>
                                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded-md">
                                                                🏪 {user.salesPointName || 'Point de Vente'}
                                                            </span>
                                                            {user.salesPointLocation && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                    📍 {user.salesPointLocation}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-md">
                                                            💳 Paiement en Ligne
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-700 dark:text-slate-300">
                                                    {user.keyCode}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                                    {new Date(user.activatedAt).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-[10px] px-2 py-1 ${status.color} text-white font-bold rounded-md uppercase`}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {user.subscriptionExpiresAt
                                                        ? new Date(
                                                            user.subscriptionExpiresAt
                                                        ).toLocaleDateString("fr-FR")
                                                        : "-"}
                                                </span>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}{" "}
                réel{filteredUsers.length > 1 ? "s" : ""} trouvé
                {filteredUsers.length > 1 ? "s" : ""}
            </p>
        </div>
    );
}
