'use client';

import { useState, useMemo, useEffect } from 'react';
import { Question, QuestionFormData } from '@/types/database';
import { YEARS, EXAM_TYPES, OPTION_LABELS } from '@/lib/constants';
import { PREDEFINED_MODULES, PREDEFINED_SUBDISCIPLINES } from '@/lib/predefined-modules';
import { createQuestion, getQuestions, deleteQuestion as deleteQuestionAPI, updateQuestion } from '@/lib/api/questions';
import { getCourses, createCourse } from '@/lib/api/courses';
import { getModules } from '@/lib/api/modules';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export default function QuestionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const [activeCourseInputIndex, setActiveCourseInputIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    year: '1',
    moduleId: '',
    examType: 'EMD',
    number: 1,
    questionText: '',
    speciality: 'Médecine',
    cours: [''],
    facultySource: undefined,
    answers: [
      { optionLabel: 'A', answerText: '', isCorrect: false },
      { optionLabel: 'B', answerText: '', isCorrect: false },
      { optionLabel: 'C', answerText: '', isCorrect: false },
      { optionLabel: 'D', answerText: '', isCorrect: false },
      { optionLabel: 'E', answerText: '', isCorrect: false },
    ],
  });
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (user) {
          setUserRole(user.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  // Get modules for selected year
  const availableModules = useMemo(() => {
    return PREDEFINED_MODULES.filter(m => m.year === formData.year);
  }, [formData.year]);

  // Get selected module details
  const selectedModule = useMemo(() => {
    return availableModules.find(m => m.name === formData.moduleId);
  }, [availableModules, formData.moduleId]);

  // Get sub-disciplines if module has them
  const availableSubDisciplines = useMemo(() => {
    if (selectedModule?.hasSubDisciplines && selectedModule.name) {
      return PREDEFINED_SUBDISCIPLINES[selectedModule.name] || [];
    }
    return [];
  }, [selectedModule]);

  // Get available exam types for selected module
  const availableExamTypes = useMemo(() => {
    return selectedModule?.examTypes || [];
  }, [selectedModule]);

  const [listFilters, setListFilters] = useState({
    year: '',
    moduleId: '', // module_name
    cours: '',
    examType: ''
  });

  const [filterCourses, setFilterCourses] = useState<string[]>([]);
  
  // Get modules for filter
  const filterModules = useMemo(() => {
    if (!listFilters.year) return [];
    return PREDEFINED_MODULES.filter(m => m.year === listFilters.year);
  }, [listFilters.year]);

  // Fetch courses for filter
  useEffect(() => {
    const fetchFilterCourses = async () => {
      if (listFilters.year && listFilters.moduleId) {
        // We can pass speciality if we had it in filters, but generic fetch is okay or assume Médecine
        // Ideally we should add speciality to filters too. 
        // For now let's try to fetch all courses for this module regardless of speciality 
        // OR add speciality to filter. Let's add speciality to filter for completeness.
        const result = await getCourses(
          listFilters.year, 
          'Médecine', // Defaulting to Médecine for now as it's the main one
          listFilters.moduleId
        );
        if (result.success) {
          setFilterCourses(result.data.map((c: any) => c.name));
        }
      } else {
        setFilterCourses([]);
      }
    };
    fetchFilterCourses();
  }, [listFilters.year, listFilters.moduleId]);

  // Load questions on mount

  useEffect(() => {
    loadQuestions();
  }, []);

  // Fetch courses when dependencies change
  useEffect(() => {
    const fetchCourses = async () => {
      if (formData.year && formData.speciality && formData.moduleId) {
        setFetchingCourses(true);
        const result = await getCourses(
          formData.year,
          formData.speciality,
          formData.moduleId
        );
        if (result.success) {
          setAvailableCourses(result.data.map((c: any) => c.name));
        }
        setFetchingCourses(false);
      } else {
        setAvailableCourses([]);
      }
    };
    fetchCourses();
  }, [formData.year, formData.speciality, formData.moduleId]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    const result = await getQuestions({
        year: listFilters.year || undefined,
        module_name: listFilters.moduleId || undefined,
        exam_type: listFilters.examType || undefined,
        cours: listFilters.cours || undefined
    });
    if (result.success) {
      setQuestions(result.data);
    } else {
      setError(result.error || 'Failed to load questions');
    }
    setLoading(false);
  };

  // Reload when filters change
  useEffect(() => {
    loadQuestions();
  }, [listFilters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validation
    const hasCorrectAnswer = formData.answers.some(a => a.isCorrect && a.answerText.trim());
    if (!hasCorrectAnswer) {
      setError('Veuillez marquer au moins une réponse comme correcte.');
      setSaving(false);
      return;
    }

    const validAnswers = formData.answers.filter(a => a.answerText.trim());
    if (validAnswers.length < 2) {
      setError('Veuillez fournir au moins 2 options de réponse.');
      setSaving(false);
      return;
    }

    // Validate cours
    const validCours = (formData.cours || []).map(c => c.trim()).filter(c => c);
    if (validCours.length === 0) {
      setError('Veuillez fournir au moins un cours.');
      setSaving(false);
      return;
    }

    // Register new courses
    for (const coursName of validCours) {
        await createCourse({
            name: coursName,
            year: formData.year,
            speciality: formData.speciality || 'Médecine',
            module_name: formData.moduleId
        });
    }

    // Prepare data for Supabase
    const questionData = {
      year: formData.year,
      module_name: formData.moduleId, // moduleId is actually the module name
      sub_discipline: formData.subDisciplineId || undefined,
      exam_type: formData.examType,
      exam_year: formData.examYear || undefined,
      number: formData.number,
      question_text: formData.questionText,
      speciality: formData.speciality || undefined,
      cours: validCours,
      unity_name: formData.unityName || undefined,
      module_type: formData.moduleType || selectedModule?.type,
      faculty_source: formData.facultySource || undefined,
      answers: validAnswers.map((answer, idx) => ({
        option_label: answer.optionLabel as 'A' | 'B' | 'C' | 'D' | 'E',
        answer_text: answer.answerText,
        is_correct: answer.isCorrect,
        display_order: idx + 1,
      })),
    };

    // Save or update to Supabase
    const result = editingId 
      ? await updateQuestion(editingId, questionData)
      : await createQuestion(questionData);

    if (result.success) {
      setSuccess(editingId ? '✅ Question modifiée avec succès!' : '✅ Question ajoutée avec succès!');
      // Reload questions
      await loadQuestions();

      if (editingId) {
        setShowForm(false);
        setEditingId(null);
      } else {
        // Keep form open for faster entry
        // Preserve context (Speciality -> Exam Year), increment number, clear content
        setFormData(prev => ({
          ...prev,
          number: prev.number + 1,
          questionText: '',
          cours: [''],
          answers: [
            { optionLabel: 'A', answerText: '', isCorrect: false },
            { optionLabel: 'B', answerText: '', isCorrect: false },
            { optionLabel: 'C', answerText: '', isCorrect: false },
            { optionLabel: 'D', answerText: '', isCorrect: false },
            { optionLabel: 'E', answerText: '', isCorrect: false },
          ],
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || `Erreur lors de ${editingId ? 'la modification' : 'l\'ajout'} de la question`);
    }

    setSaving(false);
  };

  const resetForm = () => {
    setFormData({
      year: '1',
      moduleId: '',
      examType: 'EMD',
      number: 1,
      questionText: '',
      speciality: 'Médecine',
      cours: [''],
      facultySource: undefined,
      answers: [
        { optionLabel: 'A', answerText: '', isCorrect: false },
        { optionLabel: 'B', answerText: '', isCorrect: false },
        { optionLabel: 'C', answerText: '', isCorrect: false },
        { optionLabel: 'D', answerText: '', isCorrect: false },
        { optionLabel: 'E', answerText: '', isCorrect: false },
      ],
    });
    setEditingId(null);
  };

  const editQuestion = (question: any) => {
    // Populate form with question data
    setFormData({
      year: question.year,
      moduleId: question.module_name,
      subDisciplineId: question.sub_discipline || undefined,
      examType: question.exam_type,
      examYear: question.exam_year || undefined,
      number: question.number,
      questionText: question.question_text,
      speciality: question.speciality || 'Médecine',
      cours: question.cours && question.cours.length > 0 ? question.cours : [''],
      unityName: question.unity_name || undefined,
      moduleType: question.module_type,
      facultySource: question.faculty_source || undefined,
      answers: question.answers.map((a: any) => ({
        optionLabel: a.option_label,
        answerText: a.answer_text,
        isCorrect: a.is_correct,
      })),
    });
    setEditingId(question.id);
    setShowForm(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper functions for cours management
  const addCoursInput = () => {
    setFormData({ ...formData, cours: [...(formData.cours || []), ''] });
  };

  const removeCoursInput = (index: number) => {
    const newCours = (formData.cours || []).filter((_, i) => i !== index);
    setFormData({ ...formData, cours: newCours.length > 0 ? newCours : [''] });
  };

  const updateCoursInput = (index: number, value: string) => {
    const newCours = [...(formData.cours || [])];
    newCours[index] = value;
    setFormData({ ...formData, cours: newCours });
  };

  const updateAnswer = (index: number, field: 'answerText' | 'isCorrect', value: any) => {
    const newAnswers = formData.answers.map((answer, i) =>
      i === index ? { ...answer, [field]: value } : answer
    );
    setFormData({ ...formData, answers: newAnswers });
  };

  const deleteQuestion = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      const result = await deleteQuestionAPI(id);
      if (result.success) {
        setSuccess('✅ Question supprimée avec succès!');
        await loadQuestions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    }
  };

  // Group questions by module and exam type
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    questions.forEach(q => {
      const key = `${q.year}-${q.module_name}-${q.exam_type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });
    // Sort questions by number within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.number - b.number);
    });
    return groups;
  }, [questions]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
            Questions MCQ
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Ajouter et gérer les questions à choix multiples
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/export"
            className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base whitespace-nowrap"
          >
            📤 Exporter JSON
          </a>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base whitespace-nowrap"
          >
            {showForm ? "Annuler" : "➕ Nouvelle Question"}
          </button>
        </div>
      </div>

      {/* Supabase Setup Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Configuration Supabase Requise
              </h3>
              <p className="text-yellow-800 mb-3">
                Supabase n&apos;est pas configuré. Pour utiliser cette
                interface, vous devez:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-yellow-800 mb-4">
                <li>
                  Créer un projet Supabase sur{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    supabase.com
                  </a>
                </li>
                <li>
                  Exécuter les fichiers SQL dans{" "}
                  <code className="bg-yellow-100 px-2 py-1 rounded">
                    supabase/
                  </code>
                </li>
                <li>
                  Copier{" "}
                  <code className="bg-yellow-100 px-2 py-1 rounded">
                    .env.local.example
                  </code>{" "}
                  vers{" "}
                  <code className="bg-yellow-100 px-2 py-1 rounded">
                    .env.local
                  </code>
                </li>
                <li>
                  Ajouter vos identifiants Supabase dans{" "}
                  <code className="bg-yellow-100 px-2 py-1 rounded">
                    .env.local
                  </code>
                </li>
                <li>Redémarrer le serveur de développement</li>
              </ol>
              <p className="text-sm text-yellow-700">
                📖 Consultez{" "}
                <code className="bg-yellow-100 px-2 py-1 rounded">
                  SUPABASE_SETUP.md
                </code>{" "}
                pour les instructions détaillées
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">Total Questions</p>
          <p className="text-xl md:text-3xl font-bold text-gray-900">
            {questions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">Modules Couverts</p>
          <p className="text-xl md:text-3xl font-bold text-blue-600">
            {new Set(questions.map((q) => q.module_name)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <p className="text-gray-500 text-xs md:text-sm">
            Types d&apos;Examens
          </p>
          <p className="text-xl md:text-3xl font-bold text-green-600">
            {new Set(questions.map((q) => q.exam_type)).size}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">
            {editingId ? "✏️ Modifier la Question" : "Ajouter une Question"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Section 1: Détails de la Question */}
            <div className="border-2 border-gray-200 rounded-lg p-4 md:p-6 bg-gray-50">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-700 border-b pb-2">
                📖 Détails de la Question
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Spécialité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialité 
                  </label>
                  <select
                    value={formData.speciality || "Médecine"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        speciality: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Médecine">Médecine</option>
                  </select>
                </div>

                {/* Année */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année d&apos;Étude 
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: e.target.value as any,
                        moduleId: "",
                        subDisciplineId: undefined,
                        examType: "EMD",
                        unityName: undefined,
                        moduleType: undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {YEARS.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module / Unité 
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => {
                      const selectedMod = availableModules.find(
                        (m) => m.name === e.target.value
                      );
                      setFormData({
                        ...formData,
                        moduleId: e.target.value,
                        subDisciplineId: undefined,
                        examType: availableExamTypes[0] || "EMD",
                        unityName:
                          selectedMod?.type === "uei"
                            ? e.target.value
                            : undefined,
                        moduleType: selectedMod?.type,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un module/ Unité</option>
                    {availableModules.map((module) => (
                      <option key={module.name} value={module.name}>
                        {module.type === "uei" && "🟢 UEI: "}
                        {module.type === "standalone" && "🟡 "}
                        {module.type === "annual" && "🔵 "}
                        {module.type === "semestrial" && "🔵 "}
                        {module.name}
                      </option>
                    ))}
                  </select>
                  {selectedModule && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedModule.type === "uei" &&
                        "🟢 Unité d'Enseignement Intégré (UEI)"}
                      {selectedModule.type === "standalone" &&
                        "🟡 Module Autonome"}
                      {selectedModule.type === "annual" && "🔵 Module Annuel"}
                      {selectedModule.type === "semestrial" &&
                        "🔵 Module Semestriel"}
                    </p>
                  )}
                </div>

                {/* Sub-discipline (if applicable) */}
                {availableSubDisciplines.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module  
                    </label>
                    <select
                      value={formData.subDisciplineId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subDisciplineId: e.target.value || undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucune (optionnel)</option>
                      {availableSubDisciplines.map((subDisc) => (
                        <option key={subDisc} value={subDisc}>
                          {subDisc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Source de la Faculté */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source de la Question
                  </label>
                  <select
                    value={formData.facultySource || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        facultySource: (e.target.value as any) || undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Non spécifié</option>
                    <option value="fac_mere">🏛️ Faculté de Constantine (Fac Mère)</option>
                    <option value="annexe_biskra">🏫 Annexe de Biskra</option>
                    <option value="annexe_oum_el_bouaghi">🏫 Annexe d&apos;Oum El Bouaghi</option>
                    <option value="annexe_khenchela">🏫 Annexe de Khenchela</option>
                    <option value="annexe_souk_ahras">🏫 Annexe de Souk Ahras</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Indiquez la source exacte de la question (Fac Mère ou Annexe spécifique)
                  </p>
                </div>
              </div>

              {/* Type d'Examen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d&apos;Examen *
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      examType: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.moduleId}
                >
                  <option value="">Sélectionner le type</option>
                  {availableExamTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Année de l'Examen (Promo) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année de l&apos;Examen (Promo)
                </label>
                <select
                  value={formData.examYear || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      examYear: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner la promo</option>
                  {formData.year === "1" &&
                    Array.from({ length: 8 }, (_, i) => 2025 - i).map(
                      (year) => (
                        <option key={year} value={year}>
                          M{year - 2000}
                        </option>
                      )
                    )}
                  {formData.year === "2" &&
                    Array.from({ length: 7 }, (_, i) => 2024 - i).map(
                      (year) => (
                        <option key={year} value={year}>
                          M{year - 2000}
                        </option>
                      )
                    )}
                  {formData.year === "3" &&
                    Array.from({ length: 6 }, (_, i) => 2023 - i).map(
                      (year) => (
                        <option key={year} value={year}>
                          M{year - 2000}
                        </option>
                      )
                    )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.year === "1" && "1ère année: 2018-2025"}
                  {formData.year === "2" && "2ème année: 2018-2024"}
                  {formData.year === "3" && "3ème année: 2018-2023"}
                </p>
              </div>

              {/* Numéro de la Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de la Question *
                </label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              {/* Cours (Multiple) */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Cours *
                </label>
                <div className="space-y-2">
                  {(formData.cours || [""]).map((cours, index) => (
                    <div key={index} className="flex gap-2 relative">
                        <div className="flex-1 relative">
                            <input
                            type="text"
                            value={cours}
                            onFocus={() => setActiveCourseInputIndex(index)}
                            onChange={(e) =>
                                updateCoursInput(index, e.target.value)
                            }
                            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base pr-8"
                            placeholder={fetchingCourses ? "Chargement..." : "Nom du cours"}
                            required
                            />
                            {fetchingCourses && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                </div>
                            )}
                            
                            {/* Custom Dropdown */}
                            {activeCourseInputIndex === index && availableCourses.length > 0 && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setActiveCourseInputIndex(null)}
                                        aria-hidden="true"
                                    ></div>
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        <div className="sticky top-0 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 border-b flex justify-between items-center">
                                            <span>Cours disponibles</span>
                                            <button 
                                                type="button" 
                                                className="text-gray-400 hover:text-gray-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveCourseInputIndex(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {availableCourses
                                            .filter(c => c.toLowerCase().includes(cours.toLowerCase()))
                                            .map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateCoursInput(index, c);
                                                    setActiveCourseInputIndex(null);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm border-b border-gray-50 last:border-0"
                                            >
                                                {c}
                                            </button>
                                        ))}
                                        {availableCourses.filter(c => c.toLowerCase().includes(cours.toLowerCase())).length === 0 && (
                                            <div className="px-4 py-2 text-sm text-gray-500 italic">
                                                Nouveau cours sera créé...
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                      {index === (formData.cours || []).length - 1 ? (
                        <button
                          type="button"
                          onClick={addCoursInput}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                        >
                          +
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeCoursInput(index)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vous pouvez ajouter plusieurs cours en cliquant sur le bouton
                  +
                </p>
              </div>

              {/* Question Text */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Texte de la Question *
                </label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) =>
                    setFormData({ ...formData, questionText: e.target.value })
                  }
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  rows={4}
                  placeholder="Entrez votre question ici..."
                  required
                />
              </div>
            </div>

            {/* Section 2: Options de Réponse */}
            <div className="border-2 border-gray-200 rounded-lg p-4 md:p-6 bg-gray-50">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-700 border-b pb-2">
                ✅ Options de Réponse
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                Entrez les options de réponse (A-E) et cochez les bonnes
                réponses. Vous pouvez avoir plusieurs bonnes réponses.
              </p>

              <div className="space-y-3 md:space-y-4">
                {formData.answers.map((answer, index) => (
                  <div
                    key={answer.optionLabel}
                    className="border border-gray-300 rounded-lg p-3 md:p-4 bg-white"
                  >
                    <div className="flex items-start gap-2 md:gap-4">
                      <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-base md:text-lg">
                        {answer.optionLabel}
                      </div>

                      <div className="flex-1 space-y-2 md:space-y-3">
                        <input
                          type="text"
                          value={answer.answerText}
                          onChange={(e) =>
                            updateAnswer(index, "answerText", e.target.value)
                          }
                          className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                          placeholder={`Texte de la réponse ${answer.optionLabel}...`}
                        />

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answer.isCorrect}
                            onChange={(e) =>
                              updateAnswer(index, "isCorrect", e.target.checked)
                            }
                            className="w-4 h-4 md:w-5 md:h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            Réponse correcte
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
                💡 Au moins une réponse doit être marquée comme correcte
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {saving
                  ? "⏳ Enregistrement..."
                  : editingId
                  ? "✅ Modifier la Question"
                  : "✅ Enregistrer la Question"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 md:px-6 py-2 md:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm md:text-base"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold">
            Liste des Questions ({questions.length})
          </h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
                value={listFilters.year}
                onChange={e => setListFilters(prev => ({ ...prev, year: e.target.value, moduleId: '', cours: '' }))}
                className="px-3 py-2 border rounded-lg text-sm"
            >
                <option value="">Toutes les années</option>
                {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>

            <select
                value={listFilters.moduleId}
                onChange={e => setListFilters(prev => ({ ...prev, moduleId: e.target.value, cours: '' }))}
                className="px-3 py-2 border rounded-lg text-sm max-w-[200px]"
                disabled={!listFilters.year}
            >
                <option value="">Tous les modules</option>
                {filterModules.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>

             <select
                value={listFilters.cours}
                onChange={e => setListFilters(prev => ({ ...prev, cours: e.target.value }))}
                className="px-3 py-2 border rounded-lg text-sm max-w-[200px]"
                disabled={!listFilters.moduleId}
            >
                <option value="">Tous les cours</option>
                {filterCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {loading ? (
            <p className="text-gray-500 text-center py-8">
              ⏳ Chargement des questions...
            </p>
          ) : questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune question ajoutée. Cliquez sur &quot;Nouvelle Question&quot;
              pour commencer.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedQuestions).map(([key, groupQuestions]) => {
                const [year, moduleName, examType] = key.split("-");
                return (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      {YEARS.find((y) => y.value === year)?.label} -{" "}
                      {moduleName} ({examType})
                    </h3>
                    <div className="space-y-4">
                      {groupQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                Q{question.number}
                              </span>
                              {question.speciality && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                                  {question.speciality}
                                </span>
                              )}
                              {question.module_type === "uei" && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  🟢 UEI
                                </span>
                              )}
                              {question.module_type === "standalone" && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                  🟡 Autonome
                                </span>
                              )}
                              {question.sub_discipline && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  {question.sub_discipline}
                                </span>
                              )}
                              {question.cours && question.cours.length > 0 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  📚 {question.cours.join(", ")}
                                </span>
                              )}
                              {question.faculty_source && (
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    question.faculty_source === "fac_mere"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-teal-100 text-teal-700"
                                  }`}
                                >
                                  {question.faculty_source === "fac_mere" && "🏛️ Fac Mère"}
                                  {question.faculty_source === "annexe_biskra" && "🏫 Annexe Biskra"}
                                  {question.faculty_source === "annexe_oum_el_bouaghi" && "🏫 Annexe O.E.B"}
                                  {question.faculty_source === "annexe_khenchela" && "🏫 Annexe Khenchela"}
                                  {question.faculty_source === "annexe_souk_ahras" && "🏫 Annexe Souk Ahras"}
                                  {question.faculty_source === "annexe_bechar" && "🏫 Annexe Bechar"}
                                  {question.faculty_source === "annexe_laghouat" && "🏫 Annexe Laghouat"}
                                  {question.faculty_source === "annexe_ouargla" && "� Annexe Ouargla"}
                                  {/* Fallback for old/generic data */}
                                  {(question.faculty_source === "annexe" as any) && "🏫 Annexe"}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editQuestion(question)}
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                              >
                                ✏️ Modifier
                              </button>
                              {(userRole === 'owner' || userRole === 'admin') && (
                                <button
                                  onClick={() => deleteQuestion(question.id)}
                                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                >
                                  ✕ Supprimer
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-900 mb-3 font-medium">
                            {question.question_text}
                          </p>

                          <div className="space-y-2">
                            {question.answers.map((answer: any) => (
                              <div
                                key={answer.id}
                                className={`flex items-start gap-3 p-2 rounded ${
                                  answer.is_correct
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-gray-50"
                                }`}
                              >
                                <span className="font-bold text-sm min-w-[24px]">
                                  {answer.option_label.toUpperCase()}.
                                </span>
                                <span className="text-sm flex-1">
                                  {answer.answer_text}
                                </span>
                                {answer.is_correct && (
                                  <span className="text-green-600 text-sm font-medium">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
