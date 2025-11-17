'use client';

import { useState } from 'react';
import { Question, QuestionFormData } from '@/types/database';
import { YEARS, EXAM_TYPES, OPTION_LABELS } from '@/lib/constants';

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
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      answers: formData.answers.map((answer, idx) => ({
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
      ],
    });
  };

  const addAnswer = () => {
    const nextLabel = OPTION_LABELS[formData.answers.length];
    if (nextLabel) {
      setFormData({
        ...formData,
        answers: [
          ...formData.answers,
          { optionLabel: nextLabel, answerText: '', isCorrect: false },
        ],
      });
    }
  };

  const removeAnswer = (index: number) => {
    if (formData.answers.length > 2) {
      const newAnswers = formData.answers.filter((_, i) => i !== index);
      setFormData({ ...formData, answers: newAnswers });
    }
  };

  const updateAnswer = (index: number, field: 'answerText' | 'isCorrect', value: any) => {
    const newAnswers = formData.answers.map((answer, i) =>
      i === index ? { ...answer, [field]: value } : answer
    );
    setFormData({ ...formData, answers: newAnswers });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Questions</h1>
          <p className="text-gray-600">Gérer les QCM du système</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annuler' : '➕ Nouvelle Question'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Ajouter une Question</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value as any })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d&apos;Examen
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {EXAM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <input
                type="text"
                value={formData.moduleId}
                onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Sélectionner un module..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: Ceci sera remplacé par un sélecteur de modules
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte de la Question
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Entrez le texte de la question..."
                required
              />
            </div>

            <div>
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

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Réponses</h3>
                <button
                  type="button"
                  onClick={addAnswer}
                  disabled={formData.answers.length >= OPTION_LABELS.length}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ➕ Ajouter Réponse
                </button>
              </div>

              <div className="space-y-4">
                {formData.answers.map((answer, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        {answer.optionLabel}
                      </div>

                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={answer.answerText}
                          onChange={(e) => updateAnswer(index, 'answerText', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Texte de la réponse..."
                          required
                        />

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={answer.isCorrect}
                              onChange={(e) => updateAnswer(index, 'isCorrect', e.target.checked)}
                              className="w-4 h-4 text-green-600"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Réponse correcte
                            </span>
                          </label>

                          {formData.answers.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeAnswer(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              ✕ Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Au moins une réponse doit être marquée comme correcte
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Liste des Questions</h2>
        </div>
        <div className="p-6">
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune question ajoutée. Cliquez sur &quot;Nouvelle Question&quot; pour commencer.
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {YEARS.find((y) => y.value === question.year)?.label}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {question.examType}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        Q{question.number}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                        Modifier
                      </button>
                      <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-3">{question.questionText}</p>

                  <div className="space-y-2">
                    {question.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className={`flex items-start gap-3 p-2 rounded ${
                          answer.isCorrect ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <span className="font-bold text-sm">{answer.optionLabel}.</span>
                        <span className="text-sm">{answer.answerText}</span>
                        {answer.isCorrect && (
                          <span className="ml-auto text-green-600 text-xs">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Explication:</span> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
