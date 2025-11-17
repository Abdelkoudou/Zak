'use client';

import { useState } from 'react';

export default function ImportExportPage() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportStatus('');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImportStatus('Importation en cours...');

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      // Validate and process the data
      console.log('Imported data:', data);

      setImportStatus(`✅ Importation réussie! ${data.length || 0} éléments importés.`);
      setImportFile(null);
    } catch (error) {
      setImportStatus(`❌ Erreur: ${error instanceof Error ? error.message : 'Format invalide'}`);
    }
  };

  const handleExport = (type: 'modules' | 'questions' | 'resources' | 'all') => {
    // Mock data for export
    const data = {
      exportDate: new Date().toISOString(),
      type,
      data: [],
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${type}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Import / Export</h1>
      <p className="text-gray-600 mb-8">
        Importer et exporter des données en format JSON
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">📥 Importer des Données</h2>
          <p className="text-gray-600 mb-6">
            Importez des questions, modules ou ressources depuis un fichier JSON
          </p>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-sm text-gray-500">Format JSON uniquement</p>
              </label>
            </div>

            {importFile && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Fichier sélectionné:
                </p>
                <p className="text-sm text-gray-700">{importFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Taille: {(importFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            {importStatus && (
              <div
                className={`p-4 rounded-lg ${
                  importStatus.startsWith('✅')
                    ? 'bg-green-50 text-green-700'
                    : importStatus.startsWith('❌')
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {importStatus}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!importFile}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Importer
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Format JSON attendu:</h3>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "questions": [
    {
      "year": "1",
      "moduleId": "...",
      "examType": "EMD1",
      "number": 1,
      "questionText": "...",
      "answers": [
        {
          "optionLabel": "A",
          "answerText": "...",
          "isCorrect": true
        }
      ]
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">📤 Exporter des Données</h2>
          <p className="text-gray-600 mb-6">
            Exportez vos données en format JSON pour sauvegarde ou migration
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleExport('modules')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">📚</div>
                <div>
                  <p className="font-semibold text-gray-900">Exporter les Modules</p>
                  <p className="text-sm text-gray-600">
                    Tous les modules et sous-disciplines
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('questions')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">❓</div>
                <div>
                  <p className="font-semibold text-gray-900">Exporter les Questions</p>
                  <p className="text-sm text-gray-600">
                    Toutes les questions avec leurs réponses
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('resources')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">📁</div>
                <div>
                  <p className="font-semibold text-gray-900">Exporter les Ressources</p>
                  <p className="text-sm text-gray-600">
                    Tous les liens et ressources de cours
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('all')}
              className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="text-2xl">💾</div>
                <div>
                  <p className="font-semibold">Exporter Tout</p>
                  <p className="text-sm opacity-90">
                    Export complet de la base de données
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">⚠️ Note:</span> Les exports sont en format JSON.
              Conservez-les en lieu sûr pour pouvoir restaurer vos données si nécessaire.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Import Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">🔄 Import en Masse</h2>
        <p className="text-gray-600 mb-6">
          Importez plusieurs fichiers JSON en une seule fois
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">1. Préparer les fichiers</h3>
            <p className="text-sm text-gray-600">
              Organisez vos fichiers JSON par type (modules, questions, ressources)
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">2. Valider le format</h3>
            <p className="text-sm text-gray-600">
              Assurez-vous que chaque fichier respecte le format JSON attendu
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">3. Importer</h3>
            <p className="text-sm text-gray-600">
              Utilisez la section d&apos;import ci-dessus pour chaque fichier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
