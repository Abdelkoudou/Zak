// ============================================================================
// Home Screen - Light Sea Green Brand
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getModulesWithCounts } from '@/lib/modules'
import { getUserStatistics } from '@/lib/stats'
import { Module, UserStatistics } from '@/types'
import { MODULE_TYPES, MODULE_TYPE_COLORS } from '@/constants'
import { Card, Badge, LoadingSpinner } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { GoalIcon, SavesIcon, QcmExamIcon } from '@/components/icons'

// Brand Logo
const Logo = require('@/assets/images/logo.png')

export default function HomeScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  
  const [modules, setModules] = useState<(Module & { question_count: number })[]>([])
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Responsive constants
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const contentMaxWidth = 1200
  const statsMaxWidth = 800
  const columnCount = isDesktop ? 3 : isTablet ? 2 : 1

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
        contentContainerStyle={{ alignItems: 'center' }}
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
          backgroundColor: '#09B2AD',
          width: '100%',
          alignItems: 'center',
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          paddingTop: 48,
          paddingBottom: 80,
        }}>
          <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: 18,
                fontWeight: '500',
                marginBottom: 4
              }}>
                Bienvenue
              </Text>
              <Text style={{
                color: '#ffffff',
                fontSize: isDesktop ? 36 : 28,
                fontWeight: 'bold'
              }}>
                {user?.full_name || 'Étudiant'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Badge 
                label={getYearLabel()} 
                variant="secondary"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: 15,
                  paddingHorizontal: 12
                }}
              />
              {user?.speciality && (
                <Badge 
                  label={user.speciality} 
                  variant="secondary"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    borderRadius: 15,
                    paddingHorizontal: 12
                  }}
                />
              )}
            </View>
          </View>
        </View>

        {/* content wrapper */}
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 24 }}>
          {/* Quick Stats */}
          {stats && (
            <View style={{ width: '100%', maxWidth: statsMaxWidth, alignSelf: 'center', marginTop: -40 }}>
              <Card variant="elevated" padding="md" style={{ borderRadius: 17, borderWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                  <StatItem 
                    label="Questions" 
                    value={stats.total_questions_attempted.toString()} 
                    customIcon={<QcmExamIcon size={32} color="#09B2AD" />}
                  />
                  <StatItem 
                    label="précision" 
                    value={`${Math.round(stats.average_score)}%`} 
                    customIcon={<GoalIcon size={32} color="#09B2AD" />}
                  />
                  <StatItem 
                    label="sauvegardées" 
                    value={stats.saved_questions_count.toString()} 
                    customIcon={<SavesIcon size={32} color="#09B2AD" />}
                  />
                </View>
              </Card>
            </View>
          )}

          {/* Modules Section */}
          <View style={{ marginTop: 24, width: '100%' }}>
            <Text style={{
              fontSize: 24,
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
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                marginHorizontal: -6, // Account for gap
              }}>
                {modules.map((module) => (
                  <View 
                    key={module.id} 
                    style={{ 
                      width: `${100 / columnCount}%`, 
                      padding: 6 
                    }}
                  >
                    <ModuleCard 
                      module={module}
                      onPress={() => router.push(`/module/${module.id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: isDesktop ? 100 : 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Enhanced Stat Item Component
function StatItem({ label, value, icon, customIcon }: { 
  label: string; 
  value: string; 
  icon?: string;
  customIcon?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      {customIcon ? (
        <View style={{ marginBottom: 8 }}>{customIcon}</View>
      ) : (
        <Text style={{ fontSize: 36, marginBottom: 8 }}>{icon}</Text>
      )}
      <Text style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 2
      }}>
        {value}
      </Text>
      <Text style={{
        color: 'rgba(0, 0, 0, 0.6)',
        fontSize: 14,
        fontWeight: '500'
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
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="default" padding="none" style={{ borderRadius: 17, borderWidth: 0, shadowOpacity: 0.1 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: 20
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#000000',
              marginBottom: 6
            }}>
              {module.name}
            </Text>
            <Text style={{
              color: 'rgba(0, 0, 0, 0.4)',
              fontSize: 16,
              fontWeight: '500'
            }}>
              {module.question_count} Questions
            </Text>
          </View>

          <View style={{
            backgroundColor: 'rgba(12, 227, 220, 0.3)',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 15,
          }}>
            <Text style={{
              color: '#09B2AD',
              fontWeight: '700',
              fontSize: 16
            }}>
              Pratiquer
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}
