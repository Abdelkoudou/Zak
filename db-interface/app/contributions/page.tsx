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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading contributions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-blue-600 hover:underline"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Contribution Tracking
            </h1>
            <p className="text-gray-600">
              Track questions and resources added by each admin
            </p>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-white rounded-lg p-1 shadow border border-gray-200">
            <button
              onClick={() => setPaymentMode(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !paymentMode 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics Mode
            </button>
            <button
              onClick={() => setPaymentMode(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                paymentMode 
                  ? 'bg-green-100 text-green-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment Mode
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {paymentMode ? 'Pricing Settings' : 'Filters & Pricing'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {!paymentMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per QCM (DA)
              </label>
              <input
                type="number"
                value={pricePerQuestion}
                onChange={(e) => setPricePerQuestion(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Resource (DA)
              </label>
              <input
                type="number"
                value={pricePerResource}
                onChange={(e) => setPricePerResource(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            {!paymentMode && (
              <button
                onClick={fetchContributions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
            )}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Contributors</p>
            <p className="text-3xl font-bold text-gray-900">{contributions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">
              {paymentMode ? 'Payable Questions' : 'Total Questions'}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {contributions.reduce((sum, c) => 
                sum + (paymentMode ? (c.payable_questions || 0) : c.questions_added), 0
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">
               {paymentMode ? 'Payable Resources' : 'Total Resources'}
            </p>
            <p className="text-3xl font-bold text-green-600">
              {contributions.reduce((sum, c) => 
                sum + (paymentMode ? (c.payable_resources || 0) : c.resources_added), 0
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">
              {paymentMode ? 'Total Amount Due' : 'Total Payments'}
            </p>
            <p className="text-3xl font-bold text-purple-600">{calculateTotalPayment()} DA</p>
          </div>
        </div>

        {/* Contributions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {paymentMode ? 'Payable Q' : 'Questions'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                   {paymentMode ? 'Payable R' : 'Resources'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {paymentMode ? 'Amount Due' : 'Payment (DA)'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {paymentMode ? 'Last Payment' : 'Last Activity'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contributions.map((contrib) => {
                const q = paymentMode ? (contrib.payable_questions || 0) : contrib.questions_added;
                const r = paymentMode ? (contrib.payable_resources || 0) : contrib.resources_added;
                const total = paymentMode ? (contrib.total_payable_contributions || 0) : contrib.total_contributions;
                const amount = calculatePayment(q, r);
                
                return (
                  <tr key={contrib.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {contrib.full_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">{contrib.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {contrib.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {q}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {r}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {total}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-purple-600">
                      {amount} DA
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {paymentMode 
                        ? (contrib.last_payment_date ? new Date(contrib.last_payment_date).toLocaleDateString() : 'Never')
                        : new Date(contrib.last_contribution_date).toLocaleDateString()
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => fetchDetails(contrib.user_id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Details
                        </button>
                        {paymentMode && amount > 0 && (
                          <button
                            onClick={() => setPayingUser(contrib)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Mark Paid
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    Contribution Details
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedUserId(null);
                      setDetails([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Year
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Module
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Count
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Added
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {details.map((detail, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            detail.content_type === 'question'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {detail.content_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {detail.year}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {detail.module_name}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {detail.count}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(detail.created_at).toLocaleDateString()}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Confirm Payment
                </h3>
              </div>
              <div className="p-6">
                <p className="mb-4 text-gray-600">
                  Are you sure you want to mark this admin as paid?
                </p>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-500">Admin</p>
                  <p className="font-medium">{payingUser.full_name}</p>
                  <div className="mt-2 flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Items</p>
                      <p className="font-medium">
                        {payingUser.payable_questions || 0} Q + {payingUser.payable_resources || 0} R
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-bold text-lg text-purple-600">
                        {calculatePayment(payingUser.payable_questions || 0, payingUser.payable_resources || 0)} DA
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  This will record a payment and reset the payable count for this admin.
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setPayingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
