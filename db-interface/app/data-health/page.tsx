'use client';

import { useState, useMemo, useEffect } from 'react';
import { YEARS, EXAM_TYPES } from '@/lib/constants';
import { PREDEFINED_MODULES } from '@/lib/predefined-modules';
import { getQuestions } from '@/lib/api/questions';

interface DataIssue {
  type: 'missing' | 'invalid' | 'mismatch';
  field: string;
  message: string;
}

interface QuestionWithIssues {
  question: any;
  issues: DataIssue[];
}

type IssueCategory = 
  | 'missing_year'
  | 'missing_module'
  | 'missing_exam_type'
  | 'missing_exam_year'
  | 'missing_answers'
  | 'invalid_year'
  | 'invalid_module'
  | 'no_correct_answer'
  | 'empty_question_text'
  | 'duplicate_number';

export default function DataHealthPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const result = await getQuestions();
    if (result.success) {
      setQuestions(result.data);
    }
    setLoading(false);
  };

  // Analyze questions for data issues
  const analyzedQuestions = useMemo(() => {
    const validYears = ['1', '2', '3'];
    const validModuleNames = PREDEFINED_MODULES.map(m => m.name);
    const validExamTypes = EXAM_TYPES.map(e => e.value);
    
    // Track question numbers for duplicate detection
    const numberMap = new Map<string, any[]>();
    
    return questions.map(q => {
      const issues: DataIssue[] = [];
      
      // Check for missing fields
      if (!q.year) {
        issues.push({ type: 'missing', field: 'year', message: 'Année manquante' });
      } else if (!validYears.includes(q.year)) {
        issues.push({ type: 'invalid', field: 'year', message: `Année invalide: "${q.year}"` });
      }
      
      if (!q.module_name) {
        issues.push({ type: 'missing', field: 'module_name', message: 'Module manquant' });
      } else if (!validModuleNames.includes(q.module_name)) {
        issues.push({ type: 'invalid', field: 'module_name', message: `Module non reconnu: "${q.module_name}"` });
      }
      
      if (!q.exam_type) {
        issues.push({ type: 'missing', field: 'exam_type', message: 'Type d\'examen manquant' });
      } else if (!validExamTypes.includes(q.exam_type)) {
        issues.push({ type: 'invalid', field: 'exam_type', message: `Type d'examen invalide: "${q.exam_type}"` });
      }
      
      if (!q.exam_year) {
        issues.push({ type: 'missing', field: 'exam_year', message: 'Promo (année d\'examen) manquante' });
      }
      
      if (!q.question_text || q.question_text.trim() === '') {
        issues.push({ type: 'missing', field: 'question_text', message: 'Texte de la question vide' });
      }
      
      // Check answers
      if (!q.answers || q.answers.length === 0) {
        issues.push({ type: 'missing', field: 'answers', message: 'Aucune réponse définie' });
      } else {
        const hasCorrectAnswer = q.answers.some((a: any) => a.is_correct);
        if (!hasCorrectAnswer) {
          issues.push({ type: 'invalid', field: 'answers', message: 'Aucune réponse correcte marquée' });
        }
        
        // Check for empty answer texts
        const emptyAnswers = q.answers.filter((a: any) => !a.answer_text || a.answer_text.trim() === '');
        if (emptyAnswers.length > 0) {
          issues.push({ type: 'missing', field: 'answers', message: `${emptyAnswers.length} réponse(s) vide(s)` });
        }
      }
      
      // Track for duplicates
      const key = `${q.year}-${q.module_name}-${q.sub_discipline || 'null'}-${q.exam_type}-${q.exam_year || 'null'}-${q.number}`;
      if (!numberMap.has(key)) {
        numberMap.set(key, []);
      }
      numberMap.get(key)!.push(q);
      
      return { question: q, issues };
    }).map(item => {
      // Add duplicate issues
      const key = `${item.question.year}-${item.question.module_name}-${item.question.sub_discipline || 'null'}-${item.question.exam_type}-${item.question.exam_year || 'null'}-${item.question.number}`;
      const duplicates = numberMap.get(key) || [];
      if (duplicates.length > 1) {
        item.issues.push({ 
          type: 'mismatch', 
          field: 'number', 
          message: `Numéro en double (${duplicates.length} questions avec le même numéro)` 
        });
      }
      return item;
    });
  }, [questions]);

  // Filter questions with issues
  const questionsWithIssues = useMemo(() => {
    return analyzedQuestions.filter(q => q.issues.length > 0);
  }, [analyzedQuestions]);

  // Filter by selected category
  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'all') return questionsWithIssues;
    
    const categoryFieldMap: Record<IssueCategory, { field: string; type?: string }> = {
      'missing_year': { field: 'year', type: 'missing' },
      'missing_module': { field: 'module_name', type: 'missing' },
      'missing_exam_type': { field: 'exam_type', type: 'missing' },
      'missing_exam_year': { field: 'exam_year', type: 'missing' },
      'missing_answers': { field: 'answers', type: 'missing' },
      'invalid_year': { field: 'year', type: 'invalid' },
      'invalid_module': { field: 'module_name', type: 'invalid' },
      'no_correct_answer': { field: 'answers', type: 'invalid' },
      'empty_question_text': { field: 'question_text', type: 'missing' },
      'duplicate_number': { field: 'number', type: 'mismatch' },
    };
    
    const { field, type } = categoryFieldMap[selectedCategory];
    return questionsWithIssues.filter(q => 
      q.issues.some(i => i.field === field && (!type || i.type === type))
    );
  }, [questionsWithIssues, selectedCategory]);

  // Stats by category
  const issueStats = useMemo(() => {
    const stats = {
      missing_year: 0,
      missing_module: 0,
      missing_exam_type: 0,
      missing_exam_year: 0,
      missing_answers: 0,
      invalid_year: 0,
      invalid_module: 0,
      no_correct_answer: 0,
      empty_question_text: 0,
      duplicate_number: 0,
    };
    
    questionsWithIssues.forEach(q => {
      q.issues.forEach(issue => {
        if (issue.field === 'year' && issue.type === 'missing') stats.missing_year++;
        if (issue.field === 'year' && issue.type === 'invalid') stats.invalid_year++;
        if (issue.field === 'module_name' && issue.type === 'missing') stats.missing_module++;
        if (issue.field === 'module_name' && issue.type === 'invalid') stats.invalid_module++;
        if (issue.field === 'exam_type' && issue.type === 'missing') stats.missing_exam_type++;
        if (issue.field === 'exam_year' && issue.type === 'missing') stats.missing_exam_year++;
        if (issue.field === 'answers' && issue.type === 'missing') stats.missing_answers++;
        if (issue.field === 'answers' && issue.type === 'invalid') stats.no_correct_answer++;
        if (issue.field === 'question_text') stats.empty_question_text++;
        if (issue.field === 'number') stats.duplicate_number++;
      });
    });
    
    return stats;
  }, [questionsWithIssues]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const healthScore = questions.length > 0 
    ? Math.round(((questions.length - questionsWithIssues.length) / questions.length) * 100) 
    : 100;

  const categories: { key: IssueCategory | 'all'; label: string; count: number; icon: string; color: string }[] = [
    { key: 'all', label: 'Tous les problèmes', count: questionsWithIssues.length, icon: '⚠️', color: 'slate' },
    { key: 'missing_exam_year', label: 'Promo manquante', count: issueStats.missing_exam_year, icon: '📅', color: 'amber' },
    { key: 'missing_answers', label: 'Sans réponses', count: issueStats.missing_answers, icon: '❌', color: 'red' },
    { key: 'no_correct_answer', label: 'Sans bonne réponse', count: issueStats.no_correct_answer, icon: '🎯', color: 'orange' },
    { key: 'empty_question_text', label: 'Texte vide', count: issueStats.empty_question_text, icon: '📝', color: 'pink' },
    { key: 'missing_year', label: 'Année manquante', count: issueStats.missing_year, icon: '📆', color: 'yellow' },
    { key: 'invalid_module', label: 'Module invalide', count: issueStats.invalid_module, icon: '📦', color: 'purple' },
    { key: 'duplicate_number', label: 'Numéros en double', count: issueStats.duplicate_number, icon: '🔢', color: 'blue' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Santé des Données
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Contrôle qualité • FMC APP
          </p>
        </div>
        <button
          onClick={loadQuestions}
          disabled={loading}
          className="px-6 py-3 bg-primary-500 text-white rounded-2xl font-bold text-sm hover:bg-primary-600 transition-all disabled:opacity-50"
        >
          {loading ? '⏳ Analyse...' : '🔄 Rafraîchir'}
        </button>
      </div>

      {/* Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`col-span-1 md:col-span-2 bg-gradient-to-br ${healthScore >= 90 ? 'from-green-500 to-emerald-600' : healthScore >= 70 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'} rounded-3xl p-6 text-white`}>
          <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">Score de Santé</p>
          <div className="flex items-end gap-4">
            <span className="text-6xl font-black">{healthScore}%</span>
            <span className="text-white/80 text-sm mb-2">
              {questions.length - questionsWithIssues.length} / {questions.length} questions valides
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">📊</span>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Questions</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{questions.length}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">⚠️</span>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avec Problèmes</p>
          </div>
          <p className="text-2xl font-black text-red-500">{questionsWithIssues.length}</p>
        </div>
      </div>

      {/* Issue Categories */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 mb-8">
        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">
          Catégories de Problèmes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                selectedCategory === cat.key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{cat.count}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {cat.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Questions avec Problèmes <span className="text-primary-500 ml-2">({filteredQuestions.length})</span>
          </h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4">
                Analyse en cours...
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-dashed border-green-200 dark:border-green-900/30">
              <span className="text-5xl mb-4">✅</span>
              <p className="text-green-600 dark:text-green-400 font-bold text-lg">Aucun problème détecté!</p>
              <p className="text-green-500/70 text-sm mt-2">Toutes les données sont valides.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedQuestions.map(({ question, issues }) => (
                  <div key={question.id} className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-md">
                        Q{question.number}
                      </span>
                      {question.year && (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md">
                          {YEARS.find(y => y.value === question.year)?.label || question.year}
                        </span>
                      )}
                      {question.module_name && (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md truncate max-w-[200px]">
                          {question.module_name}
                        </span>
                      )}
                      <a
                        href={`/questions?edit=${question.id}`}
                        className="ml-auto px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black rounded-lg hover:bg-primary-500/20 transition-all"
                      >
                        ✏️ Modifier
                      </a>
                    </div>
                    
                    <p className="text-slate-900 dark:text-white font-medium text-sm mb-4 line-clamp-2">
                      {question.question_text || <span className="italic text-slate-400">(Texte vide)</span>}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {issues.map((issue, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                            issue.type === 'missing' 
                              ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                              : issue.type === 'invalid'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {issue.message}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl disabled:opacity-30"
                  >
                    ←
                  </button>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Page <span className="text-slate-900 dark:text-white">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
