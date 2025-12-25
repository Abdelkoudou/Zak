'use client';

import { useState, useMemo } from 'react';
import { Module } from '@/types/database';
import { YEARS, MODULE_TYPES } from '@/lib/constants';
import { PREDEFINED_MODULES, PREDEFINED_SUBDISCIPLINES } from '@/lib/predefined-modules';

export default function ModulesPage() {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Convert predefined modules to full Module objects with IDs
  const modules: Module[] = useMemo(() => {
    return PREDEFINED_MODULES.map((module, index) => ({
      ...module,
      id: `module-${index}`,
      subDisciplines: module.hasSubDisciplines
        ? PREDEFINED_SUBDISCIPLINES[module.name]?.map((subName, subIndex) => ({
            id: `subdiscipline-${index}-${subIndex}`,
            moduleId: `module-${index}`,
            name: subName,
            examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }, []);

  // Filter modules based on selection
  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      if (selectedYear !== 'all' && module.year !== selectedYear) return false;
      if (selectedType !== 'all' && module.type !== selectedType) return false;
      return true;
    });
  }, [modules, selectedYear, selectedType]);

  // Get statistics
  const stats = useMemo(() => {
    return {
      total: modules.length,
      year1: modules.filter((m) => m.year === '1').length,
      year2: modules.filter((m) => m.year === '2').length,
      uei: modules.filter((m) => m.type === 'uei').length,
    };
  }, [modules]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 md:mb-2">
            Modules du Curriculum
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Curriculum médical français (Algérie) • FMC APP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Modules', value: stats.total, icon: '📚', color: 'primary' },
          { label: '1ère Année', value: stats.year1, icon: '🎓', color: 'blue' },
          { label: '2ème Année', value: stats.year2, icon: '🏛️', color: 'green' },
          { label: 'U.E.I', value: stats.uei, icon: '🧬', color: 'purple' },
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
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">🔍</span>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filtres</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Année', value: selectedYear, onChange: (v: string) => setSelectedYear(v), options: [{ value: 'all', label: 'Toutes les années' }, ...YEARS.map(y => ({ value: y.value, label: y.label }))] },
            { label: 'Type de Module', value: selectedType, onChange: (v: string) => setSelectedType(v), options: [{ value: 'all', label: 'Tous les types' }, ...MODULE_TYPES.map(t => ({ value: t.value, label: t.label }))] },
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
                {item.options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 rounded-3xl p-5 mb-8">
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm font-black text-primary-900 dark:text-primary-100 uppercase tracking-widest mb-1">Modules Prédéfinis</p>
            <p className="text-xs text-primary-700/80 dark:text-primary-300/80 font-medium leading-relaxed">
              Ces modules sont définis par le curriculum médical et ne peuvent pas être modifiés. 
              Vous pouvez associer des questions et des ressources à chaque module en utilisant les boutons d&apos;action.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden mb-12">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Modules <span className="text-primary-500 ml-2">({filteredModules.length})</span>
          </h2>
        </div>
        <div className="p-6 md:p-8">
          {filteredModules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun module trouvé avec ces filtres.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((module) => (
                <div key={module.id} className="group border border-slate-100 dark:border-white/5 rounded-3xl p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">{module.name}</h3>
                        <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-md uppercase tracking-widest leading-none">
                          {YEARS.find((y) => y.value === module.year)?.label}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md leading-none">
                          {MODULE_TYPES.find((t) => t.value === module.type)?.label}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Examens:</p>
                        <div className="flex flex-wrap gap-2">
                          {module.examTypes.map((examType) => (
                            <span
                              key={examType}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg"
                            >
                              {examType}
                            </span>
                          ))}
                        </div>
                      </div>

                      {module.subDisciplines && module.subDisciplines.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                            Sous-disciplines ({module.subDisciplines.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {module.subDisciplines.map((sd) => (
                              <span
                                key={sd.id}
                                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg"
                              >
                                {sd.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-3">
                      <a
                        href={`/questions?year=${module.year}&module=${encodeURIComponent(module.name)}`}
                        className="flex-1 px-4 py-3 bg-primary-600 text-white text-[10px] font-black rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95 text-center uppercase tracking-widest whitespace-nowrap"
                      >
                        📝 Questions
                      </a>
                      <a
                        href={`/resources?year=${module.year}&module=${encodeURIComponent(module.name)}`}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-black text-[10px] active:scale-95 text-center uppercase tracking-widest whitespace-nowrap"
                      >
                        📁 Ressources
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
