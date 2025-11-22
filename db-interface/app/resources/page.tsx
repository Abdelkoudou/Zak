'use client';

import { useState, useMemo, useEffect } from 'react';
import { YEARS, RESOURCE_TYPES } from '@/lib/constants';
import { PREDEFINED_MODULES, PREDEFINED_SUBDISCIPLINES } from '@/lib/predefined-modules';
import { createResource, getResources, deleteResource as deleteResourceAPI } from '@/lib/api/resources';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { CourseResourceFormData } from '@/types/database';

interface FilterState {
  year: string;
  moduleId: string;
  speciality: string;
  resourceType: string;
  createdBy: string;
  searchText: string;
  dateFrom: string;
  dateTo: string;
}

export default function ResourcesPage() {
  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    moduleId: '',
    speciality: '',
    resourceType: '',
    createdBy: '',
    searchText: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [formData, setFormData] = useState<CourseResourceFormData>({
    year: '1',
    moduleId: '',
    title: '',
    type: 'google_drive',
    url: '',
    speciality: 'Médecine',
    cours: [''],
  });

  // Get modules for selected year
  const availableModules = useMemo(() => {
    return PREDEFINED_MODULES.filter(m => m.year === formData.year);
  }, [formData.year]);

  // Get selected module details
  const selectedModule = useMemo(() => {
    return availableModules.find(m => m.name === formData.moduleId);
  }, [availableModules, formData.moduleId]);

  // Get sub-disciplines if module has them
  const availableSubDisciplines = useMemo(() => {
    if (selectedModule?.hasSubDisciplines && selectedModule.name) {
      return PREDEFINED_SUBDISCIPLINES[selectedModule.name] || [];
    }
    return [];
  }, [selectedModule]);

  // Load resources and users on mount, handle URL parameters
  useEffect(() => {
    loadResources();
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

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    const result = await getResources();
    if (result.success) {
      setResources(result.data);
    } else {
      setError(result.error || 'Failed to load resources');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validate cours
    const validCours = (formData.cours || []).filter(c => c.trim());
    if (validCours.length === 0) {
      setError('Veuillez fournir au moins un cours.');
      setSaving(false);
      return;
    }

    // Prepare data for Supabase
    const resourceData = {
      year: formData.year,
      module_name: formData.moduleId,
      sub_discipline: formData.subDisciplineId || undefined,
      title: formData.title,
      type: formData.type,
      url: formData.url,
      description: formData.description || undefined,
      speciality: formData.speciality || undefined,
      cours: validCours,
      unity_name: formData.unityName || undefined,
      module_type: formData.moduleType || selectedModule?.type,
    };

    // Save to Supabase
    const result = await createResource(resourceData);

    if (result.success) {
      setSuccess('✅ Ressource ajoutée avec succès!');
      setShowForm(false);
      
      // Reload resources
      await loadResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Erreur lors de l\'ajout de la ressource');
    }

    setSaving(false);
  };

  const resetForm = () => {
    setFormData({
      year: '1',
      moduleId: '',
      title: '',
      type: 'google_drive',
      url: '',
      speciality: 'Médecine',
      cours: [''],
    });
  };

  const deleteResourceHandler = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      const result = await deleteResourceAPI(id);
      if (result.success) {
        setSuccess('✅ Ressource supprimée avec succès!');
        await loadResources();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    }
  };

  // Helper functions for cours management
  const addCoursInput = () => {
    setFormData({ ...formData, cours: [...(formData.cours || []), ''] });
  };

  const removeCoursInput = (index: number) => {
    const newCours = (formData.cours || []).filter((_, i) => i !== index);
    setFormData({ ...formData, cours: newCours.length > 0 ? newCours : [''] });
  };

  const updateCoursInput = (index: number, value: string) => {
    const newCours = [...(formData.cours || [])];
    newCours[index] = value;
    setFormData({ ...formData, cours: newCours });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'google_drive':
        return '📁';
      case 'telegram':
        return '✈️';
      case 'youtube':
        return '▶️';
      case 'pdf':
        return '📄';
      default:
        return '🔗';
    }
  };

  // Filter resources based on all criteria
  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(r => r.year === filters.year);
    }

    // Filter by module
    if (filters.moduleId) {
      filtered = filtered.filter(r => r.module_name === filters.moduleId);
    }

    // Filter by speciality
    if (filters.speciality) {
      filtered = filtered.filter(r => r.speciality === filters.speciality);
    }

    // Filter by resource type
    if (filters.resourceType) {
      filtered = filtered.filter(r => r.type === filters.resourceType);
    }

    // Filter by created by
    if (filters.createdBy) {
      filtered = filtered.filter(r => r.created_by === filters.createdBy);
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        (r.description && r.description.toLowerCase().includes(searchLower)) ||
        (r.cours && r.cours.some((c: string) => c.toLowerCase().includes(searchLower)))
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(r => 
        new Date(r.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => 
        new Date(r.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    return filtered;
  }, [resources, filters]);

  // Get available modules for filter dropdown
  const availableFilterModules = useMemo(() => {
    if (!filters.year) return PREDEFINED_MODULES;
    return PREDEFINED_MODULES.filter(m => m.year === filters.year);
  }, [filters.year]);

  // Pagination
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResources, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      year: '',
      moduleId: '',
      speciality: '',
      resourceType: '',
      createdBy: '',
      searchText: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredResources, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resources-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Année', 'Module', 'Spécialité', 'Type', 'Titre', 'URL', 'Cours', 'Date Création'];
    const rows = filteredResources.map(r => [
      r.year,
      r.module_name,
      r.speciality || '',
      RESOURCE_TYPES.find(t => t.value === r.type)?.label || r.type,
      `"${r.title.replace(/"/g, '""')}"`,
      r.url,
      r.cours ? `"${r.cours.join('; ')}"` : '',
      new Date(r.created_at).toLocaleDateString('fr-FR'),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resources-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Ressources de Cours</h1>
          <p className="text-sm md:text-base text-gray-600">Gérer les ressources (Google Drive, Telegram, YouTube, PDF)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base whitespace-nowrap"
        >
          {showForm ? 'Annuler' : '➕ Nouvelle Ressource'}
        </button>
      </div>

      {/* Supabase Setup Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Configuration Supabase Requise
              </h3>
              <p className="text-yellow-800">
                Supabase n&apos;est pas configuré. Consultez SUPABASE_SETUP.md pour les instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">Total Ressources</p>
          <p className="text-xl md:text-3xl font-bold text-gray-900">{resources.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">Résultats Filtrés</p>
          <p className="text-xl md:text-3xl font-bold text-blue-600">{filteredResources.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">Types Uniques</p>
          <p className="text-xl md:text-3xl font-bold text-green-600">
            {new Set(filteredResources.map(r => r.type)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">Page Actuelle</p>
          <p className="text-xl md:text-3xl font-bold text-purple-600">
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
              {availableFilterModules.map((module) => (
                <option key={module.name} value={module.name}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

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

          {/* Resource Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Ressource
            </label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
              placeholder="Titre, description, cours..."
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
            disabled={filteredResources.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📄 Exporter JSON
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredResources.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📊 Exporter CSV
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Ajouter une Ressource</h2>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Form fields - similar to questions page */}
            <div className="border-2 border-gray-200 rounded-lg p-4 md:p-6 bg-gray-50">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-700 border-b pb-2">
                📖 Détails de la Ressource
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Speciality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialité *
                  </label>
                  <select
                    value={formData.speciality || 'Médecine'}
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Médecine">Médecine</option>
                    <option value="Pharmacie">Pharmacie</option>
                    <option value="Dentaire">Dentaire</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année d&apos;Étude *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      year: e.target.value as any,
                      moduleId: '',
                      subDisciplineId: undefined,
                      unityName: undefined,
                      moduleType: undefined
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {YEARS.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module / Unité *
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => {
                      const selectedMod = availableModules.find(m => m.name === e.target.value);
                      setFormData({ 
                        ...formData, 
                        moduleId: e.target.value,
                        subDisciplineId: undefined,
                        unityName: selectedMod?.type === 'uei' ? e.target.value : undefined,
                        moduleType: selectedMod?.type
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un module</option>
                    {availableModules.map((module) => (
                      <option key={module.name} value={module.name}>
                        {module.type === 'uei' && '🟢 UEI: '}
                        {module.type === 'standalone' && '🟡 '}
                        {module.type === 'annual' && '🔵 '}
                        {module.type === 'semestrial' && '🔵 '}
                        {module.name}
                      </option>
                    ))}
                  </select>
                  {selectedModule && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedModule.type === 'uei' && '🟢 Unité d\'Enseignement Intégré (UEI)'}
                      {selectedModule.type === 'standalone' && '🟡 Module Autonome'}
                      {selectedModule.type === 'annual' && '🔵 Module Annuel'}
                      {selectedModule.type === 'semestrial' && '🔵 Module Semestriel'}
                    </p>
                  )}
                </div>

                {/* Sub-discipline (if applicable) */}
                {availableSubDisciplines.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sous-discipline
                    </label>
                    <select
                      value={formData.subDisciplineId || ''}
                      onChange={(e) => setFormData({ ...formData, subDisciplineId: e.target.value || undefined })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucune (optionnel)</option>
                      {availableSubDisciplines.map((subDisc) => (
                        <option key={subDisc} value={subDisc}>
                          {subDisc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Resource Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Ressource *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cours (Multiple) */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Cours *
                </label>
                <div className="space-y-2">
                  {(formData.cours || ['']).map((cours, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={cours}
                        onChange={(e) => updateCoursInput(index, e.target.value)}
                        className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                        placeholder="Nom du cours"
                        required
                      />
                      {index === (formData.cours || []).length - 1 ? (
                        <button
                          type="button"
                          onClick={addCoursInput}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                        >
                          +
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeCoursInput(index)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vous pouvez ajouter plusieurs cours en cliquant sur le bouton +
                </p>
              </div>

              {/* Title */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Titre de la Ressource *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Ex: Cours Anatomie - Chapitre 1"
                  required
                />
              </div>

              {/* URL */}
              <div className="mt-3 md:mt-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  URL / Lien *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="https://drive.google.com/... ou https://t.me/..."
                  required
                />
              </div>

              {/* Description */}
              <div className="mt-3 md:mt-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  rows={3}
                  placeholder="Description de la ressource..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {saving ? '⏳ Enregistrement...' : '✅ Enregistrer la Ressource'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 md:px-6 py-2 md:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm md:text-base"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold">
            Ressources ({filteredResources.length})
          </h2>
        </div>
        <div className="p-4 md:p-6">
          {loading ? (
            <p className="text-gray-500 text-center py-8">
              ⏳ Chargement des ressources...
            </p>
          ) : filteredResources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {resources.length === 0 
                ? 'Aucune ressource ajoutée. Cliquez sur "Nouvelle Ressource" pour commencer.'
                : 'Aucune ressource trouvée avec ces filtres.'
              }
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedResources.map((resource) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{resource.title}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {YEARS.find(y => y.value === resource.year)?.label}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            {resource.module_name}
                          </span>
                          {resource.speciality && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                              {resource.speciality}
                            </span>
                          )}
                          {resource.module_type === 'uei' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              🟢 UEI
                            </span>
                          )}
                          {resource.module_type === 'standalone' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                              🟡 Autonome
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {RESOURCE_TYPES.find(t => t.value === resource.type)?.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    )}

                    {resource.cours && resource.cours.length > 0 && (
                      <p className="text-xs text-gray-600 mb-3">
                        📚 Cours: {resource.cours.join(', ')}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mb-3">
                      📅 {new Date(resource.created_at).toLocaleDateString('fr-FR')}
                    </p>

                    <div className="flex gap-2">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 text-sm text-center bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Ouvrir
                      </a>
                      <button
                        onClick={() => deleteResourceHandler(resource.id)}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        ✕
                      </button>
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
