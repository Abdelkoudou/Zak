'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatAmount } from '@/lib/chargily';

interface OnlinePayment {
  id: string;
  checkoutId: string;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
  paymentMethod: string | null;
  durationDays: number;
  activationKeyId: string | null;
  activationKey?: {
    keyCode: string;
    isUsed: boolean;
  };
  checkoutUrl: string | null;
  createdAt: Date;
  paidAt: Date | null;
}

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  uniqueCustomers: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<OnlinePayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [searchEmail, setSearchEmail] = useState('');

  const fetchPayments = useCallback(async () => {
    let query = supabase
      .from('online_payments')
      .select(`
        *,
        activation_key:activation_keys!online_payments_activation_key_id_fkey(key_code, is_used)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    if (searchEmail) {
      query = query.ilike('customer_email', `%${searchEmail}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return;
    }

    const transformed: OnlinePayment[] = (data || []).map((row: any) => ({
      id: row.id,
      checkoutId: row.checkout_id,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      durationDays: row.duration_days,
      activationKeyId: row.activation_key_id,
      activationKey: row.activation_key ? {
        keyCode: row.activation_key.key_code,
        isUsed: row.activation_key.is_used,
      } : undefined,
      checkoutUrl: row.checkout_url,
      createdAt: new Date(row.created_at),
      paidAt: row.paid_at ? new Date(row.paid_at) : null,
    }));

    setPayments(transformed);
  }, [filter, searchEmail]);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('online_payment_stats')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    setStats({
      totalPayments: data.total_payments || 0,
      successfulPayments: data.successful_payments || 0,
      pendingPayments: data.pending_payments || 0,
      failedPayments: data.failed_payments || 0,
      totalRevenue: data.total_revenue || 0,
      uniqueCustomers: data.unique_customers || 0,
    });
  };

  // Check auth
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

      setUserRole(user.role);
      await Promise.all([fetchPayments(), fetchStats()]);
      setLoading(false);
    };

    checkAuth();
  }, [router, fetchPayments]);

  useEffect(() => {
    if (userRole) {
      fetchPayments();
    }
  }, [userRole, fetchPayments]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      failed: 'bg-red-100 text-red-800 border border-red-200',
      canceled: 'bg-gray-100 text-gray-800 border border-gray-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
    };
    const labels: Record<string, string> = {
      paid: 'Payé',
      pending: 'En attente',
      failed: 'Échoué',
      canceled: 'Annulé',
      refunded: 'Remboursé',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-heading uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f2e8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#09b2ac]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] text-[#262626] py-10 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold font-heading text-[#262626] tracking-tight">
              Paiements en Ligne
            </h1>
            <p className="mt-2 text-lg text-[#737373]">
              Gérez les transactions et suivez les revenus via Chargily Pay.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/activation-codes')}
              className="px-4 py-2 bg-white border border-[#e8e1d5] rounded-lg text-[#404040] hover:bg-[#f0eadf] hover:text-[#262626] transition-colors font-medium text-sm shadow-sm"
            >
              Gérer les codes
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[#e8e1d5] shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2 font-heading">Total Paiements</p>
              <p className="text-3xl font-bold text-[#262626] font-heading">{stats.totalPayments}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e8e1d5] shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2 font-heading">Réussis</p>
              <p className="text-3xl font-bold text-[#10B981] font-heading">{stats.successfulPayments}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e8e1d5] shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2 font-heading">En Attente</p>
              <p className="text-3xl font-bold text-yellow-600 font-heading">{stats.pendingPayments}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e8e1d5] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-16 h-16 text-[#09b2ac]" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-xs font-bold text-[#09b2ac] uppercase tracking-wider mb-2 font-heading">Revenus Totaux</p>
              <p className="text-3xl font-bold text-[#09b2ac] font-heading">
                {stats.totalRevenue.toLocaleString('fr-DZ')} <span className="text-lg text-[#09b2ac]/70">DA</span>
              </p>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl p-5 border border-[#e8e1d5] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'paid', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 font-heading ${filter === f
                      ? 'bg-[#09b2ac] text-white shadow-md shadow-[#09b2ac]/20'
                      : 'bg-[#f0eadf] text-[#404040] hover:bg-[#e8e1d5] hover:text-[#262626]'
                    }`}
                >
                  {f === 'all' && 'Tous'}
                  {f === 'paid' && 'Payés'}
                  {f === 'pending' && 'En attente'}
                  {f === 'failed' && 'Échoués'}
                </button>
              ))}
            </div>
            <div className="flex-1 max-w-md relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#a3a3a3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par email..."
                aria-label="Rechercher par email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e8e1d5] bg-[#f8f2e8]/50 focus:bg-white focus:ring-2 focus:ring-[#09b2ac] focus:border-[#09b2ac] transition-all text-[#262626] placeholder-[#a3a3a3]"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e8e1d5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-[#f0eadf] border-b border-[#e8e1d5]">
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#737373] uppercase tracking-wider font-heading">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#737373] uppercase tracking-wider font-heading">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#737373] uppercase tracking-wider font-heading">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#737373] uppercase tracking-wider font-heading">
                    Code d&apos;activation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#737373] uppercase tracking-wider font-heading">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e1d5]">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-[#737373]">
                        <svg className="w-12 h-12 mb-3 text-[#e8e1d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-base font-medium">Aucun paiement trouvé</p>
                        <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[#f8f2e8]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#09b2ac]/10 flex items-center justify-center text-[#09b2ac] font-bold text-lg mr-3">
                            {payment.customerName ? payment.customerName.charAt(0).toUpperCase() : (payment.customerEmail ? payment.customerEmail.charAt(0).toUpperCase() : '?')}
                          </div>
                          <div>
                            <p className="font-bold text-[#262626] font-heading">
                              {payment.customerName || 'N/A'}
                            </p>
                            <p className="text-sm text-[#737373]">{payment.customerEmail}</p>
                            {payment.customerPhone && (
                              <p className="text-xs text-[#a3a3a3] mt-0.5">{payment.customerPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#262626] font-heading text-lg">
                          {formatAmount(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs font-medium text-[#737373] bg-[#f0eadf] inline-block px-1.5 py-0.5 rounded mt-1">
                          {payment.durationDays} jours
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(payment.status)}
                          {payment.paymentMethod && (
                            <p className="text-xs text-[#a3a3a3] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                              {payment.paymentMethod}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.activationKey ? (
                          <div className="flex flex-col items-start gap-1">
                            <code className="text-sm font-mono bg-[#f0eadf] border border-[#e8e1d5] text-[#404040] px-2 py-1 rounded select-all">
                              {payment.activationKey.keyCode}
                            </code>
                            {payment.activationKey.isUsed && (
                              <span className="inline-flex items-center text-xs font-medium text-[#10B981]">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Utilisé
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#a3a3a3] italic">Non généré</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#737373]">
                        <p className="font-medium text-[#262626]">
                          {payment.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[#737373]">
                          {payment.createdAt.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {payment.paidAt && (
                          <p className="text-xs text-[#10B981] mt-1 font-medium">
                            Payé le {payment.paidAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Footer / Pagination if needed later */}
          <div className="bg-[#f0eadf] px-6 py-3 border-t border-[#e8e1d5] text-xs text-[#737373] flex justify-between items-center">
            <span>Affichage de {payments.length} paiements</span>
          </div>
        </div>
      </div>
    </div>
  );
}
