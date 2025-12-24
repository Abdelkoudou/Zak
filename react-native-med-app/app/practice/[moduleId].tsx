// ============================================================================
// Practice Screen - Light Sea Green Brand (Matching Design)
// ============================================================================

import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getQuestions } from '@/lib/questions'
import { saveTestAttempt } from '@/lib/stats'
import { toggleSaveQuestion, isQuestionSaved } from '@/lib/saved'
import { QuestionWithAnswers, OptionLabel, ExamType } from '@/types'
import { Card, Badge, LoadingSpinner, Button } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

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
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <LoadingSpinner message="Chargement des questions..." />
      </SafeAreaView>
    )
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: BRAND_THEME.colors.gray[900],
            marginBottom: 8
          }}>
            Aucune question
          </Text>
          <Text style={{
            color: BRAND_THEME.colors.gray[600],
            textAlign: 'center',
            marginBottom: 24
          }}>
            Aucune question disponible pour cette sélection
          </Text>
          <Button 
            title="Retour"
            onPress={() => router.back()}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    )
  }

  const isSaved = currentQuestion ? savedQuestions.has(currentQuestion.id) : false

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Questions ${currentIndex + 1}/${questions.length}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: BRAND_THEME.colors.primary[600], fontSize: 16 }}>←</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }} edges={['bottom']}>
        <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Question Header - Matching Design */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Badge 
                label={`Q${currentQuestion.number}`}
                variant="primary"
                style={{ marginRight: 8 }}
              />
              {currentQuestion.exam_type && (
                <Badge 
                  label={currentQuestion.exam_type}
                  variant="secondary"
                />
              )}
            </View>
            
            <TouchableOpacity 
              onPress={toggleSave}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isSaved ? BRAND_THEME.colors.primary[100] : BRAND_THEME.colors.gray[100],
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {isSaved ? '💾' : '📥'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Question Text - Matching Design */}
          <Card variant="default" padding="md" style={{ marginBottom: 16 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontSize: 16,
              lineHeight: 24
            }}>
              {currentQuestion.question_text}
            </Text>
            
            {/* Question Image */}
            {currentQuestion.image_url && (
              <Image 
                source={{ uri: currentQuestion.image_url }}
                style={{ width: '100%', height: 192, marginTop: 16, borderRadius: 8 }}
                resizeMode="contain"
              />
            )}
          </Card>

          {/* Answer Options - Matching Design */}
          <View style={{ gap: 12 }}>
            {currentQuestion.answers.map((answer) => {
              const isSelected = currentAnswers.includes(answer.option_label)
              const isCorrect = answer.is_correct
              
              let cardStyle = {}
              let textColor: string = BRAND_THEME.colors.gray[900]
              
              if (isSubmitted) {
                if (isCorrect) {
                  cardStyle = { 
                    backgroundColor: BRAND_THEME.colors.success[50],
                    borderColor: BRAND_THEME.colors.success[500],
                    borderWidth: 2
                  }
                  textColor = BRAND_THEME.colors.success[600]
                } else if (isSelected && !isCorrect) {
                  cardStyle = { 
                    backgroundColor: BRAND_THEME.colors.error[50],
                    borderColor: BRAND_THEME.colors.error[500],
                    borderWidth: 2
                  }
                  textColor = BRAND_THEME.colors.error[600]
                }
              } else if (isSelected) {
                cardStyle = { 
                  backgroundColor: BRAND_THEME.colors.primary[100],
                  borderColor: BRAND_THEME.colors.primary[500],
                  borderWidth: 2
                }
                textColor = BRAND_THEME.colors.primary[600]
              }

              return (
                <TouchableOpacity
                  key={answer.id}
                  onPress={() => selectAnswer(answer.option_label)}
                  disabled={isSubmitted}
                  activeOpacity={0.7}
                >
                  <Card variant="default" padding="md" style={cardStyle}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isSelected ? BRAND_THEME.colors.primary[500] : BRAND_THEME.colors.gray[100],
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{
                          fontWeight: 'bold',
                          color: isSelected ? '#ffffff' : BRAND_THEME.colors.gray[600]
                        }}>
                          {answer.option_label}
                        </Text>
                      </View>
                      <Text style={{
                        flex: 1,
                        color: textColor,
                        fontSize: 16,
                        lineHeight: 22
                      }}>
                        {answer.answer_text}
                      </Text>
                      {isSubmitted && isCorrect && (
                        <Text style={{ color: BRAND_THEME.colors.success[500], fontSize: 20, marginLeft: 8 }}>✓</Text>
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <Text style={{ color: BRAND_THEME.colors.error[500], fontSize: 20, marginLeft: 8 }}>✗</Text>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Actions - Matching Design */}
        <View style={{
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: BRAND_THEME.colors.gray[100],
          paddingHorizontal: 24,
          paddingVertical: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Previous Button */}
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: currentIndex > 0 ? BRAND_THEME.colors.gray[100] : BRAND_THEME.colors.gray[50]
              }}
              onPress={goToPrevious}
              disabled={currentIndex === 0}
            >
              <Text style={{
                fontWeight: '500',
                color: currentIndex > 0 ? BRAND_THEME.colors.gray[700] : BRAND_THEME.colors.gray[300]
              }}>
                ← Précédent
              </Text>
            </TouchableOpacity>

            {/* Submit / Next Button */}
            {!isSubmitted ? (
              <Button
                title="Valider"
                onPress={submitAnswer}
                disabled={currentAnswers.length === 0}
                variant="primary"
              />
            ) : currentIndex < questions.length - 1 ? (
              <Button
                title="Suivant →"
                onPress={goToNext}
                variant="primary"
              />
            ) : (
              <Button
                title="Voir résultats"
                onPress={saveResults}
                variant="primary"
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}
