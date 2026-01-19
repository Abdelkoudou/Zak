'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Feedback {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  feedback_type: 'bug' | 'feature' | 'content' | 'general';
  message: string;
  rating: number | null;
  is_read: boolean;
  admin_notes: string | null;
  created_at: string;
}

const FEEDBACK_TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  general: { label: 'Général', emoji: '💭', color: 'bg-slate-500' },
  bug: { label: 'Bug', emoji: '🐛', color: 'bg-red-500' },
  feature: { label: 'Suggestion', emoji: '✨', color: 'bg-purple-500' },
  content: { label: 'Contenu', emoji: '📚', color: 'bg-blue-500' },
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'bug' | 'feature' | 'content' | 'general'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter !== 'all') {
        query = query.eq('feedback_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.error('Error loading feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const markAsRead = async (id: string) => {
    await supabase.from('user_feedback').update({ is_read: true }).eq('id', id);
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: true } : f));
  };

  const saveAdminNotes = async () => {
    if (!selectedFeedback) return;
    setSaving(true);
    try {
      await supabase
        .from('user_feedback')
        .update({ admin_notes: adminNotes, is_read: true })
        .eq('id', selectedFeedback.id);
      
      setFeedbacks(prev => prev.map(f => 
        f.id === selectedFeedback.id 
          ? { ...f, admin_notes: adminNotes, is_read: true } 
          : f
      ));
      setSelectedFeedback(null);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Supprimer ce feedback ?')) return;
    await supabase.from('user_feedback').delete().eq('id', id);
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    if (selectedFeedback?.id === id) setSelectedFeedback(null);
  };

  const unreadCount = feedbacks.filter(f => !f.is_read).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              💬 Feedbacks Utilisateurs
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {feedbacks.length} feedback{feedbacks.length > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'unread', label: `Non lus (${unreadCount})` },
            { value: 'bug', label: '🐛 Bugs' },
            { value: 'feature', label: '✨ Suggestions' },
            { value: 'content', label: '📚 Contenu' },
            { value: 'general', label: '💭 Général' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="text-5xl mb-4 block">📭</span>
            <p className="text-slate-500 dark:text-slate-400">Aucun feedback pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {feedbacks.map((feedback) => {
              const typeInfo = FEEDBACK_TYPE_LABELS[feedback.feedback_type];
              return (
                <div
                  key={feedback.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                    feedback.is_read 
                      ? 'border-slate-200 dark:border-slate-700' 
                      : 'border-primary-300 dark:border-primary-700 ring-2 ring-primary-100 dark:ring-primary-900'
                  } p-5 transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 ${typeInfo.color} text-white text-xs font-bold rounded-full`}>
                          {typeInfo.emoji} {typeInfo.label}
                        </span>
                        {feedback.rating && (
                          <span className="text-yellow-500 text-sm">
                            {'⭐'.repeat(feedback.rating)}
                          </span>
                        )}
                        {!feedback.is_read && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs font-bold rounded-full">
                            Nouveau
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">👤</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {feedback.user_name || 'Anonyme'}
                        </span>
                        {feedback.user_email && (
                          <span className="text-slate-500 dark:text-slate-400 text-sm">
                            ({feedback.user_email})
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-3">
                        {feedback.message}
                      </p>

                      {/* Admin Notes */}
                      {feedback.admin_notes && (
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">📝 Notes admin:</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{feedback.admin_notes}</p>
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(feedback.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!feedback.is_read && (
                        <button
                          onClick={() => markAsRead(feedback.id)}
                          className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Marquer comme lu"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setAdminNotes(feedback.admin_notes || '');
                        }}
                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ajouter une note"
                      >
                        📝
                      </button>
                      <button
                        onClick={() => deleteFeedback(feedback.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Admin Notes Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                📝 Notes Admin
              </h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ajouter des notes internes..."
                className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveAdminNotes}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
