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

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
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
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
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

  const totalPayments = contributions.reduce(
    (sum, c) => sum + calculatePayment(c.questions_added, c.resources_added),
    0
  );

  const exportToCSV = () => {
    const headers = ['Email', 'Name', 'Role', 'Questions', 'Resources', 'Total', 'Payment (DA)', 'Last Activity'];
    const rows = contributions.map(c => [
      c.email,
      c.full_name || '',
      c.role,
      c.questions_added,
      c.resources_added,
      c.total_contributions,
      calculatePayment(c.questions_added, c.resources_added),
      new Date(c.last_contribution_date).toLocaleDateString(),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contributions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Contribution Tracking
          </h1>
          <p className="text-gray-600">
            Track questions and resources added by each admin for payment calculations
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <button
              onClick={fetchContributions}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
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
            <p className="text-sm text-gray-600 mb-1">Total Questions</p>
            <p className="text-3xl font-bold text-blue-600">
              {contributions.reduce((sum, c) => sum + c.questions_added, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Resources</p>
            <p className="text-3xl font-bold text-green-600">
              {contributions.reduce((sum, c) => sum + c.resources_added, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Payments</p>
            <p className="text-3xl font-bold text-purple-600">{totalPayments} DA</p>
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
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resources
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment (DA)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contributions.map((contrib) => (
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
                    {contrib.questions_added}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {contrib.resources_added}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {contrib.total_contributions}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-purple-600">
                    {calculatePayment(contrib.questions_added, contrib.resources_added)} DA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(contrib.last_contribution_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchDetails(contrib.user_id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
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
      </div>
    </div>
  );
}
