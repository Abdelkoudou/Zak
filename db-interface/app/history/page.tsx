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
    const headers = ['Année', 'Module', 'Spécialité', 'Type Examen', 'Numéro', 'Question', 'Cours', 'Date Création'];
    const rows = filteredQuestions.map(q => [
      q.year,
      q.module_name,
      q.speciality || '',
      q.exam_type,
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

  // Get available modules for selected year
  const availableModules = useMemo(() => {
    if (!filters.year) return PREDEFINED_MODULES;
    return PREDEFINED_MODULES.filter(m => m.year === filters.year);
  }, [filters.year]);

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Historique des Questions</h1>
        <p className="text-gray-600">
          Recherchez et filtrez toutes les questions ajoutées au système
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Questions</p>
          <p className="text-3xl font-bold text-gray-900">{questions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Résultats Filtrés</p>
          <p className="text-3xl font-bold text-blue-600">{filteredQuestions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Modules Uniques</p>
          <p className="text-3xl font-bold text-green-600">
            {new Set(filteredQuestions.map(q => q.module_name)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Page Actuelle</p>
          <p className="text-3xl font-bold text-purple-600">
            {currentPage} / {totalPages || 1}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🔍 Filtres</h2>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
         {/* Speciality Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spécialité
            </label>
            <select
              value={filters.speciality}
              onChange={(e) => setFilters({ ...filters, speciality: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les spécialités</option>
              <option value="Médecine">Médecine</option>
              <option value="Pharmacie">Pharmacie</option>
              <option value="Dentaire">Dentaire</option>
            </select>
          </div>
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value, moduleId: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les années</option>
              {YEARS.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module
            </label>
            <select
              value={filters.moduleId}
              onChange={(e) => setFilters({ ...filters, moduleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les modules</option>
              {availableModules.map((module) => (
                <option key={module.name} value={module.name}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

         

          {/* Exam Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d&apos;Examen
            </label>
            <select
              value={filters.examType}
              onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              {availableExamTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Created By Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ajouté par
            </label>
            <select
              value={filters.createdBy}
              onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Search Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              placeholder="Texte de la question..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={exportToJSON}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📄 Exporter JSON
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📊 Exporter CSV
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Questions ({filteredQuestions.length})
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-gray-500 text-center py-8">
              ⏳ Chargement des questions...
            </p>
          ) : filteredQuestions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune question trouvée avec ces filtres.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedQuestions.map((question) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                          Q{question.number}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {YEARS.find(y => y.value === question.year)?.label}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {question.module_name}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {question.exam_type}
                        </span>
                        {question.speciality && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                            {question.speciality}
                          </span>
                        )}
                        {question.module_type === 'uei' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            🟢 UEI
                          </span>
                        )}
                        {question.module_type === 'standalone' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            🟡 Autonome
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(question.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-gray-900 mb-2 font-medium">{question.question_text}</p>

                    {question.cours && question.cours.length > 0 && (
                      <p className="text-xs text-gray-600 mb-2">
                        📚 Cours: {question.cours.join(', ')}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {question.answers?.filter((a: any) => a.is_correct).length} réponse(s) correcte(s)
                      </span>
                      <span>•</span>
                      <span>
                        {question.answers?.length} options
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    ← Précédent
                  </button>
                  <span className="text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Suivant →
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
