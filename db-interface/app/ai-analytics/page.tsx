'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';

interface DailyStat {
  date: string;
  total_messages: number;
  total_sessions: number;
  unique_users: number;
  rag_hits: number;
  fallback_count: number;
  avg_rating: number | null;
  rated_count: number;
  avg_response_time: number | null;
}

interface ModelStat {
  model: string;
  model_name: string;
  usage_count: number;
  avg_rating: number | null;
  rated_count: number;
  avg_response_time: number | null;
  fallback_count: number;
  rag_usage: number;
}

interface Feedback {
  id: string;
  content: string;
  rating: number;
  feedback: string | null;
  model_name: string;
  created_at: string;
}

export default function AIAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{
    summary: {
      totalMessages: number;
      totalSessions: number;
      totalRated: number;
      avgRating: number | null;
      ragUsageCount: number;
    };
    dailyStats: DailyStat[];
    modelStats: ModelStat[];
    recentFeedback: Feedback[];
  } | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/analytics?days=${days}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch analytics');
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const StatCard = ({ icon, label, value, subValue, color }: { 
    icon: string; label: string; value: string | number; subValue?: string; color: string 
  }) => (
    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-dark-200/50 border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subValue && (
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <p className={isDark ? 'text-red-400' : 'text-red-600'}>❌ {error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            📊 AI Chat Analytics
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Monitor usage, performance, and feedback
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className={`px-4 py-2 rounded-xl border ${isDark ? 'bg-dark-200 border-white/10 text-white' : 'bg-white border-slate-200'}`}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Link
            href="/ai-chat"
            className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Open Chat →
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon="💬"
          label="Total Messages"
          value={data?.summary.totalMessages || 0}
          color={isDark ? 'text-white' : 'text-slate-900'}
        />
        <StatCard
          icon="📁"
          label="Chat Sessions"
          value={data?.summary.totalSessions || 0}
          color={isDark ? 'text-white' : 'text-slate-900'}
        />
        <StatCard
          icon="📚"
          label="RAG Usage"
          value={data?.summary.ragUsageCount || 0}
          subValue="Knowledge hits"
          color="text-purple-500"
        />
        <StatCard
          icon="⭐"
          label="Avg Rating"
          value={data?.summary.avgRating?.toFixed(1) || 'N/A'}
          subValue={`${data?.summary.totalRated || 0} rated`}
          color="text-amber-500"
        />
        <StatCard
          icon="✅"
          label="Rated Messages"
          value={data?.summary.totalRated || 0}
          color="text-green-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Model Usage */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-dark-200/50 border-white/5' : 'bg-white border-slate-200'}`}>
          <h2 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            🤖 Model Usage
          </h2>
          {data?.modelStats && data.modelStats.length > 0 ? (
            <div className="space-y-3">
              {data.modelStats.slice(0, 8).map((model, i) => (
                <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-dark-300' : 'bg-slate-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {model.model_name || model.model}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {model.usage_count} uses • {model.avg_response_time?.toFixed(0) || '?'}ms avg
                      </p>
                    </div>
                    {model.avg_rating && (
                      <span className="text-amber-500 text-sm">
                        {renderStars(model.avg_rating)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {model.rag_usage > 0 && (
                      <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                        📚 {model.rag_usage} RAG
                      </span>
                    )}
                    {model.fallback_count > 0 && (
                      <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                        ⚡ {model.fallback_count} fallback
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>No model data yet</p>
          )}
        </div>

        {/* Recent Feedback */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-dark-200/50 border-white/5' : 'bg-white border-slate-200'}`}>
          <h2 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            💬 Recent Feedback
          </h2>
          {data?.recentFeedback && data.recentFeedback.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {data.recentFeedback.map((fb) => (
                <div key={fb.id} className={`p-3 rounded-xl ${isDark ? 'bg-dark-300' : 'bg-slate-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-amber-500 text-sm">
                      {renderStars(fb.rating)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {fb.content.slice(0, 100)}...
                  </p>
                  {fb.feedback && (
                    <p className={`text-xs mt-2 italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      &ldquo;{fb.feedback}&rdquo;
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    via {fb.model_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>No feedback yet</p>
          )}
        </div>
      </div>

      {/* Daily Stats Table */}
      {data?.dailyStats && data.dailyStats.length > 0 && (
        <div className={`mt-6 p-5 rounded-2xl border ${isDark ? 'bg-dark-200/50 border-white/5' : 'bg-white border-slate-200'}`}>
          <h2 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            📅 Daily Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-right py-2 px-3">Messages</th>
                  <th className="text-right py-2 px-3">Sessions</th>
                  <th className="text-right py-2 px-3">Users</th>
                  <th className="text-right py-2 px-3">RAG Hits</th>
                  <th className="text-right py-2 px-3">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyStats.slice(0, 14).map((day, i) => (
                  <tr key={i} className={`border-t ${isDark ? 'border-dark-100' : 'border-slate-100'}`}>
                    <td className={`py-2 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="text-right py-2 px-3">{day.total_messages}</td>
                    <td className="text-right py-2 px-3">{day.total_sessions}</td>
                    <td className="text-right py-2 px-3">{day.unique_users}</td>
                    <td className="text-right py-2 px-3 text-purple-500">{day.rag_hits}</td>
                    <td className="text-right py-2 px-3 text-amber-500">
                      {day.avg_rating?.toFixed(1) || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
