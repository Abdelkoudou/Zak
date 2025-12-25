// ============================================================================
// Profile Screen - Premium UI with Responsive Web Design
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  Animated,
  Pressable,
  Platform,
  useWindowDimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getUserStatistics, getAllModuleStatistics } from '@/lib/stats'
import { UserStatistics, ModuleStatistics, DeviceSession } from '@/types'
import { YEARS } from '@/constants'
import { Badge, FadeInView, Skeleton } from '@/components/ui'
import { WebHeader } from '@/components/ui/WebHeader'
import { BRAND_THEME } from '@/constants/theme'
import { SavesIcon, CorrectIcon, FalseIcon, FileIcon, GoalIcon, BookIcon } from '@/components/icons/ResultIcons'

export default function ProfileScreen() {
  const { user, signOut, getDeviceSessions } = useAuth()
  const { width } = useWindowDimensions()
  
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const showWebHeader = isWeb && width >= 768
  const contentMaxWidth = isDesktop ? 1000 : 800
  
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [moduleStats, setModuleStats] = useState<ModuleStatistics[]>([])
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-15)).current

  const loadData = useCallback(async () => {
    if (!user) return

    try {
      const [userStats, modStats, sessions] = await Promise.all([
        getUserStatistics(user.id),
        getAllModuleStatistics(user.id),
        getDeviceSessions()
      ])
      
      if (!userStats.error) setStats(userStats.stats)
      if (!modStats.error) setModuleStats(modStats.stats)
      if (!sessions.error) setDeviceSessions(sessions.sessions)
    } catch {
      // Error loading profile data silently handled
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, getDeviceSessions])

  useEffect(() => {
    loadData()
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start()
  }, [loadData])

  useEffect(() => {
    if (!user && !isLoading) {
      router.replace('/(auth)/welcome')
    }
  }, [user, isLoading])

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
            try {
              const result = await signOut()
              if (result?.error) Alert.alert('Erreur', result.error)
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion')
            }
          }
        },
      ]
    )
  }

  const getYearLabel = () => YEARS.find(y => y.value === user?.year_of_study)?.label || ''

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getSubscriptionStatus = () => {
    if (!user?.is_paid) return { label: 'Non actif', color: 'error' }
    if (!user.subscription_expires_at) return { label: 'Actif', color: 'success' }
    
    const expiryDate = new Date(user.subscription_expires_at)
    const now = new Date()
    
    if (expiryDate < now) return { label: 'Expiré', color: 'error' }
    
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 7) return { label: `Expire dans ${daysLeft}j`, color: 'warning' }
    
    return { label: 'Actif', color: 'success' }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        {showWebHeader && <WebHeader />}
        <ProfileSkeleton isDesktop={isDesktop} />
      </SafeAreaView>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }} edges={showWebHeader ? ['bottom'] : ['top', 'bottom']}>
      {showWebHeader && <WebHeader />}
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#09B2AD" colors={['#09B2AD']} />
        }
      >
        <View style={{ 
          width: '100%', 
          maxWidth: contentMaxWidth,
          paddingHorizontal: isDesktop ? 32 : 24,
        }}>
          {/* Profile Header */}
          <Animated.View style={{
            backgroundColor: '#ffffff',
            borderRadius: isDesktop ? 28 : 20,
            padding: isDesktop ? 32 : 24,
            marginTop: isDesktop ? 32 : 16,
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
            ...BRAND_THEME.shadows.md,
            borderWidth: 1,
            borderColor: BRAND_THEME.colors.gray[100],
          }}>
            <View style={{ 
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'flex-start',
            }}>
              {/* Avatar & Info */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                flex: 1,
                marginBottom: isDesktop ? 0 : 20,
              }}>
                <View style={{
                  width: isDesktop ? 80 : 64,
                  height: isDesktop ? 80 : 64,
                  backgroundColor: '#09B2AD',
                  borderRadius: isDesktop ? 24 : 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 20,
                  ...BRAND_THEME.shadows.lg,
                }}>
                  <Text style={{ 
                    color: '#ffffff', 
                    fontSize: isDesktop ? 32 : 26, 
                    fontWeight: '700' 
                  }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || '👤'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: isDesktop ? 28 : 24, 
                    fontWeight: '800', 
                    color: BRAND_THEME.colors.gray[900], 
                    marginBottom: 6,
                    letterSpacing: -0.5,
                  }}>
                    {user?.full_name || 'Utilisateur'}
                  </Text>
                  <Text style={{ 
                    color: BRAND_THEME.colors.gray[500], 
                    fontSize: isDesktop ? 16 : 14 
                  }}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              {/* Badges */}
              <View style={{ 
                flexDirection: 'row', 
                gap: 10, 
                flexWrap: 'wrap',
                marginLeft: isDesktop ? 20 : 0,
              }}>
                <View style={{ 
                  backgroundColor: 'rgba(9, 178, 173, 0.1)', 
                  borderRadius: 20, 
                  paddingHorizontal: 16, 
                  paddingVertical: 8 
                }}>
                  <Text style={{ color: '#09B2AD', fontWeight: '600', fontSize: 14 }}>
                    📚 {getYearLabel()}
                  </Text>
                </View>
                {user?.speciality && (
                  <View style={{ 
                    backgroundColor: BRAND_THEME.colors.gray[100], 
                    borderRadius: 20, 
                    paddingHorizontal: 16, 
                    paddingVertical: 8 
                  }}>
                    <Text style={{ color: BRAND_THEME.colors.gray[600], fontWeight: '600', fontSize: 14 }}>
                      🏥 {user.speciality}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Desktop Grid Layout */}
          <View style={{ 
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 20,
            marginTop: 24,
          }}>
            {/* Left Column */}
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              {/* Subscription Status */}
              <FadeInView delay={100} animation="slideUp">
                <AnimatedPressableCard>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ 
                        color: BRAND_THEME.colors.gray[500], 
                        fontSize: 13, 
                        marginBottom: 6, 
                        fontWeight: '500' 
                      }}>
                        Abonnement
                      </Text>
                      <Badge label={subscriptionStatus.label} variant={subscriptionStatus.color as any} />
                    </View>
                    {user?.subscription_expires_at && (
                      <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 12 }}>
                        Expire le {formatDate(user.subscription_expires_at)}
                      </Text>
                    )}
                  </View>
                </AnimatedPressableCard>
              </FadeInView>

              {/* Saved Questions */}
              <FadeInView delay={200} animation="slideUp">
                <AnimatedPressableCard onPress={() => router.push('/saved')} style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 52,
                        height: 52,
                        backgroundColor: 'rgba(9, 178, 173, 0.1)',
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16,
                      }}>
                        <SavesIcon size={26} />
                      </View>
                      <View>
                        <Text style={{ 
                          fontSize: 17, 
                          fontWeight: '700', 
                          color: BRAND_THEME.colors.gray[900] 
                        }}>
                          Questions sauvegardées
                        </Text>
                        <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 14, marginTop: 2 }}>
                          {stats?.saved_questions_count || 0} question{(stats?.saved_questions_count || 0) > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 20, color: '#09B2AD' }}>→</Text>
                  </View>
                </AnimatedPressableCard>
              </FadeInView>

              {/* Device Management */}
              <FadeInView delay={300} animation="slideUp">
                <View style={{ marginTop: 24 }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: '700', 
                    color: BRAND_THEME.colors.gray[900], 
                    marginBottom: 14,
                    letterSpacing: -0.3,
                  }}>
                    Appareils connectés ({deviceSessions.length}/2)
                  </Text>
                  
                  <AnimatedPressableCard>
                    {deviceSessions.length === 0 ? (
                      <Text style={{ 
                        color: BRAND_THEME.colors.gray[500], 
                        textAlign: 'center', 
                        fontStyle: 'italic',
                        paddingVertical: 12,
                      }}>
                        Aucun appareil connecté
                      </Text>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {deviceSessions.map((session, index) => (
                          <DeviceSessionCard 
                            key={session.id} 
                            session={session} 
                            isLast={index === deviceSessions.length - 1} 
                          />
                        ))}
                      </View>
                    )}
                    
                    <View style={{ 
                      marginTop: 16, 
                      paddingTop: 16, 
                      borderTopWidth: 1, 
                      borderTopColor: BRAND_THEME.colors.gray[100] 
                    }}>
                      <Text style={{ 
                        color: BRAND_THEME.colors.gray[500], 
                        fontSize: 12, 
                        textAlign: 'center', 
                        lineHeight: 18 
                      }}>
                        ℹ️ Vous pouvez utiliser l'application sur 2 appareils maximum.
                      </Text>
                    </View>
                  </AnimatedPressableCard>
                </View>
              </FadeInView>
            </View>

            {/* Right Column */}
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              {/* Statistics */}
              {stats && (
                <FadeInView delay={400} animation="slideUp">
                  <View style={{ marginTop: isDesktop ? 0 : 24 }}>
                    <Text style={{ 
                      fontSize: 20, 
                      fontWeight: '700', 
                      color: BRAND_THEME.colors.gray[900], 
                      marginBottom: 14,
                      letterSpacing: -0.3,
                    }}>
                      Statistiques
                    </Text>
                    
                    <AnimatedPressableCard>
                      <View style={{ 
                        flexDirection: 'row', 
                        flexWrap: 'wrap',
                        marginBottom: 20 
                      }}>
                        <StatBox 
                          label="Total" 
                          value={stats.total_questions_attempted} 
                          icon={<FileIcon size={26} color={BRAND_THEME.colors.gray[900]} />} 
                        />
                        <StatBox 
                          label="Correctes" 
                          value={stats.total_correct_answers} 
                          icon={<CorrectIcon size={26} color={BRAND_THEME.colors.gray[900]} />} 
                        />
                        <StatBox 
                          label="Incorrectes" 
                          value={stats.total_questions_attempted - stats.total_correct_answers} 
                          icon={<FalseIcon size={26} color={BRAND_THEME.colors.gray[900]} />} 
                        />
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                        <StatBox 
                          label="Temps" 
                          value={`${stats.total_time_spent_minutes}m`} 
                          icon={<GoalIcon size={26} color={BRAND_THEME.colors.gray[900]} />} 
                        />
                        <StatBox 
                          label="Précision" 
                          value={`${Math.round(stats.average_score)}%`} 
                          icon={<GoalIcon size={26} color={BRAND_THEME.colors.gray[900]} />}
                          highlight
                        />
                        <StatBox 
                          label="Modules" 
                          value={stats.modules_practiced} 
                          icon={<BookIcon size={26} color={BRAND_THEME.colors.gray[900]} />} 
                        />
                      </View>

                      {stats.last_practice_date && (
                        <View style={{ 
                          paddingTop: 16, 
                          borderTopWidth: 1, 
                          borderTopColor: BRAND_THEME.colors.gray[100] 
                        }}>
                          <Text style={{ 
                            color: BRAND_THEME.colors.gray[500], 
                            fontSize: 12, 
                            textAlign: 'center' 
                          }}>
                            Dernière pratique : {formatDate(stats.last_practice_date)}
                          </Text>
                        </View>
                      )}
                    </AnimatedPressableCard>
                  </View>
                </FadeInView>
              )}

              {/* Module Progress */}
              {moduleStats.length > 0 && (
                <FadeInView delay={500} animation="slideUp">
                  <View style={{ marginTop: 24 }}>
                    <Text style={{ 
                      fontSize: 20, 
                      fontWeight: '700', 
                      color: BRAND_THEME.colors.gray[900], 
                      marginBottom: 14,
                      letterSpacing: -0.3,
                    }}>
                      Progression par module
                    </Text>
                    
                    <View style={{ gap: 12 }}>
                      {moduleStats.slice(0, 5).map((stat, index) => (
                        <FadeInView key={stat.module_name} delay={550 + index * 50} animation="slideUp">
                          <ModuleProgressCard stat={stat} />
                        </FadeInView>
                      ))}
                    </View>
                  </View>
                </FadeInView>
              )}
            </View>
          </View>

          {/* Logout Button */}
          <FadeInView delay={600} animation="slideUp">
            <View style={{ marginTop: 40, maxWidth: isDesktop ? 400 : '100%', alignSelf: 'center', width: '100%' }}>
              <AnimatedLogoutButton onPress={handleSignOut} />
            </View>
          </FadeInView>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Animated Pressable Card
