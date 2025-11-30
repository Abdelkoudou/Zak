// ============================================================================
// Home Screen - Modules List
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getModulesWithCounts } from '@/lib/modules'
import { getUserStatistics } from '@/lib/stats'
import { Module, UserStatistics } from '@/types'
import { MODULE_TYPES, MODULE_TYPE_COLORS } from '@/constants'

export default function HomeScreen() {
  const { user } = useAuth()
  
  const [modules, setModules] = useState<(Module & { question_count: number })[]>([])
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // Load modules for user's year (default to year 1 if not set)
      const yearToLoad = user.year_of_study || '1'
      const { modules: modulesData, error: modulesError } = await getModulesWithCounts(yearToLoad)
      
      if (modulesError) {
        console.error('Error loading modules:', modulesError)
      }
      setModules(modulesData)

      // Load user statistics
      const { stats: statsData, error: statsError } = await getUserStatistics(user.id)
      
      if (statsError) {
        console.error('Error loading stats:', statsError)
      }
      setStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  const getYearLabel = () => {
    switch (user?.year_of_study) {
      case '1': return '1ère Année'
      case '2': return '2ème Année'
      case '3': return '3ème Année'
      default: return ''
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-primary-500 px-6 py-8 rounded-b-3xl">
          <Text className="text-white text-lg opacity-80">Bienvenue,</Text>
          <Text className="text-white text-2xl font-bold mb-4">
            {user?.full_name || 'Étudiant'}
          </Text>
          
          <View className="flex-row items-center">
            <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
              <Text className="text-white font-medium">{getYearLabel()}</Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-medium">{user?.speciality}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        {stats && (
          <View className="px-6 -mt-6">
            <View className="bg-white rounded-2xl p-4 shadow-sm flex-row">
              <StatItem 
                label="Questions" 
                value={stats.total_questions_attempted.toString()} 
                icon="📝"
              />
              <StatItem 
                label="Précision" 
                value={`${Math.round(stats.average_score)}%`} 
                icon="🎯"
              />
              <StatItem 
                label="Sauvegardées" 
                value={stats.saved_questions_count.toString()} 
                icon="💾"
              />
            </View>
          </View>
        )}

        {/* Modules Section */}
        <View className="px-6 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Vos Modules
          </Text>

          {modules.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-4xl mb-4">📚</Text>
              <Text className="text-gray-500 text-center">
                Aucun module disponible pour votre année
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {modules.map((module) => (
                <ModuleCard 
                  key={module.id} 
                  module={module}
                  onPress={() => router.push(`/module/${module.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Item Component
function StatItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  )
}

// Module Card Component
function ModuleCard({ 
  module, 
  onPress 
}: { 
  module: Module & { question_count: number }
  onPress: () => void 
}) {
  const moduleType = MODULE_TYPES.find(t => t.value === module.type)
  const colors = MODULE_TYPE_COLORS[module.type]

  return (
    <TouchableOpacity 
      className="bg-white rounded-2xl p-4 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={2}>
            {module.name}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${colors.bg}`}>
          <Text className={`text-xs font-medium ${colors.text}`}>
            {moduleType?.icon} {moduleType?.label}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-sm">
            {module.question_count} questions
          </Text>
          {module.has_sub_disciplines && (
            <Text className="text-gray-400 text-sm ml-2">
              • {module.sub_disciplines?.length || 0} sous-disciplines
            </Text>
          )}
        </View>
        <Text className="text-primary-500 font-medium">Pratiquer →</Text>
      </View>
    </TouchableOpacity>
  )
}
