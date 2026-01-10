// ============================================================================
// Saved Questions Screen - Premium Animations with Dark Mode
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Animated, LayoutAnimation, Platform, UIManager } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useFocusEffect, useNavigation } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { getSavedQuestions, unsaveQuestion } from '@/lib/saved'
import { QuestionWithAnswers } from '@/types'
import { FadeInView, StaggeredList, ListSkeleton } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'
import { useWebVisibility } from '@/lib/useWebVisibility'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export default function SavedQuestionsScreen() {
  const navigation = useNavigation()
  const { user, isLoading: authLoading } = useAuth()
  const { colors, isDark } = useTheme()

  
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  
  // Track last load time to prevent rapid reloads
  const lastLoadTime = useRef<number>(0)
  const LOAD_COOLDOWN = 5000

  const loadQuestions = useCallback(async (force = false) => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    // Prevent rapid reloads unless forced
    const now = Date.now()
    if (!force && hasLoaded && now - lastLoadTime.current < LOAD_COOLDOWN) {
      setRefreshing(false)
      return
    }

    try {
      lastLoadTime.current = now
      const { questions: data } = await getSavedQuestions(user.id)
      setQuestions(data)
      setHasLoaded(true)
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading saved questions:', error)
      }
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, hasLoaded])

  // Handle visibility changes on web
  useWebVisibility({
    debounceMs: 200,
    onVisibilityChange: useCallback((isVisible: boolean, hiddenDuration: number) => {
      // Reload data if hidden for more than 60 seconds
      if (isVisible && hiddenDuration > 60000 && hasLoaded && user) {
        loadQuestions(true)
      }
    }, [loadQuestions, hasLoaded, user]),
  })

  // Load on focus (native) or initial mount (web)
  useFocusEffect(
    useCallback(() => {
      // On web, only load on initial mount, not on every focus
      if (Platform.OS === 'web' && hasLoaded) {
        return
      }
      loadQuestions(true)
    }, [loadQuestions, hasLoaded])
  )

  // Also load when user changes
  useEffect(() => {
    if (user && !authLoading) {
      loadQuestions(true)
    }
  }, [user?.id, authLoading])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadQuestions()
  }, [loadQuestions])

  const handleUnsave = async (questionId: string) => {
    if (!user) return
    
    // Animate removal
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    
    await unsaveQuestion(user.id, questionId)
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedId(expandedId === id ? null : id)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: 'Questions sauvegardées' }} />
        <View style={{ padding: 24 }}>
          <ListSkeleton count={3} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Questions sauvegardées',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={{ marginRight: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeftIcon size={24} color={colors.text} />
            </TouchableOpacity>
          )
        }} 

      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            {questions.length === 0 ? (
              <FadeInView animation="scale" delay={100}>
                <View style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: 'center',
                  marginTop: 32,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>💾</Text>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: colors.text,
                    marginBottom: 8
                  }}>
                    Aucune question sauvegardée
                  </Text>
                  <Text style={{
                    color: colors.textMuted,
                    textAlign: 'center',
                    lineHeight: 22
                  }}>
                    Sauvegardez des questions pendant vos sessions de pratique pour les revoir plus tard
                  </Text>
                </View>
              </FadeInView>
            ) : (
              <>
                <FadeInView animation="slideUp" delay={0}>
                  <Text style={{
                    color: colors.textMuted,
                    marginBottom: 16
                  }}>
                    {questions.length} question{questions.length > 1 ? 's' : ''} sauvegardée{questions.length > 1 ? 's' : ''}
                  </Text>
                </FadeInView>
                
                <View style={{ gap: 12 }}>
                  {questions.map((question, index) => (
                    <FadeInView key={question.id} animation="slideUp" delay={index * 60}>
                      <SavedQuestionCard
                        question={question}
                        isExpanded={expandedId === question.id}
                        onToggle={() => toggleExpand(question.id)}
                        onUnsave={() => handleUnsave(question.id)}
                        colors={colors}
                        isDark={isDark}
                      />
                    </FadeInView>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

// Saved Question Card Component with Animations
function SavedQuestionCard({
  question,
  isExpanded,
  onToggle,
  onUnsave,
  colors,
  isDark,
}: {
  question: QuestionWithAnswers
  isExpanded: boolean
  onToggle: () => void
  onUnsave: () => void
  colors: any
  isDark: boolean
}) {
  const correctAnswers = question.answers.filter(a => a.is_correct)
  const scale = useRef(new Animated.Value(1)).current
  const deleteScale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start()
  }

  const handleDeletePress = () => {
    Animated.sequence([
      Animated.timing(deleteScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(deleteScale, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => onUnsave())
  }

  return (
    <Animated.View style={{
      transform: [{ scale }],
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    }}>
      {/* Header */}
      <TouchableOpacity 
        style={{ padding: 16 }}
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View style={{
              backgroundColor: colors.primaryMuted,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              marginRight: 8
            }}>
              <Text style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: '500'
              }}>
                Q{question.number}
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.backgroundSecondary,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6
            }}>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 12
              }}>
                {question.exam_type}
              </Text>
            </View>
          </View>
          <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
            <TouchableOpacity onPress={handleDeletePress} activeOpacity={0.7}>
              <Text style={{ fontSize: 18 }}>🗑️</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <Text 
          style={{
            color: colors.text,
            fontSize: 15,
            lineHeight: 22
          }}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {question.question_text}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12
        }}>
          <Text style={{
            color: colors.textMuted,
            fontSize: 13
          }}>
            {question.module_name}
          </Text>
          <Text style={{
            color: colors.primary,
            fontSize: 13,
            fontWeight: '500'
          }}>
            {isExpanded ? 'Masquer ▲' : 'Voir réponses ▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          padding: 16
        }}>
          {/* Question Image */}
          {question.image_url && (
            <Image 
              source={{ uri: question.image_url }}
              style={{
                width: '100%',
                height: 192,
                marginBottom: 16,
                borderRadius: 12
              }}
              resizeMode="contain"
            />
          )}
          
          <Text style={{
            color: colors.textMuted,
            fontSize: 13,
            marginBottom: 12
          }}>
            Réponses:
          </Text>
          <View style={{ gap: 8 }}>
            {question.answers.map((answer, index) => (
              <FadeInView key={answer.id} animation="slideUp" delay={index * 50} replayOnFocus={false}>
                <View style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: answer.is_correct 
                    ? colors.successLight 
                    : colors.backgroundSecondary
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                      backgroundColor: answer.is_correct 
                        ? colors.success 
                        : colors.border
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: answer.is_correct ? '#ffffff' : colors.textMuted
                      }}>
                        {answer.option_label}
                      </Text>
                    </View>
                    <Text style={{
                      flex: 1,
                      fontSize: 14,
                      lineHeight: 20,
                      color: answer.is_correct 
                        ? colors.success 
                        : colors.textSecondary
                    }}>
                      {answer.answer_text}
                    </Text>
                    {answer.is_correct && (
                      <Text style={{
                        color: colors.success,
                        marginLeft: 8
                      }}>✓</Text>
                    )}
                  </View>
                </View>
              </FadeInView>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  )
}