function AnimatedPressableCard({ 
  children, 
  onPress, 
  style 
}: { 
  children: React.ReactNode
  onPress?: () => void
  style?: any
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isWeb = Platform.OS === 'web'

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, { 
        toValue: 0.98, 
        friction: 8, 
        tension: 100, 
        useNativeDriver: true 
      }).start()
    }
  }
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { 
      toValue: 1, 
      friction: 8, 
      tension: 100, 
      useNativeDriver: true 
    }).start()
  }

  const content = (
    <Animated.View style={[{
      transform: [{ scale: scaleAnim }],
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: 20,
      ...BRAND_THEME.shadows.sm,
      borderWidth: 1,
      borderColor: BRAND_THEME.colors.gray[100],
      // @ts-ignore
      ...(isWeb && { transition: 'all 0.2s ease' }),
    }, style]}>
      {children}
    </Animated.View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {content}
      </Pressable>
    )
  }
  return content
}

// Animated Logout Button
function AnimatedLogoutButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isWeb = Platform.OS === 'web'

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { 
      toValue: 0.97, 
      friction: 8, 
      tension: 100, 
      useNativeDriver: true 
    }).start()
  }
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { 
      toValue: 1, 
      friction: 8, 
      tension: 100, 
      useNativeDriver: true 
    }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#FEF2F2',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        justifyContent: 'center',
        // @ts-ignore
        ...(isWeb && { cursor: 'pointer', transition: 'all 0.2s ease' }),
      }}>
        <Text style={{ fontSize: 20, marginRight: 10 }}>🚪</Text>
        <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '600' }}>Se déconnecter</Text>
      </Animated.View>
    </Pressable>
  )
}

