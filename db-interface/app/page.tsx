'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PREDEFINED_MODULES } from '@/lib/predefined-modules';

interface Stats {
  totalModules: number;
  totalQuestions: number;
  totalResources: number;
  totalChapters: number;
  questionsByYear: { year: string; count: number }[];
  resourcesByType: { type: string; count: number }[];
  recentQuestions: any[];
  recentResources: any[];
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalModules: PREDEFINED_MODULES.length,
    totalQuestions: 0,
    totalResources: 0,
    totalChapters: 0,
    questionsByYear: [],
    resourcesByType: [],
    recentQuestions: [],
    recentResources: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get total questions
      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Get total resources
      const { count: resourcesCount } = await supabase
        .from('course_resources')
        .select('*', { count: 'exact', head: true });

      // Get questions by year
      const { data: questions } = await supabase
        .from('questions')
        .select('year');

      const questionsByYear = questions
        ? Object.entries(
            questions.reduce((acc: any, q) => {
              acc[q.year] = (acc[q.year] || 0) + 1;
              return acc;
            }, {})
          ).map(([year, count]) => ({ year, count: count as number }))
        : [];

      // Get resources by type
      const { data: resources } = await supabase
        .from('course_resources')
        .select('type');

      const resourcesByType = resources
        ? Object.entries(
            resources.reduce((acc: any, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            }, {})
          ).map(([type, count]) => ({ type, count: count as number }))
        : [];

      // Get unique chapters from resources
      const { data: coursData } = await supabase
        .from('course_resources')
        .select('cours');

      const allCours = new Set<string>();
      coursData?.forEach((r) => {
        if (r.cours && Array.isArray(r.cours)) {
          r.cours.forEach((c: string) => allCours.add(c));
        }
      });

      // Get recent questions
      const { data: recentQuestions } = await supabase
        .from('questions')
        .select('id, question_text, year, module_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent resources
      const { data: recentResources } = await supabase
        .from('course_resources')
        .select('id, title, type, year, module_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalModules: PREDEFINED_MODULES.length,
        totalQuestions: questionsCount || 0,
        totalResources: resourcesCount || 0,
        totalChapters: allCours.size,
        questionsByYear,
        resourcesByType,
        recentQuestions: recentQuestions || [],
        recentResources: recentResources || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      google_drive: 'Google Drive',
      telegram: 'Telegram',
      youtube: 'YouTube',
      pdf: 'PDF',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
        Tableau de Bord
      </h1>
      <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
        Interface d&apos;administration pour l&apos;application MCQ Study
      </p>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Modules</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.totalModules}
              </p>
            </div>
            <div className="text-2xl md:text-4xl">📚</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Questions</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.totalQuestions}
              </p>
            </div>
            <div className="text-2xl md:text-4xl">❓</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Ressources</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.totalResources}
              </p>
            </div>
            <div className="text-2xl md:text-4xl">📁</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Chapitres</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.totalChapters}
              </p>
            </div>
            <div className="text-2xl md:text-4xl">📖</div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Questions by Year */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Questions par Année</h2>
            {stats.questionsByYear.length > 0 ? (
              <div className="space-y-3">
                {stats.questionsByYear.map(({ year, count }) => (
                  <div key={year} className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {year === '1' ? '1ère Année' : year === '2' ? '2ème Année' : '3ème Année'}
                    </span>
                    <span className="font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune question ajoutée</p>
            )}
          </div>

          {/* Resources by Type */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Ressources par Type</h2>
            {stats.resourcesByType.length > 0 ? (
              <div className="space-y-3">
                {stats.resourcesByType.map(({ type, count }) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-700">{getResourceTypeLabel(type)}</span>
                    <span className="font-bold text-green-600">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune ressource ajoutée</p>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Recent Questions */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Questions Récentes</h2>
            {stats.recentQuestions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentQuestions.map((q) => (
                  <div key={q.id} className="border-l-4 border-blue-500 pl-3 py-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {q.question_text}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {q.year === '1' ? '1ère' : q.year === '2' ? '2ème' : '3ème'} Année
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{q.module_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune question récente</p>
            )}
          </div>

          {/* Recent Resources */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Ressources Récentes</h2>
            {stats.recentResources.length > 0 ? (
              <div className="space-y-3">
                {stats.recentResources.map((r) => (
                  <div key={r.id} className="border-l-4 border-green-500 pl-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {getResourceTypeLabel(r.type)}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {r.year === '1' ? '1ère' : r.year === '2' ? '2ème' : '3ème'} Année
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune ressource récente</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Actions Rapides</h2>
          <div className="space-y-2 md:space-y-3">
            <a
              href="/modules"
              className="block p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl">📚</span>
                <div>
                  <p className="font-medium text-sm md:text-base">Voir les Modules</p>
                  <p className="text-xs md:text-sm text-gray-500">Consulter les modules du curriculum</p>
                </div>
              </div>
            </a>

            <a
              href="/questions"
              className="block p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl">➕</span>
                <div>
                  <p className="font-medium text-sm md:text-base">Ajouter une Question</p>
                  <p className="text-xs md:text-sm text-gray-500">Créer un nouveau QCM</p>
                </div>
              </div>
            </a>

            <a
              href="/resources"
              className="block p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl">➕</span>
                <div>
                  <p className="font-medium text-sm md:text-base">Ajouter une Ressource</p>
                  <p className="text-xs md:text-sm text-gray-500">Ajouter un lien Google Drive, Telegram, etc.</p>
                </div>
              </div>
            </a>

            <a
              href="/history"
              className="block p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl">📊</span>
                <div>
                  <p className="font-medium text-sm md:text-base">Voir l&apos;Historique</p>
                  <p className="text-xs md:text-sm text-gray-500">Consulter toutes les questions</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Structure du Curriculum</h2>
          <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
            <div>
              <p className="font-medium text-gray-900">1ère Année</p>
              <p className="text-gray-600">6 Modules Annuels + 4 Modules Semestriels</p>
              <p className="text-gray-500 text-xs mt-1">
                {stats.questionsByYear.find((y) => y.year === '1')?.count || 0} questions
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">2ème Année</p>
              <p className="text-gray-600">5 U.E.I + 2 Modules Autonomes</p>
              <p className="text-gray-500 text-xs mt-1">
                {stats.questionsByYear.find((y) => y.year === '2')?.count || 0} questions
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">3ème Année</p>
              <p className="text-gray-600">Structure similaire à la 2ème année</p>
              <p className="text-gray-500 text-xs mt-1">
                {stats.questionsByYear.find((y) => y.year === '3')?.count || 0} questions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
