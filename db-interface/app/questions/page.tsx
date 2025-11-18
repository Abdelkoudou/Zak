'use client';

import { useState, useMemo } from 'react';
import { Question, QuestionFormData } from '@/types/database';
import { YEARS, EXAM_TYPES, OPTION_LABELS } from '@/lib/constants';
import { PREDEFINED_MODULES, PREDEFINED_SUBDISCIPLINES } from '@/lib/predefined-modules';

export default function QuestionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState<QuestionFormData>({
    year: '1',
    moduleId: '',
    examType: 'EMD',
    number: 1,
    questionText: '',
    answers: [
      { optionLabel: 'A', answerText: '', isCorrect: false },
      { optionLabel: 'B', answerText: '', isCorrect: false },
      { optionLabel: 'C', answerText: '', isCorrect: false },
      { optionLabel: 'D', answerText: '', isCorrect: false },
      { optionLabel: 'E', answerText: '', isCorrect: false },
    ],
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const hasCorrectAnswer = formData.answers.some(a => a.isCorrect && a.answerText.trim());
    if (!hasCorrectAnswer) {
      alert('Veuillez marquer au moins une réponse comme correcte.');
      return;
    }

    const validAnswers = formData.answers.filter(a => a.answerText.trim());
    if (validAnswers.length < 2) {
      alert('Veuillez fournir au moins 2 options de réponse.');
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      year: formData.year,
      moduleId: formData.moduleId,
      subDisciplineId: formData.subDisciplineId,
      chapterId: formData.chapterId,
      examType: formData.examType,
      number: formData.number,
      questionText: formData.questionText,
      explanation: formData.explanation,
      answers: formData.answers
        .filter(a => a.answerText.trim())
        .map((answer, idx) => ({
          id: `${Date.now()}-${idx}`,
          questionId: Date.now().toString(),
          optionLabel: answer.optionLabel,
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
          order: idx,
        })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setQuestions([...questions, newQuestion]);
    setShowForm(false);
    resetForm();
    
    // Auto-increment question number
    setFormData(prev => ({ ...prev, number: prev.number + 1 }));
  };

  const resetForm = () => {
    setFormData({
      year: '1',
      moduleId: '',
      examType: 'EMD',
      number: 1,
      questionText: '',
      answers: [
        { optionLabel: 'A', answerText: '', isCorrect: false },
        { optionLabel: 'B', answerText: '', isCorrect: false },
        { optionLabel: 'C', answerText: '', isCorrect: false },
        { optionLabel: 'D', answerText: '', isCorrect: false },
        { optionLabel: 'E', answerText: '', isCorrect: false },
      ],
    });
  };

  const updateAnswer = (index: number, field: 'answerText' | 'isCorrect', value: any) => {
    const newAnswers = formData.answers.map((answer, i) =>
      i === index ? { ...answer, [field]: value } : answer
    );
    setFormData({ ...formData, answers: newAnswers });
  };

  const deleteQuestion = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  // Group questions by module and exam type
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {};
    questions.forEach(q => {
      const key = `${q.year}-${q.moduleId}-${q.examType}`;
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Questions MCQ</h1>
          <p className="text-gray-600">Ajouter et gérer les questions à choix multiples</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annuler' : '➕ Nouvelle Question'}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Total Questions</p>
          <p className="text-3xl font-bold text-gray-900">{questions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Modules Couverts</p>
          <p className="text-3xl font-bold text-blue-600">
            {new Set(questions.map(q => q.moduleId)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Types d&apos;Examens</p>
          <p className="text-3xl font-bold text-green-600">
            {new Set(questions.map(q => q.examType)).size}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Ajouter une Question</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Détails de la Question */}
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                📖 Détails de la Question
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Année */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année d&apos;Étude *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      year: e.target.value as any,
                      moduleId: '',
                      subDisciplineId: undefined,
                      examType: 'EMD'
                    })}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module *
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      moduleId: e.target.value,
                      subDisciplineId: undefined,
                      examType: availableExamTypes[0] || 'EMD'
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un module</option>
                    {availableModules.map((module) => (
                      <option key={module.name} value={module.name}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-discipline (if applicable) */}
                {availableSubDisciplines.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sous-discipline
                    </label>
                    <select
                      value={formData.subDisciplineId || ''}
                      onChange={(e) => setFormData({ ...formData, subDisciplineId: e.target.value || undefined })}
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

                {/* Type d'Examen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d&apos;Examen *
                  </label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
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

                {/* Numéro de la Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de la Question *
                  </label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte de la Question *
                </label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Entrez votre question ici..."
                  required
                />
              </div>

              {/* Explanation (optional) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explication (optionnel)
                </label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Explication de la réponse correcte..."
                />
              </div>
            </div>

            {/* Section 2: Options de Réponse */}
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                ✅ Options de Réponse
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Entrez les options de réponse (A-E) et cochez les bonnes réponses. Vous pouvez avoir plusieurs bonnes réponses.
              </p>

              <div className="space-y-4">
                {formData.answers.map((answer, index) => (
                  <div key={answer.optionLabel} className="border border-gray-300 rounded-lg p-4 bg-white">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        {answer.optionLabel}
                      </div>

                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={answer.answerText}
                          onChange={(e) => updateAnswer(index, 'answerText', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Texte de la réponse ${answer.optionLabel}...`}
                        />

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answer.isCorrect}
                            onChange={(e) => updateAnswer(index, 'isCorrect', e.target.checked)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Réponse correcte
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                💡 Au moins une réponse doit être marquée comme correcte
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✅ Enregistrer la Question
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Liste des Questions ({questions.length})
          </h2>
        </div>
        <div className="p-6">
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune question ajoutée. Cliquez sur &quot;Nouvelle Question&quot; pour commencer.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedQuestions).map(([key, groupQuestions]) => {
                const [year, moduleId, examType] = key.split('-');
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      {YEARS.find(y => y.value === year)?.label} - {moduleId} ({examType})
                    </h3>
                    <div className="space-y-4">
                      {groupQuestions.map((question) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                Q{question.number}
                              </span>
                              {question.subDisciplineId && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  {question.subDisciplineId}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteQuestion(question.id)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                            >
                              ✕ Supprimer
                            </button>
                          </div>

                          <p className="text-gray-900 mb-3 font-medium">{question.questionText}</p>

                          <div className="space-y-2">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className={`flex items-start gap-3 p-2 rounded ${
                                  answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                }`}
                              >
                                <span className="font-bold text-sm min-w-[24px]">
                                  {answer.optionLabel}.
                                </span>
                                <span className="text-sm flex-1">{answer.answerText}</span>
                                {answer.isCorrect && (
                                  <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                                )}
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">💡 Explication:</span> {question.explanation}
                              </p>
                            </div>
                          )}
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
