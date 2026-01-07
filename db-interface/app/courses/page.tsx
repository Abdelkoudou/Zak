'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { PREDEFINED_MODULES, PREDEFINED_SUBDISCIPLINES } from '@/lib/predefined-modules';

interface Course {
  id: string;
  name: string;
  module_name: string;
  sub_discipline: string | null;
  year: string;
  speciality: string;
}

export default function CoursesPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('');
  const [selectedSubDisciplineFilter, setSelectedSubDisciplineFilter] = useState('');

  const [formData, setFormData] = useState({
    speciality: 'Médecine',
    year: '1',
    module_name: '',
    sub_discipline: '',
    name: ''
  });

  // Get modules for selected year
  const availableModules = useMemo(() => {
    return PREDEFINED_MODULES.filter(m => m.year === formData.year);
  }, [formData.year]);

  // Get selected module details
  const selectedModuleDetails = useMemo(() => {
    return availableModules.find(m => m.name === formData.module_name);
  }, [availableModules, formData.module_name]);

  // Get sub-disciplines if module has them
  const availableSubDisciplines = useMemo(() => {
    if (selectedModuleDetails?.hasSubDisciplines && selectedModuleDetails.name) {
      return PREDEFINED_SUBDISCIPLINES[selectedModuleDetails.name] || [];
    }
    return [];
  }, [selectedModuleDetails]);

  // Get all unique modules from courses for filter
  const allModulesInCourses = useMemo(() => {
    const moduleNames = new Set(courses.map(c => c.module_name));
    return Array.from(moduleNames).sort();
  }, [courses]);

  // Get all unique sub-disciplines from courses for filter
  const allSubDisciplinesInCourses = useMemo(() => {
    const subDisciplines = new Set(courses.filter(c => c.sub_discipline).map(c => c.sub_discipline));
    return Array.from(subDisciplines).sort() as string[];
  }, [courses]);

  const fetchCourses = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(data || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = 
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.module_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesYear = selectedYearFilter ? course.year === selectedYearFilter : true;
      const matchesModule = selectedModuleFilter ? course.module_name === selectedModuleFilter : true;
      const matchesSubDiscipline = selectedSubDisciplineFilter ? course.sub_discipline === selectedSubDisciplineFilter : true;

      return matchesSearch && matchesYear && matchesModule && matchesSubDiscipline;
    });
  }, [courses, searchQuery, selectedYearFilter, selectedModuleFilter, selectedSubDisciplineFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // Update existing course
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            speciality: formData.speciality,
            year: formData.year,
            module_name: formData.module_name,
            sub_discipline: formData.sub_discipline || null,
            name: formData.name.trim()
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
        setSuccess('Course updated successfully!');
        setEditingId(null);
      } else {
        // Insert new course
        const { error: insertError } = await supabase
          .from('courses')
          .insert([{
            speciality: formData.speciality,
            year: formData.year,
            module_name: formData.module_name,
            sub_discipline: formData.sub_discipline || null,
            name: formData.name.trim()
          }]);

        if (insertError) throw insertError;
        setSuccess('Course added successfully!');
      }

      // Reset form if just added, or clear edit mode
      if (!editingId) {
        setFormData(prev => ({ ...prev, name: '' }));
      } else {
        resetForm();
      }
      
      fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('Course deleted successfully!');
      fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete course');
    }
  };

  const handleEdit = (course: Course) => {
    setFormData({
      speciality: course.speciality,
      year: course.year,
      module_name: course.module_name,
      sub_discipline: course.sub_discipline || '',
      name: course.name
    });
    setEditingId(course.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      speciality: 'Médecine',
      year: '1',
      module_name: '',
      sub_discipline: '',
      name: ''
    });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 md:mb-2">
            Course Management
          </h1>
          <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Catalogue & Configuration • FMC APP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Form Section - Order 2 on mobile (below list) or 1 (above list)? Usually form first implies creating content. */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl md:shadow-2xl p-5 md:p-8 relative overflow-hidden lg:sticky lg:top-8">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>
            
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl ${editingId ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'} dark:bg-white/5 text-sm md:text-base`}>
                {editingId ? "✏️" : "✨"}
              </span>
              {editingId ? 'Modifier le Cours' : 'Ajouter un Cours'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-xs md:text-sm font-medium">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl text-xs md:text-sm font-medium">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Année</label>
                      <select
                        value={formData.year}
                        onChange={e => setFormData({ ...formData, year: e.target.value, module_name: '', sub_discipline: '' })}
                        className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-sm"
                      >
                        {[1, 2, 3, 4, 5].map(y => (
                          <option key={y} value={y}>{y}{y === 1 ? 'er' : 'ème'} Année</option>
                        ))}
                      </select>
                    </div>
                    <div>
                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Spécialité</label>
                         <input
                            type="text"
                            value={formData.speciality}
                            readOnly
                            className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-500 cursor-not-allowed font-medium text-sm"
                          />
                    </div>
                 </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Module</label>
                  <select
                    value={formData.module_name}
                    onChange={e => setFormData({ ...formData, module_name: e.target.value, sub_discipline: '' })}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-sm"
                    required
                  >
                    <option value="">Sélectionner un module</option>
                    {availableModules.map(mod => (
                      <option key={mod.name} value={mod.name}>
                        {mod.type === 'uei' && '🟢 UEI: '}
                        {mod.type === 'standalone' && '🟡 '}
                        {mod.type === 'annual' && '🔵 '}
                        {mod.type === 'semestrial' && '🔵 '}
                        {mod.name}
                      </option>
                    ))}
                  </select>
                  {selectedModuleDetails && (
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1.5 ml-1">
                      {selectedModuleDetails.type === 'uei' && '🟢 Unité d\'Enseignement Intégré (UEI)'}
                      {selectedModuleDetails.type === 'standalone' && '🟡 Module Autonome'}
                      {selectedModuleDetails.type === 'annual' && '🔵 Module Annuel'}
                      {selectedModuleDetails.type === 'semestrial' && '🔵 Module Semestriel'}
                    </p>
                  )}
                </div>

                {availableSubDisciplines.length > 0 && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Sous-Discipline <span className="text-slate-300 font-normal normal-case tracking-normal">(Optionnel)</span>
                    </label>
                    <select
                      value={formData.sub_discipline}
                      onChange={e => setFormData({ ...formData, sub_discipline: e.target.value })}
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-sm"
                    >
                      <option value="">Aucune</option>
                      {availableSubDisciplines.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nom du Cours</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 1- Introduction aux ..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium placeholder:text-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 md:pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 md:py-4 font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm md:text-base
                    ${editingId 
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25' 
                        : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/25'
                    }`}
                >
                  {loading ? 'Sauvegarde...' : (editingId ? 'Mettre à jour' : 'Ajouter le Cours')}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 md:px-6 py-3 md:py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 text-sm md:text-base"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Course List */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
            {/* Search Bar */}
            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                {/* Search Bar */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-2 py-1 border border-slate-100 dark:border-white/5">
                    <div className="pl-2 text-slate-400 text-lg">🔍</div>
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        className="flex-1 bg-transparent border-none outline-none py-2 px-2 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <select
                        value={selectedYearFilter}
                        onChange={e => setSelectedYearFilter(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    >
                        <option value="">Toutes les années</option>
                        {[1, 2, 3, 4, 5].map(y => (
                            <option key={y} value={y}>{y}{y === 1 ? 'er' : 'ème'} Année</option>
                        ))}
                    </select>

                    <select
                        value={selectedModuleFilter}
                        onChange={e => setSelectedModuleFilter(e.target.value)}
                        className="flex-[2] px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    >
                        <option value="">Tous les modules</option>
                        {allModulesInCourses.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSubDisciplineFilter}
                        onChange={e => setSelectedSubDisciplineFilter(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    >
                        <option value="">Toute sous-discipline</option>
                        {allSubDisciplinesInCourses.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
              <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">Liste des Cours</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 md:mt-1">Gérez votre catalogue</p>
              </div>
              <span className="text-[10px] md:text-xs font-bold bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
                {filteredCourses.length} cours
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {fetching ? (
                <div className="p-8 md:p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading courses...
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="p-12 md:p-16 text-center text-slate-400">
                    <div className="text-3xl md:text-4xl mb-3">📭</div>
                    Aucun cours trouvé.
                </div>
              ) : (
                <div className="min-w-[600px] md:min-w-0">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3 md:px-8 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Cours</th>
                        <th className="px-5 py-3 md:px-8 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Module</th>
                        <th className="px-5 py-3 md:px-8 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredCourses.map(course => (
                        <tr key={course.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 md:px-8 md:py-5">
                            <div className="font-bold text-sm md:text-base text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 md:line-clamp-none">
                              {course.name}
                            </div>
                            {course.sub_discipline && (
                              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  🔹 {course.sub_discipline}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 md:px-8 md:py-5">
                            <div className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg w-fit border border-slate-200 dark:border-white/5">
                              {course.module_name}
                            </div>
                            <div className="text-[9px] md:text-[10px] font-semibold text-slate-400 mt-1.5 ml-1">
                              {course.year}{course.year === '1' ? 'er' : 'ème'} Année
                            </div>
                          </td>
                          <td className="px-5 py-3 md:px-8 md:py-5 text-right w-24 md:w-auto">
                            <div className="flex justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(course)}
                                  className="p-1.5 md:p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                                  title="Modifier"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(course.id, course.name)}
                                  className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                  title="Supprimer"
                                >
                                  🗑️
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
