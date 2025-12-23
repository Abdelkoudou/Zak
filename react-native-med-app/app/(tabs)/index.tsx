// ============================================================================
// Home Screen - Light Sea Green Brand
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getModulesWithCounts } from '@/lib/modules'
import { getUserStatistics } from '@/lib/stats'
import { Module, UserStatistics } from '@/types'
import { MODULE_TYPES, MODULE_TYPE_COLORS } from '@/constants'
import { Card, Badge, LoadingSpinner } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

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
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <LoadingSpinner message="Chargement de vos modules..." />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={BRAND_THEME.colors.primary[500]}
          />
        }
      >
        {/* Enhanced Header */}
        <View style={{
          backgroundColor: BRAND_THEME.colors.primary[500],
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          ...BRAND_THEME.shadows.lg
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Text style={{ fontSize: 24 }}>🩺</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: 16 
              }}>
                Bienvenue,
              </Text>
              <Text style={{
                color: '#ffffff',
                fontSize: 20,
                fontWeight: 'bold'
              }}>
                {user?.full_name || 'Étudiant'}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge 
              label={getYearLabel()} 
              variant="secondary"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            />
            <Badge 
              label={user?.speciality || ''} 
              variant="secondary"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </View>
        </View>

        {/* Quick Stats */}
        {stats && (
          <View style={{ paddingHorizontal: 24, marginTop: -20 }}>
            <Card variant="elevated" padding="md">
              <View style={{ flexDirection: 'row' }}>
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
            </Card>
          </View>
        )}

        {/* Modules Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: BRAND_THEME.colors.gray[900],
            marginBottom: 16
          }}>
            Vos Modules
          </Text>

          {modules.length === 0 ? (
            <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
              <Text style={{
                color: BRAND_THEME.colors.gray[600],
                textAlign: 'center',
                fontSize: 16
              }}>
                Aucun module disponible pour votre année
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
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
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Enhanced Stat Item Component
function StatItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{icon}</Text>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: BRAND_THEME.colors.gray[900],
        marginBottom: 2
      }}>
        {value}
      </Text>
      <Text style={{
        color: BRAND_THEME.colors.gray[600],
        fontSize: 12
      }}>
        {label}
      </Text>
    </View>
  )
}

// Enhanced Module Card Component
function ModuleCard({ 
  module, 
  onPress 
}: { 
  module: Module & { question_count: number }
  onPress: () => void 
}) {
  const moduleType = MODULE_TYPES.find(t => t.value === module.type)

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 4
            }} numberOfLines={2}>
              {module.name}
            </Text>
          </View>
          <Badge 
            label={`${moduleType?.icon} ${moduleType?.label}`}
            variant="primary"
            size="sm"
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[600],
              fontSize: 14
            }}>
              {module.question_count} questions
            </Text>
            {module.has_sub_disciplines && (
              <Text style={{
                color: BRAND_THEME.colors.gray[500],
                fontSize: 14,
                marginLeft: 8
              }}>
                • {module.sub_disciplines?.length || 0} sous-disciplines
              </Text>
            )}
          </View>
          <Text style={{
            color: BRAND_THEME.colors.primary[600],
            fontWeight: '500',
            fontSize: 14
          }}>
            Pratiquer →
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  )
}
