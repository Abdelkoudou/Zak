'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Contribution {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  questions_added: number;
  resources_added: number;
  total_contributions: number;
  last_contribution_date: string;
  // Payment mode fields
  last_payment_date?: string;
  payable_questions?: number;
  payable_resources?: number;
  total_payable_contributions?: number;
}

interface ContributionDetail {
  content_type: string;
  year: string;
  module_name: string;
  count: number;
  created_at: string;
}

export default function ContributionsPage() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [details, setDetails] = useState<ContributionDetail[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerQuestion, setPricePerQuestion] = useState(10);
  const [pricePerResource, setPricePerResource] = useState(5);
  
  // Payment Mode state
  const [paymentMode, setPaymentMode] = useState(false);
  const [payingUser, setPayingUser] = useState<Contribution | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchContributions();
  }, [paymentMode]); // Refetch when mode toggles

  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (paymentMode) {
        params.append('mode', 'payable');
      } else {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      
      const response = await fetch(`/api/admin/contributions?${params}`);
      
      if (response.status === 403) {
        setError('Only owners can view contribution analytics');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }
      
      const data = await response.json();
      setContributions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (userId: string) => {
    try {
      const params = new URLSearchParams({ userId });
      // In payment mode, we don't apply date filters to details yet
      // ideally we would want to filter details > last_payment_date
      // but the existing API filters by absolute start/end date.
      // For now, let's keep simple behaviour: all details or date-filtered details.
      if (!paymentMode) {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      } else {
         // In payment mode, finding the exact start date (last payment) 
         // to filter details would require extra logic. 
         // For now, we show all history or no filter.
      }
      
      const response = await fetch(`/api/admin/contributions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch details');
      }
      
      const data = await response.json();
      setDetails(data);
      setSelectedUserId(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const calculatePayment = (questions: number, resources: number) => {
    return questions * pricePerQuestion + resources * pricePerResource;
  };

  const calculateTotalPayment = () => {
    return contributions.reduce((sum, c) => {
      const q = paymentMode ? (c.payable_questions || 0) : c.questions_added;
      const r = paymentMode ? (c.payable_resources || 0) : c.resources_added;
      return sum + calculatePayment(q, r);
    }, 0);
  };

  const handleMarkAsPaid = async () => {
    if (!payingUser) return;
    
    try {
      setProcessingPayment(true);
      const amount = calculatePayment(
        payingUser.payable_questions || 0,
        payingUser.payable_resources || 0
      );
      
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: payingUser.user_id,
          amount
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to record payment');
      }
      
      // Success
      setPayingUser(null);
      fetchContributions(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Email', 
      'Name', 
      'Role', 
      paymentMode ? 'Payable Questions' : 'Questions', 
      paymentMode ? 'Payable Resources' : 'Resources', 
      paymentMode ? 'Total Payable' : 'Total', 
      'Payment Amount (DA)', 
      paymentMode ? 'Last Payment' : 'Last Activity'
    ];
    
    const rows = contributions.map(c => {
      const q = paymentMode ? (c.payable_questions || 0) : c.questions_added;
      const r = paymentMode ? (c.payable_resources || 0) : c.resources_added;
      const total = paymentMode ? (c.total_payable_contributions || 0) : c.total_contributions;
      const lastDate = paymentMode 
        ? (c.last_payment_date ? new Date(c.last_payment_date).toLocaleDateString() : 'Never') 
        : new Date(c.last_contribution_date).toLocaleDateString();

      return [
        c.email,
        c.full_name || '',
        c.role,
        q,
        r,
        total,
        calculatePayment(q, r),
        lastDate,
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contributions-${paymentMode ? 'payable-' : ''}${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && contributions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Chargement des contributions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
          <span className="text-4xl mb-4 block">🚫</span>
          <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all active:scale-95"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Suivi des Contributions
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Analytique & Paiements • FMC APP
          </p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-100 dark:bg-white/5 rounded-2xl p-1.5 border border-slate-200 dark:border-white/5 transition-all">
          <button
            onClick={() => setPaymentMode(false)}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              !paymentMode 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setPaymentMode(true)}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              paymentMode 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Paiements
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 mb-8 shadow-sm">
        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 px-1">
          {paymentMode ? 'Configuration des Prix' : 'Filtres & Configuration'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {!paymentMode && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Prix par QCM (DA)
            </label>
            <input
              type="number"
              value={pricePerQuestion}
              onChange={(e) => setPricePerQuestion(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Prix par Ressource (DA)
            </label>
            <input
              type="number"
              value={pricePerResource}
              onChange={(e) => setPricePerResource(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
          {!paymentMode && (
            <button
              onClick={fetchContributions}
              className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95"
            >
              Appliquer les Filtres
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95 text-center"
          >
            📊 Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Contributeurs', value: contributions.length, icon: '👥', color: 'primary' },
          { label: paymentMode ? 'QCM à Payer' : 'Total QCM', value: contributions.reduce((sum, c) => sum + (paymentMode ? (c.payable_questions || 0) : c.questions_added), 0), icon: '❓', color: 'blue' },
          { label: paymentMode ? 'Ressources à Payer' : 'Total Ressources', value: contributions.reduce((sum, c) => sum + (paymentMode ? (c.payable_resources || 0) : c.resources_added), 0), icon: '📚', color: 'green' },
          { label: paymentMode ? 'Total Dû' : 'Total Paiements', value: `${calculateTotalPayment()} DA`, icon: '💰', color: 'purple' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{item.icon}</span>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</p>
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-white/5">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contributeur</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rôle</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{paymentMode ? 'Q. Dû' : 'Questions'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{paymentMode ? 'R. Dû' : 'Resources'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{paymentMode ? 'Montant Dû' : 'Paiement (DA)'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{paymentMode ? 'Dernier Paiement' : 'Dernière Act.'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {contributions.map((contrib) => {
                const q = paymentMode ? (contrib.payable_questions || 0) : contrib.questions_added;
                const r = paymentMode ? (contrib.payable_resources || 0) : contrib.resources_added;
                const total = paymentMode ? (contrib.total_payable_contributions || 0) : contrib.total_contributions;
                const amount = calculatePayment(q, r);
                
                return (
                  <tr key={contrib.user_id} className="group hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-600 font-bold">
                          {(contrib.full_name || contrib.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {contrib.full_name || 'Contributeur'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{contrib.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black rounded-md uppercase tracking-widest leading-none">
                        {contrib.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {q}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {r}
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">
                      {total}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                        {amount} DA
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {paymentMode 
                        ? (contrib.last_payment_date ? new Date(contrib.last_payment_date).toLocaleDateString('fr-FR') : 'Jamais')
                        : new Date(contrib.last_contribution_date).toLocaleDateString('fr-FR')
                      }
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchDetails(contrib.user_id)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                          Détails
                        </button>
                        {paymentMode && amount > 0 && (
                          <button
                            onClick={() => setPayingUser(contrib)}
                            className="px-3 py-1.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95 text-center"
                          >
                            Payer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedUserId && details.length > 0 && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-white/10">
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Détails des Contributions</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(null);
                    setDetails([]);
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-0 overflow-y-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-white/5">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Année</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Module</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nombre</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dernier Ajout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {details.map((detail, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                        <td className="px-8 py-4">
                          <span className={`${
                            detail.content_type === 'question'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-green-500/10 text-green-600 dark:text-green-400'
                          } px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-widest`}>
                            {detail.content_type}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{detail.year}</td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{detail.module_name}</td>
                        <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white">{detail.count}</td>
                        <td className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {new Date(detail.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {payingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-white/10">
              <div className="p-8 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center">Confirmer le Paiement</h3>
              </div>
              <div className="p-8">
                <p className="text-center text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                  Êtes-vous sûr de vouloir marquer ce contributeur comme payé ? Cette action est irréversible.
                </p>
                <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 mb-6">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Contributeur</p>
                  <p className="font-bold text-slate-900 dark:text-white mb-4">{payingUser.full_name}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Articles</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {payingUser.payable_questions || 0} Q + {payingUser.payable_resources || 0} R
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Montant Total</p>
                      <p className="text-2xl font-black text-primary-600">
                        {calculatePayment(payingUser.payable_questions || 0, payingUser.payable_resources || 0)} DA
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleMarkAsPaid}
                    className="w-full px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
                    disabled={processingPayment}
                  >
                    {processingPayment ? '⏳ Traitement...' : '✅ Confirmer le Paiement'}
                  </button>
                  <button
                    onClick={() => setPayingUser(null)}
                    className="w-full px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95 disabled:opacity-50"
                    disabled={processingPayment}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
