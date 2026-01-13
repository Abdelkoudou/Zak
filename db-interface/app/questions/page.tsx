'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Question, QuestionFormData } from '@/types/database';
import { YEARS, EXAM_TYPES, OPTION_LABELS } from '@/lib/constants';
import { PREDEFINED_MODULES, PREDEFINED_SUBDISCIPLINES } from '@/lib/predefined-modules';
import { createQuestion, getQuestions, deleteQuestion as deleteQuestionAPI, updateQuestion, getQuestionById, getExistingQuestionNumbers } from '@/lib/api/questions';
import { getCourses, createCourse } from '@/lib/api/courses';
import { getModules } from '@/lib/api/modules';
import { supabase, supabaseConfigured } from '@/lib/supabase';

function QuestionsPageContent() {
  const searchParams = useSearchParams();
  const editQuestionId = searchParams.get('edit');
  
  // localStorage key for autosave
  const AUTOSAVE_KEY = 'questions_form_autosave';
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const [fetchingNextNumber, setFetchingNextNumber] = useState(false);
  const [existingNumbers, setExistingNumbers] = useState<number[]>([]);
  const [activeCourseInputIndex, setActiveCourseInputIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [formData, setFormData] = useState<QuestionFormData>({
    year: '1',
    moduleId: '',
    examType: 'EMD',
    examYear: undefined,
    number: 1,
    questionText: '',
    speciality: 'Médecine',
    cours: [''],
    facultySource: undefined,
    imageUrl: undefined,
    explanation: '',
    answers: [
      { optionLabel: 'A', answerText: '', isCorrect: false },
      { optionLabel: 'B', answerText: '', isCorrect: false },
      { optionLabel: 'C', answerText: '', isCorrect: false },
      { optionLabel: 'D', answerText: '', isCorrect: false },
      { optionLabel: 'E', answerText: '', isCorrect: false },
    ],
  });
  const [userRole, setUserRole] = useState<string | null>(null);

  // Load saved form context from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore context fields, not content fields
        setFormData(prev => ({
          ...prev,
          year: parsed.year || prev.year,
          moduleId: parsed.moduleId || prev.moduleId,
          subDisciplineId: parsed.subDisciplineId,
          examType: parsed.examType || prev.examType,
          examYear: parsed.examYear,
          speciality: parsed.speciality || prev.speciality,
          unityName: parsed.unityName,
          moduleType: parsed.moduleType,
          facultySource: parsed.facultySource,
        }));
        console.log('[Autosave] Restored form context from localStorage');
      }
    } catch (e) {
      console.error('[Autosave] Failed to load saved form context:', e);
    }
    setFormDataLoaded(true);
  }, []);

  // Save form context to localStorage when context fields change
  useEffect(() => {
    // Don't save until initial load is complete
    if (!formDataLoaded) return;
    
    try {
      const contextToSave = {
        year: formData.year,
        moduleId: formData.moduleId,
        subDisciplineId: formData.subDisciplineId,
        examType: formData.examType,
        examYear: formData.examYear,
        speciality: formData.speciality,
        unityName: formData.unityName,
        moduleType: formData.moduleType,
        facultySource: formData.facultySource,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(contextToSave));
    } catch (e) {
      console.error('[Autosave] Failed to save form context:', e);
    }
  }, [
    formDataLoaded,
    formData.year,
    formData.moduleId,
    formData.subDisciplineId,
    formData.examType,
    formData.examYear,
    formData.speciality,
    formData.unityName,
    formData.moduleType,
    formData.facultySource,
  ]);

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
    subDiscipline: '',
    cours: '',
    examType: '',
    examYear: '' // promo
  });

  const [filterCourses, setFilterCourses] = useState<string[]>([]);
  
  // Get modules for filter
  const filterModules = useMemo(() => {
    if (!listFilters.year) return [];
    return PREDEFINED_MODULES.filter(m => m.year === listFilters.year);
  }, [listFilters.year]);

  // Get selected module for filter
  const filterSelectedModule = useMemo(() => {
    return filterModules.find(m => m.name === listFilters.moduleId);
  }, [filterModules, listFilters.moduleId]);

  // Get sub-disciplines for filter
  const filterSubDisciplines = useMemo(() => {
    if (filterSelectedModule?.hasSubDisciplines && filterSelectedModule.name) {
      return PREDEFINED_SUBDISCIPLINES[filterSelectedModule.name] || [];
    }
    return [];
  }, [filterSelectedModule]);

  // Fetch courses for filter
  useEffect(() => {
    const fetchFilterCourses = async () => {
      if (listFilters.year && listFilters.moduleId) {
        setFetchingCourses(true);
        const result = await getCourses(
          listFilters.year, 
          'Médecine', 
          listFilters.moduleId,
          listFilters.subDiscipline || undefined
        );
        if (result.success) {
          setFilterCourses(result.data.map((c: any) => c.name));
        }
        setFetchingCourses(false);
      } else {
        setFilterCourses([]);
      }
    };
    fetchFilterCourses();
  }, [listFilters.year, listFilters.moduleId, listFilters.subDiscipline]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getQuestions({
        year: listFilters.year || undefined,
        module_name: listFilters.moduleId || undefined,
        sub_discipline: listFilters.subDiscipline || undefined,
        exam_type: listFilters.examType || undefined,
        exam_year: listFilters.examYear ? parseInt(listFilters.examYear) : undefined,
        cours: listFilters.cours || undefined
    });
    if (result.success) {
      setQuestions(result.data);
    } else {
      setError(result.error || 'Failed to load questions');
    }
    setLoading(false);
  }, [listFilters]);

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Handle edit query parameter from URL (e.g., from reports page)
  useEffect(() => {
    const loadQuestionForEdit = async () => {
      if (editQuestionId) {
        const result = await getQuestionById(editQuestionId);
        if (result.success && result.data) {
          editQuestion(result.data);
        }
      }
    };
    loadQuestionForEdit();
  }, [editQuestionId]);

  // Fetch courses when dependencies change
  useEffect(() => {
    const fetchCourses = async () => {
      if (formData.year && formData.speciality && formData.moduleId) {
        setFetchingCourses(true);
        const result = await getCourses(
          formData.year,
          formData.speciality,
          formData.moduleId,
          formData.subDisciplineId
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
  }, [formData.year, formData.speciality, formData.moduleId, formData.subDisciplineId]);

  // Auto-fetch existing question numbers when module/exam context changes
  useEffect(() => {
    const fetchExistingNumbers = async () => {
      // Only fetch if we have the required fields and not editing
      if (formData.year && formData.moduleId && formData.examType && !editingId) {
        setFetchingNextNumber(true);
        const result = await getExistingQuestionNumbers({
          year: formData.year,
          module_name: formData.moduleId,
          sub_discipline: formData.subDisciplineId,
          exam_type: formData.examType,
          exam_year: formData.examYear,
        });
        if (result.success && result.data) {
          const numbers = result.data.existingNumbers as number[];
          setExistingNumbers(numbers);
          // Only auto-set number if current number is already taken or is default (1)
          if (numbers.includes(formData.number) || formData.number === 1) {
            setFormData(prev => ({ ...prev, number: result.data.suggestedNext }));
          }
        }
        setFetchingNextNumber(false);
      } else {
        setExistingNumbers([]);
      }
    };
    fetchExistingNumbers();
  }, [formData.year, formData.moduleId, formData.subDisciplineId, formData.examType, formData.examYear, editingId]);

  // Reload when filters change
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validation: exam_year is required
    if (!formData.examYear) {
      setError('Veuillez sélectionner l\'année de l\'examen (promo). C\'est obligatoire pour éviter les doublons.');
      setSaving(false);
      return;
    }

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
            module_name: formData.moduleId,
            sub_discipline: formData.subDisciplineId
        });
    }

    // Prepare data for Supabase
    const questionData = {
      year: formData.year,
      module_name: formData.moduleId, // moduleId is actually the module name
      sub_discipline: formData.subDisciplineId || undefined,
      exam_type: formData.examType,
      exam_year: formData.examYear!,  // Already validated as required above
      number: formData.number,
      question_text: formData.questionText,
      speciality: formData.speciality || undefined,
      cours: validCours,
      unity_name: formData.unityName || undefined,
      module_type: formData.moduleType || selectedModule?.type,
      faculty_source: formData.facultySource || undefined,
      image_url: formData.imageUrl || undefined,
      explanation: formData.explanation || undefined,
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
        // Fetch existing numbers to update the list and suggest next
        const numbersResult = await getExistingQuestionNumbers({
          year: formData.year,
          module_name: formData.moduleId,
          sub_discipline: formData.subDisciplineId,
          exam_type: formData.examType,
          exam_year: formData.examYear,
        });
        
        if (numbersResult.success) {
          setExistingNumbers(numbersResult.data.existingNumbers);
        }
        
        const nextNumber = numbersResult.success ? numbersResult.data.suggestedNext : formData.number + 1;
        
        // Preserve context fields explicitly (year, module, examType, examYear, speciality, etc.)
        // Clear only content fields (questionText, cours, answers, etc.)
        setFormData(prev => ({
          // Explicitly preserve all context fields
          year: prev.year,
          moduleId: prev.moduleId,
          subDisciplineId: prev.subDisciplineId,
          examType: prev.examType,
          examYear: prev.examYear,  // IMPORTANT: Keep the promo year!
          speciality: prev.speciality,
          unityName: prev.unityName,
          moduleType: prev.moduleType,
          facultySource: prev.facultySource,
          // Set next question number
          number: nextNumber,
          // Clear content fields for new question
          questionText: '',
          cours: [''],
          imageUrl: undefined,
          explanation: '',
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

  const resetForm = (clearContext: boolean = false) => {
    if (clearContext) {
      // Full reset - clear everything including context
      setFormData({
        year: '1',
        moduleId: '',
        examType: 'EMD',
        examYear: undefined,
        number: 1,
        questionText: '',
        speciality: 'Médecine',
        cours: [''],
        facultySource: undefined,
        imageUrl: undefined,
        explanation: '',
        answers: [
          { optionLabel: 'A', answerText: '', isCorrect: false },
          { optionLabel: 'B', answerText: '', isCorrect: false },
          { optionLabel: 'C', answerText: '', isCorrect: false },
          { optionLabel: 'D', answerText: '', isCorrect: false },
          { optionLabel: 'E', answerText: '', isCorrect: false },
        ],
      });
    } else {
      // Partial reset - preserve context fields (year, module, examType, examYear, etc.)
      setFormData(prev => ({
        ...prev,
        number: 1,
        questionText: '',
        cours: [''],
        imageUrl: undefined,
        explanation: '',
        answers: [
          { optionLabel: 'A', answerText: '', isCorrect: false },
          { optionLabel: 'B', answerText: '', isCorrect: false },
          { optionLabel: 'C', answerText: '', isCorrect: false },
          { optionLabel: 'D', answerText: '', isCorrect: false },
          { optionLabel: 'E', answerText: '', isCorrect: false },
        ],
      }));
    }
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
      imageUrl: question.image_url || undefined,
      explanation: question.explanation || '',
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

  // Handle image upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image est trop grande. Taille maximum: 5MB.');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      // Update form data with image URL
      setFormData({ ...formData, imageUrl: publicUrl });
      setSuccess('✅ Image téléchargée avec succès!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setFormData({ ...formData, imageUrl: undefined });
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Questions MCQ
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Gestion du catalogue • FMC APP
          </p>
        </div>
        <div className="flex gap-3">
          {userRole === 'owner' && (
            <a
              href="/export"
              className="px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm font-bold shadow-sm flex items-center gap-2"
            >
              <span>📤</span> Exporter JSON
            </a>
          )}
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className={`px-6 py-3 rounded-2xl transition-all text-sm font-bold shadow-lg flex items-center gap-2 ${
              showForm 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 shadow-none" 
                : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20 active:scale-[0.98]"
            }`}
          >
            {showForm ? "Annuler" : <><span>➕</span> Nouvelle Question</>}
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Questions', value: questions.length, icon: '❓', color: 'primary' },
          { label: 'Modules', value: new Set(questions.map((q) => q.module_name)).size, icon: '📚', color: 'blue' },
          { label: 'Exam Types', value: new Set(questions.map((q) => q.exam_type)).size, icon: '📝', color: 'green' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="w-10 h-10 flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600">
                {editingId ? "✏️" : "✨"}
              </span>
              {editingId ? "Modifier la Question" : "Ajouter une Question"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Sauvegarde auto activée</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Détails de la Question */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="flex-1 h-px bg-slate-100 dark:bg-white/5"></span>
                Détails Académiques
                <span className="flex-1 h-px bg-slate-100 dark:bg-white/5"></span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Spécialité */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
                    required
                  >
                    <option value="Médecine">Médecine</option>
                  </select>
                </div>

                {/* Année */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
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
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mt-2 ml-1">
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
                    >
                      <option value="">Aucune (obligatoire)</option>
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
                  >
                    <option value="">Non spécifié</option>
                    <option value="fac_mere">🏛️ Faculté de Constantine (Fac Mère)</option>
                    <option value="annexe_biskra">🏫 Annexe de Biskra</option>
                    <option value="annexe_oum_el_bouaghi">🏫 Annexe d&apos;Oum El Bouaghi</option>
                    <option value="annexe_khenchela">🏫 Annexe de Khenchela</option>
                    <option value="annexe_souk_ahras">🏫 Annexe de Souk Ahras</option>
                  </select>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mt-2 ml-1">
                    Indiquez la source exacte (Fac Mère ou Annexe)
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
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

              {/* Année de l'Examen (Promo) - REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année de l&apos;Examen (Promo) <span className="text-red-500">*</span>
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
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all ${
                    !formData.examYear ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-white/10'
                  }`}
                  required
                >
                  <option value="">⚠️ Sélectionner la promo (obligatoire)</option>
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
                {!formData.examYear && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    ⚠️ La promo est obligatoire pour éviter les doublons
                  </p>
                )}
                {formData.examYear && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.year === "1" && "1ère année: 2018-2025"}
                    {formData.year === "2" && "2ème année: 2018-2024"}
                    {formData.year === "3" && "3ème année: 2018-2023"}
                  </p>
                )}
              </div>

              {/* Numéro de la Question */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Numéro de la Question *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        number: parseInt(e.target.value) || 1,
                      })
                    }
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all pr-10 ${
                      existingNumbers.includes(formData.number) && !editingId
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                    min="1"
                    required
                  />
                  {fetchingNextNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {/* Warning if number already exists */}
                {existingNumbers.includes(formData.number) && !editingId && (
                  <p className="text-xs text-red-500 mt-2 ml-1 font-medium">
                    ⚠️ Ce numéro existe déjà pour cet examen!
                  </p>
                )}
                {/* Show existing numbers */}
                {existingNumbers.length > 0 && (
                  <div className="mt-2 ml-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Questions déjà saisies ({existingNumbers.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {existingNumbers.slice(0, 30).map((num) => (
                        <span
                          key={num}
                          className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg ${
                            num === formData.number
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {num}
                        </span>
                      ))}
                      {existingNumbers.length > 30 && (
                        <span className="inline-flex items-center justify-center px-2 h-7 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          +{existingNumbers.length - 30}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {existingNumbers.length === 0 && !fetchingNextNumber && formData.moduleId && formData.examType && (
                  <p className="text-[10px] font-bold text-green-500 dark:text-green-400 uppercase tracking-wider mt-2 ml-1">
                    ✓ Aucune question saisie pour cet examen
                  </p>
                )}
              </div>

              {/* Cours (Multiple) */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Cours *
                </label>
                <div className="space-y-3">
                  {(formData.cours || [""]).map((cours, index) => (
                    <div key={index} className="flex gap-3 relative">
                        <div className="flex-1 relative">
                            <input
                            type="text"
                            value={cours}
                            onFocus={() => setActiveCourseInputIndex(index)}
                            onChange={(e) =>
                                updateCoursInput(index, e.target.value)
                            }
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all pr-10"
                            placeholder={fetchingCourses ? "Chargement..." : "Nom du cours"}
                            required
                            />
                            {fetchingCourses && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-primary-500 rounded-full border-t-transparent"></div>
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
                                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                                        <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex justify-between items-center z-10">
                                            <span className="uppercase tracking-[0.15em]">Cours disponibles</span>
                                            <button 
                                                type="button" 
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                                                className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 focus:bg-slate-50 dark:focus:bg-white/5 focus:outline-none text-sm border-b border-slate-100 dark:border-white/5 last:border-0 text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                {c}
                                            </button>
                                        ))}
                                        {availableCourses.filter(c => c.toLowerCase().includes(cours.toLowerCase())).length === 0 && (
                                            <div className="px-5 py-3 text-xs text-slate-400 dark:text-slate-500 italic">
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
                          className="px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-black shadow-lg shadow-primary-500/20 active:scale-[0.95] transition-all"
                        >
                          +
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeCoursInput(index)}
                          className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 font-black transition-all"
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
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Texte de la Question *
                </label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) =>
                    setFormData({ ...formData, questionText: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
                  rows={4}
                  placeholder="Entrez votre question ici..."
                  required
                />
              </div>

              {/* Explanation Text */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Explication (Optionnelle)
                </label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
                  rows={3}
                  placeholder="Expliquez la réponse correcte..."
                />
              </div>

              {/* Image Upload */}
              <div className="mt-4 md:mt-6">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  📷 Image (optionnelle)
                </label>
                
                {formData.imageUrl ? (
                  <div className="relative inline-block group">
                    <img 
                      src={formData.imageUrl} 
                      alt="Question image" 
                      className="max-w-full max-h-64 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg transition-transform hover:scale-[1.02]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3 bg-red-600 text-white rounded-xl w-10 h-10 flex items-center justify-center hover:bg-red-700 shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                      title="Supprimer l'image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer group">
                      <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-600 hover:text-white transition-all flex items-center gap-2 font-bold shadow-sm active:scale-95">
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <span>📤</span> Télécharger une image
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      JPG, PNG, GIF, WebP • Max 5MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Options de Réponse */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="flex-1 h-px bg-slate-100 dark:bg-white/5"></span>
                Options de Réponse
                <span className="flex-1 h-px bg-slate-100 dark:bg-white/5"></span>
              </h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                Cochez les bonnes réponses (Choix multiples supportés)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.answers.map((answer, index) => (
                  <div
                    key={answer.optionLabel}
                    className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl transition-all hover:border-primary-500/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-primary-500/20">
                        {answer.optionLabel}
                      </div>

                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={answer.answerText}
                          onChange={(e) =>
                            updateAnswer(index, "answerText", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all text-sm"
                          placeholder={`Option ${answer.optionLabel}...`}
                        />

                        <label className="flex items-center gap-3 cursor-pointer group/correct">
                          <input
                            type="checkbox"
                            checked={answer.isCorrect}
                            onChange={(e) =>
                              updateAnswer(index, "isCorrect", e.target.checked)
                            }
                            className="w-5 h-5 text-green-600 rounded-lg border-slate-300 dark:border-white/10 focus:ring-green-500 dark:bg-slate-900 transition-all"
                          />
                          <span className="text-[10px] font-bold text-slate-400 group-hover/correct:text-green-500 dark:text-slate-500 uppercase tracking-widest transition-colors">
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
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-black shadow-xl shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest active:scale-[0.98]"
              >
                {saving
                  ? "⏳ Enregistrement..."
                  : editingId
                  ? "Modifier la Question"
                  : "Enregistrer la Question"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-black text-sm uppercase tracking-widest"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Catalogue des Questions
            </h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              {questions.length} questions indexées
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
                value={listFilters.year}
                onChange={e => setListFilters(prev => ({ ...prev, year: e.target.value, moduleId: '', cours: '' }))}
                className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
            >
                <option value="">Toutes les années</option>
                {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>

            <select
                value={listFilters.moduleId}
                onChange={e => setListFilters(prev => ({ ...prev, moduleId: e.target.value, subDiscipline: '', cours: '' }))}
                className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all max-w-[180px]"
                disabled={!listFilters.year}
            >
                <option value="">Tous les modules</option>
                {filterModules.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>

            {filterSubDisciplines.length > 0 && (
                <select
                    value={listFilters.subDiscipline}
                    onChange={e => setListFilters(prev => ({ ...prev, subDiscipline: e.target.value, cours: '' }))}
                    className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all max-w-[180px]"
                >
                    <option value="">Tous les sous-modules</option>
                    {filterSubDisciplines.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            )}

             <select
                value={listFilters.cours}
                onChange={e => setListFilters(prev => ({ ...prev, cours: e.target.value }))}
                className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all max-w-[180px]"
                disabled={!listFilters.moduleId}
            >
                <option value="">Tous les cours</option>
                {filterCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
                value={listFilters.examType}
                onChange={e => setListFilters(prev => ({ ...prev, examType: e.target.value }))}
                className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
            >
                <option value="">Tous les types</option>
                {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <select
                value={listFilters.examYear}
                onChange={e => setListFilters(prev => ({ ...prev, examYear: e.target.value }))}
                className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
            >
                <option value="">Toutes les promos</option>
                {Array.from({ length: 8 }, (_, i) => 2025 - i).map(year => (
                  <option key={year} value={year}>M{year - 2000}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 pointer-events-none opacity-50">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent mb-4"></div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Chargement du catalogue...
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center text-3xl mb-4 grayscale opacity-50">
                📂
              </div>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Aucune question trouvée
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                Ajustez vos filtres ou créez une nouvelle question
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedQuestions).map(([key, groupQuestions]) => {
                const [year, moduleName, examType] = key.split("-");
                return (
                  <div key={key} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-white/5"></div>
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] bg-white dark:bg-slate-900 px-4 py-1.5 border border-slate-100 dark:border-white/5 rounded-full">
                        {YEARS.find((y) => y.value === year)?.label} • {moduleName} • {examType}
                      </h3>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-white/5"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {groupQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="group bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/20"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-primary-500/20">
                                Q{question.number}
                              </span>
                              {question.exam_year && (
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-500/20">
                                  M{question.exam_year - 2000}
                                </span>
                              )}
                              {!question.exam_year && (
                                <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-red-500/20">
                                  ⚠️ Sans promo
                                </span>
                              )}
                              {question.speciality && (
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                                  {question.speciality}
                                </span>
                              )}
                              {question.module_type === "uei" && (
                                <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-green-500/20">
                                  UEI
                                </span>
                              )}
                              {question.sub_discipline && (
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-purple-500/20">
                                  {question.sub_discipline}
                                </span>
                              )}
                              {question.faculty_source && (
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-amber-500/20">
                                  {question.faculty_source.replace('annexe_', '').replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editQuestion(question)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-all"
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              {(userRole === 'owner' || userRole === 'admin') && (
                                <button
                                  onClick={() => deleteQuestion(question.id)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                  title="Supprimer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-6">
                            <p className="text-slate-900 dark:text-slate-100 font-bold leading-relaxed">
                              {question.question_text}
                            </p>

                            {question.image_url && (
                              <div className="relative inline-block overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
                                <img 
                                  src={question.image_url} 
                                  alt="Question illustration" 
                                  className="max-w-full max-h-64 object-contain transition-transform hover:scale-105"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                              {question.answers.map((answer: any) => (
                                <div
                                  key={answer.id}
                                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                                    answer.is_correct
                                      ? "bg-green-50/50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 shadow-sm"
                                      : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5"
                                  }`}
                                >
                                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                                    answer.is_correct
                                      ? "bg-green-600 text-white"
                                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}>
                                    {answer.option_label.toUpperCase()}
                                  </span>
                                  <span className={`text-sm py-1.5 flex-1 ${
                                    answer.is_correct ? "text-slate-900 dark:text-white font-bold" : "text-slate-600 dark:text-slate-400"
                                  }`}>
                                    {answer.answer_text}
                                  </span>
                                  {answer.is_correct && (
                                    <span className="text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest mt-2">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {question.cours && question.cours.length > 0 && (
                              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cours associés:</span>
                                <div className="flex flex-wrap gap-2">
                                  {question.cours.map((c: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
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

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}
