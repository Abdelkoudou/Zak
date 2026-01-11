'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface QuestionReport {
  id: string;
  question_id: string;
  user_id: string;
  report_type: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  question?: {
    number: number;
    question_text: string;
    module_name: string;
    exam_type: string;
  };
  user?: {
    email: string;
    full_name: string | null;
  };
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  error_in_question: 'Erreur dans la question',
  wrong_answer: 'Réponse incorrecte',
  unclear: 'Question pas claire',
  duplicate: 'Question dupliquée',
  outdated: 'Information obsolète',
  other: 'Autre',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  reviewing: { label: 'En révision', color: 'text-blue-700', bg: 'bg-blue-100' },
  resolved: { label: 'Résolu', color: 'text-green-700', bg: 'bg-green-100' },
  dismissed: { label: 'Rejeté', color: 'text-slate-700', bg: 'bg-slate-100' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('question_reports')
        .select(`
          *,
          question:questions(number, question_text, module_name, exam_type),
          user:users!question_reports_user_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;
      if (typeFilter !== 'all' && report.report_type !== typeFilter) return false;
      return true;
    });
  }, [reports, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }), [reports]);

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error: updateError } = await supabase
        .from('question_reports')
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_by: session?.user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateError) throw updateError;
      
      await loadReports();
      setSelectedReport(null);
      setAdminNotes('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Signalements
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Gestion des signalements • FMC APP
          </p>
        </div>
        <button
          onClick={loadReports}
          className="px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm font-bold shadow-sm flex items-center gap-2"
        >
          <span>🔄</span> Actualiser
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: '📊', color: 'primary' },
          { label: 'En attente', value: stats.pending, icon: '⏳', color: 'yellow' },
          { label: 'En révision', value: stats.reviewing, icon: '👀', color: 'blue' },
          { label: 'Résolus', value: stats.resolved, icon: '✅', color: 'green' },
          { label: 'Rejetés', value: stats.dismissed, icon: '❌', color: 'slate' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{item.icon}</span> {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="reviewing">En révision</option>
              <option value="resolved">Résolus</option>
              <option value="dismissed">Rejetés</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="all">Tous</option>
              {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-500">Chargement des signalements...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-500">Aucun signalement trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[report.status].bg} ${STATUS_LABELS[report.status].color}`}>
                      {STATUS_LABELS[report.status].label}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(report.created_at)}
                    </span>
                  </div>

                  {/* Question Info */}
                  {report.question && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Q{report.question.number} • {report.question.module_name} • {report.question.exam_type}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {report.question.question_text}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {report.description && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{report.description}</p>
                    </div>
                  )}

                  {/* Reporter */}
                  {report.user && (
                    <p className="text-xs text-slate-400">
                      Signalé par: {report.user.full_name || report.user.email}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setAdminNotes(report.admin_notes || '');
                    }}
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Gérer
                  </button>
                  {report.question_id && (
                    <a
                      href={`/questions?edit=${report.question_id}`}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center"
                    >
                      ✏️ Modifier
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gérer le signalement</h2>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setAdminNotes('');
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Report Info */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</p>
                <p className="text-slate-700 dark:text-slate-300">{REPORT_TYPE_LABELS[selectedReport.report_type]}</p>
              </div>
              
              {selectedReport.description && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-slate-700 dark:text-slate-300">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.question && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Question</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Q{selectedReport.question.number}: {selectedReport.question.question_text.substring(0, 150)}...
                  </p>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Notes admin (optionnel)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ajouter des notes internes..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white resize-none"
                rows={3}
              />
            </div>

            {/* Status Actions */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Changer le statut</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'reviewing')}
                  disabled={updating || selectedReport.status === 'reviewing'}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  👀 En révision
                </button>
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                  disabled={updating}
                  className="px-4 py-3 bg-green-100 text-green-700 rounded-xl font-semibold hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  ✅ Résolu
                </button>
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'dismissed')}
                  disabled={updating}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  ❌ Rejeter
                </button>
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'pending')}
                  disabled={updating || selectedReport.status === 'pending'}
                  className="px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  ⏳ En attente
                </button>
              </div>
            </div>

            {updating && (
              <div className="mt-4 text-center text-slate-500">
                <span className="animate-spin inline-block">⏳</span> Mise à jour...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
