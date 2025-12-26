// ============================================================================
// Practice Screen - Premium UI with Dark Mode Support
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { getQuestions } from '@/lib/questions'
import { saveTestAttempt } from '@/lib/stats'
import { toggleSaveQuestion, isQuestionSaved } from '@/lib/saved'
import { QuestionWithAnswers, OptionLabel, ExamType } from '@/types'
import { Card, Badge, LoadingSpinner, Button, FadeInView } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

export default function PracticeScreen() {
  const { moduleId, moduleName, examType, subDiscipline, cours } = useLocalSearchParams<{
    moduleId: string
    moduleName: string
    examType?: string
    subDiscipline?: string
    cours?: string
  }>()
  
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, OptionLabel[]>>({})
  const [eliminatedAnswers, setEliminatedAnswers] = useState<Record<string, OptionLabel[]>>({})
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set())
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [startTime] = useState(new Date())
  const scrollRef = useRef<ScrollView>(null)
  
  const questionFade = useRef(new Animated.Value(0)).current
  const questionSlide = useRef(new Animated.Value(20)).current
  const saveButtonScale = useRef(new Animated.Value(1)).current
  const progressWidth = useRef(new Animated.Value(0)).current

  const animateQuestionIn = useCallback(() => {
    questionFade.setValue(0)
    questionSlide.setValue(20)
    Animated.parallel([
      Animated.timing(questionFade, { toValue: 1, duration: ANIMATION_DURATION.normal, easing: ANIMATION_EASING.premium, useNativeDriver: true }),
      Animated.timing(questionSlide, { toValue: 0, duration: ANIMATION_DURATION.normal, easing: ANIMATION_EASING.premium, useNativeDriver: true }),
    ]).start()
  }, [])

  const animateProgress = useCallback(() => {
    if (questions.length > 0) {
      Animated.timing(progressWidth, {
        toValue: ((currentIndex + 1) / questions.length) * 100,
        duration: ANIMATION_DURATION.normal,
        easing: ANIMATION_EASING.smooth,
        useNativeDriver: false,
      }).start()
    }
  }, [currentIndex, questions.length])

  const animateSavePress = () => {
    Animated.sequence([
      Animated.timing(saveButtonScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(saveButtonScale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start()
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    animateQuestionIn()
    animateProgress()
  }, [currentIndex, animateQuestionIn, animateProgress])

  const loadQuestions = async () => {
    try {
      const filters: any = { module_name: moduleName }
      if (examType) filters.exam_type = examType
      if (subDiscipline) filters.sub_discipline = subDiscipline
      if (cours) filters.cours = cours

      const { questions: data } = await getQuestions(filters)
      setQuestions(data)

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
  const currentEliminated = currentQuestion ? eliminatedAnswers[currentQuestion.id] || [] : []

  const toggleEliminate = (label: OptionLabel) => {
    if (isSubmitted || !currentQuestion) return
    
    setEliminatedAnswers(prev => {
      const current = prev[currentQuestion.id] || []
      const isEliminated = current.includes(label)
      
      if (isEliminated) {
        // Restore option
        return { ...prev, [currentQuestion.id]: current.filter(l => l !== label) }
      } else {
        // Eliminate option
        // If it was selected, deselect it
        if (currentAnswers.includes(label)) {
          setSelectedAnswers(prevSelected => ({
            ...prevSelected,
            [currentQuestion.id]: (prevSelected[currentQuestion.id] || []).filter(l => l !== label)
          }))
        }
        return { ...prev, [currentQuestion.id]: [...current, label] }
      }
    })
  }

  const selectAnswer = (label: OptionLabel) => {
    if (isSubmitted || !currentQuestion) return
    
    // Don't allow selecting eliminated options
    if (currentEliminated.includes(label)) return

    setSelectedAnswers(prev => {
      const current = prev[currentQuestion.id] || []
      const isSelected = current.includes(label)
      if (isSelected) {
        return { ...prev, [currentQuestion.id]: current.filter(l => l !== label) }
      } else {
        return { ...prev, [currentQuestion.id]: [...current, label] }
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
    animateSavePress()
    const { isSaved } = await toggleSaveQuestion(user.id, currentQuestion.id)
    setSavedQuestions(prev => {
      const newSet = new Set(prev)
      if (isSaved) newSet.add(currentQuestion.id)
      else newSet.delete(currentQuestion.id)
      return newSet
    })
  }

  const finishPractice = async () => {
    Alert.alert('Terminer la session', 'Voulez-vous terminer cette session de pratique ?', [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Terminer', onPress: async () => { await saveResults() } },
    ])
  }

  const saveResults = async () => {
    if (!user) return
    let correctCount = 0
    const answeredQuestions = questions.filter(q => submittedQuestions.has(q.id))
    
    for (const question of answeredQuestions) {
      const userAnswers = selectedAnswers[question.id] || []
      const correctAnswers = question.answers.filter(a => a.is_correct).map(a => a.option_label)
      const isCorrect = userAnswers.length === correctAnswers.length && userAnswers.every(a => correctAnswers.includes(a))
      if (isCorrect) correctCount++
    }

    const totalQuestions = answeredQuestions.length
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000)

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

    router.replace({
      pathname: '/practice/results',
      params: { total: totalQuestions.toString(), correct: correctCount.toString(), score: scorePercentage.toFixed(1), time: timeSpent.toString(), moduleName: moduleName! }
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LoadingSpinner message="Chargement des questions..." />
      </SafeAreaView>
    )
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Aucune question</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>Aucune question disponible pour cette sélection</Text>
          <Button title="Retour" onPress={() => router.back()} variant="primary" />
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
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -12, padding: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeftIcon size={28} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        {/* Progress Bar */}
        <View style={{ height: 4, backgroundColor: colors.backgroundSecondary }}>
          <Animated.View style={{ height: '100%', backgroundColor: colors.primary, width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Question Header */}
          <Animated.View style={{ opacity: questionFade, transform: [{ translateY: questionSlide }], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Badge label={`Q${currentQuestion.number}`} variant="primary" style={{ marginRight: 8 }} />
              {currentQuestion.exam_type && <Badge label={currentQuestion.exam_type} variant="secondary" />}
            </View>
            <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
              <TouchableOpacity 
                onPress={toggleSave}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isSaved ? colors.primaryLight : colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>{isSaved ? '💾' : '📥'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Question Text */}
          <Animated.View style={{ opacity: questionFade, transform: [{ translateY: questionSlide }], marginBottom: 16 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{currentQuestion.question_text}</Text>
              {currentQuestion.image_url && (
                <Image source={{ uri: currentQuestion.image_url }} style={{ width: '100%', height: 192, marginTop: 16, borderRadius: 8 }} resizeMode="contain" />
              )}
            </View>
          </Animated.View>

          {/* Answer Options */}
          <View style={{ gap: 12 }}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = currentAnswers.includes(answer.option_label)
              const isCorrect = answer.is_correct
              
              let cardBg = colors.card
              let borderColor = colors.border
              let textColor = colors.text
              
              if (isSubmitted) {
                if (isCorrect) {
                  cardBg = colors.successLight
                  borderColor = colors.success
                  textColor = colors.success
                } else if (isSelected && !isCorrect) {
                  cardBg = colors.errorLight
                  borderColor = colors.error
                  textColor = colors.error
                }
              } else if (isSelected) {
                cardBg = colors.primaryLight
                borderColor = colors.primary
                textColor = colors.primary
              }

              return (
                <AnimatedAnswerOption
                  key={answer.id}
                  answer={answer}
                  index={index}
                  isSelected={isSelected}
                  isEliminated={currentEliminated.includes(answer.option_label)}
                  isCorrect={isCorrect}
                  isSubmitted={isSubmitted}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  textColor={textColor}
                  onPress={() => selectAnswer(answer.option_label)}
                  onLongPress={() => toggleEliminate(answer.option_label)}
                  questionFade={questionFade}
                  colors={colors}
                />
              )
            })}
          </View>


          {/* Feature Hint */}
          {!isSubmitted && (
            <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: colors.textMuted }}>
              💡 Astuce : Appui long pour éliminer une option
            </Text>
          )}

          {/* Explanation */}
          {isSubmitted && currentQuestion.explanation && (
            <Animated.View style={{ opacity: questionFade, transform: [{ translateY: questionSlide }], marginTop: 24 }}>
              <View style={{ backgroundColor: colors.primaryMuted, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryLight }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>💡</Text>
                  <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 16 }}>Explication</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{currentQuestion.explanation}</Text>
              </View>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Actions */}
        <FadeInView animation="slideUp" delay={200} replayOnFocus={false}>
          <View style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 24, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AnimatedNavButton label="← Précédent" onPress={goToPrevious} disabled={currentIndex === 0} colors={colors} />
              {!isSubmitted ? (
                <Button title="Valider" onPress={submitAnswer} disabled={currentAnswers.length === 0} variant="primary" />
              ) : currentIndex < questions.length - 1 ? (
                <Button title="Suivant →" onPress={goToNext} variant="primary" />
              ) : (
                <Button title="Voir résultats" onPress={saveResults} variant="primary" />
              )}
            </View>
          </View>
        </FadeInView>
      </SafeAreaView>
    </>
  )
}

// Animated Answer Option
function AnimatedAnswerOption({ answer, index, isSelected, isEliminated, isCorrect, isSubmitted, cardBg, borderColor, textColor, onPress, onLongPress, questionFade, colors }: any) {
  const scale = useRef(new Animated.Value(1)).current
  const slideIn = useRef(new Animated.Value(30)).current
  
  useEffect(() => {
    Animated.timing(slideIn, { toValue: 0, duration: ANIMATION_DURATION.normal, delay: index * 50, easing: ANIMATION_EASING.premium, useNativeDriver: true }).start()
  }, [index])

  const handlePressIn = () => { Animated.timing(scale, { toValue: 0.98, duration: 100, useNativeDriver: true }).start() }
  const handlePressOut = () => { Animated.spring(scale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start() }

  // If eliminated, override styles to look disabled/crossed out
  const finalCardBg = isEliminated ? colors.background : cardBg
  const finalBorderColor = isEliminated ? colors.border : borderColor
  const finalTextColor = isEliminated ? colors.textMuted : textColor
  const finalOpacity = isEliminated ? 0.6 : 1

  return (
    <Animated.View style={{ opacity: questionFade, transform: [{ translateY: slideIn }, { scale }] }}>
      <TouchableOpacity 
        onPress={onPress} 
        onLongPress={onLongPress}
        onPressIn={handlePressIn} 
        onPressOut={handlePressOut} 
        disabled={isSubmitted} 
        activeOpacity={isEliminated ? 1 : 0.7}
        delayLongPress={200}
      >
        <View style={{ backgroundColor: finalCardBg, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: finalBorderColor, opacity: finalOpacity }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', marginRight: 12, opacity: isEliminated ? 0.5 : 1 }}>
              <Text style={{ fontWeight: 'bold', color: isSelected ? '#ffffff' : colors.textMuted, textDecorationLine: isEliminated ? 'line-through' : 'none' }}>{answer.option_label}</Text>
            </View>
            <Text style={{ flex: 1, color: finalTextColor, fontSize: 16, lineHeight: 22, textDecorationLine: isEliminated ? 'line-through' : 'none' }}>{answer.answer_text}</Text>
            {isSubmitted && isCorrect && <Text style={{ color: colors.success, fontSize: 20, marginLeft: 8 }}>✓</Text>}
            {isSubmitted && isSelected && !isCorrect && <Text style={{ color: colors.error, fontSize: 20, marginLeft: 8 }}>✗</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Animated Navigation Button
function AnimatedNavButton({ label, onPress, disabled, colors }: { label: string; onPress: () => void; disabled: boolean; colors: any }) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => { if (!disabled) Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }).start() }
  const handlePressOut = () => { Animated.spring(scale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start() }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: !disabled ? colors.backgroundSecondary : colors.background }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Text style={{ fontWeight: '500', color: !disabled ? colors.textSecondary : colors.textMuted }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
