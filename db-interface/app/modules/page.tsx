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
            examTypes: ['M1', 'M2', 'M3', 'M4'],
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Modules du Curriculum</h1>
        <p className="text-gray-600">
          Modules prédéfinis selon le curriculum médical français (Algérie)
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Modules</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">1ère Année</p>
          <p className="text-3xl font-bold text-blue-600">{stats.year1}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">2ème Année</p>
          <p className="text-3xl font-bold text-green-600">{stats.year2}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">U.E.I</p>
          <p className="text-3xl font-bold text-purple-600">{stats.uei}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les années</option>
              {YEARS.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Module
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              {MODULE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-medium text-blue-900">Modules Prédéfinis</p>
            <p className="text-sm text-blue-700 mt-1">
              Ces modules sont définis par le curriculum médical français et ne peuvent pas être modifiés.
              Vous pouvez ajouter des questions et des ressources pour chaque module.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Liste des Modules ({filteredModules.length})
          </h2>
        </div>
        <div className="p-6">
          {filteredModules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun module trouvé avec ces filtres.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{module.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {YEARS.find((y) => y.value === module.year)?.label}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {MODULE_TYPES.find((t) => t.value === module.type)?.label}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Types d&apos;examens:</p>
                        <div className="flex flex-wrap gap-2">
                          {module.examTypes.map((examType) => (
                            <span
                              key={examType}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium"
                            >
                              {examType}
                            </span>
                          ))}
                        </div>
                      </div>

                      {module.subDisciplines && module.subDisciplines.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Sous-disciplines ({module.subDisciplines.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {module.subDisciplines.map((sd) => (
                              <span
                                key={sd.id}
                                className="px-2 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded"
                              >
                                {sd.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap">
                        📝 Voir Questions
                      </button>
                      <button className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap">
                        📁 Voir Ressources
                      </button>
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
