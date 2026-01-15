'use client';

import { useState, useMemo, useEffect } from 'react';
import { YEARS, EXAM_TYPES } from '@/lib/constants';
import { PREDEFINED_MODULES } from '@/lib/predefined-modules';
import { getQuestions } from '@/lib/api/questions';
import { supabase } from '@/lib/supabase';

interface FilterState {
  year: string;
  moduleId: string;
  speciality: string;
  examType: string;
  examYear: string;
  questionNumber: string;
  createdBy: string;
  searchText: string;
  dateFrom: string;
  dateTo: string;
}

export default function HistoryPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    moduleId: '',
    speciality: '',
    examType: '',
    examYear: '',
    questionNumber: '',
    createdBy: '',
    searchText: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load questions and users on mount, and handle URL parameters
  useEffect(() => {
    loadQuestions();
    loadUsers();
    
    // Check for URL parameters
    const params = new URLSearchParams(window.location.search);
    const yearParam = params.get('year');
    const moduleParam = params.get('module');
    
    if (yearParam || moduleParam) {
      setFilters(prev => ({
        ...prev,
        year: yearParam || '',
        moduleId: moduleParam || '',
      }));
    }
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const result = await getQuestions();
    if (result.success) {
      setQuestions(result.data);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('role', ['owner', 'admin', 'manager'])
      .order('email');
    
    if (data) {
      setUsers(data);
    }
  };

  // Filter questions based on all criteria
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(q => q.year === filters.year);
    }

    // Filter by module
    if (filters.moduleId) {
      filtered = filtered.filter(q => q.module_name === filters.moduleId);
    }

    // Filter by speciality
    if (filters.speciality) {
      filtered = filtered.filter(q => q.speciality === filters.speciality);
    }

    // Filter by exam type
    if (filters.examType) {
      filtered = filtered.filter(q => q.exam_type === filters.examType);
    }

    // Filter by exam year (promo)
    if (filters.examYear) {
      if (filters.examYear === 'null') {
        // Filter for questions without promo (exam_year is null)
        filtered = filtered.filter(q => q.exam_year === null || q.exam_year === undefined);
      } else {
        // Filter for specific promo year
        filtered = filtered.filter(q => q.exam_year === parseInt(filters.examYear));
      }
    }

    // Filter by question number
    if (filters.questionNumber) {
      filtered = filtered.filter(q => q.number === parseInt(filters.questionNumber));
    }

    // Filter by created by
    if (filters.createdBy) {
      filtered = filtered.filter(q => q.created_by === filters.createdBy);
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchLower) ||
        q.answers?.some((a: any) => a.answer_text.toLowerCase().includes(searchLower))
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(q => 
        new Date(q.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(q => 
        new Date(q.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    return filtered;
  }, [questions, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      year: '',
      moduleId: '',
      speciality: '',
      examType: '',
      examYear: '',
      questionNumber: '',
      createdBy: '',
      searchText: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Année', 'Module', 'Spécialité', 'Type Examen', 'Promo', 'Numéro', 'Question', 'Cours', 'Date Création'];
    const rows = filteredQuestions.map(q => [
      q.year,
      q.module_name,
      q.speciality || '',
      q.exam_type,
      q.exam_year ? `M${q.exam_year - 2000}` : '',
      q.number,
      `"${q.question_text.replace(/"/g, '""')}"`,
      q.cours ? `"${q.cours.join('; ')}"` : '',
      new Date(q.created_at).toLocaleDateString('fr-FR'),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get available modules for selected year and specialty
  const availableModules = useMemo(() => {
    let modules = PREDEFINED_MODULES;
    
    // Filter by year if selected
    if (filters.year) {
      modules = modules.filter(m => m.year === filters.year);
    }
    
    // Filter by specialty if selected (non-Médecine specialties should not see Médecine modules)
    if (filters.speciality && filters.speciality !== 'Médecine') {
      // For Pharmacie and Dentaire, only show modules that exist in the database for that specialty
      // Since PREDEFINED_MODULES are for Médecine, we need to check actual questions
      const specialityModules = new Set(
        questions
          .filter(q => q.speciality === filters.speciality)
          .map(q => q.module_name)
      );
      modules = modules.filter(m => specialityModules.has(m.name));
    }
    
    return modules;
  }, [filters.year, filters.speciality, questions]);

  // Get available exam types for selected module
  const availableExamTypes = useMemo(() => {
    if (!filters.moduleId) {
      // Return just the values (strings) from EXAM_TYPES
      return EXAM_TYPES.map(et => et.value);
    }
    const selectedModule = PREDEFINED_MODULES.find(m => m.name === filters.moduleId);
    return selectedModule?.examTypes || EXAM_TYPES.map(et => et.value);
  }, [filters.moduleId]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Historique des Questions
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Recherche globale • FMC APP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Questions', value: questions.length, icon: '❓', color: 'primary' },
          { label: 'Résultats Filtrés', value: filteredQuestions.length, icon: '🔍', color: 'primary' },
          { label: 'Modules Uniques', value: new Set(filteredQuestions.map(q => q.module_name)).size, icon: '🧩', color: 'green' },
          { label: 'Page Actuelle', value: `${currentPage} / ${totalPages || 1}`, icon: '📄', color: 'purple' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{item.icon}</span>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</p>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filtres</h2>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-500 transition-colors"
          >
            Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Spécialité', value: filters.speciality, onChange: (v: string) => setFilters({ ...filters, speciality: v, moduleId: '' }), placeholder: 'Toutes les spécialités', options: [{ value: 'Médecine', label: 'Médecine' }, { value: 'Pharmacie', label: 'Pharmacie' }, { value: 'Dentaire', label: 'Dentaire' }] },
            { label: 'Année', value: filters.year, onChange: (v: string) => setFilters({ ...filters, year: v, moduleId: '' }), placeholder: 'Toutes les années', options: YEARS.map(y => ({ value: y.value, label: y.label })) },
            { label: 'Module', value: filters.moduleId, onChange: (v: string) => setFilters({ ...filters, moduleId: v }), placeholder: 'Tous les modules', options: availableModules.map(m => ({ value: m.name, label: m.name })) },
            { label: 'Type d\'Examen', value: filters.examType, onChange: (v: string) => setFilters({ ...filters, examType: v }), placeholder: 'Tous les types', options: availableExamTypes.map(t => ({ value: t, label: t })) },
            { label: 'Promo (Année Examen)', value: filters.examYear, onChange: (v: string) => setFilters({ ...filters, examYear: v }), placeholder: 'Toutes les promos', options: [
              { value: 'null', label: '⚠️ Pas de promo' },
              ...Array.from({ length: 8 }, (_, i) => 2025 - i).map(year => ({ value: String(year), label: `M${year - 2000}` }))
            ] },
            { label: 'Ajouté par', value: filters.createdBy, onChange: (v: string) => setFilters({ ...filters, createdBy: v }), placeholder: 'Tous les utilisateurs', options: users.map(u => ({ value: u.id, label: u.full_name || u.email })) },
          ].map((item, idx) => (
            <div key={idx}>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                {item.label}
              </label>
              <select
                value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">{item.placeholder}</option>
                {item.options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Search Text */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Rechercher
            </label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              placeholder="Texte de la question..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>

          {/* Question Number */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              N° Question
            </label>
            <input
              type="number"
              value={filters.questionNumber}
              onChange={(e) => setFilters({ ...filters, questionNumber: e.target.value })}
              placeholder="Ex: 17"
              min="1"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Date de début
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={exportToJSON}
            disabled={filteredQuestions.length === 0}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📄 Exporter JSON
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredQuestions.length === 0}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Exporter CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden mb-12">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Questions <span className="text-primary-500 ml-2">({filteredQuestions.length})</span>
          </h2>
        </div>
        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Chargement des questions...
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                Aucune question trouvée.
              </p>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                Essayez d&apos;ajuster vos filtres.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {paginatedQuestions.map((question) => (
                  <div key={question.id} className="group bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/60">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-md uppercase tracking-widest leading-none">
                          Q{question.number}
                        </span>
                        {question.exam_year ? (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-md uppercase tracking-widest leading-none border border-blue-500/20">
                            M{question.exam_year - 2000}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded-md uppercase tracking-widest leading-none border border-red-500/20">
                            ⚠️ Sans promo
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md leading-none">
                          {YEARS.find(y => y.value === question.year)?.label}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md leading-none">
                          {question.module_name}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md leading-none">
                          {question.exam_type}
                        </span>
                        {question.speciality && (
                          <span className="px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black rounded-md uppercase tracking-widest leading-none">
                            {question.speciality}
                          </span>
                        )}
                        {question.module_type === 'uei' && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black rounded-md uppercase tracking-widest leading-none">
                            🟢 UEI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`/questions?edit=${question.id}`}
                          className="px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-primary-500/20 transition-all"
                        >
                          ✏️ Modifier
                        </a>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {new Date(question.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-900 dark:text-white mb-4 font-bold leading-relaxed">{question.question_text}</p>

                    {question.cours && question.cours.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {question.cours.map((c: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-medium rounded-md">
                            📚 {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {question.answers?.filter((a: any) => a.is_correct).length} Correcte(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {question.answers?.length} Options
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ←
                  </button>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Page <span className="text-slate-900 dark:text-white">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
