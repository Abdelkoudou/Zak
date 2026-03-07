"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  Database,
  Filter,
  AlertCircle,
  X,
} from "lucide-react";
import CourseEditModal from "@/components/CourseEditModal";

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
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<CourseWithCount[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithCount | null>(
    null,
  );

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("");
  const [selectedSubDisciplineFilter, setSelectedSubDisciplineFilter] =
    useState("");

  const [showEmptyCourses, setShowEmptyCourses] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

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

      // Fetch question counts
      const { data: countsData } = await supabase.rpc("get_all_cours_counts");

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
      setError("Erreur lors du chargement des cours.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

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

    return {
      total: filteredCourses.length,
      totalQuestions,
      modulesCount,
      withQuestions,
      withoutQuestions,
    };
  }, [filteredCourses]);

  // Empty courses grouped by module for the detail panel
  const emptyCourses = useMemo(() => {
    return courses.filter((c) => c.question_count === 0);
  }, [courses]);

  const emptyCoursesGrouped = useMemo(() => {
    const groups: Record<string, CourseWithCount[]> = {};
    for (const course of emptyCourses) {
      if (!groups[course.module_name]) groups[course.module_name] = [];
      groups[course.module_name].push(course);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [emptyCourses]);

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
      if (next.has(moduleName)) next.delete(moduleName);
      else next.add(moduleName);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedModules(new Set(groupedCourses.map(([name]) => name)));
  const collapseAll = () => setExpandedModules(new Set());

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

  const openAddModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: CourseWithCount) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (msg: string) => {
    setSuccess(msg);
    fetchCourses();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-4 md:p-8">
      {/* Messages (Floating) */}
      {(success || error) && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          {success && (
            <div className="px-6 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full shadow-lg shadow-emerald-500/10 text-sm font-bold flex items-center gap-2">
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="px-6 py-3 bg-red-50 border border-red-200 text-red-700 rounded-full shadow-lg shadow-red-500/10 text-sm font-bold flex items-center gap-2">
              <span className="shrink-0">❌</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center border border-primary-100 dark:border-primary-800/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Catalogue des Cours
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                Gérez les modules, les disciplines et la structure académique.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Nouveau Cours
        </button>
      </div>

      {/* CRM Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Total Cours
            </h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.total.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Database className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Questions Liées
            </h3>
          </div>
          <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
            {stats.totalQuestions.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Layers className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Modules
            </h3>
          </div>
          <div className="text-3xl font-black text-violet-600 dark:text-violet-400">
            {stats.modulesCount.toLocaleString()}
          </div>
        </div>

        <button
          onClick={() => setShowEmptyCourses(!showEmptyCourses)}
          className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm text-left transition-all cursor-pointer hover:shadow-md ${
            showEmptyCourses
              ? "border-amber-300 dark:border-amber-700 ring-2 ring-amber-200/50 dark:ring-amber-800/30"
              : "border-slate-200 dark:border-white/5"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Cours Vides
              </h3>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-amber-400 transition-transform duration-200 ${showEmptyCourses ? "rotate-180" : ""}`}
            />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 flex items-baseline gap-2">
            {stats.withoutQuestions.toLocaleString()}
            <span className="text-sm font-semibold text-slate-400 lowercase">
              sans questions
            </span>
          </div>
        </button>
      </div>

      {/* Empty Courses Detail Panel */}
      {showEmptyCourses && emptyCourses.length > 0 && (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200/50 dark:border-amber-800/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                Cours sans questions
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black rounded-full">
                {emptyCourses.length}
              </span>
            </div>
            <button
              onClick={() => setShowEmptyCourses(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-amber-200/30 dark:divide-amber-800/20">
            {emptyCoursesGrouped.map(([moduleName, moduleCourses]) => (
              <div key={moduleName} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {moduleName}
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">
                    — {moduleCourses[0]?.year}
                    {moduleCourses[0]?.year === "1" ? "ère" : "ème"} Année
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {moduleCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                    >
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {course.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(course)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              course.id,
                              course.name,
                              course.question_count,
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Filters Bar */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un cours..."
              className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Select Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative">
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="w-full sm:w-40 appearance-none pl-4 pr-10 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
              >
                <option value="">Toutes Années</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y}
                    {y === 1 ? "ère" : "ème"} Année
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="w-full sm:w-56 appearance-none pl-4 pr-10 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
              >
                <option value="">Tous les Modules</option>
                {allModulesInCourses.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {allSubDisciplinesInCourses.length > 0 && (
              <div className="relative">
                <select
                  value={selectedSubDisciplineFilter}
                  onChange={(e) =>
                    setSelectedSubDisciplineFilter(e.target.value)
                  }
                  className="w-full sm:w-56 appearance-none pl-4 pr-10 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  <option value="">Toutes Sous-disciplines</option>
                  {allSubDisciplinesInCourses.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Filter Actions */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <button
                onClick={expandAll}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                Tout déplier
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                Tout replier
              </button>
            </div>
          </div>
        </div>

        {/* Data List */}
        <div className="flex-1 p-4 md:p-6 bg-slate-50/30 dark:bg-slate-950/20">
          {fetching ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Chargement du catalogue...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Aucun cours trouvé
              </h3>
              <p className="text-slate-500 max-w-sm mb-6">
                Modifiez vos filtres ou ajoutez un nouveau cours pour enrichir
                le catalogue.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Réinitialiser la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedCourses.map(([moduleName, moduleCourses]) => {
                const isExpanded = expandedModules.has(moduleName);
                const moduleQuestionCount = moduleCourses.reduce(
                  (sum, c) => sum + c.question_count,
                  0,
                );

                return (
                  <div
                    key={moduleName}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-white/10"
                  >
                    {/* Module Row Header */}
                    <button
                      onClick={() => toggleModule(moduleName)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-90 bg-primary-50 text-primary-600" : ""}`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {moduleName}
                          </h3>
                          <div className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
                            {moduleCourses[0]?.year}
                            {moduleCourses[0]?.year === "1"
                              ? "ère"
                              : "ème"}{" "}
                            Année
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {moduleCourses.length} cours
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {moduleQuestionCount.toLocaleString()} QCMs
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-white/5">
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {moduleCourses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between px-6 py-4 hover:bg-white dark:hover:bg-slate-800/80 transition-colors group"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div
                                  className={`w-2 h-2 rounded-full ${course.question_count > 0 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-300 dark:bg-slate-700"}`}
                                ></div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {course.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {course.sub_discipline && (
                                      <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                                        {course.sub_discipline}
                                      </span>
                                    )}
                                    <span className="text-xs font-medium text-slate-500">
                                      {course.question_count > 0
                                        ? `${course.question_count} questions`
                                        : "Aucune question"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditModal(course)}
                                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      course.id,
                                      course.name,
                                      course.question_count,
                                    )
                                  }
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Render Modal */}
      {isModalOpen && (
        <CourseEditModal
          course={editingCourse}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
