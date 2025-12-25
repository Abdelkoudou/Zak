// ============================================================================
// Module Detail Screen - Premium UI with Smooth Animations
// ============================================================================

import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { getModuleById, getModuleCours, getModuleQuestionCount } from '@/lib/modules'
import { getQuestionCount } from '@/lib/questions'
import { Module, ExamType } from '@/types'
import { EXAM_TYPES_BY_MODULE_TYPE } from '@/constants'
import { FadeInView, Skeleton, AnimatedButton } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { QcmExamIcon, BookQcmIcon, ChevronLeftIcon } from '@/components/icons'

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  const [module, setModule] = useState<Module | null>(null)
  const [cours, setCours] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<'exam' | 'cours' | null>('exam')
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)
  const [selectedCours, setSelectedCours] = useState<string | null>(null)
  const [availableExamTypes, setAvailableExamTypes] = useState<{ type: ExamType; count: number }[]>([])
  const [coursWithCounts, setCoursWithCounts] = useState<{ name: string; count: number }[]>([])

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    loadModule()
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start()
  }, [id])

  const loadModule = async () => {
    if (!id) return

    try {
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
    } catch {
      // Error loading module silently handled
    } finally {
      setIsLoading(false)
    }
  }

  const loadExamTypesWithCounts = async (moduleData: Module) => {
    try {
      const validExamTypes = EXAM_TYPES_BY_MODULE_TYPE[moduleData.type] || []
      
      const examTypesWithCounts = await Promise.all(
        validExamTypes.map(async (examType) => {
          const { count } = await getQuestionCount({
            module_name: moduleData.name,
            exam_type: examType,
            year: moduleData.year
          })
          return { type: examType, count }
        })
      )

      setAvailableExamTypes(examTypesWithCounts.filter(item => item.count > 0))
    } catch {
      // Error loading exam types silently handled
    }
  }

  const loadCoursWithCounts = async (moduleName: string, coursData: string[]) => {
    try {
      const coursWithCounts = await Promise.all(
        coursData.map(async (coursName) => {
          const { count } = await getQuestionCount({
            module_name: moduleName,
            cours: coursName
          })
          return { name: coursName, count }
        })
      )

      setCoursWithCounts(coursWithCounts.filter(item => item.count > 0))
    } catch {
      // Error loading cours counts silently handled
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

    router.push({
      pathname: '/practice/[moduleId]',
      params: { moduleId: module.id, ...params }
    })
  }

  const canStartPractice = () => {
    if (!selectedMode) return false
    if (selectedMode === 'exam') return !!selectedExamType
    if (selectedMode === 'cours') return !!selectedCours
    return false
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <ModuleDetailSkeleton />
      </SafeAreaView>
    )
  }

  if (!module) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <FadeInView animation="scale" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
          <Text style={{ color: BRAND_THEME.colors.gray[600], fontSize: 16, textAlign: 'center' }}>Module non trouvé</Text>
          <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 12, marginTop: 8 }}>ID: {id}</Text>
        </FadeInView>
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: module.name,
          headerShown: false,
        }} 
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Module Header */}
          <Animated.View style={{
            backgroundColor: '#09B2AD',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 32,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          }}>
            {/* Back Button */}
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginBottom: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ChevronLeftIcon size={24} color="#ffffff" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <Text style={{
              fontSize: 26,
              fontWeight: '800',
              color: '#ffffff',
              marginBottom: 8,
              letterSpacing: -0.5,
            }}>
              {module.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                  {questionCount} Questions
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                  {module.year}ère Année
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Practice Mode Selection */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <FadeInView delay={100} animation="slideUp">
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 14,
              }}>
                Mode de pratique
              </Text>
            </FadeInView>

            {/* Exam Mode */}
            <FadeInView delay={150} animation="slideUp">
              <AnimatedModeCard
                isSelected={selectedMode === 'exam'}
                onPress={() => { setSelectedMode('exam'); setSelectedCours(null) }}
                icon={<QcmExamIcon size={26} color="#ffffff" />}
                title="QCM d'examen"
                subtitle="Questions mélangées par type d'examen"
              />
            </FadeInView>

            {/* Cours Mode */}
            {cours.length > 0 && (
              <FadeInView delay={200} animation="slideUp">
                <AnimatedModeCard
                  isSelected={selectedMode === 'cours'}
                  onPress={() => { setSelectedMode('cours'); setSelectedExamType(null) }}
                  icon={<BookQcmIcon size={26} color="#ffffff" />}
                  title="Par cours"
                  subtitle="Questions d'un cours spécifique"
                />
              </FadeInView>
            )}
          </View>

          {/* Exam Types List */}
          {selectedMode === 'exam' && availableExamTypes.length > 0 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <FadeInView delay={250} animation="slideUp">
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 14,
                }}>
                  Types d'examen disponibles
                </Text>
              </FadeInView>
              
              {availableExamTypes.map(({ type, count }, index) => (
                <FadeInView key={type} delay={300 + index * 50} animation="slideUp">
                  <AnimatedOptionCard
                    isSelected={selectedExamType === type}
                    onPress={() => setSelectedExamType(type)}
                    title={type}
                    count={count}
                  />
                </FadeInView>
              ))}
            </View>
          )}

          {/* Cours List */}
          {selectedMode === 'cours' && coursWithCounts.length > 0 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <FadeInView delay={250} animation="slideUp">
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 14,
                }}>
                  Cours disponibles
                </Text>
              </FadeInView>
              
              {coursWithCounts.map(({ name, count }, index) => (
                <FadeInView key={name} delay={300 + index * 50} animation="slideUp">
                  <AnimatedOptionCard
                    isSelected={selectedCours === name}
                    onPress={() => setSelectedCours(name)}
                    title={name}
                    count={count}
                  />
                </FadeInView>
              ))}
            </View>
          )}

          {/* Empty States */}
          {selectedMode === 'exam' && availableExamTypes.length === 0 && !isLoading && (
            <FadeInView delay={300} animation="scale" style={{ paddingHorizontal: 24, marginTop: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 16, textAlign: 'center' }}>
                Aucun examen disponible pour ce module
              </Text>
            </FadeInView>
          )}

          {selectedMode === 'cours' && coursWithCounts.length === 0 && !isLoading && (
            <FadeInView delay={300} animation="scale" style={{ paddingHorizontal: 24, marginTop: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📖</Text>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 16, textAlign: 'center' }}>
                Aucun cours disponible pour ce module
              </Text>
            </FadeInView>
          )}

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Start Button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: BRAND_THEME.colors.gray[100],
          paddingHorizontal: 24,
          paddingVertical: 16,
          paddingBottom: 32,
        }}>
          <AnimatedButton
            title="Commencer la pratique"
            onPress={startPractice}
            disabled={!canStartPractice()}
            variant="primary"
            size="lg"
          />
        </View>
      </SafeAreaView>
    </>
  )
}

