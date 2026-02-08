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
    <div className="max-w-7xl mx-auto font-body text-theme-main space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-theme-main mb-2">
            Santé des Données
          </h1>
          <p className="text-sm md:text-base text-theme-muted font-medium uppercase tracking-wider">
            Contrôle qualité • FMC APP
          </p>
        </div>
        <button
          onClick={loadQuestions}
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold font-heading text-sm hover:bg-primary-600 transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Analyse...</span>
            </>
          ) : (
            <>
              <span className="text-lg">🔄</span>
              <span>Rafraîchir</span>
            </>
          )}
        </button>
      </div>

      {/* Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`col-span-1 md:col-span-2 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group ${healthScore >= 90 ? 'bg-gradient-to-br from-[#09b2ac] to-[#0f766e]' :
            healthScore >= 70 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
              'bg-gradient-to-br from-red-500 to-rose-600'
          }`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
          </div>
          <p className="text-white/90 text-xs font-bold font-heading uppercase tracking-widest mb-1">Score de Santé</p>
          <div className="flex items-baseline gap-3 relative z-10">
            <span className="text-6xl font-extrabold font-heading tracking-tighter">{healthScore}%</span>
            <span className="text-white/80 text-sm font-medium">
              {questions.length - questionsWithIssues.length} / {questions.length} questions valides
            </span>
          </div>
        </div>

        <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl bg-theme-secondary/50 p-2 rounded-lg">📊</span>
            <p className="text-[10px] font-bold font-heading text-theme-muted uppercase tracking-widest">Total Questions</p>
          </div>
          <p className="text-3xl font-extrabold font-heading text-theme-main">{questions.length.toLocaleString()}</p>
        </div>

        <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm hover:border-destructive/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl bg-destructive/10 p-2 rounded-lg text-destructive">⚠️</span>
            <p className="text-[10px] font-bold font-heading text-theme-muted uppercase tracking-widest">Avec Problèmes</p>
          </div>
          <p className="text-3xl font-extrabold font-heading text-destructive">{questionsWithIssues.length.toLocaleString()}</p>
        </div>
      </div>

      {/* Issue Categories */}
      <div className="bg-theme-card rounded-2xl p-6 border border-theme shadow-sm">
        <h2 className="text-sm font-bold font-heading text-theme-main uppercase tracking-widest mb-6 flex items-center gap-2">
          <span>Catégories de Problèmes</span>
          <div className="h-px flex-1 bg-theme-secondary"></div>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${selectedCategory === cat.key
                  ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(9,178,172,0.1)]'
                  : 'border-theme-light hover:border-theme-secondary hover:bg-theme-secondary/20'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                <span className={`text-xl font-extrabold font-heading ${selectedCategory === cat.key ? 'text-primary' : 'text-theme-main'}`}>
                  {cat.count}
                </span>
              </div>
              <p className={`text-[11px] font-bold font-heading uppercase tracking-wider ${selectedCategory === cat.key ? 'text-primary' : 'text-theme-muted'}`}>
                {cat.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-theme-card border border-theme rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme bg-theme-secondary/10 flex justify-between items-center">
          <h2 className="text-sm font-bold font-heading text-theme-main uppercase tracking-widest">
            Questions avec Problèmes
          </h2>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold font-heading">
            {filteredQuestions.length} résultats
          </span>
        </div>

        <div className="p-6 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 h-full">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-bold font-heading text-theme-muted uppercase tracking-widest mt-6">
                Analyse en cours...
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-success/5 rounded-2xl border border-dashed border-success/20">
              <span className="text-6xl mb-6 drop-shadow-sm">✅</span>
              <p className="text-success font-bold font-heading text-xl">Aucun problème détecté !</p>
              <p className="text-success/70 text-sm mt-2 font-medium">Toutes les données sont valides pour cette catégorie.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedQuestions.map(({ question, issues }) => (
                  <div key={question.id} className="bg-theme-secondary/20 hover:bg-theme-secondary/40 transition-colors rounded-xl p-5 border border-theme group">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold font-heading rounded uppercase tracking-wider">
                        Q{question.number}
                      </span>
                      {question.year && (
                        <span className="px-2 py-1 bg-theme-secondary text-theme-secondary text-[10px] font-bold rounded uppercase tracking-wider border border-theme">
                          {YEARS.find(y => y.value === question.year)?.label || question.year}
                        </span>
                      )}
                      {question.module_name && (
                        <span className="px-2 py-1 bg-theme-secondary text-theme-secondary text-[10px] font-bold rounded uppercase tracking-wider border border-theme truncate max-w-[200px]">
                          {question.module_name}
                        </span>
                      )}
                      <a
                        href={`/questions?edit=${question.id}`}
                        className="ml-auto px-4 py-1.5 bg-white border border-theme text-theme-secondary text-xs font-bold font-heading rounded-lg hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span>✏️</span> Modifier
                      </a>
                    </div>

                    <p className="text-theme-main font-medium text-sm mb-4 line-clamp-2 leading-relaxed">
                      {question.question_text || <span className="italic text-theme-muted">(Texte vide)</span>}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-theme-light">
                      {issues.map((issue, idx) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 text-[10px] font-bold font-heading rounded-md border flex items-center gap-1.5 ${issue.type === 'missing'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : issue.type === 'invalid'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            }`}
                        >
                          <span>{issue.type === 'missing' ? '⚠️' : issue.type === 'invalid' ? '🚫' : 'ℹ️'}</span>
                          {issue.message}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-theme">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-theme rounded-lg text-theme-secondary hover:bg-theme-secondary disabled:opacity-30 disabled:hover:bg-white transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-xs font-bold font-heading text-theme-muted uppercase tracking-widest">
                    Page <span className="text-theme-main">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-theme rounded-lg text-theme-secondary hover:bg-theme-secondary disabled:opacity-30 disabled:hover:bg-white transition-colors"
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
