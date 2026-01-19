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
  Image,
  StyleSheet,
  AppState
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
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
import { OfflineStatsService } from '@/lib/offline-stats'

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
  const isTablet = width >= 768 && width < 1024
  const isMobile = width < 768
  
  const contentMaxWidth = 1200
  const statsMaxWidth = isDesktop ? 1000 : 800
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
      if (!modulesResult.error) {
        const PREDEFINED_ORDER = [
          'Cardio',
          'Digestif',
          'Urinaire',
          'Endo',
          'Neuro',
          'Immuno',
          'Génétique'
        ]

        const sortedModules = modulesResult.modules.sort((a, b) => {
          // Normalize names for comparison (handle potential casing or minor differences if needed, 
          // but strict match is usually safer for known IDs/Names. Assuming 'name' matches the user list)
          // We'll check if the module name *starts with* or *includes* the key if exact match fails, 
          // but usually these are short names. Let's assume exact or partial match.
          // Given the user prompt "Cardio", "Digestif" etc., these might be short names or full names.
          // I'll check if the module name includes the key to be more robust.
          
          const getOrderIndex = (name: string) => {
            const index = PREDEFINED_ORDER.findIndex(key => name.includes(key))
            return index === -1 ? Infinity : index
          }

          const indexA = getOrderIndex(a.name)
          const indexB = getOrderIndex(b.name)

          if (indexA !== indexB) {
            return indexA - indexB
          }
          
          return a.name.localeCompare(b.name)
        })

        setModules(sortedModules)
      }
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

  // Background Sync Effect (On Mount + On Foreground)
  useEffect(() => {
    const triggerSync = () => {
        if (user?.id) {
            OfflineStatsService.syncPendingQueue(user.id).then(({ syncedCount }) => {
                if (syncedCount > 0) {
                    console.log('[Home] Synced pending attempts:', syncedCount)
                    loadData(true)
                }
            })
        }
    }

    // specific import for AppState inside the hook or top level. 
    // AppState is not imported above yet. I will add it to the imports via a separate edit or assume I can add it here if I check imports.
    // Wait, I should add AppState to imports first.
    // For now, let's just implement the logic and I will check imports in next step or use Fully Qualified if possible, 
    // but better to add to imports.
    
    // Initial sync
    triggerSync()

    // Listen for state changes (background -> active)
    // useful when user goes to settings to enable wifi and comes back
    const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
            triggerSync()
        }
    })

    return () => {
        subscription.remove()
    }
  }, [user?.id, loadData])

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
        {/* Hero Section */}
        <View style={{ width: '100%', position: 'relative' }}>
          {isDesktop ? (
             <LinearGradient
                colors={['#0D9488', '#09B2AD', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: '100%',
                  paddingTop: showWebHeader ? 48 : 40,
                  paddingBottom: 120,
                  alignItems: 'center',
                  borderBottomLeftRadius: 48,
                  borderBottomRightRadius: 48,
                }}
             >
                <Animated.View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 32, opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
                        Bienvenue
                      </Text>
                      <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '800', letterSpacing: -0.5 }}>
                        {user?.full_name || 'Étudiant'}
                      </Text>
                    </View>
                    
                    <View style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      // @ts-ignore
                      backdropFilter: 'blur(12px)',
                      
                    }}>
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>{getYearLabel()}</Text>
                    </View>
                  </View>
                </Animated.View>
             </LinearGradient>
          ) : (
            <View 
              style={{
                width: '100%',
                
                backgroundColor: '#09B2AD',
                paddingTop: showWebHeader ? 20 : 20,
                paddingBottom: 60,
                alignItems: 'center',
                position: 'relative',
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
              }}
            >

              
              <Animated.View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 24, opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
                <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: '#1E1E1E', fontSize: 17, fontWeight: '600', marginBottom: 4 }}>
                      Bienvenue
                    </Text>
                    <Text style={{ color: '#1E1E1E', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                      {user?.full_name || 'Étudiant'}
                    </Text>
                  </View>
                  
                  {Platform.OS === 'web' ? (
                    <View style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      // @ts-ignore
                      backdropFilter: 'blur(12px)',
                      
                    }}>
                      <Text style={{ color: '#1E1E1E', fontWeight: '700', fontSize: 13 }}>{getYearLabel()}</Text>
                    </View>
                  ) : (
                    <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                      <BlurView intensity={40} tint="light" style={{ borderRadius: 20, overflow: 'hidden' }}>
                        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 16, paddingVertical: 8 }}>
                          <Text style={{ color: '#1E1E1E', fontWeight: '700', fontSize: 13 }}>{getYearLabel()}</Text>
                        </View>
                      </BlurView>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Content Container */}
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isDesktop ? 32 : 24 }}>
          {/* Stats Cards */}
          <Animated.View style={{ width: '100%', maxWidth: statsMaxWidth, alignSelf: 'center', marginTop: isDesktop ? -50 : -35, opacity: statsOpacity, transform: [{ scale: statsScale }], zIndex: 10 }}>
            {isLoading ? (
              <StatsSkeleton />
            ) : stats ? (
              <View style={{ 
                borderRadius: 17, 
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}>
                {Platform.OS === 'web' ? (
                  // Web: CSS backdrop-filter
                  <View style={{
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 17,
                    padding: isDesktop ? 28 : 20,
                    // @ts-ignore
                    backdropFilter: 'blur(20px)',
                    
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                      <StatItem label="Questions" value={stats.total_questions_attempted.toString()} icon={<QcmExamIcon size={isDesktop ? 32 : 28} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                      <StatItem label="précision" value={`${Math.round(stats.average_score)}%`} icon={<GoalIcon size={isDesktop ? 32 : 28} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                      <StatItem label="sauvegardées" value={stats.saved_questions_count.toString()} icon={<SavesIcon size={isDesktop ? 32 : 28} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                    </View>
                  </View>
                ) : (
                  // Native: Gradient to simulate frosted glass (BlurView doesn't match web backdrop-filter)
                  <LinearGradient
                    colors={isDark 
                      ? ['rgba(45, 55, 60, 0.95)', 'rgba(30, 35, 40, 0.98)']
                      : ['rgba(200, 235, 235, 0.85)', 'rgba(245, 250, 250, 0.95)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ 
                      borderRadius: 14,
                      padding: isDesktop ? 20 : 12,
                      borderWidth: 1,
                      borderColor: isDark 
                        ? 'rgba(255, 255, 255, 0.12)' 
                        : 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                      <StatItem label="Questions" value={stats.total_questions_attempted.toString()} icon={<QcmExamIcon size={isDesktop ? 32 : 28} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                      <StatItem label="précision" value={`${Math.round(stats.average_score)}%`} icon={<GoalIcon size={isDesktop ? 32 : 28} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                      <StatItem label="sauvegardées" value={stats.saved_questions_count.toString()} icon={<SavesIcon size={isDesktop ? 32 : 28} color={colors.text} />} isDesktop={isDesktop} colors={colors} />
                    </View>
                  </LinearGradient>
                )}
              </View>
            ) : null}
          </Animated.View>

          {/* Modules Section */}
          <View style={{ marginTop: isDesktop ? 24 : 16, width: '100%' }}>
            <FadeInView delay={150}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View>
                  <Text style={{ fontSize: isDesktop ? 22 : 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}> Vos Unités / Modules</Text>
                  <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
                    {modules.filter(m => m.type === 'uei').length} Unités et {modules.filter(m => m.type !== 'uei').length} Modules 
                  </Text>
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
      <View style={{ marginBottom: 6, padding: 6, borderRadius: 10 }}>{icon}</View>
      <Text style={{ fontSize: isDesktop ? 24 : 18, fontWeight: '800', color: colors.text, marginBottom: 2, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: isDesktop ? 13 : 11, fontWeight: '600' }}>{label}</Text>
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
        <View style={{ height: 3, backgroundColor: colors.primary, width: '100%' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: isDesktop ? 16 : 12 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: isDesktop ? 16 : 14, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.3 }} numberOfLines={1}>{module.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookIcon size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500', marginLeft: 6 }}>{module.question_count} Questions</Text>
            </View>
          </View>
          <View style={{ backgroundColor: colors.primaryMuted, paddingHorizontal: isDesktop ? 12 : 10, paddingVertical: isDesktop ? 8 : 6, borderRadius: 10 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: isDesktop ? 13 : 11 }}>Pratiquer</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}
