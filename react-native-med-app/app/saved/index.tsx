// ============================================================================
// Saved Questions Screen
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getSavedQuestions, unsaveQuestion } from '@/lib/saved'
import { QuestionWithAnswers } from '@/types'

export default function SavedQuestionsScreen() {
  const { user } = useAuth()
  
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadQuestions = useCallback(async () => {
    if (!user) return

    try {
      const { questions: data } = await getSavedQuestions(user.id)
      setQuestions(data)
    } catch (error) {
      console.error('Error loading saved questions:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadQuestions()
  }, [loadQuestions])

  const handleUnsave = async (questionId: string) => {
    if (!user) return
    
    await unsaveQuestion(user.id, questionId)
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Questions sauvegardées' }} />
      
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="px-6 py-4">
            {questions.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center mt-8">
                <Text className="text-4xl mb-4">💾</Text>
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  Aucune question sauvegardée
                </Text>
                <Text className="text-gray-500 text-center">
                  Sauvegardez des questions pendant vos sessions de pratique pour les revoir plus tard
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-gray-500 mb-4">
                  {questions.length} question{questions.length > 1 ? 's' : ''} sauvegardée{questions.length > 1 ? 's' : ''}
                </Text>
                
                <View className="space-y-3">
                  {questions.map((question) => (
                    <SavedQuestionCard
                      key={question.id}
                      question={question}
                      isExpanded={expandedId === question.id}
                      onToggle={() => toggleExpand(question.id)}
                      onUnsave={() => handleUnsave(question.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Bottom Spacing */}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

// Saved Question Card Component
function SavedQuestionCard({
  question,
  isExpanded,
  onToggle,
  onUnsave,
}: {
  question: QuestionWithAnswers
  isExpanded: boolean
  onToggle: () => void
  onUnsave: () => void
}) {
  const correctAnswers = question.answers.filter(a => a.is_correct)

  return (
    <View className="bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <TouchableOpacity 
        className="p-4"
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="bg-primary-100 px-2 py-1 rounded mr-2">
              <Text className="text-primary-700 text-xs font-medium">
                Q{question.number}
              </Text>
            </View>
            <View className="bg-gray-100 px-2 py-1 rounded mr-2">
              <Text className="text-gray-600 text-xs">
                {question.exam_type}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onUnsave}>
            <Text className="text-red-400">🗑️</Text>
          </TouchableOpacity>
        </View>
        
        <Text className="text-gray-900" numberOfLines={isExpanded ? undefined : 2}>
          {question.question_text}
        </Text>
        
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-gray-400 text-sm">
            {question.module_name}
          </Text>
          <Text className="text-primary-500 text-sm">
            {isExpanded ? 'Masquer ▲' : 'Voir réponses ▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="border-t border-gray-100 p-4">
          {/* Question Image */}
          {question.image_url && (
            <Image 
              source={{ uri: question.image_url }}
              className="w-full h-48 mb-4 rounded-lg"
              resizeMode="contain"
            />
          )}
          
          <Text className="text-gray-500 text-sm mb-3">Réponses:</Text>
          <View className="space-y-2">
            {question.answers.map((answer) => (
              <View 
                key={answer.id}
                className={`p-3 rounded-xl ${
                  answer.is_correct ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <View className="flex-row items-start">
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                    answer.is_correct ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      answer.is_correct ? 'text-white' : 'text-gray-500'
                    }`}>
                      {answer.option_label}
                    </Text>
                  </View>
                  <Text className={`flex-1 ${
                    answer.is_correct ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {answer.answer_text}
                  </Text>
                  {answer.is_correct && (
                    <Text className="text-green-500 ml-2">✓</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
