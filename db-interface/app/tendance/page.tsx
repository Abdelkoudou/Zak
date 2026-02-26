"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import TendanceShareCard from "@/components/TendanceShareCard";
import type { ShareSubDiscGroup } from "@/components/TendanceShareCard";

// ── Types ───────────────────────────────────────────────────────────
interface GranularEntry {
  m: string; // module
  sd: string; // sub-discipline
  c: string; // course
  ey: number; // exam year
  et: string; // exam type
  cnt: number; // question count
}

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
  const [rawEntries, setRawEntries] = useState<GranularEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Available filters (from API)
  const [availableExamTypes, setAvailableExamTypes] = useState<string[]>([]);
  const [availablePromos, setAvailablePromos] = useState<number[]>([]);

  // Selection state
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]); // empty = all
  const [selectedPromos, setSelectedPromos] = useState<number[]>([]); // empty = all

  // ── Auth + Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (controller.signal.aborted) return;
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/tendance", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch tendance data");
        const json = await res.json();
        if (controller.signal.aborted) return;

        setRawEntries(json.data || []);
        setAvailableExamTypes(json.availableExamTypes || []);
        setAvailablePromos(json.availableExamYears || []);

        // Default to all selected
        setSelectedExamTypes(json.availableExamTypes || []);
        setSelectedPromos(json.availableExamYears || []);

        // Default module
        if (json.data?.length > 0) {
          const modules = [
            ...new Set(json.data.map((d: GranularEntry) => d.m)),
          ];
          setSelectedModule(modules[0] as string);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [router]);

  // ── Filtering + Aggregation ───────────────────────────────────────
  const filteredData: CoursEntry[] = useMemo(() => {
    if (!rawEntries.length) return [];

    // 1. Filter raw entries
    const filtered = rawEntries.filter((e) => {
      const matchType =
        selectedExamTypes.length === 0 || selectedExamTypes.includes(e.et);
      const matchPromo =
        selectedPromos.length === 0 || selectedPromos.includes(e.ey);
      return matchType && matchPromo;
    });

    // 2. Aggregate by (module, subDisc, course)
    const aggMap = new Map<
      string,
      {
        m: string;
        sd: string;
        c: string;
        years: Set<number>;
        count: number;
      }
    >();

    for (const e of filtered) {
      const key = `${e.m}|||${e.sd}|||${e.c}`;
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          m: e.m,
          sd: e.sd,
          c: e.c,
          years: new Set(),
          count: 0,
        });
      }
      const item = aggMap.get(key)!;
      item.years.add(e.ey);
      item.count += e.cnt;
    }

    // 3. Convert to CoursEntry format
    return Array.from(aggMap.values())
      .map((v) => ({
        module_name: v.m,
        sub_discipline: v.sd,
        cours_topic: v.c,
        question_count: v.count,
        years_appeared: v.years.size,
        exam_years_list: Array.from(v.years).sort((a, b) => a - b),
      }))
      .sort((a, b) => {
        // Sort by module, then sub_discipline, then count DESC
        if (a.module_name !== b.module_name)
          return a.module_name.localeCompare(b.module_name);
        if (a.sub_discipline !== b.sub_discipline)
          return a.sub_discipline.localeCompare(b.sub_discipline);
        return b.question_count - a.question_count;
      });
  }, [rawEntries, selectedExamTypes, selectedPromos]);

  // ── Derived View Data ─────────────────────────────────────────────
  const modules: ModuleInfo[] = useMemo(() => {
    const moduleMap = new Map<string, { subs: Set<string>; totalQ: number }>();
    for (const d of filteredData) {
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
  }, [filteredData]);

  // Keep selectedModule valid when filters change
  useEffect(() => {
    if (
      modules.length > 0 &&
      !modules.some((m) => m.module_name === selectedModule)
    ) {
      setSelectedModule(modules[0].module_name);
    } else if (modules.length === 0 && selectedModule !== "") {
      setSelectedModule("");
    }
  }, [modules, selectedModule]);

  const filteredByModule = useMemo(() => {
    return filteredData.filter((d) => d.module_name === selectedModule);
  }, [filteredData, selectedModule]);

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
    for (const d of filteredData) {
      for (const y of d.exam_years_list) years.add(y);
    }
    return years.size;
  }, [filteredData]);

  const examYearsRange = useMemo(() => {
    const years = new Set<number>();
    for (const d of filteredData) {
      for (const y of d.exam_years_list) years.add(y);
    }
    const sorted = Array.from(years).sort((a, b) => a - b);
    return sorted.length > 0 ? `${sorted[0]}–${sorted[sorted.length - 1]}` : "";
  }, [filteredData]);

  // ── Helpers for Filter UI ─────────────────────────────────────────
  const toggleType = (type: string) => {
    setSelectedExamTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const togglePromo = (promo: number) => {
    setSelectedPromos((prev) =>
      prev.includes(promo) ? prev.filter((p) => p !== promo) : [...prev, promo],
    );
  };

  const selectEMDOnly = () => {
    const emdTypes = availableExamTypes.filter((t) => t.startsWith("EMD"));
    setSelectedExamTypes(emdTypes);
  };

  const selectRattrapageOnly = () => {
    const rattrapageTypes = availableExamTypes.filter(
      (t) => t === "Rattrapage",
    );
    setSelectedExamTypes(rattrapageTypes);
  };

  const selectAllTypes = () => setSelectedExamTypes(availableExamTypes);
  const selectAllPromos = () => setSelectedPromos(availablePromos);
  const deselectAllPromos = () => setSelectedPromos([]);

  // ── Export handler ──────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!shareCardRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        width: 1080,
        height: 1080,
      });
      const link = document.createElement("a");
      link.download = `tendance-${selectedModule.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [exporting, selectedModule]);

  // ── Data for share card ────────────────────────────────────────────
  const shareCardSubGroups: ShareSubDiscGroup[] = useMemo(() => {
    return groupedBySubDisc.map(([subDisc, entries]) => ({
      sub_discipline: subDisc,
      entries: entries.map((e) => ({
        cours_topic: e.cours_topic,
        question_count: e.question_count,
      })),
    }));
  }, [groupedBySubDisc]);

  const selectedModuleInfo = useMemo(() => {
    return modules.find((m) => m.module_name === selectedModule);
  }, [modules, selectedModule]);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-theme-main tracking-tight">
            🔥 Classement des Cours par Tendance
          </h1>
          <p className="text-theme-muted text-sm md:text-base max-w-2xl">
            Classement selon l&apos;importance d&apos;après les{" "}
            <span className="font-bold text-primary">
              {totalExamYears} promos sélectionnées
            </span>{" "}
            ({examYearsRange}).
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !selectedModule}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Export en cours..." : "Exporter"}
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-theme-card border-2 border-primary/20 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exam Type Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-theme-main flex items-center gap-2">
                📝 Type d&apos;examen
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllTypes}
                  className="text-[10px] uppercase font-bold text-primary hover:underline"
                >
                  Tous
                </button>
                <button
                  onClick={selectEMDOnly}
                  className="text-[10px] uppercase font-bold text-primary hover:underline"
                >
                  EMD UNIQUEMENT
                </button>
                <button
                  onClick={selectRattrapageOnly}
                  className="text-[10px] uppercase font-bold text-primary hover:underline"
                >
                  RATTRAPAGE
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableExamTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedExamTypes.includes(type)
                      ? "bg-primary border-primary text-white"
                      : "bg-theme-secondary border-theme text-theme-muted hover:border-primary/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Promo Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-theme-main flex items-center gap-2">
                🎓 Promotions (Années)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllPromos}
                  className="text-[10px] uppercase font-bold text-primary hover:underline"
                >
                  Sélectionner tout
                </button>
                <button
                  onClick={deselectAllPromos}
                  className="text-[10px] uppercase font-bold text-primary hover:underline"
                >
                  Désélectionner tout
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {availablePromos.map((year) => (
                <label
                  key={year}
                  className={`flex items-center justify-center px-2 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    selectedPromos.includes(year)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-theme-secondary border-theme text-theme-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedPromos.includes(year)}
                    onChange={() => togglePromo(year)}
                  />
                  {year}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="bg-theme-card border border-theme rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>📚 Sélectionner un module</span>
          <span className="text-[10px] font-normal opacity-60">
            Montrant {filteredByModule.length} cours sur {filteredData.length}{" "}
            au total
          </span>
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
                    const safeBase = entries[0]?.question_count || 1;
                    const barWidth = Math.max(
                      8,
                      (entry.question_count / safeBase) * 100,
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
                          <p className="text-sm font-semibold text-theme-main truncate mb-1">
                            {entry.cours_topic}
                          </p>

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
        automatique de {filteredData.length} cours
      </div>

      {/* Hidden Share Card for export (rendered off-screen) */}
      <div
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          zIndex: -1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <TendanceShareCard
          ref={shareCardRef}
          moduleName={selectedModule}
          totalQuestions={selectedModuleInfo?.total_questions ?? 0}
          examYearsRange={examYearsRange}
          totalExamYears={totalExamYears}
          subDiscGroups={shareCardSubGroups}
        />
      </div>
    </div>
  );
}
