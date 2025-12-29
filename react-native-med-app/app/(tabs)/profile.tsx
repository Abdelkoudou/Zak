// ============================================================================
// Profile Screen - Premium UI with Dark Mode Support
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
  useWindowDimensions,
  Switch
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useTheme, ThemeColors } from '@/context/ThemeContext'
import { getUserStatistics, getAllModuleStatistics } from '@/lib/stats'
import { UserStatistics, ModuleStatistics, DeviceSession } from '@/types'
import { YEARS } from '@/constants'
import { Badge, FadeInView, Skeleton } from '@/components/ui'
import { WebHeader } from '@/components/ui/WebHeader'
import { SavesIcon, CorrectIcon, FalseIcon, FileIcon, GoalIcon, BookIcon } from '@/components/icons/ResultIcons'
import { showConfirm } from '@/lib/alerts'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export default function ProfileScreen() {
  const { user, signOut, getDeviceSessions } = useAuth()
  const { colors, isDark, toggleTheme } = useTheme()
  const { width } = useWindowDimensions()
  
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const showWebHeader = isWeb && width >= 768
  const contentMaxWidth = isDesktop ? 1000 : 800
  
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [moduleStats, setModuleStats] = useState<ModuleStatistics[]>([])
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
      // Error loading profile data
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, getDeviceSessions])

  useEffect(() => {
    loadData()
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: USE_NATIVE_DRIVER }),
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
    showConfirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      async () => {
        try {
          const result = await signOut()
          if (result?.error) Alert.alert('Erreur', result.error)
        } catch {
          Alert.alert('Erreur', 'Une erreur est survenue')
        }
      },
      'Déconnexion',
      'Annuler',
      'destructive'
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {showWebHeader && <WebHeader />}
        <ProfileSkeleton isDesktop={isDesktop} colors={colors} />
      </SafeAreaView>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showWebHeader ? ['bottom'] : ['top', 'bottom']}>
      {showWebHeader && <WebHeader />}
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isDesktop ? 32 : 24 }}>
          {/* Profile Header */}
          <Animated.View style={{
            backgroundColor: colors.card,
            borderRadius: isDesktop ? 28 : 20,
            padding: isDesktop ? 32 : 24,
            marginTop: isDesktop ? 32 : 16,
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: isDesktop ? 0 : 20 }}>
                <View style={{
                  width: isDesktop ? 80 : 64,
                  height: isDesktop ? 80 : 64,
                  backgroundColor: colors.primary,
                  borderRadius: isDesktop ? 24 : 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 20,
                }}>
                  <Text style={{ color: '#ffffff', fontSize: isDesktop ? 32 : 26, fontWeight: '700' }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || '👤'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: isDesktop ? 28 : 24, fontWeight: '800', color: colors.text, marginBottom: 6 }}>
                    {user?.full_name || 'Utilisateur'}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: isDesktop ? 16 : 14 }}>{user?.email}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginLeft: isDesktop ? 20 : 0 }}>
                <View style={{ backgroundColor: colors.primaryMuted, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>📚 {getYearLabel()}</Text>
                </View>
                {user?.speciality && (
                  <View style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>🏥 {user.speciality}</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Dark Mode Toggle */}
          <FadeInView delay={50} animation="slideUp">
            <View style={{ marginTop: 20 }}>
              <ThemedCard colors={colors} isDark={isDark}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 52, height: 52,
                      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                      borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16,
                    }}>
                      <Text style={{ fontSize: 26 }}>{isDark ? '🌙' : '☀️'}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Mode sombre</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>{isDark ? 'Activé' : 'Désactivé'}</Text>
                    </View>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={isDark ? colors.primary : '#f4f3f4'}
                    ios_backgroundColor={colors.border}
                  />
                </View>
              </ThemedCard>
            </View>
          </FadeInView>

          {/* Grid Layout */}
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginTop: 24 }}>
            {/* Left Column */}
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              {/* Subscription */}
              <FadeInView delay={100} animation="slideUp">
                <ThemedCard colors={colors} isDark={isDark}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '500' }}>Abonnement</Text>
                      <Badge label={subscriptionStatus.label} variant={subscriptionStatus.color as any} />
                    </View>
                    {user?.subscription_expires_at && (
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>Expire le {formatDate(user.subscription_expires_at)}</Text>
                    )}
                  </View>
                </ThemedCard>
              </FadeInView>

              {/* Saved Questions */}
              <FadeInView delay={200} animation="slideUp">
                <Pressable onPress={() => router.push('/saved')}>
                  <ThemedCard colors={colors} isDark={isDark} style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 52, height: 52, backgroundColor: colors.primaryMuted, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                          <SavesIcon size={26} color="#1E1E1E" />
                        </View>
                        <View>
                          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Questions sauvegardées</Text>
                          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>{stats?.saved_questions_count || 0} question{(stats?.saved_questions_count || 0) > 1 ? 's' : ''}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 20, color: colors.primary }}>→</Text>
                    </View>
                  </ThemedCard>
                </Pressable>
              </FadeInView>

              {/* Devices */}
              <FadeInView delay={300} animation="slideUp">
                <View style={{ marginTop: 24 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
                    Appareils connectés ({deviceSessions.length}/2)
                  </Text>
                  <ThemedCard colors={colors} isDark={isDark}>
                    {deviceSessions.length === 0 ? (
                      <Text style={{ color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', paddingVertical: 12 }}>Aucun appareil connecté</Text>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {deviceSessions.map((session, index) => (
                          <DeviceSessionCard key={session.id} session={session} isLast={index === deviceSessions.length - 1} colors={colors} />
                        ))}
                      </View>
                    )}
                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, marginRight: 8 }}>ℹ️</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1, textAlign: 'center' }}>
                          Vous pouvez utiliser l'application sur 2 appareils maximum.
                        </Text>
                      </View>
                    </View>
                  </ThemedCard>
                </View>
              </FadeInView>
            </View>

            {/* Right Column */}
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              {/* Statistics */}
              {stats && (
                <FadeInView delay={400} animation="slideUp">
                  <View style={{ marginTop: isDesktop ? 0 : 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Statistiques</Text>
                    <ThemedCard colors={colors} isDark={isDark}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
                        <StatBox label="Total" value={stats.total_questions_attempted} icon={<FileIcon size={26} color="#1E1E1E" />} colors={colors} />
                        <StatBox label="Correctes" value={stats.total_correct_answers} icon={<CorrectIcon size={26} color="#1E1E1E" />} colors={colors} />
                        <StatBox label="Incorrectes" value={stats.total_questions_attempted - stats.total_correct_answers} icon={<FalseIcon size={26} color="#1E1E1E" />} colors={colors} />
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                        <StatBox label="Temps" value={`${stats.total_time_spent_minutes}m`} icon={<GoalIcon size={26} color="#1E1E1E" />} colors={colors} />
                        <StatBox label="Précision" value={`${Math.round(stats.average_score)}%`} icon={<GoalIcon size={26} color="#1E1E1E" />} colors={colors} />
                        <StatBox label="Modules" value={stats.modules_practiced} icon={<BookIcon size={26} color="#1E1E1E" />} colors={colors} />
                      </View>
                      {stats.last_practice_date && (
                        <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Dernière pratique : {formatDate(stats.last_practice_date)}</Text>
                        </View>
                      )}
                    </ThemedCard>
                  </View>
                </FadeInView>
              )}

              {/* Module Progress */}
              {moduleStats.length > 0 && (
                <FadeInView delay={500} animation="slideUp">
                  <View style={{ marginTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Progression par module</Text>
                    <View style={{ gap: 12 }}>
                      {moduleStats.slice(0, 5).map((stat, index) => (
                        <FadeInView key={stat.module_name} delay={550 + index * 50} animation="slideUp">
                          <ModuleProgressCard stat={stat} colors={colors} isDark={isDark} />
                        </FadeInView>
                      ))}
                    </View>
                  </View>
                </FadeInView>
              )}
            </View>
          </View>

          {/* Logout */}
          <FadeInView delay={600} animation="slideUp">
            <View style={{ marginTop: 40, maxWidth: isDesktop ? 400 : '100%', alignSelf: 'center', width: '100%' }}>
              <Pressable onPress={handleSignOut}>
                <View style={{
                  backgroundColor: colors.errorLight,
                  paddingVertical: 18,
                  borderRadius: 18,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : '#FECACA',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🚪</Text>
                  <Text style={{ color: colors.error, fontSize: 16, fontWeight: '600' }}>Se déconnecter</Text>
                </View>
              </Pressable>
            </View>
          </FadeInView>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Themed Card Component
function ThemedCard({ children, colors, isDark, style }: { children: React.ReactNode; colors: ThemeColors; isDark: boolean; style?: any }) {
  return (
    <View style={[{
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
    }, style]}>
      {children}
    </View>
  )
}

// Profile Skeleton
function ProfileSkeleton({ isDesktop, colors }: { isDesktop: boolean; colors: ThemeColors }) {
  return (
    <View style={{ padding: isDesktop ? 32 : 24, maxWidth: 1000, alignSelf: 'center', width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: colors.card, borderRadius: 20, padding: 24 }}>
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
function StatBox({ label, value, icon, colors }: { label: string; value: number | string; icon: React.ReactNode; colors: ThemeColors }) {
  return (
    <View style={{ width: '33.33%', alignItems: 'center', paddingVertical: 8 }}>
      <View style={{ marginBottom: 6, padding: 6, borderRadius: 12 }}>{icon}</View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 2 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
    </View>
  )
}

// Module Progress Card
function ModuleProgressCard({ stat, colors, isDark }: { stat: ModuleStatistics; colors: ThemeColors; isDark: boolean }) {
  const progress = stat.questions_attempted > 0 ? Math.round(stat.average_score) : 0
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start()
  }, [progress])

  const animatedWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })

  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '600', flex: 1, fontSize: 15 }} numberOfLines={1}>{stat.module_name}</Text>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{progress}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.backgroundSecondary, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', backgroundColor: colors.primary, borderRadius: 4, width: animatedWidth }} />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10 }}>{stat.questions_attempted} questions • {stat.attempts_count} sessions</Text>
    </View>
  )
}

// Device Session Card
function DeviceSessionCard({ session, isLast, colors }: { session: DeviceSession; isLast: boolean; colors: ThemeColors }) {
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
        <View style={{ width: 44, height: 44, backgroundColor: colors.backgroundSecondary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Text style={{ fontSize: 20 }}>📱</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 2 }} numberOfLines={1}>{session.device_name || 'Appareil inconnu'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{formatLastActive(session.last_active_at)}</Text>
        </View>
      </View>
      {!isLast && <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />}
    </View>
  )
}
