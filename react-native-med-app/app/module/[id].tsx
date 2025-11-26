// ============================================================================
// Module Detail Screen
// ============================================================================

import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { getModuleById, getModuleCours, getModuleQuestionCount } from '@/lib/modules'
import { getQuestionCount } from '@/lib/questions'
import { Module, ExamType } from '@/types'
import { MODULE_TYPES, MODULE_TYPE_COLORS, EXAM_TYPES } from '@/constants'

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  const [module, setModule] = useState<Module | null>(null)
  const [cours, setCours] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<'exam' | 'cours' | null>(null)
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)
  const [selectedSubDiscipline, setSelectedSubDiscipline] = useState<string | null>(null)
  const [selectedCours, setSelectedCours] = useState<string | null>(null)

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
      }
    } catch (error) {
      console.error('Error loading module:', error)
    } finally {
      setIsLoading(false)
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
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  if (!module) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Module non trouvé</Text>
      </SafeAreaView>
    )
  }

  const moduleType = MODULE_TYPES.find(t => t.value === module.type)
  const colors = MODULE_TYPE_COLORS[module.type]

  return (
    <>
      <Stack.Screen options={{ title: module.name }} />
      
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <ScrollView className="flex-1">
          {/* Module Header */}
          <View className="bg-white px-6 py-6 border-b border-gray-100">
            <View className={`self-start px-3 py-1 rounded-full mb-3 ${colors.bg}`}>
              <Text className={`text-sm font-medium ${colors.text}`}>
                {moduleType?.icon} {moduleType?.label}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {module.name}
            </Text>
            <Text className="text-gray-500">
              {questionCount} questions disponibles
            </Text>
          </View>

          {/* Practice Mode Selection */}
          <View className="px-6 mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Mode de pratique
            </Text>

            {/* Exam Mode */}
            <TouchableOpacity
              className={`bg-white rounded-xl p-4 mb-3 border-2 ${
                selectedMode === 'exam' ? 'border-primary-500' : 'border-transparent'
              }`}
              onPress={() => {
                setSelectedMode('exam')
                setSelectedCours(null)
              }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4">
                  <Text className="text-2xl">📝</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">QCM d'examen</Text>
                  <Text className="text-gray-500 text-sm">
                    Questions mélangées par type d'examen
                  </Text>
                </View>
                {selectedMode === 'exam' && (
                  <Text className="text-primary-500 text-xl">✓</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Cours Mode */}
            {cours.length > 0 && (
              <TouchableOpacity
                className={`bg-white rounded-xl p-4 border-2 ${
                  selectedMode === 'cours' ? 'border-primary-500' : 'border-transparent'
                }`}
                onPress={() => {
                  setSelectedMode('cours')
                  setSelectedExamType(null)
                  setSelectedSubDiscipline(null)
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-green-50 rounded-xl items-center justify-center mr-4">
                    <Text className="text-2xl">📖</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">Par cours</Text>
                    <Text className="text-gray-500 text-sm">
                      Questions d'un cours spécifique
                    </Text>
                  </View>
                  {selectedMode === 'cours' && (
                    <Text className="text-primary-500 text-xl">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Exam Type Selection */}
          {selectedMode === 'exam' && (
            <View className="px-6 mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Type d'examen
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {module.exam_types.map((examType) => (
                  <TouchableOpacity
                    key={examType}
                    className={`px-4 py-2 rounded-full ${
                      selectedExamType === examType 
                        ? 'bg-primary-500' 
                        : 'bg-white border border-gray-200'
                    }`}
                    onPress={() => setSelectedExamType(examType)}
                  >
                    <Text className={`font-medium ${
                      selectedExamType === examType ? 'text-white' : 'text-gray-700'
                    }`}>
                      {examType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sub-discipline Selection (for UEI) */}
          {selectedMode === 'exam' && module.has_sub_disciplines && module.sub_disciplines && (
            <View className="px-6 mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Sous-discipline (optionnel)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${
                    selectedSubDiscipline === null 
                      ? 'bg-primary-500' 
                      : 'bg-white border border-gray-200'
                  }`}
                  onPress={() => setSelectedSubDiscipline(null)}
                >
                  <Text className={`font-medium ${
                    selectedSubDiscipline === null ? 'text-white' : 'text-gray-700'
                  }`}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {module.sub_disciplines.map((sub) => (
                  <TouchableOpacity
                    key={sub.name}
                    className={`px-4 py-2 rounded-full ${
                      selectedSubDiscipline === sub.name 
                        ? 'bg-primary-500' 
                        : 'bg-white border border-gray-200'
                    }`}
                    onPress={() => setSelectedSubDiscipline(sub.name)}
                  >
                    <Text className={`font-medium ${
                      selectedSubDiscipline === sub.name ? 'text-white' : 'text-gray-700'
                    }`}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Cours Selection */}
          {selectedMode === 'cours' && (
            <View className="px-6 mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Sélectionner un cours
              </Text>
              <View className="space-y-2">
                {cours.map((c) => (
                  <TouchableOpacity
                    key={c}
                    className={`bg-white rounded-xl p-4 border-2 ${
                      selectedCours === c ? 'border-primary-500' : 'border-transparent'
                    }`}
                    onPress={() => setSelectedCours(c)}
                  >
                    <Text className="text-gray-900">{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View className="h-24" />
        </ScrollView>

        {/* Start Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              canStartPractice() ? 'bg-primary-500' : 'bg-gray-200'
            }`}
            onPress={startPractice}
            disabled={!canStartPractice()}
          >
            <Text className={`text-center font-semibold text-lg ${
              canStartPractice() ? 'text-white' : 'text-gray-400'
            }`}>
              Commencer la pratique
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  )
}
