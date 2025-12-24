// ============================================================================
// Module Detail Screen - Light Sea Green Brand (Matching Design)
// ============================================================================

import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { getModuleById, getModuleCours, getModuleQuestionCount } from '@/lib/modules'
import { getQuestionCount } from '@/lib/questions'
import { Module, ExamType } from '@/types'
import { EXAM_TYPES, EXAM_TYPES_BY_MODULE_TYPE } from '@/constants'
import { Card, Badge, LoadingSpinner, Button } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  const [module, setModule] = useState<Module | null>(null)
  const [cours, setCours] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<'exam' | 'cours' | null>('exam')
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)
  const [selectedSubDiscipline, setSelectedSubDiscipline] = useState<string | null>(null)
  const [selectedCours, setSelectedCours] = useState<string | null>(null)
  const [availableExamTypes, setAvailableExamTypes] = useState<{ type: ExamType; count: number }[]>([])
  const [coursWithCounts, setCoursWithCounts] = useState<{ name: string; count: number }[]>([])

  useEffect(() => {
    loadModule()
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

        // Load available exam types with counts
        await loadExamTypesWithCounts(moduleData)
        
        // Load cours with counts
        await loadCoursWithCounts(moduleData.name, coursData)
      }
    } catch (error) {
      console.error('Error loading module:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExamTypesWithCounts = async (moduleData: Module) => {
    try {
      // Get valid exam types for this module type
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

      // Only show exam types that have questions
      setAvailableExamTypes(examTypesWithCounts.filter(item => item.count > 0))
    } catch (error) {
      console.error('Error loading exam types:', error)
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

      // Only show cours that have questions
      setCoursWithCounts(coursWithCounts.filter(item => item.count > 0))
    } catch (error) {
      console.error('Error loading cours counts:', error)
    }
  }

  const startPractice = async () => {
    if (!module) return

    // Build query params
    const params: Record<string, string> = {
      moduleName: module.name,
    }

    if (selectedMode === 'exam' && selectedExamType) {
      params.examType = selectedExamType
      if (selectedSubDiscipline) {
        params.subDiscipline = selectedSubDiscipline
      }
    } else if (selectedMode === 'cours' && selectedCours) {
      params.cours = selectedCours
    }

    // Check if there are questions
    const filters: any = { module_name: module.name }
    if (params.examType) filters.exam_type = params.examType
    if (params.subDiscipline) filters.sub_discipline = params.subDiscipline
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
    if (selectedMode === 'exam') {
      return !!selectedExamType
    }
    if (selectedMode === 'cours') {
      return !!selectedCours
    }
    return false
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <LoadingSpinner message="Chargement du module..." />
      </SafeAreaView>
    )
  }

  if (!module) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: BRAND_THEME.colors.gray[600] }}>Module non trouvé</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: module.name,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: BRAND_THEME.colors.primary[600], fontSize: 16 }}>←</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }} edges={['bottom']}>
        <ScrollView style={{ flex: 1 }}>
          {/* Module Header - Matching Design */}
          <View style={{
            backgroundColor: '#ffffff',
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderBottomColor: BRAND_THEME.colors.gray[100]
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 8
            }}>
              {module.name}
            </Text>
            <Text style={{
              color: BRAND_THEME.colors.gray[600],
              fontSize: 14
            }}>
              {questionCount} Questions
            </Text>
          </View>

          {/* Practice Mode Selection - Matching Design */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 12
            }}>
              Mode de pratique
            </Text>

            {/* Exam Mode - Matching Design */}
            <TouchableOpacity
              onPress={() => {
                setSelectedMode('exam')
                setSelectedCours(null)
              }}
              activeOpacity={0.7}
            >
              <Card 
                variant="default" 
                padding="md" 
                style={{
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: selectedMode === 'exam' ? BRAND_THEME.colors.primary[500] : 'transparent'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    backgroundColor: BRAND_THEME.colors.gray[900],
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 20 }}>📝</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: BRAND_THEME.colors.gray[900],
                      fontWeight: '600',
                      fontSize: 16,
                      marginBottom: 2
                    }}>
                      FMC d'examen
                    </Text>
                    <Text style={{
                      color: BRAND_THEME.colors.gray[600],
                      fontSize: 14
                    }}>
                      Questions mélangées par type d'examen
                    </Text>
                  </View>
                  {selectedMode === 'exam' && (
                    <Text style={{ color: BRAND_THEME.colors.primary[500], fontSize: 20 }}>✓</Text>
                  )}
                </View>
              </Card>
            </TouchableOpacity>

            {/* Cours Mode - Matching Design */}
            {cours.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedMode('cours')
                  setSelectedExamType(null)
                  setSelectedSubDiscipline(null)
                }}
                activeOpacity={0.7}
              >
                <Card 
                  variant="default" 
                  padding="md"
                  style={{
                    borderWidth: 2,
                    borderColor: selectedMode === 'cours' ? BRAND_THEME.colors.primary[500] : 'transparent'
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      backgroundColor: BRAND_THEME.colors.gray[900],
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <Text style={{ color: '#ffffff', fontSize: 20 }}>📖</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: BRAND_THEME.colors.gray[900],
                        fontWeight: '600',
                        fontSize: 16,
                        marginBottom: 2
                      }}>
                        Par cours
                      </Text>
                      <Text style={{
                        color: BRAND_THEME.colors.gray[600],
                        fontSize: 14
                      }}>
                        Questions d'un cours spécifique
                      </Text>
                    </View>
                    {selectedMode === 'cours' && (
                      <Text style={{ color: BRAND_THEME.colors.primary[500], fontSize: 20 }}>✓</Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          </View>

          {/* Exam Types List - Inline Display */}
          {selectedMode === 'exam' && availableExamTypes.length > 0 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 12
              }}>
                Types d'examen disponibles
              </Text>
              
              {availableExamTypes.map(({ type, count }) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedExamType(type)}
                  activeOpacity={0.7}
                  style={{ marginBottom: 8 }}
                >
                  <Card 
                    variant="default" 
                    padding="md"
                    style={{
                      borderWidth: 2,
                      borderColor: selectedExamType === type ? BRAND_THEME.colors.primary[500] : 'transparent'
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{
                          color: BRAND_THEME.colors.gray[900],
                          fontWeight: '600',
                          fontSize: 16,
                          marginBottom: 2
                        }}>
                          {type}
                        </Text>
                        <Text style={{
                          color: BRAND_THEME.colors.gray[600],
                          fontSize: 14
                        }}>
                          {count} question{count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Badge 
                          variant="secondary" 
                          size="sm"
                          label={`${count} QCM`}
                        />
                        {selectedExamType === type && (
                          <Text style={{ color: BRAND_THEME.colors.primary[500], fontSize: 20 }}>✓</Text>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Cours List - Inline Display */}
          {selectedMode === 'cours' && coursWithCounts.length > 0 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 12
              }}>
                Cours disponibles
              </Text>
              
              {coursWithCounts.map(({ name, count }) => (
                <TouchableOpacity
                  key={name}
                  onPress={() => setSelectedCours(name)}
                  activeOpacity={0.7}
                  style={{ marginBottom: 8 }}
                >
                  <Card 
                    variant="default" 
                    padding="md"
                    style={{
                      borderWidth: 2,
                      borderColor: selectedCours === name ? BRAND_THEME.colors.primary[500] : 'transparent'
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: BRAND_THEME.colors.gray[900],
                          fontWeight: '600',
                          fontSize: 16,
                          marginBottom: 2
                        }} numberOfLines={2}>
                          {name}
                        </Text>
                        <Text style={{
                          color: BRAND_THEME.colors.gray[600],
                          fontSize: 14
                        }}>
                          {count} question{count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Badge 
                          variant="secondary" 
                          size="sm"
                          label={`${count} QCM`}
                        />
                        {selectedCours === name && (
                          <Text style={{ color: BRAND_THEME.colors.primary[500], fontSize: 20 }}>✓</Text>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty State Messages */}
          {selectedMode === 'exam' && availableExamTypes.length === 0 && !isLoading && (
            <View style={{ paddingHorizontal: 24, marginTop: 24, alignItems: 'center' }}>
              <Text style={{
                color: BRAND_THEME.colors.gray[500],
                fontSize: 16,
                textAlign: 'center'
              }}>
                Aucun examen disponible pour ce module
              </Text>
            </View>
          )}

          {selectedMode === 'cours' && coursWithCounts.length === 0 && !isLoading && (
            <View style={{ paddingHorizontal: 24, marginTop: 24, alignItems: 'center' }}>
              <Text style={{
                color: BRAND_THEME.colors.gray[500],
                fontSize: 16,
                textAlign: 'center'
              }}>
                Aucun cours disponible pour ce module
              </Text>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Start Button - Matching Design */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: BRAND_THEME.colors.gray[100],
          paddingHorizontal: 24,
          paddingVertical: 16
        }}>
          <Button
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
