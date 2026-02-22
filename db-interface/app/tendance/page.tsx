"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ── Types ───────────────────────────────────────────────────────────
interface CoursEntry {
  module_name: string;
  sub_discipline: string;
  cours_topic: string;
  question_count: number;
  years_appeared: number;
  exam_years_list: number[];
}

interface ModuleInfo {
  module_name: string;
  sub_disciplines: string[];
  total_questions: number;
}

// ── Sub-Discipline Icons ────────────────────────────────────────────
const SUB_DISC_ICONS: Record<string, string> = {
  Anatomie: "🫀",
  Histologie: "🔬",
  Physiologie: "⚡",
  Biochimie: "🧪",
  Biophysique: "📐",
};

const SUB_DISC_COLORS: Record<string, string> = {
  Anatomie: "from-red-500 to-rose-600",
  Histologie: "from-purple-500 to-violet-600",
  Physiologie: "from-blue-500 to-cyan-600",
  Biochimie: "from-emerald-500 to-teal-600",
  Biophysique: "from-amber-500 to-orange-600",
};

const SUB_DISC_BG: Record<string, string> = {
  Anatomie:
    "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50",
  Histologie:
    "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50",
  Physiologie:
    "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50",
  Biochimie:
    "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
  Biophysique:
    "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
};

export default function TendancePage() {
  const router = useRouter();
  const [data, setData] = useState<CoursEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");

  // ── Auth + Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/tendance", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch tendance data");
        const json = await res.json();
        setData(json.data || []);
        // Default to first module
        if (json.data?.length > 0) {
          const modules = [
            ...new Set(json.data.map((d: CoursEntry) => d.module_name)),
          ];
          setSelectedModule(modules[0] as string);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // ── Derived Data ──────────────────────────────────────────────────
  const modules: ModuleInfo[] = useMemo(() => {
    const moduleMap = new Map<string, { subs: Set<string>; totalQ: number }>();
    for (const d of data) {
      if (!moduleMap.has(d.module_name)) {
        moduleMap.set(d.module_name, { subs: new Set(), totalQ: 0 });
      }
      const entry = moduleMap.get(d.module_name)!;
      entry.subs.add(d.sub_discipline);
      entry.totalQ += d.question_count;
    }
    return Array.from(moduleMap.entries())
      .map(([name, info]) => ({
        module_name: name,
        sub_disciplines: Array.from(info.subs).sort(),
        total_questions: info.totalQ,
      }))
      .sort((a, b) => b.total_questions - a.total_questions);
  }, [data]);

  const filteredByModule = useMemo(() => {
    return data.filter((d) => d.module_name === selectedModule);
  }, [data, selectedModule]);

  const groupedBySubDisc = useMemo(() => {
    const groups: Record<string, CoursEntry[]> = {};
    for (const d of filteredByModule) {
      if (!groups[d.sub_discipline]) groups[d.sub_discipline] = [];
      groups[d.sub_discipline].push(d);
    }
    // Sort sub_disciplines in a meaningful order
    const order = [
      "Anatomie",
      "Histologie",
      "Physiologie",
      "Biochimie",
      "Biophysique",
    ];
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return sorted;
  }, [filteredByModule]);

  const totalExamYears = useMemo(() => {
    const years = new Set<number>();
    for (const d of data) {
      for (const y of d.exam_years_list) years.add(y);
    }
    return years.size;
  }, [data]);

  const examYearsRange = useMemo(() => {
    const years = new Set<number>();
    for (const d of data) {
      for (const y of d.exam_years_list) years.add(y);
    }
    const sorted = Array.from(years).sort((a, b) => a - b);
    return sorted.length > 0 ? `${sorted[0]}–${sorted[sorted.length - 1]}` : "";
  }, [data]);

  // ── Fire intensity indicator ──────────────────────────────────────
  const getFireIndicator = (yearsAppeared: number) => {
    const ratio = yearsAppeared / Math.max(totalExamYears, 1);
    if (ratio >= 1)
      return {
        fire: "🔥🔥🔥",
        label: "Chaque année",
        color: "text-red-600 dark:text-red-400",
      };
    if (ratio >= 0.8)
      return {
        fire: "🔥🔥",
        label: "Très fréquent",
        color: "text-orange-600 dark:text-orange-400",
      };
    if (ratio >= 0.5)
      return {
        fire: "🔥",
        label: "Fréquent",
        color: "text-amber-600 dark:text-amber-400",
      };
    return {
      fire: "💡",
      label: "Occasionnel",
      color: "text-blue-600 dark:text-blue-400",
    };
  };

  // ── Loading / Error States ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-theme-muted text-sm font-medium">
            Analyse des tendances en cours...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-8 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            ❌ {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-theme-main tracking-tight">
          🔥 Classement des Cours par Tendance
        </h1>
        <p className="text-theme-muted text-sm md:text-base max-w-2xl">
          Classement des cours selon leur importance d&apos;après les{" "}
          <span className="font-bold text-primary">
            {totalExamYears} dernières promos
          </span>{" "}
          ({examYearsRange}). Les cours qui tombent le plus souvent aux examens
          sont en haut.
        </p>
      </div>

      {/* Module Tabs */}
      <div className="bg-theme-card border border-theme rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-3">
          📚 Sélectionner un module
        </p>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <button
              key={m.module_name}
              onClick={() => setSelectedModule(m.module_name)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedModule === m.module_name
                  ? "bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]"
                  : "bg-theme-secondary text-theme-secondary hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {m.module_name}
              <span className="ml-1.5 opacity-70 text-xs">
                ({m.total_questions})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Discipline Sections */}
      <div className="space-y-6">
        {groupedBySubDisc.map(([subDisc, entries]) => {
          const icon = SUB_DISC_ICONS[subDisc] || "📖";
          const gradientClass =
            SUB_DISC_COLORS[subDisc] || "from-gray-500 to-slate-600";
          const bgClass =
            SUB_DISC_BG[subDisc] ||
            "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800/50";
          const totalSubQ = entries.reduce(
            (sum, e) => sum + e.question_count,
            0,
          );

          return (
            <div
              key={subDisc}
              className={`rounded-2xl border overflow-hidden ${bgClass}`}
            >
              {/* Sub-Discipline Header */}
              <div
                className={`bg-gradient-to-r ${gradientClass} px-5 py-3.5 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {subDisc}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/80 text-xs font-medium bg-white/20 rounded-full px-3 py-1">
                    {entries.length} cours
                  </span>
                  <span className="text-white/80 text-xs font-medium bg-white/20 rounded-full px-3 py-1">
                    {totalSubQ} questions
                  </span>
                </div>
              </div>

              {/* Cours List */}
              <div className="p-4 md:p-5">
                <div className="space-y-1.5">
                  {entries.map((entry, idx) => {
                    const fire = getFireIndicator(entry.years_appeared);
                    const barWidth = Math.max(
                      8,
                      (entry.question_count / entries[0].question_count) * 100,
                    );

                    return (
                      <div
                        key={entry.cours_topic}
                        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        {/* Rank */}
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-theme shadow-sm text-xs font-bold text-theme-main flex-shrink-0">
                          {idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-theme-main truncate">
                              {entry.cours_topic}
                            </p>
                            <span className="text-xs font-mono opacity-60 flex-shrink-0">
                              {fire.fire}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs font-medium text-theme-muted">
                            {entry.years_appeared}/{totalExamYears} promos
                          </span>
                          <span className="text-sm font-bold text-theme-main bg-white dark:bg-slate-800 border border-theme rounded-lg px-2.5 py-1 shadow-sm">
                            {entry.question_count} Q
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-theme-muted pt-4 border-t border-theme">
        Données basées sur {totalExamYears} promos ({examYearsRange}) · Analyse
        automatique de {data.length} cours
      </div>
    </div>
  );
}
