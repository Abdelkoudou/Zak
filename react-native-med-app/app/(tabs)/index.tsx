// ============================================================================
// Home Screen - Premium UI with Smooth Animations
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react'
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
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getModulesWithCounts } from '@/lib/modules'
import { getUserStatistics } from '@/lib/stats'
import { Module, UserStatistics } from '@/types'
import { 
  Card, 
  AnimatedCard, 
  FadeInView,
  StatsSkeleton,
  ListSkeleton 
} from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { GoalIcon, SavesIcon, QcmExamIcon } from '@/components/icons'

export default function HomeScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  
  const [modules, setModules] = useState<(Module & { question_count: number })[]>([])
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Header animation
  const headerFade = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-30)).current

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
      const { modules: modulesData, error: modulesError } = await getModulesWithCounts(yearToLoad)
      
      if (modulesError) console.error('Error loading modules:', modulesError)
      setModules(modulesData)

      const { stats: statsData, error: statsError } = await getUserStatistics(user.id)
      if (statsError) console.error('Error loading stats:', statsError)
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
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start()
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#09B2AD"
            colors={['#09B2AD']}
          />
        }
      >
        {/* Premium Animated Header */}
        <View style={{
          backgroundColor: '#09B2AD',
          width: '100%',
          alignItems: 'center',
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          paddingTop: 48,
          paddingBottom: 80,
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <View style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }} />
          <View style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }} />

          <Animated.View 
            style={{ 
              width: '100%', 
              maxWidth: contentMaxWidth, 
              paddingHorizontal: 24,
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            }}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: 16,
                fontWeight: '500',
                marginBottom: 4,
                letterSpacing: 0.5,
              }}>
                Bienvenue 👋
              </Text>
              <Text style={{
                color: '#ffffff',
                fontSize: isDesktop ? 36 : 28,
                fontWeight: 'bold',
                letterSpacing: -0.5,
              }}>
                {user?.full_name || 'Étudiant'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                  {getYearLabel()}
                </Text>
              </View>
              {user?.speciality && (
                <View style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}>
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                    {user.speciality}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Content wrapper */}
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 24 }}>
          {/* Quick Stats Card */}
          <View style={{ width: '100%', maxWidth: statsMaxWidth, alignSelf: 'center', marginTop: -40 }}>
            {isLoading ? (
              <StatsSkeleton />
            ) : stats ? (
              <FadeInView delay={100} animation="scale">
                <AnimatedCard variant="elevated" padding="lg" animateOnMount={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <StatItem 
                      label="Questions" 
                      value={stats.total_questions_attempted.toString()} 
                      icon={<QcmExamIcon size={32} color="#09B2AD" />}
                      delay={200}
                    />
                    <View style={{ width: 1, height: 50, backgroundColor: BRAND_THEME.colors.gray[200] }} />
                    <StatItem 
                      label="Précision" 
                      value={`${Math.round(stats.average_score)}%`} 
                      icon={<GoalIcon size={32} color="#09B2AD" />}
                      delay={300}
                    />
                    <View style={{ width: 1, height: 50, backgroundColor: BRAND_THEME.colors.gray[200] }} />
                    <StatItem 
                      label="Sauvegardées" 
                      value={stats.saved_questions_count.toString()} 
                      icon={<SavesIcon size={32} color="#09B2AD" />}
                      delay={400}
                    />
                  </View>
                </AnimatedCard>
              </FadeInView>
            ) : null}
          </View>

          {/* Modules Section */}
          <View style={{ marginTop: 32, width: '100%' }}>
            <FadeInView delay={300}>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 16,
                letterSpacing: -0.3,
              }}>
                Vos Modules
              </Text>
            </FadeInView>

            {isLoading ? (
              <ListSkeleton count={3} />
            ) : modules.length === 0 ? (
              <FadeInView delay={400}>
                <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
                  <Text style={{
                    color: BRAND_THEME.colors.gray[600],
                    textAlign: 'center',
                    fontSize: 16,
                  }}>
                    Aucun module disponible pour votre année
                  </Text>
                </Card>
              </FadeInView>
            ) : (
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                marginHorizontal: -6,
              }}>
                {modules.map((module, index) => (
                  <View 
                    key={module.id} 
                    style={{ 
                      width: `${100 / columnCount}%`, 
                      padding: 6,
                    }}
                  >
                    <FadeInView delay={400 + index * 50} animation="slideUp">
                      <ModuleCard 
                        module={module}
                        onPress={() => router.push(`/module/${module.id}`)}
                      />
                    </FadeInView>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Item Component
function StatItem({ label, value, icon, delay = 0 }: { 
  label: string; value: string; icon: React.ReactNode; delay?: number 
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 6, tension: 80, delay, useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 300, delay, useNativeDriver: true,
      }),
    ]).start()
  }, [delay])

  return (
    <Animated.View style={{ alignItems: 'center', opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <View style={{ marginBottom: 8 }}>{icon}</View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: BRAND_THEME.colors.gray[900], marginBottom: 2 }}>{value}</Text>
      <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </Animated.View>
  )
}

// Module Card Component
function ModuleCard({ module, onPress }: { module: Module & { question_count: number }; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, tension: 100, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        ...BRAND_THEME.shadows.sm,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 4 }} numberOfLines={2}>
              {module.name}
            </Text>
            <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 14, fontWeight: '500' }}>
              {module.question_count} Questions
            </Text>
          </View>
          <View style={{ backgroundColor: 'rgba(9, 178, 173, 0.12)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}>
            <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 14 }}>Pratiquer</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}
