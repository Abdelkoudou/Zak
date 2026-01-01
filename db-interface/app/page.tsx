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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#09B2AD] to-[#0A9B97] rounded-3xl p-8 text-white">
        <h2 className="text-white/80 font-medium text-lg">Bienvenue</h2>
        <h1 className="text-4xl font-black tracking-tight">Tableau de Bord</h1>
        <div className="inline-flex mt-4 px-4 py-2 bg-white/20 rounded-full font-semibold text-sm">
          FMC APP • Administration
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Modules', value: stats.totalModules, icon: '📚' },
          { label: 'Total Questions', value: stats.totalQuestions, icon: '❓' },
          { label: 'Ressources', value: stats.totalResources, icon: '📁' },
          { label: 'Chapitres', value: stats.totalChapters, icon: '📖' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-slate-500 dark:text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? '...' : item.value}
                </p>
              </div>
              <div className="text-2xl md:text-4xl filter drop-shadow-sm">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Statistics */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Questions by Year */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary-500 rounded-full"></span>
              Questions par Année
            </h2>
            {stats.questionsByYear.length > 0 ? (
              <div className="space-y-4">
                {stats.questionsByYear.map(({ year, count }) => (
                  <div key={year} className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {year === '1' ? '1ère Année' : year === '2' ? '2ème Année' : '3ème Année'}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Aucune question ajoutée</p>
            )}
          </div>

          {/* Resources by Type */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              Ressources par Type
            </h2>
            {stats.resourcesByType.length > 0 ? (
              <div className="space-y-4">
                {stats.resourcesByType.map(({ type, count }) => (
                  <div key={type} className="flex justify-between items-center group">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold group-hover:text-green-600 transition-colors">{getResourceTypeLabel(type)}</span>
                    <span className="font-black text-slate-900 dark:text-white px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Aucune ressource ajoutée</p>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Questions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">❓</span>
              Questions Récentes
            </h2>
            {stats.recentQuestions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentQuestions.map((q) => (
                  <div key={q.id} className="group p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-transparent hover:border-blue-500/30 transition-all">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                      <span>{q.year === '1' ? '1ère' : q.year === '2' ? '2ème' : '3ème'} Année</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span className="text-blue-500/80">{q.module_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Aucune question récente</p>
            )}
          </div>

          {/* Recent Resources */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">📁</span>
              Ressources Récentes
            </h2>
            {stats.recentResources.length > 0 ? (
              <div className="space-y-4">
                {stats.recentResources.map((r) => (
                  <div key={r.id} className="group p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-transparent hover:border-green-500/30 transition-all">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">{r.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                      <span className="text-green-500/80">{getResourceTypeLabel(r.type)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span>{r.year === '1' ? '1ère' : r.year === '2' ? '2ème' : '3ème'} Année</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Aucune ressource récente</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions & Curriculum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { href: '/modules', icon: '📚', title: 'Modules', desc: 'Curriculum' },
              { href: '/questions', icon: '➕', title: 'Question', desc: 'Nouveau QCM' },
              { href: '/resources', icon: '🔗', title: 'Ressource', desc: 'Nouveau Lien' },
              { href: '/history', icon: '📜', title: 'Historique', desc: 'Liste QCM' },
            ].map((action, idx) => (
              <a
                key={idx}
                href={action.href}
                className="group flex flex-col p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-transparent hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
              >
                <span className="text-3xl mb-3 transition-transform group-hover:scale-110 group-hover:-rotate-3">{action.icon}</span>
                <p className="font-bold text-slate-900 dark:text-white leading-tight">{action.title}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-1">{action.desc}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Structure Curriculum</h2>
          <div className="space-y-6">
            {[
              { year: '1ère Année', desc: '6 Modules Annuels + 4 Semestriels', count: stats.questionsByYear.find((y) => y.year === '1')?.count || 0 },
              { year: '2ème Année', desc: '5 U.E.I + 2 Modules Autonomes', count: stats.questionsByYear.find((y) => y.year === '2')?.count || 0 },
              { year: '3ème Année', desc: 'Structure unifiée', count: stats.questionsByYear.find((y) => y.year === '3')?.count || 0 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-1.5 h-12 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="w-full h-1/2 bg-primary-500"></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">{item.year}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-lg border border-primary-100 dark:border-primary-900/50">
                      {item.count} Questions
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
