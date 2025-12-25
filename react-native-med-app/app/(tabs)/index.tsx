// ============================================================================
// Home Screen - Premium UI with Smooth Animations (Replays on Focus)
// ============================================================================

import { useState, useCallback, useRef } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  useWindowDimensions,
  Animated,
  Pressable
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getModulesWithCounts } from '@/lib/modules'
import { getUserStatistics } from '@/lib/stats'
import { Module, UserStatistics } from '@/types'
import { Card, FadeInView, StatsSkeleton, ListSkeleton } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { GoalIcon, SavesIcon, QcmExamIcon } from '@/components/icons'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

export default function HomeScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  
  const [modules, setModules] = useState<(Module & { question_count: number })[]>([])
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Header animations - will replay on focus
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-20)).current
  const statsScale = useRef(new Animated.Value(0.95)).current
  const statsOpacity = useRef(new Animated.Value(0)).current

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
      const yearToLoad = user.year_of_study || '1'
      const [modulesResult, statsResult] = await Promise.all([
        getModulesWithCounts(yearToLoad),
        getUserStatistics(user.id)
      ])
      
      if (!modulesResult.error) setModules(modulesResult.modules)
      if (!statsResult.error) setStats(statsResult.stats)
    } catch {
      // Error loading data silently handled
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  // Animate on focus - replays every time screen comes into view
  useFocusEffect(
    useCallback(() => {
      // Reset animation values
      headerOpacity.setValue(0)
      headerSlide.setValue(-20)
      statsScale.setValue(0.95)
      statsOpacity.setValue(0)

      // Run smooth entrance animations
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION.normal,
          easing: ANIMATION_EASING.smooth,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: ANIMATION_DURATION.normal,
          easing: ANIMATION_EASING.premium,
          useNativeDriver: true,
        }),
      ]).start()

      // Stats card animation with slight delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(statsOpacity, {
            toValue: 1,
            duration: ANIMATION_DURATION.fast,
            easing: ANIMATION_EASING.smooth,
            useNativeDriver: true,
          }),
          Animated.timing(statsScale, {
            toValue: 1,
            duration: ANIMATION_DURATION.fast,
            easing: ANIMATION_EASING.premium,
            useNativeDriver: true,
          }),
        ]).start()
      }, 100)

      // Load data
      loadData()
    }, [loadData])
  )

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#09B2AD" colors={['#09B2AD']} />
        }
      >
        {/* Premium Animated Header */}
        <View style={{
          backgroundColor: '#09B2AD',
          width: '100%',
          alignItems: 'center',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          paddingTop: 40,
          paddingBottom: 70,
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
          <View style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.04)' }} />

          <Animated.View style={{ 
            width: '100%', 
            maxWidth: contentMaxWidth, 
            paddingHorizontal: 24,
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          }}>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 15, fontWeight: '500', marginBottom: 4 }}>
                Bienvenue 👋
              </Text>
              <Text style={{ color: '#ffffff', fontSize: isDesktop ? 32 : 26, fontWeight: '700' }}>
                {user?.full_name || 'Étudiant'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>{getYearLabel()}</Text>
              </View>
              {user?.speciality && (
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>{user.speciality}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Content wrapper */}
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 24 }}>
          {/* Quick Stats Card */}
          <Animated.View style={{ 
            width: '100%', 
            maxWidth: statsMaxWidth, 
            alignSelf: 'center', 
            marginTop: -35,
            opacity: statsOpacity,
            transform: [{ scale: statsScale }],
          }}>
            {isLoading ? (
              <StatsSkeleton />
            ) : stats ? (
              <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 20, ...BRAND_THEME.shadows.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                  <StatItem label="Questions" value={stats.total_questions_attempted.toString()} icon={<QcmExamIcon size={28} color="#09B2AD" />} />
                  <View style={{ width: 1, height: 40, backgroundColor: BRAND_THEME.colors.gray[200] }} />
                  <StatItem label="Précision" value={`${Math.round(stats.average_score)}%`} icon={<GoalIcon size={28} color="#09B2AD" />} />
                  <View style={{ width: 1, height: 40, backgroundColor: BRAND_THEME.colors.gray[200] }} />
                  <StatItem label="Sauvegardées" value={stats.saved_questions_count.toString()} icon={<SavesIcon size={28} color="#09B2AD" />} />
                </View>
              </View>
            ) : null}
          </Animated.View>

          {/* Modules Section */}
          <View style={{ marginTop: 28, width: '100%' }}>
            <FadeInView delay={150}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 14 }}>
                Vos Modules
              </Text>
            </FadeInView>

            {isLoading ? (
              <ListSkeleton count={3} />
            ) : modules.length === 0 ? (
              <FadeInView delay={200}>
                <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
                  <Text style={{ color: BRAND_THEME.colors.gray[600], textAlign: 'center', fontSize: 16 }}>
                    Aucun module disponible pour votre année
                  </Text>
                </Card>
              </FadeInView>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                {modules.map((module, index) => (
                  <View key={module.id} style={{ width: `${100 / columnCount}%`, padding: 6 }}>
                    <FadeInView delay={200 + index * 40}>
                      <ModuleCard module={module} onPress={() => router.push(`/module/${module.id}`)} />
                    </FadeInView>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Item Component
function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ marginBottom: 6 }}>{icon}</View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 2 }}>{value}</Text>
      <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  )
}

// Module Card with smooth press animation
function ModuleCard({ module, onPress }: { module: Module & { question_count: number }; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: ANIMATION_DURATION.instant,
      easing: ANIMATION_EASING.smooth,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION.fast,
      easing: ANIMATION_EASING.smooth,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 18,
        ...BRAND_THEME.shadows.sm,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 3 }} numberOfLines={2}>
              {module.name}
            </Text>
            <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 13, fontWeight: '500' }}>
              {module.question_count} Questions
            </Text>
          </View>
          <View style={{ backgroundColor: 'rgba(9, 178, 173, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
            <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 13 }}>Pratiquer</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}
