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
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      paid: 'Payé',
      pending: 'En attente',
      failed: 'Échoué',
      canceled: 'Annulé',
      refunded: 'Remboursé',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Paiements en Ligne</h1>
          <p className="text-gray-600">Gérez les paiements Chargily Pay</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Paiements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Réussis</p>
              <p className="text-2xl font-bold text-green-600">{stats.successfulPayments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Revenus</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalRevenue.toLocaleString('fr-DZ')} DA
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(['all', 'paid', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' && 'Tous'}
                  {f === 'paid' && 'Payés'}
                  {f === 'pending' && 'En attente'}
                  {f === 'failed' && 'Échoués'}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code d&apos;activation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.customerName || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">{payment.customerEmail}</p>
                          {payment.customerPhone && (
                            <p className="text-xs text-gray-400">{payment.customerPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.durationDays} jours
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(payment.status)}
                        {payment.paymentMethod && (
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.paymentMethod}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {payment.activationKey ? (
                          <div>
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {payment.activationKey.keyCode}
                            </code>
                            {payment.activationKey.isUsed && (
                              <span className="ml-2 text-xs text-green-600">Utilisé</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <p>{payment.createdAt.toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs">
                          {payment.createdAt.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {payment.paidAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Payé le {payment.paidAt.toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/activation-codes')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Retour aux codes d&apos;activation
          </button>
        </div>
      </div>
    </div>
  );
}
