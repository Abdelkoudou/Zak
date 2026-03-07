"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  PREDEFINED_MODULES,
  PREDEFINED_SUBDISCIPLINES,
} from "@/lib/predefined-modules";
import { X, Save } from "lucide-react";

interface Course {
  id: string;
  name: string;
  module_name: string;
  sub_discipline: string | null;
  year: string;
  speciality: string;
}

interface CourseEditModalProps {
  course?: Course | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function CourseEditModal({
  course,
  onClose,
  onSuccess,
}: CourseEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const editingId = course?.id || null;
  const originalCourseName = course?.name || "";

  const [formData, setFormData] = useState({
    speciality: course?.speciality || "Médecine",
    year: course?.year || "1",
    module_name: course?.module_name || "",
    sub_discipline: course?.sub_discipline || "",
    name: course?.name || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
        onSuccess(
          isRenaming
            ? `✅ Cours renommé ! Les questions liées ont été mises à jour automatiquement.`
            : "✅ Cours mis à jour avec succès !",
        );
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
        onSuccess("✅ Cours ajouté avec succès !");
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Échec de l'opération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Decorative Top Accent */}
        <div
          className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${editingId ? "from-transparent via-amber-500 to-transparent" : "from-transparent via-primary-500 to-transparent"} opacity-60 transition-colors`}
        ></div>

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span
              className={`w-10 h-10 flex items-center justify-center rounded-xl ${editingId ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30" : "bg-primary-50 text-primary-600 dark:bg-primary-900/30"} text-base transition-colors`}
            >
              {editingId ? "✏️" : "✨"}
            </span>
            <div>
              {editingId ? "Modifier le Cours" : "Nouveau Cours"}
              {editingId && originalCourseName && (
                <div className="text-xs font-medium text-amber-500/80 mt-0.5 truncate max-w-[300px]">
                  {originalCourseName}
                </div>
              )}
            </div>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium flex items-start gap-2">
                <span className="shrink-0 mt-0.5">❌</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
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
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    value={formData.speciality}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
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
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-2">
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
                  <label className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>Sous-Discipline</span>
                    <span className="text-xs font-medium text-slate-400 normal-case">
                      Optionnel
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
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
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200"
                />

                {/* Rename indicator */}
                {editingId &&
                  originalCourseName &&
                  formData.name.trim() !== originalCourseName &&
                  formData.name.trim() !== "" && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">
                        Renommage détecté
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 line-through truncate max-w-[150px]">
                          {originalCourseName}
                        </span>
                        <span className="text-amber-500">→</span>
                        <span className="text-amber-700 dark:text-amber-300 font-semibold truncate max-w-[150px]">
                          {formData.name.trim()}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-500/80 dark:text-amber-400/60 mt-1.5 leading-tight">
                        Les questions et ressources liées seront mises à jour
                        automatiquement.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all dark:bg-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="course-form"
            disabled={loading}
            className={`flex-1 py-3.5 font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-white
              ${
                editingId
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                  : "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/25"
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : editingId ? (
              <>
                <Save className="w-5 h-5" /> Mettre à jour
              </>
            ) : (
              "Ajouter le Cours"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
