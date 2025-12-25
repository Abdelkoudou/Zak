// ============================================================================
// Home Screen - Premium UI with Dark Mode Support
// ============================================================================

import { useState, useCallback, useRef } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  useWindowDimensions,
  Animated,
  Pressable,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { getModulesWithCounts } from '@/lib/modules'
import { getUserStatistics } from '@/lib/stats'
import { Module, UserStatistics } from '@/types'
import { FadeInView, StatsSkeleton, ListSkeleton } from '@/components/ui'
import { WebHeader } from '@/components/ui/WebHeader'
import { GoalIcon, SavesIcon, QcmExamIcon } from '@/components/icons'
import { BookIcon } from '@/components/icons/ResultIcons'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

export default function HomeScreen() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const { width } = useWindowDimensions()
  
  const [modules, setModules] = useState<(Module & { question_count: number })[]>([])
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-20)).current
  const statsScale = useRef(new Animated.Value(0.95)).current
  const statsOpacity = useRef(new Animated.Value(0)).current

  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const isMobile = width < 768
  
  const contentMaxWidth = 1200
  const statsMaxWidth = isDesktop ? 1000 : 800
  const columnCount = isDesktop ? 3 : isTablet ? 2 : 1
  const showWebHeader = isWeb && width >= 768

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
      // Error loading data
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useFocusEffect(
    useCallback(() => {
      headerOpacity.setValue(0)
      headerSlide.setValue(-20)
      statsScale.setValue(0.95)
      statsOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: ANIMATION_DURATION.normal, easing: ANIMATION_EASING.smooth, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: ANIMATION_DURATION.normal, easing: ANIMATION_EASING.premium, useNativeDriver: true }),
      ]).start()

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(statsOpacity, { toValue: 1, duration: ANIMATION_DURATION.fast, easing: ANIMATION_EASING.smooth, useNativeDriver: true }),
          Animated.timing(statsScale, { toValue: 1, duration: ANIMATION_DURATION.fast, easing: ANIMATION_EASING.premium, useNativeDriver: true }),
        ]).start()
      }, 100)

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showWebHeader ? ['bottom'] : ['top', 'bottom']}>
      {showWebHeader && <WebHeader />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Hero Section */}
        <View style={{
          backgroundColor: colors.primary,
          width: '100%',
          alignItems: 'center',
          borderBottomLeftRadius: isDesktop ? 48 : 32,
          borderBottomRightRadius: isDesktop ? 48 : 32,
          paddingTop: showWebHeader ? 48 : 40,
          paddingBottom: isDesktop ? 90 : 70,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Decorative Elements */}
          <View style={{ position: 'absolute', top: -60, right: isDesktop ? '10%' : -40, width: isDesktop ? 200 : 160, height: isDesktop ? 200 : 160, borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
          <View style={{ position: 'absolute', bottom: -30, left: isDesktop ? '5%' : -20, width: isDesktop ? 140 : 100, height: isDesktop ? 140 : 100, borderRadius: 70, backgroundColor: 'rgba(255, 255, 255, 0.04)' }} />

          <Animated.View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isDesktop ? 32 : 24, opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ marginBottom: isDesktop ? 0 : 14 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: isDesktop ? 18 : 15, fontWeight: '500', marginBottom: 6 }}>
                  {getGreeting()} 👋
                </Text>
                <Text style={{ color: '#ffffff', fontSize: isDesktop ? 40 : 28, fontWeight: '800', letterSpacing: -1 }}>
                  {user?.full_name || 'Étudiant'}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>📚 {getYearLabel()}</Text>
                </View>
                {user?.speciality && (
                  <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>🏥 {user.speciality}</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Content Container */}
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isDesktop ? 32 : 24 }}>
          {/* Stats Cards */}
          <Animated.View style={{ width: '100%', maxWidth: statsMaxWidth, alignSelf: 'center', marginTop: isDesktop ? -50 : -35, opacity: statsOpacity, transform: [{ scale: statsScale }] }}>
            {isLoading ? (
              <StatsSkeleton />
            ) : stats ? (
              <View style={{ 
                backgroundColor: colors.card, 
                borderRadius: isDesktop ? 28 : 20, 
                padding: isDesktop ? 28 : 20, 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.15,
                shadowRadius: 8,
                elevation: 5,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <StatItem label="Questions" value={stats.total_questions_attempted.toString()} icon={<QcmExamIcon size={isDesktop ? 30 : 26} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                  {!isMobile && <View style={{ width: 1, height: 50, backgroundColor: colors.border }} />}
                  <StatItem label="Précision" value={`${Math.round(stats.average_score)}%`} icon={<GoalIcon size={isDesktop ? 30 : 26} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                  {!isMobile && <View style={{ width: 1, height: 50, backgroundColor: colors.border }} />}
                  <StatItem label="Sauvegardées" value={stats.saved_questions_count.toString()} icon={<SavesIcon size={isDesktop ? 30 : 26} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                </View>
              </View>
            ) : null}
          </Animated.View>

          {/* Modules Section */}
          <View style={{ marginTop: isDesktop ? 40 : 28, width: '100%' }}>
            <FadeInView delay={150}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View>
                  <Text style={{ fontSize: isDesktop ? 26 : 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>Vos Modules</Text>
                  <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{modules.length} modules disponibles</Text>
                </View>
                {modules.length > 6 && (
                  <Pressable>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Voir tout →</Text>
                  </Pressable>
                )}
              </View>
            </FadeInView>

            {isLoading ? (
              <ListSkeleton count={3} />
            ) : modules.length === 0 ? (
              <FadeInView delay={200}>
                <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 56, marginBottom: 16 }}>📚</Text>
                  <Text style={{ color: colors.text, textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Aucun module disponible</Text>
                  <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 15 }}>pour votre année d'étude</Text>
                </View>
              </FadeInView>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
                {modules.map((module, index) => (
                  <View key={module.id} style={{ width: `${100 / columnCount}%`, padding: 8 }}>
                    <FadeInView delay={200 + index * 40}>
                      <ModuleCard module={module} onPress={() => router.push(`/module/${module.id}`)} isDesktop={isDesktop} colors={colors} isDark={isDark} />
                    </FadeInView>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: isMobile ? 120 : 60 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Item Component
function StatItem({ label, value, icon, isDesktop, colors }: { label: string; value: string; icon: React.ReactNode; isDesktop: boolean; colors: any }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: isDesktop ? 24 : 12, paddingVertical: 8 }}>
      <View style={{ marginBottom: 10, padding: 8, borderRadius: 14 }}>{icon}</View>
      <Text style={{ fontSize: isDesktop ? 28 : 22, fontWeight: '800', color: colors.text, marginBottom: 4, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: isDesktop ? 14 : 12, fontWeight: '500' }}>{label}</Text>
    </View>
  )
}

// Module Card
function ModuleCard({ module, onPress, isDesktop, colors, isDark }: { module: Module & { question_count: number }; onPress: () => void; isDesktop: boolean; colors: any; isDark: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.98, duration: ANIMATION_DURATION.instant, easing: ANIMATION_EASING.smooth, useNativeDriver: true }).start()
  }

  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: ANIMATION_DURATION.fast, easing: ANIMATION_EASING.smooth, useNativeDriver: true }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }],
        backgroundColor: colors.card,
        borderRadius: isDesktop ? 20 : 18,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}>
        <View style={{ height: 4, backgroundColor: colors.primary, width: '100%' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: isDesktop ? 20 : 16 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: isDesktop ? 17 : 16, fontWeight: '700', color: colors.text, marginBottom: 6, letterSpacing: -0.3 }} numberOfLines={2}>{module.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookIcon size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500', marginLeft: 6 }}>{module.question_count} Questions</Text>
            </View>
          </View>
          <View style={{ backgroundColor: colors.primaryMuted, paddingHorizontal: isDesktop ? 16 : 14, paddingVertical: isDesktop ? 10 : 8, borderRadius: 12 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: isDesktop ? 14 : 13 }}>Pratiquer</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}