// Animated Mode Card
function AnimatedModeCard({ isSelected, onPress, icon, title, subtitle }: {
  isSelected: boolean
  onPress: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 100, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: isSelected ? '#09B2AD' : 'transparent',
        ...BRAND_THEME.shadows.sm,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 52,
            height: 52,
            backgroundColor: isSelected ? '#09B2AD' : BRAND_THEME.colors.gray[800],
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontWeight: '700',
              fontSize: 17,
              marginBottom: 4,
            }}>
              {title}
            </Text>
            <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 14 }}>
              {subtitle}
            </Text>
          </View>
          {isSelected && (
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#09B2AD',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>✓</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  )
}

// Animated Option Card
function AnimatedOptionCard({ isSelected, onPress, title, count }: {
  isSelected: boolean
  onPress: () => void
  title: string
  count: number
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 100, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: isSelected ? '#09B2AD' : 'transparent',
        ...BRAND_THEME.shadows.sm,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontWeight: '600',
              fontSize: 16,
              marginBottom: 4,
            }} numberOfLines={2}>
              {title}
            </Text>
            <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 14 }}>
              {count} question{count !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              backgroundColor: 'rgba(9, 178, 173, 0.1)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 13 }}>{count} QCM</Text>
            </View>
            {isSelected && (
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#09B2AD',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>✓</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}

// Module Detail Skeleton
function ModuleDetailSkeleton() {
  return (
    <View>
      <View style={{ backgroundColor: '#09B2AD', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <Skeleton width={200} height={28} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={120} height={32} borderRadius={20} />
          <Skeleton width={100} height={32} borderRadius={20} />
        </View>
      </View>
      <View style={{ padding: 24 }}>
        <Skeleton width={150} height={22} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={90} borderRadius={18} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={90} borderRadius={18} />
      </View>
    </View>
  )
}
