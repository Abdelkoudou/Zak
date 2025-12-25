// ============================================================================
// Profile Screen - Premium UI with Smooth Animations (Replays on Focus)
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  useWindowDimensions,
  Animated,
  Pressable
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getUserStatistics, getAllModuleStatistics } from '@/lib/stats'
import { UserStatistics, ModuleStatistics, DeviceSession } from '@/types'
import { YEARS } from '@/constants'
import { Card, Badge, FadeInView, Skeleton } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

export default function ProfileScreen() {
  const { user, signOut, getDeviceSessions } = useAuth()
  const { width } = useWindowDimensions()
  const contentMaxWidth = 800
  
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
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, getDeviceSessions])

  useEffect(() => {
    loadData()
    // Animate header
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
        <ProfileSkeleton />
      </SafeAreaView>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()

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
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
          {/* Profile Header */}
          <Animated.View style={{
            backgroundColor: '#ffffff',
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderBottomColor: BRAND_THEME.colors.gray[100],
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 56,
                height: 56,
                backgroundColor: '#09B2AD',
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                ...BRAND_THEME.shadows.md,
              }}>
                <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || '👤'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 4 }}>
                  {user?.full_name || 'Utilisateur'}
                </Text>
                <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 14 }}>
                  {user?.email}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ backgroundColor: 'rgba(9, 178, 173, 0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: '#09B2AD', fontWeight: '600', fontSize: 13 }}>{getYearLabel()}</Text>
              </View>
              {user?.speciality && (
                <View style={{ backgroundColor: BRAND_THEME.colors.gray[100], borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                  <Text style={{ color: BRAND_THEME.colors.gray[600], fontWeight: '600', fontSize: 13 }}>{user.speciality}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Subscription Status */}
          <FadeInView delay={100} animation="slideUp">
            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
              <AnimatedPressableCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 13, marginBottom: 4, fontWeight: '500' }}>Abonnement</Text>
                    <Badge label={subscriptionStatus.label} variant={subscriptionStatus.color as any} />
                  </View>
                  {user?.subscription_expires_at && (
                    <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 12 }}>
                      Expire le {formatDate(user.subscription_expires_at)}
                    </Text>
                  )}
                </View>
              </AnimatedPressableCard>
            </View>
          </FadeInView>

          {/* Device Management */}
          <FadeInView delay={200} animation="slideUp">
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 12 }}>
                Appareils connectés ({deviceSessions.length}/2)
              </Text>
              
              <AnimatedPressableCard>
                {deviceSessions.length === 0 ? (
                  <Text style={{ color: BRAND_THEME.colors.gray[500], textAlign: 'center', fontStyle: 'italic' }}>
                    Aucun appareil connecté
                  </Text>
                ) : (
                  <View style={{ gap: 12 }}>
                    {deviceSessions.map((session, index) => (
                      <DeviceSessionCard key={session.id} session={session} isLast={index === deviceSessions.length - 1} />
                    ))}
                  </View>
                )}
                
                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: BRAND_THEME.colors.gray[100] }}>
                  <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                    ℹ️ Vous pouvez utiliser l'application sur 2 appareils maximum.
                  </Text>
                </View>
              </AnimatedPressableCard>
            </View>
          </FadeInView>

          {/* Saved Questions */}
          <FadeInView delay={300} animation="slideUp">
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <AnimatedPressableCard onPress={() => router.push('/saved')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      backgroundColor: 'rgba(9, 178, 173, 0.1)',
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}>
                      <Text style={{ fontSize: 20 }}>💾</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND_THEME.colors.gray[900] }}>
                        Questions sauvegardées
                      </Text>
                      <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 14 }}>
                        {stats?.saved_questions_count || 0} question{(stats?.saved_questions_count || 0) > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: '#09B2AD', fontSize: 20, fontWeight: '600' }}>→</Text>
                </View>
              </AnimatedPressableCard>
            </View>
          </FadeInView>

          {/* Statistics */}
          {stats && (
            <FadeInView delay={400} animation="slideUp">
              <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 12 }}>
                  Statistiques
                </Text>
                
                <AnimatedPressableCard>
                  <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    <StatBox label="Total" value={stats.total_questions_attempted} icon="📝" />
                    <StatBox label="Correctes" value={stats.total_correct_answers} icon="✅" />
                    <StatBox label="Incorrectes" value={stats.total_questions_attempted - stats.total_correct_answers} icon="❌" />
                  </View>

                  <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <StatBox label="Temps" value={`${stats.total_time_spent_minutes}m`} icon="⏱️" />
                    <StatBox label="Précision" value={`${Math.round(stats.average_score)}%`} icon="📊" />
                    <StatBox label="Modules" value={stats.modules_practiced} icon="📚" />
                  </View>

                  {stats.last_practice_date && (
                    <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: BRAND_THEME.colors.gray[100] }}>
                      <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 12, textAlign: 'center' }}>
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
              <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 12 }}>
                  Progression par module
                </Text>
                
                <View style={{ gap: 10 }}>
                  {moduleStats.slice(0, 3).map((stat, index) => (
                    <FadeInView key={stat.module_name} delay={550 + index * 50} animation="slideUp">
                      <ModuleProgressCard stat={stat} />
                    </FadeInView>
                  ))}
                </View>
              </View>
            </FadeInView>
          )}

          {/* Logout Button */}
          <FadeInView delay={600} animation="slideUp">
            <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
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
function AnimatedPressableCard({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (onPress) Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 100, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()
  }

  const content = (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      ...BRAND_THEME.shadows.sm,
    }}>
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
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
        <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '600' }}>Se déconnecter</Text>
      </Animated.View>
    </Pressable>
  )
}

// Profile Skeleton
function ProfileSkeleton() {
  return (
    <View style={{ padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <Skeleton width={56} height={56} borderRadius={28} style={{ marginRight: 16 }} />
        <View>
          <Skeleton width={150} height={22} style={{ marginBottom: 8 }} />
          <Skeleton width={200} height={14} />
        </View>
      </View>
      <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={180} borderRadius={16} />
    </View>
  )
}

// Stat Box
function StatBox({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: BRAND_THEME.colors.gray[900], marginBottom: 2 }}>{value}</Text>
      <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 12 }}>{label}</Text>
    </View>
  )
}

// Module Progress Card
function ModuleProgressCard({ stat }: { stat: ModuleStatistics }) {
  const progress = stat.questions_attempted > 0 ? Math.round(stat.average_score) : 0
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start()
  }, [progress])

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, ...BRAND_THEME.shadows.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: BRAND_THEME.colors.gray[900], fontWeight: '600', flex: 1, fontSize: 15 }} numberOfLines={1}>
          {stat.module_name}
        </Text>
        <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 14 }}>{progress}%</Text>
      </View>
      
      <View style={{ height: 6, backgroundColor: BRAND_THEME.colors.gray[100], borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={{
          height: '100%',
          backgroundColor: '#09B2AD',
          borderRadius: 3,
          width: animatedWidth,
        }} />
      </View>
      
      <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 12, marginTop: 8 }}>
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
        <View style={{ width: 40, height: 40, backgroundColor: BRAND_THEME.colors.gray[100], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18 }}>📱</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: BRAND_THEME.colors.gray[900], fontWeight: '600', marginBottom: 2 }} numberOfLines={1}>
            {session.device_name || 'Appareil inconnu'}
          </Text>
          <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 13 }}>
            {formatLastActive(session.last_active_at)}
          </Text>
        </View>
      </View>
      {!isLast && <View style={{ height: 1, backgroundColor: BRAND_THEME.colors.gray[100], marginVertical: 4 }} />}
    </View>
  )
}