// Profile Skeleton
function ProfileSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={{ padding: isDesktop ? 32 : 24, maxWidth: 1000, alignSelf: 'center', width: '100%' }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 24,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
      }}>
        <Skeleton width={isDesktop ? 80 : 64} height={isDesktop ? 80 : 64} borderRadius={24} style={{ marginRight: 20 }} />
        <View>
          <Skeleton width={180} height={24} style={{ marginBottom: 8 }} />
          <Skeleton width={220} height={16} />
        </View>
      </View>
      <Skeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={140} borderRadius={20} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={200} borderRadius={20} />
    </View>
  )
}

// Stat Box
function StatBox({ 
  label, 
  value, 
  icon,
  highlight
}: { 
  label: string
  value: number | string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <View style={{ 
      width: '33.33%', 
      alignItems: 'center',
      paddingVertical: 8,
    }}>
      <View style={{ 
        marginBottom: 6,
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'transparent',
      }}>
        {icon}
      </View>
      <Text style={{ 
        fontSize: 22, 
        fontWeight: '800', 
        color: BRAND_THEME.colors.gray[900], 
        marginBottom: 2 
      }}>
        {value}
      </Text>
      <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 12 }}>{label}</Text>
    </View>
  )
}

// Module Progress Card
function ModuleProgressCard({ stat }: { stat: ModuleStatistics }) {
  const progress = stat.questions_attempted > 0 ? Math.round(stat.average_score) : 0
  const progressAnim = useRef(new Animated.Value(0)).current
  const isWeb = Platform.OS === 'web'

  useEffect(() => {
    Animated.timing(progressAnim, { 
      toValue: progress, 
      duration: 800, 
      useNativeDriver: false 
    }).start()
  }, [progress])

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={{ 
      backgroundColor: '#ffffff', 
      borderRadius: 16, 
      padding: 16, 
      ...BRAND_THEME.shadows.sm,
      borderWidth: 1,
      borderColor: BRAND_THEME.colors.gray[100],
      // @ts-ignore
      ...(isWeb && { transition: 'all 0.2s ease' }),
    }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 12 
      }}>
        <Text style={{ 
          color: BRAND_THEME.colors.gray[900], 
          fontWeight: '600', 
          flex: 1, 
          fontSize: 15 
        }} numberOfLines={1}>
          {stat.module_name}
        </Text>
        <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 15 }}>{progress}%</Text>
      </View>
      
      <View style={{ 
        height: 8, 
        backgroundColor: BRAND_THEME.colors.gray[100], 
        borderRadius: 4, 
        overflow: 'hidden' 
      }}>
        <Animated.View style={{
          height: '100%',
          backgroundColor: '#09B2AD',
          borderRadius: 4,
          width: animatedWidth,
        }} />
      </View>
      
      <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 12, marginTop: 10 }}>
        {stat.questions_attempted} questions • {stat.attempts_count} sessions
      </Text>
    </View>
  )
}

// Device Session Card
function DeviceSessionCard({ session, isLast }: { session: DeviceSession; isLast: boolean }) {
  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Il y a ${diffInDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
        <View style={{ 
          width: 44, 
          height: 44, 
          backgroundColor: BRAND_THEME.colors.gray[100], 
          borderRadius: 14, 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginRight: 14 
        }}>
          <Text style={{ fontSize: 20 }}>📱</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            color: BRAND_THEME.colors.gray[900], 
            fontWeight: '600', 
            marginBottom: 2 
          }} numberOfLines={1}>
            {session.device_name || 'Appareil inconnu'}
          </Text>
          <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 13 }}>
            {formatLastActive(session.last_active_at)}
          </Text>
        </View>
      </View>
      {!isLast && (
        <View style={{ 
          height: 1, 
          backgroundColor: BRAND_THEME.colors.gray[100], 
          marginVertical: 4 
        }} />
      )}
    </View>
  )
}
