// ============================================================================
// Module Detail Screen - Clean UI Design
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, Pressable, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { getModuleById, getModuleCours, getModuleQuestionCount } from '@/lib/modules'
import { getQuestionCount } from '@/lib/questions'
import { Module, ExamType } from '@/types'
import { EXAM_TYPES_BY_MODULE_TYPE } from '@/constants'
import { FadeInView, Skeleton, AnimatedButton } from '@/components/ui'
import { ChevronLeftIcon, QcmExamIcon, BookQcmIcon } from '@/components/icons'
import { useWebVisibility } from '@/lib/useWebVisibility'

const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors, isDark } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  
  const [module, setModule] = useState<Module | null>(null)
  const [cours, setCours] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<'exam' | 'cours'>('exam')
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)
  const [selectedCours, setSelectedCours] = useState<string | null>(null)
  const [availableExamTypes, setAvailableExamTypes] = useState<{ type: ExamType; count: number }[]>([])
  const [coursWithCounts, setCoursWithCounts] = useState<{ name: string; count: number }[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const headerOpacity = useRef(new Animated.Value(0)).current
  const lastLoadTime = useRef<number>(0)
  const LOAD_COOLDOWN = 5000

  useWebVisibility({
    debounceMs: 200,
    onVisibilityChange: useCallback((isVisible: boolean, hiddenDuration: number) => {
      if (isVisible && hiddenDuration > 60000 && hasLoaded && id) {
        loadModule(true)
      }
    }, [hasLoaded, id]),
  })

  useEffect(() => {
    if (id && !authLoading) {
      loadModule(true)
    }
    Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }, [id, authLoading])

  const loadModule = async (force = false) => {
    if (!id) return
    
    const now = Date.now()
    if (!force && hasLoaded && now - lastLoadTime.current < LOAD_COOLDOWN) {
      return
    }
    
    try {
      lastLoadTime.current = now
      const { module: moduleData } = await getModuleById(id)
      setModule(moduleData)
      if (moduleData) {
        const { count } = await getModuleQuestionCount(moduleData.name)
        setQuestionCount(count)
        const { cours: coursData } = await getModuleCours(moduleData.name)
        setCours(coursData)
        await loadExamTypesWithCounts(moduleData)
        await loadCoursWithCounts(moduleData.name, coursData)
      }
      setHasLoaded(true)
    } catch {
      // Error loading module
    } finally {
      setIsLoading(false)
    }
  }

  const loadExamTypesWithCounts = async (moduleData: Module) => {
    try {
      const validExamTypes = EXAM_TYPES_BY_MODULE_TYPE[moduleData.type] || []
      const examTypesWithCounts = await Promise.all(
        validExamTypes.map(async (examType) => {
          const { count } = await getQuestionCount({ module_name: moduleData.name, exam_type: examType, year: moduleData.year })
          return { type: examType, count }
        })
      )
      setAvailableExamTypes(examTypesWithCounts.filter(item => item.count > 0))
    } catch {
      // Error loading exam types
    }
  }

  const loadCoursWithCounts = async (moduleName: string, coursData: string[]) => {
    try {
      const coursWithCounts = await Promise.all(
        coursData.map(async (coursName) => {
          const { count } = await getQuestionCount({ module_name: moduleName, cours: coursName })
          return { name: coursName, count }
        })
      )
      setCoursWithCounts(coursWithCounts.filter(item => item.count > 0))
    } catch {
      // Error loading cours counts
    }
  }

  const startPractice = async () => {
    if (!module) return
    const params: Record<string, string> = { moduleName: module.name }
    if (selectedMode === 'exam' && selectedExamType) {
      params.examType = selectedExamType
    } else if (selectedMode === 'cours' && selectedCours) {
      params.cours = selectedCours
    }
    const filters: any = { module_name: module.name }
    if (params.examType) filters.exam_type = params.examType
    if (params.cours) filters.cours = params.cours
    const { count } = await getQuestionCount(filters)
    if (count === 0) {
      alert('Aucune question disponible pour cette sélection')
      return
    }
    router.push({ pathname: '/practice/[moduleId]', params: { moduleId: module.id, ...params } })
  }

  const canStartPractice = () => {
    if (selectedMode === 'exam') return !!selectedExamType
    if (selectedMode === 'cours') return !!selectedCours
    return false
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ModuleDetailSkeleton colors={colors} />
      </SafeAreaView>
    )
  }

  if (!module) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <FadeInView animation="scale" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center' }}>Module non trouvé</Text>
        </FadeInView>
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: module.name, headerShown: false }} />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={Platform.OS === 'web' ? [] : ['top', 'bottom', 'left', 'right']}>
        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
          {/* Header */}
          <Animated.View style={{ paddingHorizontal: 20, paddingTop: 16, opacity: headerOpacity }}>
            {/* Back Button + Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={{ marginRight: 12 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeftIcon size={28} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: '700', 
                color: colors.text,
                flex: 1,
              }}>
                {module.name}
              </Text>
            </View>

            {/* Question Count */}
            <Text style={{ 
              fontSize: 15, 
              color: colors.textSecondary, 
              marginBottom: 4 
            }}>
              {questionCount} Questions
            </Text>

            {/* Mode de pratique Title */}
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: colors.text,
              marginBottom: 20,
            }}>
              Mode de pratique
            </Text>

            {/* Mode Toggle Buttons */}
            <View style={{ 
              flexDirection: 'row', 
              gap: 12,
              marginBottom: 24,
            }}>
              {/* Selon les Controles */}
              <TouchableOpacity
                onPress={() => { setSelectedMode('exam'); setSelectedCours(null) }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 24,
                  backgroundColor: selectedMode === 'exam' ? colors.primaryMuted : colors.card,
                  borderWidth: 1.5,
                  borderColor: selectedMode === 'exam' ? colors.primary : colors.border,
                }}
              >
                <QcmExamIcon 
                  size={18} 
                  color={selectedMode === 'exam' ? colors.primary : colors.textSecondary} 
                />
                <Text style={{ 
                  marginLeft: 8,
                  fontSize: 14, 
                  fontWeight: '600',
                  color: selectedMode === 'exam' ? colors.primary : colors.textSecondary,
                }}>
                  Selon les Controles
                </Text>
              </TouchableOpacity>

              {/* Selon les Cours */}
              {cours.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setSelectedMode('cours'); setSelectedExamType(null) }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 24,
                    backgroundColor: selectedMode === 'cours' ? colors.primaryMuted : colors.card,
                    borderWidth: 1.5,
                    borderColor: selectedMode === 'cours' ? colors.primary : colors.border,
                  }}
                >
                  <BookQcmIcon 
                    size={18} 
                    color={selectedMode === 'cours' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={{ 
                    marginLeft: 8,
                    fontSize: 14, 
                    fontWeight: '600',
                    color: selectedMode === 'cours' ? colors.primary : colors.textSecondary,
                  }}>
                    Selon les Cours
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Exam Types List */}
          {selectedMode === 'exam' && availableExamTypes.length > 0 && (
            <View style={{ paddingHorizontal: 20 }}>
              <FadeInView delay={100} animation="slideUp">
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: colors.text, 
                  marginBottom: 12 
                }}>
                  Sélectionner un type d'examen
                </Text>
              </FadeInView>
              {availableExamTypes.map(({ type, count }, index) => (
                <FadeInView key={type} delay={150 + index * 50} animation="slideUp">
                  <SelectableCard
                    isSelected={selectedExamType === type}
                    onPress={() => setSelectedExamType(type)}
                    title={type}
                    subtitle={`${count} question${count !== 1 ? 's' : ''}`}
                    colors={colors}
                    isDark={isDark}
                  />
                </FadeInView>
              ))}
            </View>
          )}

          {/* Cours List */}
          {selectedMode === 'cours' && coursWithCounts.length > 0 && (
            <View style={{ paddingHorizontal: 20 }}>
              <FadeInView delay={100} animation="slideUp">
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: colors.text, 
                  marginBottom: 12 
                }}>
                  Sélectionner un cours
                </Text>
              </FadeInView>
              {coursWithCounts.map(({ name, count }, index) => (
                <FadeInView key={name} delay={150 + index * 50} animation="slideUp">
                  <SelectableCard
                    isSelected={selectedCours === name}
                    onPress={() => setSelectedCours(name)}
                    title={name}
                    subtitle={`${count} question${count !== 1 ? 's' : ''}`}
                    colors={colors}
                    isDark={isDark}
                  />
                </FadeInView>
              ))}
            </View>
          )}

          {/* Empty States */}
          {selectedMode === 'exam' && availableExamTypes.length === 0 && !isLoading && (
            <FadeInView delay={200} animation="scale" style={{ paddingHorizontal: 20, marginTop: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center' }}>
                Aucun examen disponible pour ce module
              </Text>
            </FadeInView>
          )}

          {selectedMode === 'cours' && coursWithCounts.length === 0 && !isLoading && (
            <FadeInView delay={200} animation="scale" style={{ paddingHorizontal: 20, marginTop: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📖</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center' }}>
                Aucun cours disponible pour ce module
              </Text>
            </FadeInView>
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Platform.OS === 'web' ? 24 : 40,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <TouchableOpacity
            onPress={startPractice}
            disabled={!canStartPractice()}
            style={{
              backgroundColor: canStartPractice() ? colors.primary : colors.border,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ 
              color: canStartPractice() ? '#ffffff' : colors.textMuted, 
              fontSize: 17, 
              fontWeight: '700' 
            }}>
              Commencer la pratique
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  )
}

// Selectable Card Component
function SelectableCard({ isSelected, onPress, title, subtitle, colors, isDark }: {
  isSelected: boolean
  onPress: () => void
  title: string
  subtitle: string
  colors: any
  isDark: boolean
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: isSelected ? colors.primary : 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.15 : 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              color: colors.text, 
              fontWeight: '600', 
              fontSize: 16, 
              marginBottom: 2 
            }} numberOfLines={2}>
              {title}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              {subtitle}
            </Text>
          </View>
          {isSelected && (
            <View style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 12, 
              backgroundColor: colors.primary, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>✓</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  )
}

// Skeleton Loader
function ModuleDetailSkeleton({ colors }: { colors: any }) {
  return (
    <View style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <Skeleton width={28} height={28} borderRadius={14} style={{ marginRight: 12 }} />
        <Skeleton width={180} height={28} />
      </View>
      <Skeleton width={100} height={18} style={{ marginBottom: 8 }} />
      <Skeleton width={160} height={24} style={{ marginBottom: 20 }} />
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <Skeleton width={160} height={44} borderRadius={22} />
        <Skeleton width={140} height={44} borderRadius={22} />
      </View>
      <Skeleton width={200} height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={70} borderRadius={14} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={70} borderRadius={14} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={70} borderRadius={14} />
    </View>
  )
}
