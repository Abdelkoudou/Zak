// ============================================================================
// Home Screen - Premium UI with Dark Mode Support
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  useWindowDimensions,
  Animated,
  Pressable,
  Platform,
  ImageBackground,
  StyleSheet
} from 'react-native'
import { BlurView } from 'expo-blur'
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
import { ANIMATION_DURATION, ANIMATION_EASING, USE_NATIVE_DRIVER } from '@/lib/animations'
import { useWebVisibility } from '@/lib/useWebVisibility'

const HeaderImg = require('../../assets/images/images/Header.png')

export default function HomeScreen() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const { width } = useWindowDimensions()
  
  const [modules, setModules] = useState<(Module & { question_count: number })[]>([])
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-20)).current
  const statsScale = useRef(new Animated.Value(0.95)).current
  const statsOpacity = useRef(new Animated.Value(0)).current
  
  // Track running animations for cleanup
  const runningAnimations = useRef<Animated.CompositeAnimation[]>([])
  // Track last data load time to prevent rapid reloads
  const lastLoadTime = useRef<number>(0)
  const DATA_LOAD_COOLDOWN = 5000 // 5 seconds

  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isLargeDesktop = width >= 1440
  const isTablet = width >= 768 && width < 1024
  const isMobile = width < 768
  
  const contentMaxWidth = isLargeDesktop ? 1400 : 1200
  const statsMaxWidth = isLargeDesktop ? 900 : isDesktop ? 800 : 600
  const columnCount = isDesktop ? 3 : isTablet ? 2 : 1
  const showWebHeader = isWeb && width >= 768

  const loadData = useCallback(async (force = false) => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    // Prevent rapid reloads unless forced
    const now = Date.now()
    if (!force && now - lastLoadTime.current < DATA_LOAD_COOLDOWN) {
      setRefreshing(false)
      return
    }
    
    try {
      lastLoadTime.current = now
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
      setHasInitiallyLoaded(true)
    }
  }, [user])

  // Handle visibility changes on web
  useWebVisibility({
    debounceMs: 200,
    onVisibilityChange: useCallback((isVisible: boolean, hiddenDuration: number) => {
      // Only reload data if hidden for more than 60 seconds
      if (isVisible && hiddenDuration > 60000 && hasInitiallyLoaded) {
        loadData(true)
      }
    }, [loadData, hasInitiallyLoaded]),
  })

  const runEntranceAnimations = useCallback(() => {
    // Stop any running animations first
    runningAnimations.current.forEach(anim => anim.stop())
    runningAnimations.current = []
    
    // Reset values
    headerOpacity.setValue(0)
    headerSlide.setValue(-20)
    statsScale.setValue(0.95)
    statsOpacity.setValue(0)

    const headerAnim = Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: ANIMATION_DURATION.normal, easing: ANIMATION_EASING.smooth, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(headerSlide, { toValue: 0, duration: ANIMATION_DURATION.normal, easing: ANIMATION_EASING.premium, useNativeDriver: USE_NATIVE_DRIVER }),
    ])
    
    runningAnimations.current.push(headerAnim)
    headerAnim.start()

    // Delayed stats animation
    const statsTimer = setTimeout(() => {
      const statsAnim = Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: ANIMATION_DURATION.fast, easing: ANIMATION_EASING.smooth, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(statsScale, { toValue: 1, duration: ANIMATION_DURATION.fast, easing: ANIMATION_EASING.premium, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
      runningAnimations.current.push(statsAnim)
      statsAnim.start()
    }, 100)
    
    return () => {
      clearTimeout(statsTimer)
      runningAnimations.current.forEach(anim => anim.stop())
      runningAnimations.current = []
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData(true)
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      // On native, run animations on focus
      // On web, only run on initial mount (not on tab visibility changes)
      if (!isWeb || !hasInitiallyLoaded) {
        const cleanup = runEntranceAnimations()
        return cleanup
      }
      
      return () => {
        // Cleanup animations when losing focus
        runningAnimations.current.forEach(anim => anim.stop())
      }
    }, [isWeb, hasInitiallyLoaded, runEntranceAnimations])
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
        <View style={{ width: '100%', position: 'relative' }}>
          <ImageBackground 
            source={HeaderImg} 
            style={{
              width: '100%',
              paddingTop: showWebHeader ? (isLargeDesktop ? 60 : 48) : 40,
              paddingBottom: isLargeDesktop ? 140 : isDesktop ? 120 : 100,
              alignItems: 'center',
            }}
            imageStyle={{
              resizeMode: 'cover',
              borderBottomLeftRadius: isLargeDesktop ? 56 : isDesktop ? 48 : 32,
              borderBottomRightRadius: isLargeDesktop ? 56 : isDesktop ? 48 : 32,
            }}
          >
            <Animated.View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isLargeDesktop ? 48 : isDesktop ? 32 : 24, opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
              <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <View style={{ marginBottom: isLargeDesktop ? 20 : 14 }}>
                  <Text style={{ color: '#09B2AD', fontSize: isLargeDesktop ? 22 : isDesktop ? 18 : 17, fontWeight: '600', marginBottom: 6 }}>
                    Bienvenue
                  </Text>
                  <Text style={{ color: '#1E1E1E', fontSize: isLargeDesktop ? 48 : isDesktop ? 36 : 28, fontWeight: '800', letterSpacing: -0.5 }}>
                    {user?.full_name || 'Étudiant'}
                  </Text>
                </View>
                
                <View style={{ backgroundColor: 'rgba(9, 178, 173, 0.15)', borderRadius: 24, paddingHorizontal: isLargeDesktop ? 20 : 16, paddingVertical: isLargeDesktop ? 10 : 8 }}>
                  <Text style={{ color: '#1E1E1E', fontWeight: '700', fontSize: isLargeDesktop ? 15 : 13 }}>{getYearLabel()}</Text>
                </View>
              </View>
            </Animated.View>
          </ImageBackground>
        </View>

        {/* Content Container */}
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isLargeDesktop ? 48 : isDesktop ? 32 : 24 }}>
          {/* Stats Cards */}
          <Animated.View style={{ width: '100%', maxWidth: statsMaxWidth, alignSelf: 'center', marginTop: isLargeDesktop ? -70 : isDesktop ? -60 : -45, opacity: statsOpacity, transform: [{ scale: statsScale }] }}>
            {isLoading ? (
              <StatsSkeleton />
            ) : stats ? (
              <View style={{ 
                borderRadius: isLargeDesktop ? 36 : isDesktop ? 32 : 24, 
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.12,
                shadowRadius: 24,
                elevation: 10,
              }}>
                <BlurView 
                  intensity={Platform.OS === 'web' ? 40 : 80} 
                  tint="light"
                  style={{
                    padding: isLargeDesktop ? 36 : isDesktop ? 28 : 20,
                    borderRadius: isLargeDesktop ? 36 : isDesktop ? 32 : 24,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <StatItem label="Questions" value={stats.total_questions_attempted.toString()} icon={<QcmExamIcon size={isLargeDesktop ? 36 : isDesktop ? 32 : 28} color="#1E1E1E" />} isDesktop={isDesktop} colors={colors} />
                    <StatItem label="précision" value={`${Math.round(stats.average_score)}%`} icon={<GoalIcon size={isLargeDesktop ? 36 : isDesktop ? 32 : 28} color="#1E1E1E" />} isDesktop={isDesktop} colors={colors} />
                    <StatItem label="sauvegardées" value={stats.saved_questions_count.toString()} icon={<SavesIcon size={isLargeDesktop ? 36 : isDesktop ? 32 : 28} color="#1E1E1E" />} isDesktop={isDesktop} colors={colors} />
                  </View>
                </BlurView>
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
    Animated.timing(scaleAnim, { toValue: 0.98, duration: ANIMATION_DURATION.instant, easing: ANIMATION_EASING.smooth, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }

  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: ANIMATION_DURATION.fast, easing: ANIMATION_EASING.smooth, useNativeDriver: USE_NATIVE_DRIVER }).start()
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
