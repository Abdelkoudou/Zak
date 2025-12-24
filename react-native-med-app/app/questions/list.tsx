// ============================================================================
// Questions List Screen - Browse Questions by Filters
// ============================================================================

import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getQuestions, getQuestionCount } from '@/lib/questions'
import { QuestionWithAnswers, ExamType, YearLevel } from '@/types'
import { Card, Badge, LoadingSpinner, Button } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { EXAM_TYPES, YEARS } from '@/constants'

export default function QuestionsListScreen() {
  const { 
    moduleName, 
    initialExamType, 
    initialYear,
    mode = 'exam' // 'exam' or 'cours'
  } = useLocalSearchParams<{
    moduleName: string
    initialExamType?: string
    initialYear?: string
    mode?: string
  }>()
  
  const { user } = useAuth()
  
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(
    initialExamType as ExamType || null
  )
  const [selectedYear, setSelectedYear] = useState<YearLevel | null>(
    initialYear as YearLevel || null
  )
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    loadQuestions(true) // Reset on filter change
  }, [selectedExamType, selectedYear])

  const loadQuestions = async (reset = false) => {
    if (!moduleName) return

    try {
      setIsLoading(true)
      
      const filters: any = { 
        module_name: moduleName,
        limit: ITEMS_PER_PAGE,
        offset: reset ? 0 : page * ITEMS_PER_PAGE
      }
      
      if (selectedExamType) filters.exam_type = selectedExamType
      if (selectedYear) filters.year = selectedYear

      const { questions: data, total } = await getQuestions(filters)
      
      if (reset) {
        setQuestions(data)
        setPage(0)
      } else {
        setQuestions(prev => [...prev, ...data])
      }
      
      setTotalCount(total)
      setHasMore(data.length === ITEMS_PER_PAGE)
      
      if (!reset) {
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadQuestions(false)
    }
  }

  const startPracticeWithFilters = () => {
    if (!moduleName) return

    const params: Record<string, string> = {
      moduleName: moduleName,
    }

    if (selectedExamType) params.examType = selectedExamType
    if (selectedYear) params.year = selectedYear

    router.push({
      pathname: '/practice/[moduleId]',
      params: { moduleId: 'filtered', ...params }
    })
  }

  const renderQuestion = ({ item: question, index }: { item: QuestionWithAnswers; index: number }) => (
    <TouchableOpacity
      key={question.id}
      onPress={() => {
        router.push({
          pathname: '/practice/[moduleId]',
          params: {
            moduleId: 'single',
            moduleName: moduleName,
            questionId: question.id,
            startIndex: index.toString()
          }
        })
      }}
      activeOpacity={0.7}
    >
      <Card variant="default" padding="md" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: BRAND_THEME.colors.primary[600]
          }}>
            Question {question.number}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {question.exam_type && (
              <Badge 
                variant="secondary" 
                size="sm"
                label={question.exam_type}
              />
            )}
            {question.year && (
              <Badge 
                variant="gray" 
                size="sm"
                label={`${question.year}ère Année`}
              />
            )}
          </View>
        </View>
        
        <Text style={{
          fontSize: 16,
          lineHeight: 24,
          color: BRAND_THEME.colors.gray[900],
          marginBottom: 12
        }} numberOfLines={3}>
          {question.question_text}
        </Text>

        {question.sub_discipline && (
          <Badge 
            variant="gray" 
            size="sm"
            label={question.sub_discipline}
            style={{ alignSelf: 'flex-start', marginBottom: 8 }}
          />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: 12,
            color: BRAND_THEME.colors.gray[500]
          }}>
            {question.answers.length} options
          </Text>
          
          <Text style={{
            fontSize: 12,
            color: BRAND_THEME.colors.primary[600],
            fontWeight: '500'
          }}>
            Voir la question →
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  )

  const renderFilters = () => (
    <View style={{ padding: 16, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      {/* Exam Type Filter */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: BRAND_THEME.colors.gray[900],
          marginBottom: 8
        }}>
          Type d'Examen
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: !selectedExamType ? BRAND_THEME.colors.primary[100] : BRAND_THEME.colors.gray[100]
              }}
              onPress={() => setSelectedExamType(null)}
            >
              <Text style={{
                fontWeight: '500',
                color: !selectedExamType ? BRAND_THEME.colors.primary[700] : BRAND_THEME.colors.gray[700]
              }}>
                Tous
              </Text>
            </TouchableOpacity>
            {EXAM_TYPES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedExamType === value ? BRAND_THEME.colors.primary[100] : BRAND_THEME.colors.gray[100]
                }}
                onPress={() => setSelectedExamType(value)}
              >
                <Text style={{
                  fontWeight: '500',
                  color: selectedExamType === value ? BRAND_THEME.colors.primary[700] : BRAND_THEME.colors.gray[700]
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Year Filter */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: BRAND_THEME.colors.gray[900],
          marginBottom: 8
        }}>
          Année d'Étude
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: !selectedYear ? BRAND_THEME.colors.primary[100] : BRAND_THEME.colors.gray[100]
              }}
              onPress={() => setSelectedYear(null)}
            >
              <Text style={{
                fontWeight: '500',
                color: !selectedYear ? BRAND_THEME.colors.primary[700] : BRAND_THEME.colors.gray[700]
              }}>
                Toutes
              </Text>
            </TouchableOpacity>
            {YEARS.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedYear === value ? BRAND_THEME.colors.primary[100] : BRAND_THEME.colors.gray[100]
                }}
                onPress={() => setSelectedYear(value)}
              >
                <Text style={{
                  fontWeight: '500',
                  color: selectedYear === value ? BRAND_THEME.colors.primary[700] : BRAND_THEME.colors.gray[700]
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results Summary */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: BRAND_THEME.colors.gray[200]
      }}>
        <Text style={{
          fontSize: 14,
          color: BRAND_THEME.colors.gray[600]
        }}>
          {totalCount} question{totalCount !== 1 ? 's' : ''} trouvée{totalCount !== 1 ? 's' : ''}
        </Text>
        
        {totalCount > 0 && (
          <Button 
            variant="outline"
            size="sm"
            title="Commencer la Pratique"
            onPress={startPracticeWithFilters}
          />
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      <Stack.Screen 
        options={{ 
          title: `Questions - ${moduleName}`,
          headerStyle: { backgroundColor: BRAND_THEME.colors.primary[600] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: '600' }
        }} 
      />

      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderFilters}
        ListEmptyComponent={() => (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: 32,
            minHeight: 200
          }}>
            {isLoading ? (
              <LoadingSpinner size="large" />
            ) : (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Aucune question trouvée
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: BRAND_THEME.colors.gray[500],
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  Essayez de modifier les filtres pour voir plus de questions
                </Text>
              </>
            )}
          </View>
        )}
        ListFooterComponent={() => (
          hasMore && questions.length > 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Button
                  variant="outline"
                  title="Charger Plus"
                  onPress={loadMore}
                />
              )}
            </View>
          ) : null
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}