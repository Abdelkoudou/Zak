"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  PREDEFINED_MODULES,
  PREDEFINED_SUBDISCIPLINES,
} from "@/lib/predefined-modules";

interface Course {
  id: string;
  name: string;
  module_name: string;
  sub_discipline: string | null;
  year: string;
  speciality: string;
}

interface CourseWithCount extends Course {
  question_count: number;
}

export default function CoursesPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<CourseWithCount[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalCourseName, setOriginalCourseName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("");
  const [selectedSubDisciplineFilter, setSelectedSubDisciplineFilter] =
    useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  const [formData, setFormData] = useState({
    speciality: "Médecine",
    year: "1",
    module_name: "",
    sub_discipline: "",
    name: "",
  });

  // Get modules for selected year
  const availableModules = useMemo(() => {
    return PREDEFINED_MODULES.filter((m) => m.year === formData.year);
  }, [formData.year]);

  // Get selected module details
  const selectedModuleDetails = useMemo(() => {
    return availableModules.find((m) => m.name === formData.module_name);
  }, [availableModules, formData.module_name]);

  // Get sub-disciplines if module has them
  const availableSubDisciplines = useMemo(() => {
    if (
      selectedModuleDetails?.hasSubDisciplines &&
      selectedModuleDetails.name
    ) {
      return PREDEFINED_SUBDISCIPLINES[selectedModuleDetails.name] || [];
    }
    return [];
  }, [selectedModuleDetails]);

  // Get all unique modules from courses for filter
  const allModulesInCourses = useMemo(() => {
    const moduleNames = new Set(courses.map((c) => c.module_name));
    return Array.from(moduleNames).sort();
  }, [courses]);

  // Get all unique sub-disciplines from courses for filter
  const allSubDisciplinesInCourses = useMemo(() => {
    const subDisciplines = new Set(
      courses.filter((c) => c.sub_discipline).map((c) => c.sub_discipline),
    );
    return Array.from(subDisciplines).sort() as string[];
  }, [courses]);

  const fetchCourses = useCallback(async () => {
    setFetching(true);
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("module_name")
        .order("name");

      if (coursesError) throw coursesError;

      // Fetch question counts per course using the RPC
      const { data: countsData } = await supabase.rpc("get_all_cours_counts");

      // Build a lookup map: "module_name::course_name" -> count
      const countMap = new Map<string, number>();
      if (countsData) {
        for (const row of countsData as {
          cours_name: string;
          module_name: string;
          question_count: number;
        }[]) {
          countMap.set(
            `${row.module_name}::${row.cours_name}`,
            row.question_count,
          );
        }
      }

      const enriched: CourseWithCount[] = (coursesData || []).map(
        (c: Course) => ({
          ...c,
          question_count: countMap.get(`${c.module_name}::${c.name}`) || 0,
        }),
      );

      setCourses(enriched);
    } catch (err) {
      console.error("Error fetching courses:", err);
      // Fallback: fetch courses without counts
      const { data } = await supabase
        .from("courses")
        .select("*")
        .order("module_name")
        .order("name");
      setCourses(
        (data || []).map((c: Course) => ({ ...c, question_count: 0 })),
      );
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Auto-dismiss success messages after 4s
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.module_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesYear = selectedYearFilter
        ? course.year === selectedYearFilter
        : true;
      const matchesModule = selectedModuleFilter
        ? course.module_name === selectedModuleFilter
        : true;
      const matchesSubDiscipline = selectedSubDisciplineFilter
        ? course.sub_discipline === selectedSubDisciplineFilter
        : true;

      return (
        matchesSearch && matchesYear && matchesModule && matchesSubDiscipline
      );
    });
  }, [
    courses,
    searchQuery,
    selectedYearFilter,
    selectedModuleFilter,
    selectedSubDisciplineFilter,
  ]);

  // Group courses by module
  const groupedCourses = useMemo(() => {
    const groups: Record<string, CourseWithCount[]> = {};
    for (const course of filteredCourses) {
      if (!groups[course.module_name]) {
        groups[course.module_name] = [];
      }
      groups[course.module_name].push(course);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCourses]);

  // Stats
  const stats = useMemo(() => {
    const totalQuestions = filteredCourses.reduce(
      (sum, c) => sum + c.question_count,
      0,
    );
    const modulesCount = new Set(filteredCourses.map((c) => c.module_name))
      .size;
    const withQuestions = filteredCourses.filter(
      (c) => c.question_count > 0,
    ).length;
    const withoutQuestions = filteredCourses.filter(
      (c) => c.question_count === 0,
    ).length;
    return { totalQuestions, modulesCount, withQuestions, withoutQuestions };
  }, [filteredCourses]);

  // Active filters check
  const hasActiveFilters =
    selectedYearFilter ||
    selectedModuleFilter ||
    selectedSubDisciplineFilter ||
    searchQuery;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedYearFilter("");
    setSelectedModuleFilter("");
    setSelectedSubDisciplineFilter("");
  };

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedModules(new Set(groupedCourses.map(([name]) => name)));
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const trimmedName = formData.name.trim();
      const isRenaming =
        editingId && originalCourseName && trimmedName !== originalCourseName;

      if (editingId) {
        // Check for duplicate name in the same scope
        if (isRenaming) {
          let dupQuery = supabase
            .from("courses")
            .select("id")
            .eq("name", trimmedName)
            .eq("module_name", formData.module_name)
            .eq("year", formData.year)
            .eq("speciality", formData.speciality)
            .neq("id", editingId);

          if (formData.sub_discipline) {
            dupQuery = dupQuery.eq("sub_discipline", formData.sub_discipline);
          } else {
            dupQuery = dupQuery.is("sub_discipline", null);
          }

          const { data: duplicate } = await dupQuery.maybeSingle();

          if (duplicate) {
            setError("Un cours avec ce nom existe déjà dans ce module.");
            setLoading(false);
            return;
          }

          const confirmed = confirm(
            `Renommer "${originalCourseName}" en "${trimmedName}" va aussi mettre à jour toutes les questions et ressources liées à ce cours.\n\nContinuer ?`,
          );
          if (!confirmed) {
            setLoading(false);
            return;
          }
        }

        const { error: updateError } = await supabase
          .from("courses")
          .update({
            speciality: formData.speciality,
            year: formData.year,
            module_name: formData.module_name,
            sub_discipline: formData.sub_discipline || null,
            name: trimmedName,
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess(
          isRenaming
            ? `✅ Cours renommé ! Les questions liées ont été mises à jour automatiquement.`
            : "✅ Cours mis à jour avec succès !",
        );
        setEditingId(null);
        setOriginalCourseName("");
      } else {
        const { error: insertError } = await supabase.from("courses").insert([
          {
            speciality: formData.speciality,
            year: formData.year,
            module_name: formData.module_name,
            sub_discipline: formData.sub_discipline || null,
            name: trimmedName,
          },
        ]);

        if (insertError) throw insertError;
        setSuccess("✅ Cours ajouté avec succès !");
      }

      if (!editingId) {
        setFormData((prev) => ({ ...prev, name: "" }));
      } else {
        resetForm();
      }

      fetchCourses();
    } catch (err: any) {
      setError(err.message || "Échec de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    id: string,
    name: string,
    questionCount: number,
  ) => {
    const warning =
      questionCount > 0
        ? `⚠️ "${name}" est lié à ${questionCount} question${questionCount > 1 ? "s" : ""}.\n\nSupprimer ce cours ? (Les questions ne seront pas supprimées, mais leur lien avec ce cours sera perdu)`
        : `Supprimer "${name}" ?`;

    if (!confirm(warning)) return;

    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      setSuccess("✅ Cours supprimé avec succès !");
      fetchCourses();
    } catch (err: any) {
      setError(err.message || "Échec de la suppression");
    }
  };

  const handleEdit = (course: CourseWithCount) => {
    setFormData({
      speciality: course.speciality,
      year: course.year,
      module_name: course.module_name,
      sub_discipline: course.sub_discipline || "",
      name: course.name,
    });
    setEditingId(course.id);
    setOriginalCourseName(course.name);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setFormData({
      speciality: "Médecine",
      year: "1",
      module_name: "",
      sub_discipline: "",
      name: "",
    });
    setEditingId(null);
    setOriginalCourseName("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 md:mb-2">
            📚 Gestion des Cours
          </h1>
          <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Catalogue & Configuration • FMC APP
          </p>
        </div>
        {/* Quick Stats */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30">
            <span className="text-primary-600 dark:text-primary-400 text-xs md:text-sm font-black">
              {filteredCourses.length}
            </span>
            <span className="text-primary-500/70 dark:text-primary-400/70 text-[10px] md:text-xs font-semibold">
              cours
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs md:text-sm font-black">
              {stats.totalQuestions.toLocaleString()}
            </span>
            <span className="text-emerald-500/70 dark:text-emerald-400/70 text-[10px] md:text-xs font-semibold">
              questions liées
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/30">
            <span className="text-violet-600 dark:text-violet-400 text-xs md:text-sm font-black">
              {stats.modulesCount}
            </span>
            <span className="text-violet-500/70 dark:text-violet-400/70 text-[10px] md:text-xs font-semibold">
              modules
            </span>
          </div>
          {stats.withoutQuestions > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
              <span className="text-amber-600 dark:text-amber-400 text-xs md:text-sm font-black">
                {stats.withoutQuestions}
              </span>
              <span className="text-amber-500/70 dark:text-amber-400/70 text-[10px] md:text-xs font-semibold">
                sans questions
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* ═══ LEFT: Form Panel ═══ */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl md:shadow-2xl p-5 md:p-8 relative overflow-hidden lg:sticky lg:top-8">
            <div
              className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${editingId ? "from-transparent via-amber-500 to-transparent" : "from-transparent via-primary-500 to-transparent"} opacity-60 transition-colors`}
            ></div>

            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span
                className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl ${editingId ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30" : "bg-primary-50 text-primary-600 dark:bg-primary-900/30"} text-sm md:text-base transition-colors`}
              >
                {editingId ? "✏️" : "✨"}
              </span>
              <div>
                {editingId ? "Modifier le Cours" : "Ajouter un Cours"}
                {editingId && originalCourseName && (
                  <div className="text-[10px] md:text-xs font-medium text-amber-500/80 mt-0.5 truncate max-w-[200px]">
                    Modification de : {originalCourseName}
                  </div>
                )}
              </div>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {error && (
                <div className="p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 rounded-xl text-xs md:text-sm font-medium flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">❌</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 md:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs md:text-sm font-medium flex items-start gap-2 animate-[fadeIn_0.3s_ease-out]">
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Année
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: e.target.value,
                          module_name: "",
                          sub_discipline: "",
                        })
                      }
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                    >
                      {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>
                          {y}
                          {y === 1 ? "ère" : "ème"} Année
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Spécialité
                    </label>
                    <input
                      type="text"
                      value={formData.speciality}
                      readOnly
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed font-medium text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Module
                  </label>
                  <select
                    value={formData.module_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        module_name: e.target.value,
                        sub_discipline: "",
                      })
                    }
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                    required
                  >
                    <option value="">Sélectionner un module</option>
                    {availableModules.map((mod) => (
                      <option key={mod.name} value={mod.name}>
                        {mod.type === "uei" && "🟢 UEI: "}
                        {mod.type === "standalone" && "🟡 "}
                        {mod.type === "annual" && "🔵 "}
                        {mod.type === "semestrial" && "🔵 "}
                        {mod.name}
                      </option>
                    ))}
                  </select>
                  {selectedModuleDetails && (
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1.5 ml-1">
                      {selectedModuleDetails.type === "uei" &&
                        "🟢 Unité d'Enseignement Intégré (UEI)"}
                      {selectedModuleDetails.type === "standalone" &&
                        "🟡 Module Autonome"}
                      {selectedModuleDetails.type === "annual" &&
                        "🔵 Module Annuel"}
                      {selectedModuleDetails.type === "semestrial" &&
                        "🔵 Module Semestriel"}
                    </p>
                  )}
                </div>

                {availableSubDisciplines.length > 0 && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Sous-Discipline{" "}
                      <span className="text-slate-300 dark:text-slate-600 font-normal normal-case tracking-normal">
                        (Optionnel)
                      </span>
                    </label>
                    <select
                      value={formData.sub_discipline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sub_discipline: e.target.value,
                        })
                      }
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                    >
                      <option value="">Aucune</option>
                      {availableSubDisciplines.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Nom du Cours
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 01- Introduction aux ..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm"
                  />
                  {/* Rename indicator */}
                  {editingId &&
                    originalCourseName &&
                    formData.name.trim() !== originalCourseName &&
                    formData.name.trim() !== "" && (
                      <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg">
                        <div className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                          Renommage détecté
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 line-through truncate max-w-[120px]">
                            {originalCourseName}
                          </span>
                          <span className="text-amber-500">→</span>
                          <span className="text-amber-700 dark:text-amber-300 font-semibold truncate max-w-[120px]">
                            {formData.name.trim()}
                          </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-amber-500/80 dark:text-amber-400/60 mt-1">
                          Les questions et ressources liées seront mises à jour
                          automatiquement.
                        </p>
                      </div>
                    )}
                </div>
              </div>

              <div className="pt-2 md:pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 md:py-4 font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm md:text-base
                    ${
                      editingId
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                        : "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/25"
                    }`}
                >
                  {loading
                    ? "Sauvegarde..."
                    : editingId
                      ? "💾 Mettre à jour"
                      : "➕ Ajouter le Cours"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 md:px-6 py-3 md:py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 text-sm md:text-base"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ═══ RIGHT: Course List ═══ */}
        <div className="lg:col-span-8 space-y-4 md:space-y-5">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3 py-1.5 border border-slate-100 dark:border-white/5">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un cours ou un module..."
                className="flex-1 bg-transparent border-none outline-none py-2 px-1 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
              >
                <option value="">Toutes les années</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y}
                    {y === 1 ? "ère" : "ème"} Année
                  </option>
                ))}
              </select>

              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="flex-[2] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
              >
                <option value="">Tous les modules</option>
                {allModulesInCourses.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>

              {allSubDisciplinesInCourses.length > 0 && (
                <select
                  value={selectedSubDisciplineFilter}
                  onChange={(e) =>
                    setSelectedSubDisciplineFilter(e.target.value)
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                >
                  <option value="">Toute sous-discipline</option>
                  {allSubDisciplinesInCourses.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Active filters + expand/collapse */}
            {(hasActiveFilters || groupedCourses.length > 1) && (
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] md:text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      ✕ Réinitialiser les filtres
                    </button>
                  )}
                </div>
                {groupedCourses.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={expandAll}
                      className="text-[10px] md:text-xs font-semibold text-slate-400 hover:text-primary-500 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    >
                      Tout déplier
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">
                      |
                    </span>
                    <button
                      onClick={collapseAll}
                      className="text-[10px] md:text-xs font-semibold text-slate-400 hover:text-primary-500 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    >
                      Tout replier
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course List - Grouped by Module */}
          {fetching ? (
            <div className="p-12 md:p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-slate-500 font-medium">
                Chargement des cours...
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 md:p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-base font-semibold text-slate-500 dark:text-slate-400">
                Aucun cours trouvé
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-sm text-primary-500 hover:text-primary-600 font-semibold"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {groupedCourses.map(([moduleName, moduleCourses]) => {
                const isExpanded = expandedModules.has(moduleName);
                const moduleQuestionCount = moduleCourses.reduce(
                  (sum, c) => sum + c.question_count,
                  0,
                );

                return (
                  <div
                    key={moduleName}
                    className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden"
                  >
                    {/* Module Header — clickable to expand/collapse */}
                    <button
                      onClick={() => toggleModule(moduleName)}
                      className="w-full px-4 py-3 md:px-6 md:py-4 flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`text-xs font-black text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        >
                          ▶
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {moduleName}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-slate-400 font-medium">
                              {moduleCourses[0]?.year}
                              {moduleCourses[0]?.year === "1"
                                ? "ère"
                                : "ème"}{" "}
                              Année
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/5">
                          {moduleCourses.length} cours
                        </span>
                        {moduleQuestionCount > 0 && (
                          <span className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                            {moduleQuestionCount} Q
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Courses List (expanded) */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {moduleCourses.map((course) => (
                          <div
                            key={course.id}
                            className={`group px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors ${editingId === course.id ? "bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-400" : ""}`}
                          >
                            {/* Question count badge */}
                            <div
                              className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-xs md:text-sm font-black ${
                                course.question_count > 0
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30"
                                  : "bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-white/5"
                              }`}
                            >
                              {course.question_count > 0
                                ? course.question_count
                                : "—"}
                            </div>

                            {/* Course info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm md:text-base text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                {course.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {course.sub_discipline && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-[9px] md:text-[10px] font-bold text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/30">
                                    {course.sub_discipline}
                                  </span>
                                )}
                                {course.question_count > 0 && (
                                  <span className="text-[9px] md:text-[10px] text-emerald-500/70 dark:text-emerald-400/60 font-medium">
                                    {course.question_count} question
                                    {course.question_count > 1 ? "s" : ""}
                                  </span>
                                )}
                                {course.question_count === 0 && (
                                  <span className="text-[9px] md:text-[10px] text-slate-400/70 font-medium italic">
                                    Aucune question
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(course)}
                                className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                                title="Modifier"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(
                                    course.id,
                                    course.name,
                                    course.question_count,
                                  )
                                }
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                title="Supprimer"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
