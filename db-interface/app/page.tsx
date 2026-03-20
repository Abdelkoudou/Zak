"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PREDEFINED_MODULES } from "@/lib/predefined-modules";

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
        .from("questions")
        .select("*", { count: "exact", head: true });

      // Get total resources
      const { count: resourcesCount } = await supabase
        .from("course_resources")
        .select("*", { count: "exact", head: true });

      // Get questions by year using exact counts (bypasses Supabase 1000 row limit)
      const [year1Result, year2Result, year3Result] = await Promise.all([
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("year", "1"),
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("year", "2"),
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("year", "3"),
      ]);

      const questionsByYear = [
        { year: "1", count: year1Result.count || 0 },
        { year: "2", count: year2Result.count || 0 },
        { year: "3", count: year3Result.count || 0 },
      ].filter((y) => y.count > 0);

      // Get resources by type
      const { data: resources } = await supabase
        .from("course_resources")
        .select("type");

      const resourcesByType = resources
        ? Object.entries(
            resources.reduce((acc: any, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            }, {}),
          ).map(([type, count]) => ({ type, count: count as number }))
        : [];

      // Get unique chapters from resources
      const { data: coursData } = await supabase
        .from("course_resources")
        .select("cours");

      const allCours = new Set<string>();
      coursData?.forEach((r) => {
        if (r.cours && Array.isArray(r.cours)) {
          r.cours.forEach((c: string) => allCours.add(c));
        }
      });

      // Get recent questions
      const { data: recentQuestions } = await supabase
        .from("questions")
        .select("id, question_text, year, module_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get recent resources
      const { data: recentResources } = await supabase
        .from("course_resources")
        .select("id, title, type, year, module_name, created_at")
        .order("created_at", { ascending: false })
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
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      google_drive: "Google Drive",
      telegram: "Telegram",
      youtube: "YouTube",
      pdf: "PDF",
      other: "Autre",
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-body">
      {/* Header Banner - Elegant & Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#09b2ac] via-[#0d9488] to-[#262626] rounded-[2rem] p-10 text-white flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-[#9941ff]/20 rounded-full blur-[80px] -mb-20 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-white/90 font-medium text-lg uppercase tracking-[0.2em] font-heading">
            Bienvenue
          </h2>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight drop-shadow-sm">
            Tableau de Bord
          </h1>
          <div className="inline-flex items-center gap-3 mt-4 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full font-semibold text-sm border border-white/20 shadow-inner w-max">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f8f2e8] shadow-[0_0_10px_rgba(248,242,232,0.8)] animate-pulse"></span>
            FMC APP • Administration
          </div>
        </div>
      </div>

      {/* Main Statistics - Glassmorphic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Modules", value: stats.totalModules, icon: "📚", color: "text-[#09b2ac]", bg: "bg-[#09b2ac]/10" },
          { label: "Total Questions", value: stats.totalQuestions, icon: "❓", color: "text-[#9941ff]", bg: "bg-[#9941ff]/10" },
          { label: "Ressources", value: stats.totalResources, icon: "📁", color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Chapitres", value: stats.totalChapters, icon: "📖", color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="group relative bg-theme-card rounded-3xl p-6 border border-theme shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute -right-6 -top-6 w-32 h-32 ${item.bg} rounded-full blur-3xl group-hover:bg-opacity-50 transition-colors duration-500`}></div>
            <div className="relative flex flex-col gap-5">
              <div className={`w-14 h-14 flex items-center justify-center rounded-2xl ${item.bg} ${item.color} text-2xl shadow-sm border border-theme/30`}>
                {item.icon}
              </div>
              <div>
                <p className="text-theme-muted text-xs font-bold uppercase tracking-widest mb-1.5 font-heading">
                  {item.label}
                </p>
                <p className="text-4xl font-black text-theme-main font-heading tracking-tight">
                  {loading ? (
                    <span className="w-16 h-8 bg-theme-secondary rounded animate-pulse inline-block"></span>
                  ) : (
                    item.value
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Statistics Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Questions by Year */}
          <div className="bg-theme-card rounded-[2rem] p-8 border border-theme shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-theme-main mb-8 flex items-center gap-3 font-heading">
              <span className="w-2 h-8 bg-gradient-to-b from-[#09b2ac] to-[#0d9488] rounded-full shadow-sm"></span>
              Questions par Année
            </h2>
            {stats.questionsByYear.length > 0 ? (
              <div className="space-y-3">
                {stats.questionsByYear.map(({ year, count }) => (
                  <div key={year} className="flex justify-between items-center group p-4 hover:bg-theme-secondary rounded-2xl transition-colors border border-transparent hover:border-theme">
                    <span className="text-theme-secondary font-semibold group-hover:text-[#09b2ac] transition-colors">
                      {year === "1" ? "1ère Année" : year === "2" ? "2ème Année" : "3ème Année"}
                    </span>
                    <span className="font-extrabold text-theme-main px-4 py-1.5 bg-theme-card rounded-xl border border-theme shadow-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-theme-muted italic">
                <span className="text-4xl mb-3 opacity-40">📂</span>
                Aucune question ajoutée
              </div>
            )}
          </div>

          {/* Resources by Type */}
          <div className="bg-theme-card rounded-[2rem] p-8 border border-theme shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-theme-main mb-8 flex items-center gap-3 font-heading">
              <span className="w-2 h-8 bg-gradient-to-b from-[#9941ff] to-[#7d1cff] rounded-full shadow-sm"></span>
              Ressources par Type
            </h2>
            {stats.resourcesByType.length > 0 ? (
              <div className="space-y-3">
                {stats.resourcesByType.map(({ type, count }) => (
                  <div key={type} className="flex justify-between items-center group p-4 hover:bg-theme-secondary rounded-2xl transition-colors border border-transparent hover:border-theme">
                    <span className="text-theme-secondary font-semibold group-hover:text-[#9941ff] transition-colors">
                      {getResourceTypeLabel(type)}
                    </span>
                    <span className="font-extrabold text-theme-main px-4 py-1.5 bg-theme-card rounded-xl border border-theme shadow-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-theme-muted italic">
                <span className="text-4xl mb-3 opacity-40">📄</span>
                Aucune ressource ajoutée
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Questions */}
          <div className="bg-theme-card rounded-[2rem] p-8 border border-theme shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-theme-main flex items-center gap-3 font-heading">
                <div className="w-10 h-10 rounded-xl bg-[#09b2ac]/10 flex items-center justify-center text-[#09b2ac]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                Questions Récentes
              </h2>
            </div>
            {stats.recentQuestions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentQuestions.map((q) => (
                  <div key={q.id} className="group p-5 bg-theme-secondary rounded-2xl border border-transparent hover:border-[#09b2ac]/30 hover:shadow-sm transition-all">
                    <p className="text-sm font-semibold text-theme-main line-clamp-2 leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="flex items-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                      <span className="px-2.5 py-1 bg-theme-card rounded-lg shadow-sm border border-theme/50 text-theme-secondary">
                        {q.year === "1" ? "1ère" : q.year === "2" ? "2ème" : "3ème"} Année
                      </span>
                      <span className="text-[#09b2ac] bg-[#09b2ac]/10 px-2.5 py-1 rounded-lg">{q.module_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-muted text-sm italic">Aucune question récente</p>
            )}
          </div>

          {/* Recent Resources */}
          <div className="bg-theme-card rounded-[2rem] p-8 border border-theme shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-theme-main flex items-center gap-3 font-heading">
                <div className="w-10 h-10 rounded-xl bg-[#9941ff]/10 flex items-center justify-center text-[#9941ff]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                Ressources Récentes
              </h2>
            </div>
            {stats.recentResources.length > 0 ? (
              <div className="space-y-4">
                {stats.recentResources.map((r) => (
                  <div key={r.id} className="group p-5 bg-theme-secondary rounded-2xl border border-transparent hover:border-[#9941ff]/30 hover:shadow-sm transition-all">
                    <p className="text-sm font-semibold text-theme-main uppercase tracking-tight">
                      {r.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                      <span className="text-[#9941ff] bg-[#9941ff]/10 px-2.5 py-1 rounded-lg">
                        {getResourceTypeLabel(r.type)}
                      </span>
                      <span className="px-2.5 py-1 bg-theme-card rounded-lg shadow-sm border border-theme/50 text-theme-secondary">
                        {r.year === "1" ? "1ère" : r.year === "2" ? "2ème" : "3ème"} Année
                      </span>
                      {r.module_name && (
                        <span className="text-theme-secondary bg-theme-card px-2.5 py-1 rounded-lg border border-theme/50 line-clamp-1 max-w-[150px] truncate shadow-sm">
                          {r.module_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-muted text-sm italic">Aucune ressource récente</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions & Curriculum */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 bg-theme-card rounded-[2rem] p-8 border border-theme shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-theme-main mb-8 font-heading flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { href: "/modules", icon: "📚", title: "Modules", desc: "Curriculum", color: "from-[#09b2ac]/5 to-transparent", hoverColor: "group-hover:text-[#09b2ac]", borderColor: "hover:border-[#09b2ac]/30" },
              { href: "/questions", icon: "➕", title: "Question", desc: "Nouveau QCM", color: "from-blue-500/5 to-transparent", hoverColor: "group-hover:text-blue-500", borderColor: "hover:border-blue-500/30" },
              { href: "/resources", icon: "🔗", title: "Ressource", desc: "Nouveau Lien", color: "from-[#9941ff]/5 to-transparent", hoverColor: "group-hover:text-[#9941ff]", borderColor: "hover:border-[#9941ff]/30" },
              { href: "/history", icon: "📜", title: "Historique", desc: "Liste QCM", color: "from-orange-500/5 to-transparent", hoverColor: "group-hover:text-orange-500", borderColor: "hover:border-orange-500/30" },
            ].map((action, idx) => (
              <a
                key={idx}
                href={action.href}
                className={`group relative overflow-hidden flex items-center p-6 bg-theme-secondary rounded-2xl border border-theme/60 transition-all duration-300 hover:shadow-sm hover:-translate-y-1 ${action.borderColor}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} rounded-full blur-2xl opacity-80`}></div>
                <div className="relative z-10 flex items-center gap-5 w-full">
                  <div className={`w-14 h-14 bg-theme-card rounded-[1rem] shadow-sm border border-theme/50 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${action.hoverColor}`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-theme-main text-lg tracking-tight font-heading">
                      {action.title}
                    </h3>
                    <p className="text-xs font-semibold text-theme-muted uppercase tracking-widest mt-1">
                      {action.desc}
                    </p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-theme-muted group-hover:translate-x-1 duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-gradient-to-b from-[#262626] to-[#1a1a1a] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#09b2ac]/20 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
          <h2 className="text-xl font-bold text-white mb-8 font-heading flex items-center gap-3 relative z-10">
            <span className="text-2xl">🎓</span>
            Structure Curriculum
          </h2>
          <div className="space-y-7 relative z-10">
            {[
              { year: "1ère Année", desc: "6 Modules Annuels + 4 Semestriels", count: stats.questionsByYear.find((y) => y.year === "1")?.count || 0, color: "bg-[#09b2ac]" },
              { year: "2ème Année", desc: "5 U.E.I + 2 Modules Autonomes", count: stats.questionsByYear.find((y) => y.year === "2")?.count || 0, color: "bg-[#9941ff]" },
              { year: "3ème Année", desc: "Structure unifiée", count: stats.questionsByYear.find((y) => y.year === "3")?.count || 0, color: "bg-blue-500" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-5 group">
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-3.5 h-3.5 ${item.color} rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)] group-hover:scale-125 transition-transform duration-300 ring-4 ring-white/5`}></div>
                  {idx !== 2 && <div className="w-px h-16 bg-white/10 mt-2"></div>}
                </div>
                <div className="flex-1 pb-1">
                  <p className="font-bold text-white text-lg font-heading tracking-tight group-hover:text-white/90 transition-colors">{item.year}</p>
                  <p className="text-sm text-white/50 font-medium mt-1 mb-3 group-hover:text-white/70 transition-colors">
                    {item.desc}
                  </p>
                  <span className="px-3 py-1 bg-white/10 text-white/90 text-xs font-bold rounded-lg border border-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                    {item.count} Questions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
