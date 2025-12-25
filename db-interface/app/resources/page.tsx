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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (user) {
          setUserRole(user.role);
        }
      }
    };
    fetchUserRole();
  }, []);

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
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 md:mb-2">
            Ressources de Cours
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Gérer les ressources • FMC APP
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95 text-sm md:text-base whitespace-nowrap"
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Ressources', value: resources.length, icon: '📚', color: 'primary' },
          { label: 'Résultats Filtrés', value: filteredResources.length, icon: '🔍', color: 'primary' },
          { label: 'Types Uniques', value: new Set(filteredResources.map(r => r.type)).size, icon: '🧩', color: 'green' },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Search Text */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Rechercher
            </label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              placeholder="Titre, description, cours..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>

          {[
            { label: 'Année', value: filters.year, options: YEARS.map(y => ({ value: y.value, label: y.label })), onChange: (v: string) => setFilters({ ...filters, year: v, moduleId: '' }), placeholder: 'Toutes les années' },
            { label: 'Module', value: filters.moduleId, options: availableFilterModules.map(m => ({ value: m.name, label: m.name })), onChange: (v: string) => setFilters({ ...filters, moduleId: v }), placeholder: 'Tous les modules' },
            { label: 'Spécialité', value: filters.speciality, options: [{ value: 'Médecine', label: 'Médecine' }, { value: 'Pharmacie', label: 'Pharmacie' }, { value: 'Dentaire', label: 'Dentaire' }], onChange: (v: string) => setFilters({ ...filters, speciality: v }), placeholder: 'Toutes les spécialités' },
            { label: 'Type', value: filters.resourceType, options: RESOURCE_TYPES.map(t => ({ value: t.value, label: t.label })), onChange: (v: string) => setFilters({ ...filters, resourceType: v }), placeholder: 'Tous les types' },
            { label: 'Ajouté par', value: filters.createdBy, options: users.map(u => ({ value: u.id, label: u.full_name || u.email })), onChange: (v: string) => setFilters({ ...filters, createdBy: v }), placeholder: 'Tous les utilisateurs' },
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

          {/* Date Range */}
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
            disabled={filteredResources.length === 0}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📄 Exporter JSON
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredResources.length === 0}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Exporter CSV
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-10 mb-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-2xl">
              ➕
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Ajouter une Ressource
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-white/5">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-slate-200 dark:bg-white/10"></span>
                Détails de la Ressource
                <span className="flex-1 h-px bg-slate-200 dark:bg-white/10"></span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {[
                  { label: 'Spécialité *', value: formData.speciality || 'Médecine', options: ['Médecine', 'Pharmacie', 'Dentaire'], onChange: (v: string) => setFormData({ ...formData, speciality: v as any }), required: true },
                  { label: 'Année d\'Étude *', value: formData.year, options: YEARS.map(y => ({ value: y.value, label: y.label })), onChange: (v: string) => setFormData({ ...formData, year: v as any, moduleId: '', subDisciplineId: undefined, unityName: undefined, moduleType: undefined }), required: true },
                ].map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      {item.label}
                    </label>
                    <select
                      value={item.value}
                      onChange={(e) => item.onChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                      required={item.required}
                    >
                      {Array.isArray(item.options) ? item.options.map((opt) => (
                        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value} className="bg-white dark:bg-slate-900">
                          {typeof opt === 'string' ? opt : opt.label}
                        </option>
                      )) : null}
                    </select>
                  </div>
                ))}

                {/* Module */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
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
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Sélectionner un module</option>
                    {availableModules.map((module) => (
                      <option key={module.name} value={module.name} className="bg-white dark:bg-slate-900">
                        {module.type === 'uei' ? '🟢 ' : module.type === 'standalone' ? '🟡 ' : '🔵 '}
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-discipline */}
                {availableSubDisciplines.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                      Sous-discipline
                    </label>
                    <select
                      value={formData.subDisciplineId || ''}
                      onChange={(e) => setFormData({ ...formData, subDisciplineId: e.target.value || undefined })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Aucune (optionnel)</option>
                      {availableSubDisciplines.map((subDisc) => (
                        <option key={subDisc} value={subDisc} className="bg-white dark:bg-slate-900">
                          {subDisc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Resource Type */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                    Type de Ressource *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                    required
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type.value} value={type.value} className="bg-white dark:bg-slate-900">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cours (Multiple) */}
              <div className="mt-8">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">
                  Cours associés *
                </label>
                <div className="space-y-4">
                  {(formData.cours || ['']).map((cours, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={cours}
                        onChange={(e) => updateCoursInput(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                        placeholder="Nom du cours"
                        required
                      />
                      {index === (formData.cours || []).length - 1 ? (
                        <button
                          type="button"
                          onClick={addCoursInput}
                          className="w-12 h-12 flex items-center justify-center bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                        >
                          ➕
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeCoursInput(index)}
                          className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all active:scale-95"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Title & URL & Description */}
              <div className="mt-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                    Titre de la Ressource *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                    placeholder="Ex: Cours Anatomie - Chapitre 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                    URL / Lien *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                    placeholder="https://drive.google.com/... ou https://t.me/..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all outline-none"
                    rows={3}
                    placeholder="Description de la ressource..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '⏳ Enregistrement...' : '✅ Enregistrer la Ressource'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold active:scale-95"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden mb-12">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Ressources <span className="text-primary-500 ml-2">({filteredResources.length})</span>
          </h2>
        </div>
        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Chargement des ressources...
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                {resources.length === 0 
                  ? 'Aucune ressource ajoutée.'
                  : 'Aucune ressource trouvée.'
                }
              </p>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                {resources.length === 0 ? 'Cliquez sur "Nouvelle Ressource" pour commencer.' : 'Essayez d\'ajuster vos filtres.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedResources.map((resource) => (
                  <div key={resource.id} className="group bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/20">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2 truncate group-hover:text-primary-500 transition-colors">
                          {resource.title}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-md uppercase tracking-widest leading-none">
                            {YEARS.find(y => y.value === resource.year)?.label}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md leading-none">
                            {resource.module_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      {resource.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {resource.description}
                        </p>
                      )}

                      {resource.cours && resource.cours.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {resource.cours.slice(0, 3).map((c: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-medium rounded-md">
                              {c}
                            </span>
                          ))}
                          {resource.cours.length > 3 && (
                            <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-medium rounded-md">
                              +{resource.cours.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {new Date(resource.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <div className="flex gap-2">
                          {(userRole === 'owner' || userRole === 'admin') && (
                            <button
                              onClick={() => deleteResourceHandler(resource.id)}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          )}
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                          >
                            Ouvrir
                          </a>
                        </div>
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
