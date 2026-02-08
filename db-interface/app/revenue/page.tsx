'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface MonthlyRevenue {
  month: string;
  online: number;
  salesPoint: number;
  total: number;
}

interface RevenueStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  onlineRevenue: number;
  salesPointRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

interface RecentTransaction {
  id: string;
  type: 'online' | 'salesPoint';
  amount: number;
  customerEmail?: string;
  salesPointName?: string;
  durationDays: number;
  date: Date;
}

// Estimated prices for activation keys by duration (for sales point revenue)
const ACTIVATION_KEY_PRICES: Record<number, number> = {
  30: 1000,
  60: 1000,
  90: 1000,
  180: 1000,
  365: 1000,
};

const getKeyPrice = (durationDays: number): number => {
  return ACTIVATION_KEY_PRICES[durationDays] || durationDays * 15;
};

export default function RevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [dateRange, setDateRange] = useState<'month' | '3months' | 'year' | 'all'>('month');
  const [analyticsMode, setAnalyticsMode] = useState<'dev' | 'production'>('dev');
  const [productionSalesPoints, setProductionSalesPoints] = useState<string[]>([]);
  const [productionSalesPointNames, setProductionSalesPointNames] = useState<string[]>([]);

  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case '3months':
        return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return null;
    }
  }, [dateRange]);

  const fetchData = useCallback(async (mode: 'dev' | 'production', prodSalesPoints: string[]) => {
    const dateFilter = getDateFilter();

    // Fetch online payments
    let onlineQuery = supabase
      .from('online_payments')
      .select('*')
      .eq('status', 'paid');

    if (dateFilter) {
      onlineQuery = onlineQuery.gte('paid_at', dateFilter);
    }

    const { data: onlinePayments } = await onlineQuery;

    // Fetch used activation keys (sales point revenue)
    let keysQuery = supabase
      .from('activation_keys')
      .select('*, sales_point:sales_points(name, id)')
      .eq('is_used', true)
      .not('used_at', 'is', null);

    if (dateFilter) {
      keysQuery = keysQuery.gte('used_at', dateFilter);
    }

    // Filter by production sales points if in production mode
    if (mode === 'production' && prodSalesPoints.length > 0) {
      keysQuery = keysQuery.in('sales_point_id', prodSalesPoints);
    }

    const { data: usedKeys } = await keysQuery;

    // Calculate stats
    const onlineRevenue = (onlinePayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const salesPointRevenue = (usedKeys || []).reduce((sum, k) => sum + getKeyPrice(k.duration_days), 0);
    const totalRevenue = onlineRevenue + salesPointRevenue;

    // This month's revenue
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthOnline = (onlinePayments || [])
      .filter(p => new Date(p.paid_at) >= thisMonthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const thisMonthSalesPoint = (usedKeys || [])
      .filter(k => new Date(k.used_at) >= thisMonthStart)
      .reduce((sum, k) => sum + getKeyPrice(k.duration_days), 0);

    const totalTransactions = (onlinePayments?.length || 0) + (usedKeys?.length || 0);

    setStats({
      totalRevenue,
      thisMonthRevenue: thisMonthOnline + thisMonthSalesPoint,
      onlineRevenue,
      salesPointRevenue,
      totalTransactions,
      averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    });

    // Build monthly data for chart (last 12 months)
    const monthlyMap = new Map<string, MonthlyRevenue>();
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyMap.set(key, { month: monthName, online: 0, salesPoint: 0, total: 0 });
    }

    (onlinePayments || []).forEach(p => {
      const d = new Date(p.paid_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.online += p.amount || 0;
        entry.total += p.amount || 0;
      }
    });

    (usedKeys || []).forEach(k => {
      const d = new Date(k.used_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        const price = getKeyPrice(k.duration_days);
        entry.salesPoint += price;
        entry.total += price;
      }
    });

    setMonthlyData(Array.from(monthlyMap.values()));

    // Recent transactions
    const recent: RecentTransaction[] = [
      ...(onlinePayments || []).slice(0, 10).map(p => ({
        id: p.id,
        type: 'online' as const,
        amount: p.amount,
        customerEmail: p.customer_email,
        durationDays: p.duration_days,
        date: new Date(p.paid_at),
      })),
      ...(usedKeys || []).slice(0, 10).map((k: any) => ({
        id: k.id,
        type: 'salesPoint' as const,
        amount: getKeyPrice(k.duration_days),
        durationDays: k.duration_days,
        salesPointName: k.sales_point?.name,
        date: new Date(k.used_at),
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    setRecentTransactions(recent);
  }, [getDateFilter]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!user || user.role !== 'owner') {
        router.push('/');
        return;
      }

      // Fetch analytics config
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

      await fetchData(mode, prodPoints);
      setLoading(false);
    };

    checkAuth();
  }, [router, fetchData]);

  useEffect(() => {
    if (!loading) {
      fetchData(analyticsMode, productionSalesPoints);
    }
  }, [dateRange, fetchData, loading, analyticsMode, productionSalesPoints]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Paiements en ligne', value: stats.onlineRevenue, color: '#09b2ac' },
      { name: 'Points de vente', value: stats.salesPointRevenue, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('fr-DZ')} DA`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          <p className="text-theme-muted text-sm font-medium">Chargement des revenus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme text-theme py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-extrabold text-theme tracking-tight">
                📈 Tableau des Revenus
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                analyticsMode === 'dev'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                {analyticsMode === 'dev' ? '🔧 Mode Dev' : '🚀 Production'}
              </span>
            </div>
            <p className="mt-2 text-theme-muted">
              {analyticsMode === 'production' 
                ? productionSalesPointNames.length > 0
                  ? productionSalesPointNames.join(', ')
                  : 'Aucun point de vente sélectionné'
                : 'Toutes les données (y compris les tests)'
              }
            </p>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex bg-theme-secondary rounded-2xl p-1.5 border border-theme">
            {[
              { value: 'month', label: 'Ce mois' },
              { value: '3months', label: '3 mois' },
              { value: 'year', label: 'Cette année' },
              { value: 'all', label: 'Tout' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as typeof dateRange)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  dateRange === option.value
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-theme-secondary hover:text-theme'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💰</span>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Revenus Totaux</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-primary">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            
            <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📅</span>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Ce Mois</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-theme">
                {formatCurrency(stats.thisMonthRevenue)}
              </p>
            </div>
            
            <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💳</span>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Paiements en ligne</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-[#09b2ac]">
                {formatCurrency(stats.onlineRevenue)}
              </p>
            </div>
            
            <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏪</span>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Points de vente</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-amber-500">
                {formatCurrency(stats.salesPointRevenue)}
              </p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 bg-theme-card rounded-2xl p-6 border border-theme shadow-sm">
            <h2 className="text-lg font-bold text-theme mb-6 flex items-center gap-2">
              <span>📊</span> Évolution des Revenus
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#09b2ac" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#09b2ac" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSalesPoint" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value) => [formatCurrency(value as number), '']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="online"
                    name="En ligne"
                    stroke="#09b2ac"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOnline)"
                  />
                  <Area
                    type="monotone"
                    dataKey="salesPoint"
                    name="Points de vente"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSalesPoint)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Breakdown Pie Chart */}
          <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm">
            <h2 className="text-lg font-bold text-theme mb-6 flex items-center gap-2">
              <span>🥧</span> Répartition
            </h2>
            <div className="h-64">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-theme-muted">
                  Aucune donnée disponible
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-theme-secondary">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-theme">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-theme-card rounded-xl p-4 border border-theme">
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">Transactions</p>
              <p className="text-xl font-bold text-theme">{stats.totalTransactions}</p>
            </div>
            <div className="bg-theme-card rounded-xl p-4 border border-theme">
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">Valeur Moyenne</p>
              <p className="text-xl font-bold text-theme">{formatCurrency(Math.round(stats.averageTransactionValue))}</p>
            </div>
            <div className="bg-theme-card rounded-xl p-4 border border-theme">
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">% En ligne</p>
              <p className="text-xl font-bold text-[#09b2ac]">
                {stats.totalRevenue > 0 ? Math.round((stats.onlineRevenue / stats.totalRevenue) * 100) : 0}%
              </p>
            </div>
            <div className="bg-theme-card rounded-xl p-4 border border-theme">
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">% Points de vente</p>
              <p className="text-xl font-bold text-amber-500">
                {stats.totalRevenue > 0 ? Math.round((stats.salesPointRevenue / stats.totalRevenue) * 100) : 0}%
              </p>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-theme-card rounded-2xl border border-theme shadow-sm overflow-hidden">
          <div className="p-6 border-b border-theme flex items-center justify-between">
            <h2 className="text-lg font-bold text-theme flex items-center gap-2">
              <span>📋</span> Transactions Récentes
            </h2>
            <button
              onClick={() => router.push('/payments')}
              className="text-sm text-primary font-medium hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-theme-secondary border-b border-theme">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-widest">Type</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-widest">Montant</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-widest">Durée</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-theme-muted">
                      Aucune transaction récente
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-theme-secondary transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          tx.type === 'online'
                            ? 'bg-[#09b2ac]/10 text-[#09b2ac]'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {tx.type === 'online' ? '💳 En ligne' : `🏪 ${tx.salesPointName || 'Point de vente'}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-theme">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-theme-secondary">
                        {tx.durationDays} jours
                      </td>
                      <td className="px-6 py-4 text-sm text-theme-muted">
                        {tx.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
