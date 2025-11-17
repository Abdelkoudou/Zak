'use client';

import { useState } from 'react';
import { CourseResource, CourseResourceFormData } from '@/types/database';
import { YEARS, RESOURCE_TYPES } from '@/lib/constants';

export default function ResourcesPage() {
  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [formData, setFormData] = useState<CourseResourceFormData>({
    year: '1',
    moduleId: '',
    title: '',
    type: 'google_drive',
    url: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newResource: CourseResource = {
      id: Date.now().toString(),
      year: formData.year,
      moduleId: formData.moduleId,
      subDisciplineId: formData.subDisciplineId,
      title: formData.title,
      type: formData.type,
      url: formData.url,
      description: formData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setResources([...resources, newResource]);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      year: '1',
      moduleId: '',
      title: '',
      type: 'google_drive',
      url: '',
    });
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ressources</h1>
          <p className="text-gray-600">Gérer les ressources de cours (Google Drive, Telegram, etc.)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annuler' : '➕ Nouvelle Ressource'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Ajouter une Ressource</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value as any })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de Ressource
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <input
                type="text"
                value={formData.moduleId}
                onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Sélectionner un module..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: Ceci sera remplacé par un sélecteur de modules
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Cours Anatomie - Chapitre 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL / Lien
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://drive.google.com/... ou https://t.me/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Description de la ressource..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Liste des Ressources</h2>
        </div>
        <div className="p-6">
          {resources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune ressource ajoutée. Cliquez sur &quot;Nouvelle Ressource&quot; pour commencer.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {YEARS.find((y) => y.value === resource.year)?.label}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {RESOURCE_TYPES.find((t) => t.value === resource.type)?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 text-sm text-center bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Ouvrir
                    </a>
                    <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                      Modifier
                    </button>
                    <button className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                      ✕
                    </button>
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
