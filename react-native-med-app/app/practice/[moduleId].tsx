// ============================================================================
// Practice Screen - QCM Session
// ============================================================================

import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getQuestions } from '@/lib/questions'
import { saveTestAttempt } from '@/lib/stats'
import { toggleSaveQuestion, isQuestionSaved } from '@/lib/saved'
import { QuestionWithAnswers, OptionLabel, ExamType } from '@/types'

export default function PracticeScreen() {
  const { moduleId, moduleName, examType, subDiscipline, cours } = useLocalSearchParams<{
    moduleId: string
    moduleName: string
    examType?: string
    subDiscipline?: string
    cours?: string
  }>()
  
  const { user } = useAuth()
  
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, OptionLabel[]>>({})
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set())
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [startTime] = useState(new Date())
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const filters: any = { module_name: moduleName }
      if (examType) filters.exam_type = examType
      if (subDiscipline) filters.sub_discipline = subDiscipline
      if (cours) filters.cours = cours

      const { questions: data } = await getQuestions(filters)
      setQuestions(data)

      // Check which questions are saved
      if (user) {
        const savedSet = new Set<string>()
        for (const q of data) {
          const saved = await isQuestionSaved(user.id, q.id)
          if (saved) savedSet.add(q.id)
        }
        setSavedQuestions(savedSet)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const isSubmitted = currentQuestion ? submittedQuestions.has(currentQuestion.id) : false
  const currentAnswers = currentQuestion ? selectedAnswers[currentQuestion.id] || [] : []
  
  // Count how many correct answers this question has
  const correctAnswersCount = currentQuestion 
    ? currentQuestion.answers.filter(a => a.is_correct).length 
    : 0
  const isMultipleChoice = correctAnswersCount > 1

  const selectAnswer = (label: OptionLabel) => {
    if (isSubmitted || !currentQuestion) return

    setSelectedAnswers(prev => {
      const current = prev[currentQuestion.id] || []
      const isSelected = current.includes(label)
      
      if (isMultipleChoice) {
        // Multiple selection mode - toggle the answer
        if (isSelected) {
          return {
            ...prev,
            [currentQuestion.id]: current.filter(l => l !== label)
          }
        } else {
          return {
            ...prev,
            [currentQuestion.id]: [...current, label]
          }
        }
      } else {
        // Single selection mode - replace the answer
        return {
          ...prev,
          [currentQuestion.id]: isSelected ? [] : [label]
        }
      }
    })
  }

  const submitAnswer = () => {
    if (!currentQuestion || currentAnswers.length === 0) return
    setSubmittedQuestions(prev => new Set([...prev, currentQuestion.id]))
  }

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }
  }

  const toggleSave = async () => {
    if (!user || !currentQuestion) return
    
    const { isSaved } = await toggleSaveQuestion(user.id, currentQuestion.id)
    setSavedQuestions(prev => {
      const newSet = new Set(prev)
      if (isSaved) {
        newSet.add(currentQuestion.id)
      } else {
        newSet.delete(currentQuestion.id)
      }
      return newSet
    })
  }

  const finishPractice = async () => {
    Alert.alert(
      'Terminer la session',
      'Voulez-vous terminer cette session de pratique ?',
      [
        { text: 'Continuer', style: 'cancel' },
        { 
          text: 'Terminer', 
          onPress: async () => {
            await saveResults()
          }
        },
      ]
    )
  }

  const saveResults = async () => {
    if (!user) return

    // Calculate results
    let correctCount = 0
    const answeredQuestions = questions.filter(q => submittedQuestions.has(q.id))
    
    for (const question of answeredQuestions) {
      const userAnswers = selectedAnswers[question.id] || []
      const correctAnswers = question.answers
        .filter(a => a.is_correct)
        .map(a => a.option_label)
      
      const isCorrect = 
        userAnswers.length === correctAnswers.length &&
        userAnswers.every(a => correctAnswers.includes(a))
      
      if (isCorrect) correctCount++
    }

    const totalQuestions = answeredQuestions.length
    const scorePercentage = totalQuestions > 0 
      ? (correctCount / totalQuestions) * 100 
      : 0
    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000)

    // Save to database
    await saveTestAttempt({
      user_id: user.id,
      year: user.year_of_study!,
      module_name: moduleName!,
      sub_discipline: subDiscipline || undefined,
      exam_type: (examType as ExamType) || 'EMD',
      total_questions: totalQuestions,
      correct_answers: correctCount,
      score_percentage: scorePercentage,
      time_spent_seconds: timeSpent,
    })

    // Navigate to results
    router.replace({
      pathname: '/practice/results',
      params: {
        total: totalQuestions.toString(),
        correct: correctCount.toString(),
        score: scorePercentage.toFixed(1),
        time: timeSpent.toString(),
        moduleName: moduleName!,
      }
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-4xl mb-4">📭</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Aucune question</Text>
        <Text className="text-gray-500 text-center mb-6">
          Aucune question disponible pour cette sélection
        </Text>
        <TouchableOpacity 
          className="bg-primary-500 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const isSaved = currentQuestion ? savedQuestions.has(currentQuestion.id) : false

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Question ${currentIndex + 1}/${questions.length}`,
          headerRight: () => (
            <TouchableOpacity onPress={finishPractice} className="mr-4">
              <Text className="text-primary-500 font-medium">Terminer</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        {/* Progress Bar */}
        <View className="h-1 bg-gray-200">
          <View 
            className="h-full bg-primary-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </View>

        <ScrollView ref={scrollRef} className="flex-1 px-6 py-4">
          {/* Question Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-primary-100 px-3 py-1 rounded-full mr-2">
                <Text className="text-primary-700 font-medium">
                  Q{currentQuestion.number}
                </Text>
              </View>
              {currentQuestion.exam_type && (
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-700 text-sm">
                    {currentQuestion.exam_type}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={toggleSave}>
              <Text className="text-2xl">{isSaved ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Question Text */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-gray-900 text-lg leading-relaxed">
              {currentQuestion.question_text}
            </Text>
            
            {/* Question Image */}
            {currentQuestion.image_url && (
              <Image 
                source={{ uri: currentQuestion.image_url }}
                className="w-full h-48 mt-4 rounded-lg"
                resizeMode="contain"
              />
            )}
          </View>

          {/* Multiple Choice Indicator */}
          {isMultipleChoice && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex-row items-center">
              <Text className="text-amber-600 mr-2">⚠️</Text>
              <Text className="text-amber-700 flex-1">
                Cette question a {correctAnswersCount} réponses correctes. 
                {!isSubmitted && ` (${currentAnswers.length}/${correctAnswersCount} sélectionnées)`}
              </Text>
            </View>
          )}

          {/* Answer Options */}
          <View className="space-y-3">
            {currentQuestion.answers.map((answer) => {
              const isSelected = currentAnswers.includes(answer.option_label)
              const isCorrect = answer.is_correct
              
              let bgColor = 'bg-white'
              let borderColor = 'border-gray-200'
              let textColor = 'text-gray-900'
              
              if (isSubmitted) {
                if (isCorrect) {
                  bgColor = 'bg-green-50'
                  borderColor = 'border-green-500'
                  textColor = 'text-green-700'
                } else if (isSelected && !isCorrect) {
                  bgColor = 'bg-red-50'
                  borderColor = 'border-red-500'
                  textColor = 'text-red-700'
                }
              } else if (isSelected) {
                bgColor = 'bg-primary-50'
                borderColor = 'border-primary-500'
                textColor = 'text-primary-700'
              }

              return (
                <TouchableOpacity
                  key={answer.id}
                  className={`${bgColor} rounded-xl p-4 border-2 ${borderColor}`}
                  onPress={() => selectAnswer(answer.option_label)}
                  disabled={isSubmitted}
                >
                  <View className="flex-row items-start">
                    <View className={`w-8 h-8 ${isMultipleChoice ? 'rounded-lg' : 'rounded-full'} items-center justify-center mr-3 ${
                      isSelected ? 'bg-primary-500' : 'bg-gray-100'
                    }`}>
                      <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                        {answer.option_label}
                      </Text>
                    </View>
                    <Text className={`flex-1 ${textColor}`}>
                      {answer.answer_text}
                    </Text>
                    {isSubmitted && isCorrect && (
                      <Text className="text-green-500 text-xl ml-2">✓</Text>
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <Text className="text-red-500 text-xl ml-2">✗</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Bottom Spacing */}
          <View className="h-24" />
        </ScrollView>

        {/* Bottom Actions */}
        <View className="bg-white border-t border-gray-100 px-6 py-4">
          <View className="flex-row items-center justify-between">
            {/* Previous Button */}
            <TouchableOpacity
              className={`px-4 py-3 rounded-xl ${
                currentIndex > 0 ? 'bg-gray-100' : 'bg-gray-50'
              }`}
              onPress={goToPrevious}
              disabled={currentIndex === 0}
            >
              <Text className={`font-medium ${
                currentIndex > 0 ? 'text-gray-700' : 'text-gray-300'
              }`}>
                ← Précédent
              </Text>
            </TouchableOpacity>

            {/* Submit / Next Button */}
            {!isSubmitted ? (
              <TouchableOpacity
                className={`px-6 py-3 rounded-xl ${
                  currentAnswers.length > 0 ? 'bg-primary-500' : 'bg-gray-200'
                }`}
                onPress={submitAnswer}
                disabled={currentAnswers.length === 0}
              >
                <Text className={`font-semibold ${
                  currentAnswers.length > 0 ? 'text-white' : 'text-gray-400'
                }`}>
                  Valider
                </Text>
              </TouchableOpacity>
            ) : currentIndex < questions.length - 1 ? (
              <TouchableOpacity
                className="bg-primary-500 px-6 py-3 rounded-xl"
                onPress={goToNext}
              >
                <Text className="text-white font-semibold">Suivant →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-green-500 px-6 py-3 rounded-xl"
                onPress={saveResults}
              >
                <Text className="text-white font-semibold">Voir résultats</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}
