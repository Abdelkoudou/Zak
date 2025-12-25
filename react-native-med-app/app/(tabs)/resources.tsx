// ============================================================================
// Resources Screen - Premium UI with Responsive Web Design
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  Linking,
  Animated,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getResources } from '@/lib/resources'
import { CourseResource, ResourceType } from '@/types'
import { Card, FadeInView, Skeleton } from '@/components/ui'
import { WebHeader } from '@/components/ui/WebHeader'
import { BRAND_THEME } from '@/constants/theme'

export default function ResourcesScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const showWebHeader = isWeb && width >= 768
  const contentMaxWidth = 1200
  const columnCount = isDesktop ? 2 : 1
  
  const [resources, setResources] = useState<CourseResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all')

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-20)).current

  const loadResources = useCallback(async () => {
    if (!user?.year_of_study) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const filters = selectedType === 'all' 
        ? { year: user.year_of_study }
        : { year: user.year_of_study, type: selectedType }
      
      const { resources: data, error: apiError } = await getResources(filters)
      
      if (apiError) {
        setError(apiError)
        setResources([])
      } else {
        setResources(data)
      }
    } catch {
      setError('Erreur lors du chargement des ressources')
      setResources([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, selectedType])

  useEffect(() => {
    loadResources()
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start()
  }, [loadResources])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadResources()
  }, [loadResources])

  const openResource = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        setError('Impossible d\'ouvrir ce lien')
      }
    } catch (error) {
      setError('Erreur lors de l\'ouverture du lien')
    }
  }

  if (!user || !user.year_of_study) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        {showWebHeader && <WebHeader />}
        <FadeInView delay={200} animation="scale" style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          paddingHorizontal: 24 
        }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>🎓</Text>
          <Text style={{ 
            color: BRAND_THEME.colors.gray[700], 
            textAlign: 'center', 
            fontSize: 22, 
            fontWeight: '700', 
            marginBottom: 8 
          }}>
            Connectez-vous
          </Text>
          <Text style={{ 
            color: BRAND_THEME.colors.gray[500], 
            textAlign: 'center', 
            fontSize: 16, 
            lineHeight: 24 
          }}>
            pour accéder aux ressources de votre année d'étude
          </Text>
        </FadeInView>
      </SafeAreaView>
    )
  }

  const filteredResources = selectedType === 'all' ? resources : resources.filter(r => r.type === selectedType)

  const getTypeLabel = (type: ResourceType) => {
    switch (type) {
      case 'google_drive': return 'Drive'
      case 'telegram': return 'Telegram'
      case 'youtube': return 'YouTube'
      case 'pdf': return 'PDF'
      default: return 'Autre'
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }} edges={showWebHeader ? ['bottom'] : ['top', 'bottom']}>
      {showWebHeader && <WebHeader />}

      {/* Header */}
      <Animated.View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: isDesktop ? 32 : 24,
        paddingVertical: isDesktop ? 28 : 20,
        borderBottomWidth: 1,
        borderBottomColor: BRAND_THEME.colors.gray[100],
        opacity: headerOpacity,
        transform: [{ translateY: headerSlide }],
        alignItems: 'center',
      }}>
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
          <View style={{ 
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: isDesktop ? 'center' : 'flex-start',
            justifyContent: 'space-between',
          }}>
            <View style={{ marginBottom: isDesktop ? 0 : 16 }}>
              <Text style={{ 
                fontSize: isDesktop ? 32 : 26, 
                fontWeight: '800', 
                color: BRAND_THEME.colors.gray[900], 
                marginBottom: 4, 
                letterSpacing: -0.5 
              }}>
                Ressources
              </Text>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 15 }}>
                Cours et documents pour vos études • {user.year_of_study}ère Année
              </Text>
            </View>

            {/* Type Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <AnimatedFilterChip 
                label="Tous" 
                isSelected={selectedType === 'all'} 
                onPress={() => setSelectedType('all')} 
              />
              <AnimatedFilterChip 
                label="📁 Drive" 
                isSelected={selectedType === 'google_drive'} 
                onPress={() => setSelectedType('google_drive')} 
              />
              <AnimatedFilterChip 
                label="💬 Telegram" 
                isSelected={selectedType === 'telegram'} 
                onPress={() => setSelectedType('telegram')} 
              />
              <AnimatedFilterChip 
                label="📺 YouTube" 
                isSelected={selectedType === 'youtube'} 
                onPress={() => setSelectedType('youtube')} 
              />
              <AnimatedFilterChip 
                label="📄 PDF" 
                isSelected={selectedType === 'pdf'} 
                onPress={() => setSelectedType('pdf')} 
              />
            </ScrollView>
          </View>
        </View>
      </Animated.View>

      {/* Resources List */}
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
          paddingVertical: isDesktop ? 32 : 20 
        }}>
          {isLoading ? (
            <ResourcesSkeleton columnCount={columnCount} />
          ) : error ? (
            <FadeInView animation="scale">
              <View style={{ 
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: 48,
                alignItems: 'center',
                ...BRAND_THEME.shadows.sm,
              }}>
                <Text style={{ fontSize: 56, marginBottom: 20 }}>⚠️</Text>
                <Text style={{ 
                  color: BRAND_THEME.colors.error[600], 
                  textAlign: 'center', 
                  fontSize: 18, 
                  fontWeight: '600',
                  marginBottom: 16 
                }}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={{ 
                    backgroundColor: '#09B2AD', 
                    paddingHorizontal: 24, 
                    paddingVertical: 12, 
                    borderRadius: 14 
                  }}
                  onPress={() => { setError(null); loadResources() }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          ) : filteredResources.length === 0 ? (
            <FadeInView animation="scale">
              <View style={{ 
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: 48,
                alignItems: 'center',
                ...BRAND_THEME.shadows.sm,
              }}>
                <Text style={{ fontSize: 64, marginBottom: 20 }}>📁</Text>
                <Text style={{ 
                  color: BRAND_THEME.colors.gray[700], 
                  textAlign: 'center', 
                  fontSize: 20, 
                  fontWeight: '700',
                  marginBottom: 8,
                }}>
                  Aucune ressource disponible
                </Text>
                <Text style={{ 
                  color: BRAND_THEME.colors.gray[500], 
                  textAlign: 'center', 
                  fontSize: 15 
                }}>
                  pour la {user.year_of_study}ère année
                  {selectedType !== 'all' && ` (${getTypeLabel(selectedType)})`}
                </Text>
              </View>
            </FadeInView>
          ) : (
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              marginHorizontal: -8 
            }}>
              {filteredResources.map((resource, index) => (
                <View 
                  key={resource.id} 
                  style={{ 
                    width: `${100 / columnCount}%`, 
                    padding: 8 
                  }}
                >
                  <FadeInView delay={150 + index * 50} animation="slideUp">
                    <AnimatedResourceCard 
                      resource={resource} 
                      onPress={() => openResource(resource.url)} 
                    />
                  </FadeInView>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Animated Filter Chip
function AnimatedFilterChip({ 
  label, 
  isSelected, 
  onPress 
}: { 
  label: string
  isSelected: boolean
  onPress: () => void 
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isWeb = Platform.OS === 'web'

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { 
      toValue: 0.95, 
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
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: isSelected ? '#09B2AD' : BRAND_THEME.colors.gray[100],
        // @ts-ignore
        ...(isWeb && { cursor: 'pointer', transition: 'all 0.2s ease' }),
      }}>
        <Text style={{
          fontWeight: '600',
          fontSize: 14,
          color: isSelected ? '#ffffff' : BRAND_THEME.colors.gray[600],
        }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

// Animated Resource Card
function AnimatedResourceCard({ 
  resource, 
  onPress 
}: { 
  resource: CourseResource
  onPress: () => void 
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isWeb = Platform.OS === 'web'

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { 
      toValue: 0.98, 
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

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'google_drive': return '📁'
      case 'telegram': return '💬'
      case 'youtube': return '📺'
      case 'pdf': return '📄'
      default: return '📋'
    }
  }

  const getResourceColor = (type: ResourceType) => {
    switch (type) {
      case 'google_drive': return { bg: 'rgba(66, 133, 244, 0.1)', accent: '#4285F4' }
      case 'telegram': return { bg: 'rgba(0, 136, 204, 0.1)', accent: '#0088CC' }
      case 'youtube': return { bg: 'rgba(255, 0, 0, 0.08)', accent: '#FF0000' }
      case 'pdf': return { bg: 'rgba(220, 38, 38, 0.08)', accent: '#DC2626' }
      default: return { bg: BRAND_THEME.colors.gray[100], accent: BRAND_THEME.colors.gray[600] }
    }
  }

  const colors = getResourceColor(resource.type)

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        ...BRAND_THEME.shadows.sm,
        borderWidth: 1,
        borderColor: BRAND_THEME.colors.gray[100],
        // @ts-ignore
        ...(isWeb && { cursor: 'pointer', transition: 'all 0.2s ease' }),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 56,
            height: 56,
            backgroundColor: colors.bg,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}>
            <Text style={{ fontSize: 26 }}>{getResourceIcon(resource.type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontWeight: '700',
              fontSize: 16,
              marginBottom: 4,
              letterSpacing: -0.2,
            }} numberOfLines={2}>
              {resource.title}
            </Text>
            {resource.description && (
              <Text style={{
                color: BRAND_THEME.colors.gray[500],
                fontSize: 14,
              }} numberOfLines={1}>
                {resource.description}
              </Text>
            )}
          </View>
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(9, 178, 173, 0.1)',
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 12,
          }}>
            <Text style={{ color: '#09B2AD', fontSize: 18, fontWeight: '700' }}>→</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}

// Resources Skeleton
function ResourcesSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={{ width: `${100 / columnCount}%`, padding: 8 }}>
          <View style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 20, 
            padding: 20, 
            ...BRAND_THEME.shadows.sm 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Skeleton width={56} height={56} borderRadius={16} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
                <Skeleton width="60%" height={14} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}
