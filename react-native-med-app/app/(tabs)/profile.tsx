// ============================================================================
// Profile Screen - Light Sea Green Brand (Matching Design)
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getUserStatistics, getAllModuleStatistics } from '@/lib/stats'
import { UserStatistics, ModuleStatistics, DeviceSession } from '@/types'
import { YEARS } from '@/constants'
import { Card, Badge, LoadingSpinner } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export default function ProfileScreen() {
  const { user, signOut, isLoading: authLoading, getDeviceSessions } = useAuth()
  const { width } = useWindowDimensions()
  const contentMaxWidth = 800
  
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [moduleStats, setModuleStats] = useState<ModuleStatistics[]>([])
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    try {
      const { stats: userStats } = await getUserStatistics(user.id)
      setStats(userStats)

      const { stats: modStats } = await getAllModuleStatistics(user.id)
      setModuleStats(modStats)

      const { sessions, error: sessionsError } = await getDeviceSessions()
      if (!sessionsError) {
        setDeviceSessions(sessions)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, getDeviceSessions])

  useEffect(() => {
    loadData()
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
              if (result?.error) {
                Alert.alert('Erreur', result.error)
              }
              // The useEffect will handle the redirect when user becomes null
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion')
            }
          }
        },
      ]
    )
  }

  const getYearLabel = () => {
    return YEARS.find(y => y.value === user?.year_of_study)?.label || ''
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getSubscriptionStatus = () => {
    if (!user?.is_paid) return { label: 'Non actif', color: 'error' }
    if (!user.subscription_expires_at) return { label: 'Actif', color: 'success' }
    
    const expiryDate = new Date(user.subscription_expires_at)
    const now = new Date()
    
    if (expiryDate < now) {
      return { label: 'Expiré', color: 'error' }
    }
    
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 7) {
      return { label: `Expire dans ${daysLeft}j`, color: 'warning' }
    }
    
    return { label: 'Actif', color: 'success' }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <LoadingSpinner message="Chargement du profil..." />
      </SafeAreaView>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()

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
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
        {/* Profile Header - Matching Design */}
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 24,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderBottomColor: BRAND_THEME.colors.gray[100]
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              backgroundColor: BRAND_THEME.colors.gray[900],
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <Text style={{ color: '#ffffff', fontSize: 20 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 4
              }}>
                {user?.full_name || 'Utilisateur'}
              </Text>
              <Text style={{
                color: BRAND_THEME.colors.gray[600],
                fontSize: 14
              }}>
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Year Badge - Matching Design */}
          <Badge 
            label={getYearLabel()}
            variant="primary"
            style={{
              backgroundColor: BRAND_THEME.colors.primary[100],
              alignSelf: 'flex-start'
            }}
          />
        </View>

        {/* Subscription Status - Matching Design */}
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <Card variant="default" padding="md">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{
                  color: BRAND_THEME.colors.gray[700],
                  fontSize: 16,
                  marginBottom: 4
                }}>
                  Abonnement
                </Text>
                <Badge 
                  label={subscriptionStatus.label}
                  variant={subscriptionStatus.color as any}
                />
              </View>
              {user?.subscription_expires_at && (
                <Text style={{
                  color: BRAND_THEME.colors.gray[500],
                  fontSize: 12
                }}>
                  Expire le {formatDate(user.subscription_expires_at)}
                </Text>
              )}
            </View>
          </Card>
        </View>

        {/* Device Management - View Only (No Deletion) */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: BRAND_THEME.colors.gray[900],
            marginBottom: 12
          }}>
            Appareils connectés ({deviceSessions.length}/2)
          </Text>
          
          <Card variant="default" padding="md">
            {deviceSessions.length === 0 ? (
              <Text style={{
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center',
                fontStyle: 'italic'
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
            
            {/* Info Message */}
            <View style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: BRAND_THEME.colors.gray[100]
            }}>
              <Text style={{
                color: BRAND_THEME.colors.gray[600],
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 18
              }}>
                ℹ️ Vous pouvez utiliser l'application sur 2 appareils maximum. La connexion depuis un 3ème appareil sera bloquée.
              </Text>
            </View>
          </Card>
        </View>

        {/* Saved Questions - New Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <TouchableOpacity 
            onPress={() => router.push('/saved')}
            activeOpacity={0.7}
          >
            <Card variant="default" padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: BRAND_THEME.colors.primary[50],
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Text style={{ fontSize: 20 }}>💾</Text>
                  </View>
                  <View>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: BRAND_THEME.colors.gray[900]
                    }}>
                      Questions sauvegardées
                    </Text>
                    <Text style={{
                      color: BRAND_THEME.colors.gray[500],
                      fontSize: 14
                    }}>
                      {stats?.saved_questions_count || 0} question{(stats?.saved_questions_count || 0) > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: BRAND_THEME.colors.gray[400], fontSize: 18 }}>→</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Statistics - Matching Design */}
        {stats && (
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 12
            }}>
              Statistiques
            </Text>
            
            <Card variant="default" padding="md">
              {/* First Row */}
              <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                <StatBox 
                  label="Total" 
                  value={stats.total_questions_attempted} 
                  icon="📝"
                />
                <StatBox 
                  label="Correctes" 
                  value={stats.total_correct_answers} 
                  icon="✅"
                />
                <StatBox 
                  label="Incorrectes" 
                  value={stats.total_questions_attempted - stats.total_correct_answers} 
                  icon="❌"
                />
              </View>

              {/* Second Row */}
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <StatBox 
                  label="Temps" 
                  value={`${stats.total_time_spent_minutes}m`} 
                  icon="⏱️"
                />
                <StatBox 
                  label="Correctes" 
                  value={Math.round(stats.average_score)} 
                  icon="📊"
                />
                <StatBox 
                  label="Modules" 
                  value={stats.modules_practiced} 
                  icon="📚"
                />
              </View>

              {/* Last Practice Date */}
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
            </Card>
          </View>
        )}

        {/* Module Progress - Matching Design */}
        {moduleStats.length > 0 && (
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 12
            }}>
              Progression par module
            </Text>
            
            <View style={{ gap: 8 }}>
              {moduleStats.slice(0, 2).map((stat) => (
                <ModuleProgressCard key={stat.module_name} stat={stat} />
              ))}
            </View>
          </View>
        )}

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <TouchableOpacity 
            onPress={handleSignOut}
            activeOpacity={0.7}
            style={{
              backgroundColor: '#FEF2F2',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#FECACA',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
            <Text style={{
              color: '#DC2626',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Box Component - Matching Design
function StatBox({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{icon}</Text>
      <Text style={{
        fontSize: 22,
        fontWeight: 'bold',
        color: BRAND_THEME.colors.gray[900],
        marginBottom: 2
      }}>
        {typeof value === 'number' && label === 'Correctes' ? `${value}%` : value}
      </Text>
      <Text style={{
        color: BRAND_THEME.colors.gray[600],
        fontSize: 14
      }}>
        {label}
      </Text>
    </View>
  )
}

// Module Progress Card - Matching Design
function ModuleProgressCard({ stat }: { stat: ModuleStatistics }) {
  const progress = stat.questions_attempted > 0 
    ? Math.round(stat.average_score) 
    : 0

  return (
    <Card variant="default" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{
          color: BRAND_THEME.colors.gray[900],
          fontWeight: '500',
          flex: 1
        }} numberOfLines={1}>
          {stat.module_name}
        </Text>
      </View>
      
      <View style={{
        height: 8,
        backgroundColor: BRAND_THEME.colors.gray[100],
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8
      }}>
        <View style={{
          height: '100%',
          backgroundColor: BRAND_THEME.colors.primary[500],
          borderRadius: 4,
          width: `${progress}%`
        }} />
      </View>
      
      <Text style={{
        color: BRAND_THEME.colors.gray[500],
        fontSize: 14
      }}>
        {stat.questions_attempted} question • {stat.attempts_count} sessions
      </Text>
    </Card>
  )
}

// Device Session Card - New Component
// Device Session Card - View Only (No Delete Button)
function DeviceSessionCard({ 
  session, 
  isLast 
}: { 
  session: DeviceSession; 
  isLast: boolean;
}) {
  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Il y a ${diffInDays}j`
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <View>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingVertical: 8
      }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 22, marginRight: 8 }}>📱</Text>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontWeight: '500',
              flex: 1
            }} numberOfLines={1}>
              {session.device_name || 'Appareil inconnu'}
            </Text>
          </View>
          <Text style={{
            color: BRAND_THEME.colors.gray[500],
            fontSize: 14
          }}>
            Dernière activité: {formatLastActive(session.last_active_at)}
          </Text>
        </View>
      </View>
      
      {!isLast && (
        <View style={{
          height: 1,
          backgroundColor: BRAND_THEME.colors.gray[100],
          marginVertical: 8
        }} />
      )}
    </View>
  )
}
