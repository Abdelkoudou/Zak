export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Tableau de Bord
      </h1>
      <p className="text-gray-600 mb-8">
        Interface d'administration pour l'application MCQ Study
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Modules</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">❓</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ressources</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">📁</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Chapitres</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">📖</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
          <div className="space-y-3">
            <a
              href="/modules"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-medium">Voir les Modules</p>
                  <p className="text-sm text-gray-500">Consulter les modules du curriculum</p>
                </div>
              </div>
            </a>

            <a
              href="/questions"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium">Ajouter une Question</p>
                  <p className="text-sm text-gray-500">Créer un nouveau QCM</p>
                </div>
              </div>
            </a>

            <a
              href="/resources"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium">Ajouter une Ressource</p>
                  <p className="text-sm text-gray-500">Ajouter un lien Google Drive, Telegram, etc.</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Structure du Curriculum</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">1ère Année</p>
              <p className="text-gray-600">6 Modules Annuels + 4 Modules Semestriels</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">2ème Année</p>
              <p className="text-gray-600">5 U.E.I + 2 Modules Autonomes</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">3ème Année</p>
              <p className="text-gray-600">Structure similaire à la 2ème année</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
