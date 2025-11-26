// ============================================================================
// Profile Screen
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getUserStatistics, getAllModuleStatistics } from '@/lib/stats'
import { getSavedQuestionsCount } from '@/lib/saved'
import { UserStatistics, ModuleStatistics } from '@/types'
import { YEARS, SPECIALITIES } from '@/constants'

export default function ProfileScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth()
  
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [moduleStats, setModuleStats] = useState<ModuleStatistics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    try {
      const { stats: userStats } = await getUserStatistics(user.id)
      setStats(userStats)

      const { stats: modStats } = await getAllModuleStatistics(user.id)
      setModuleStats(modStats)
    } catch (error) {
      console.error('Error loading profile data:', error)
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

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/welcome')
          }
        },
      ]
    )
  }

  const getYearLabel = () => {
    return YEARS.find(y => y.value === user?.year_of_study)?.label || ''
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getSubscriptionStatus = () => {
    if (!user?.is_paid) return { label: 'Non actif', color: 'text-red-500', bg: 'bg-red-50' }
    if (!user.subscription_expires_at) return { label: 'Actif', color: 'text-green-500', bg: 'bg-green-50' }
    
    const expiryDate = new Date(user.subscription_expires_at)
    const now = new Date()
    
    if (expiryDate < now) {
      return { label: 'Expiré', color: 'text-red-500', bg: 'bg-red-50' }
    }
    
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 7) {
      return { label: `Expire dans ${daysLeft}j`, color: 'text-orange-500', bg: 'bg-orange-50' }
    }
    
    return { label: 'Actif', color: 'text-green-500', bg: 'bg-green-50' }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mr-4">
              <Text className="text-3xl">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {user?.full_name || 'Utilisateur'}
              </Text>
              <Text className="text-gray-500">{user?.email}</Text>
            </View>
          </View>

          {/* User Info Badges */}
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-primary-50 px-3 py-1 rounded-full">
              <Text className="text-primary-700 font-medium">{getYearLabel()}</Text>
            </View>
            <View className="bg-purple-50 px-3 py-1 rounded-full">
              <Text className="text-purple-700 font-medium">{user?.speciality}</Text>
            </View>
            {user?.region && (
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-gray-700 font-medium">{user.region}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Status */}
        <View className="px-6 mt-4">
          <View className={`${subscriptionStatus.bg} rounded-xl p-4 flex-row items-center justify-between`}>
            <View>
              <Text className="text-gray-700 font-medium">Abonnement</Text>
              <Text className={`${subscriptionStatus.color} font-semibold`}>
                {subscriptionStatus.label}
              </Text>
            </View>
            {user?.subscription_expires_at && (
              <Text className="text-gray-500 text-sm">
                Expire le {formatDate(user.subscription_expires_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Statistics */}
        {stats && (
          <View className="px-6 mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Statistiques</Text>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row flex-wrap">
                <StatBox label="Questions" value={stats.total_questions_attempted} icon="📝" />
                <StatBox label="Correctes" value={stats.total_correct_answers} icon="✅" />
                <StatBox label="Précision" value={`${Math.round(stats.average_score)}%`} icon="🎯" />
                <StatBox label="Temps" value={`${stats.total_time_spent_minutes}m`} icon="⏱️" />
                <StatBox label="Sessions" value={stats.test_attempts_count} icon="📊" />
                <StatBox label="Modules" value={stats.modules_practiced} icon="📚" />
              </View>
              
              {stats.last_practice_date && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <Text className="text-gray-500 text-sm text-center">
                    Dernière pratique: {formatDate(stats.last_practice_date)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Module Progress */}
        {moduleStats.length > 0 && (
          <View className="px-6 mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Progression par module</Text>
            <View className="space-y-2">
              {moduleStats.map((stat) => (
                <ModuleProgressCard key={stat.module_name} stat={stat} />
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Actions</Text>
          <View className="space-y-2">
            <ActionButton 
              icon="💾" 
              label="Questions sauvegardées" 
              sublabel={`${stats?.saved_questions_count || 0} questions`}
              onPress={() => router.push('/saved')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-6 mt-8 mb-8">
          <TouchableOpacity 
            className="bg-red-50 py-4 rounded-xl"
            onPress={handleSignOut}
            disabled={authLoading}
          >
            <Text className="text-red-500 text-center font-semibold">
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Box Component
function StatBox({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <View className="w-1/3 items-center py-3">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 text-xs">{label}</Text>
    </View>
  )
}

// Module Progress Card
function ModuleProgressCard({ stat }: { stat: ModuleStatistics }) {
  const progress = stat.questions_attempted > 0 
    ? Math.round(stat.average_score) 
    : 0

  return (
    <View className="bg-white rounded-xl p-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-900 font-medium flex-1" numberOfLines={1}>
          {stat.module_name}
        </Text>
        <Text className="text-primary-500 font-semibold">{progress}%</Text>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View 
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className="text-gray-400 text-xs mt-2">
        {stat.questions_attempted} questions • {stat.attempts_count} sessions
      </Text>
    </View>
  )
}

// Action Button Component
function ActionButton({ 
  icon, 
  label, 
  sublabel,
  onPress 
}: { 
  icon: string
  label: string
  sublabel?: string
  onPress: () => void 
}) {
  return (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4 flex-row items-center"
      onPress={onPress}
    >
      <View className="w-12 h-12 bg-primary-50 rounded-xl items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{label}</Text>
        {sublabel && <Text className="text-gray-500 text-sm">{sublabel}</Text>}
      </View>
      <Text className="text-gray-400 text-xl">→</Text>
    </TouchableOpacity>
  )
}
