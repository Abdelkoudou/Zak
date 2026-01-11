'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  metadata: Record<string, any>;
  created_at: string;
}

const CATEGORIES = ['general', 'about', 'curriculum', 'subscription', 'features', 'faq'];

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchEntries();
  }, [filterCategory]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const url = filterCategory 
        ? `/api/knowledge?category=${filterCategory}` 
        : '/api/knowledge';
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.knowledge || []);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, ...form }
        : form;

      const res = await fetch('/api/knowledge', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setForm({ title: '', content: '', category: 'general' });
        setEditingId(null);
        fetchEntries();
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
    setSaving(false);
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge entry?')) return;

    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleRegenerateEmbeddings = async () => {
    if (!confirm('Regenerate embeddings for all entries without embeddings?')) return;

    setRegenerating(true);
    try {
      const res = await fetch('/api/knowledge/embeddings', { method: 'POST' });
      const data = await res.json();
      alert(`Updated: ${data.updated}, Errors: ${data.errors}`);
      fetchEntries();
    } catch (error) {
      console.error('Error regenerating:', error);
    }
    setRegenerating(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            📚 Knowledge Base (RAG)
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Add knowledge for the AI to use when answering questions
          </p>
        </div>
        <button
          onClick={handleRegenerateEmbeddings}
          disabled={regenerating}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            ${isDark ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}
            disabled:opacity-50
          `}
        >
          {regenerating ? '⏳ Regenerating...' : '🔄 Regenerate Embeddings'}
        </button>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-dark-200 border-dark-100' : 'bg-white border-slate-200'}`}>
        <h2 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {editingId ? '✏️ Edit Entry' : '➕ Add New Knowledge'}
        </h2>
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-dark-300 border-dark-100 text-white' : 'bg-white border-slate-200'}`}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-dark-300 border-dark-100 text-white' : 'bg-white border-slate-200'}`}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Content (the knowledge the AI will use)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            className={`px-4 py-2 rounded-lg border resize-none ${isDark ? 'bg-dark-300 border-dark-100 text-white' : 'bg-white border-slate-200'}`}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ title: '', content: '', category: 'general' });
                }}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-300 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            !filterCategory 
              ? 'bg-primary-500 text-white' 
              : isDark ? 'bg-dark-200 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              filterCategory === cat 
                ? 'bg-primary-500 text-white' 
                : isDark ? 'bg-dark-200 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Entries List */}
      {loading ? (
        <div className={`text-center py-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className={`text-center py-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          No knowledge entries yet. Add some above!
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-xl border ${isDark ? 'bg-dark-200 border-dark-100' : 'bg-white border-slate-200'}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {entry.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-dark-300 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {entry.category}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {entry.content.length > 200 ? entry.content.slice(0, 200) + '...' : entry.content}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(entry)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-dark-300' : 'hover:bg-slate-100'}`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-900/50' : 'hover:bg-red-50'}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
