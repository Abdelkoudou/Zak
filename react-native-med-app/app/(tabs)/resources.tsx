// ============================================================================
// Resources Screen - Premium UI with Smooth Animations
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
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getResources } from '@/lib/resources'
import { CourseResource, ResourceType } from '@/types'
import { Card, FadeInView, Skeleton } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export default function ResourcesScreen() {
  const { user } = useAuth()
  
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
    // Animate header
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
        <FadeInView delay={200} animation="scale" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 56, marginBottom: 20 }}>🎓</Text>
          <Text style={{ color: BRAND_THEME.colors.gray[700], textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
            Connectez-vous
          </Text>
          <Text style={{ color: BRAND_THEME.colors.gray[500], textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      {/* Header */}
      <Animated.View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: BRAND_THEME.colors.gray[100],
        opacity: headerOpacity,
        transform: [{ translateY: headerSlide }],
      }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: BRAND_THEME.colors.gray[900], marginBottom: 4, letterSpacing: -0.5 }}>
          Ressources
        </Text>
        <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 15 }}>
          Cours et documents pour vos études
        </Text>
      </Animated.View>

      {/* Type Filter */}
      <FadeInView delay={100} animation="slideUp">
        <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: BRAND_THEME.colors.gray[100] }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14 }}
          >
            <AnimatedFilterChip label="Tous" isSelected={selectedType === 'all'} onPress={() => setSelectedType('all')} />
            <AnimatedFilterChip label="📁 Drive" isSelected={selectedType === 'google_drive'} onPress={() => setSelectedType('google_drive')} />
            <AnimatedFilterChip label="💬 Telegram" isSelected={selectedType === 'telegram'} onPress={() => setSelectedType('telegram')} />
            <AnimatedFilterChip label="📺 YouTube" isSelected={selectedType === 'youtube'} onPress={() => setSelectedType('youtube')} />
            <AnimatedFilterChip label="📄 PDF" isSelected={selectedType === 'pdf'} onPress={() => setSelectedType('pdf')} />
          </ScrollView>
        </View>
      </FadeInView>

      {/* Resources List */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#09B2AD" colors={['#09B2AD']} />
        }
      >
        <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
          {isLoading ? (
            <ResourcesSkeleton />
          ) : error ? (
            <FadeInView animation="scale">
              <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
                <Text style={{ color: BRAND_THEME.colors.error[600], textAlign: 'center', fontSize: 16, marginBottom: 12 }}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#09B2AD', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
                  onPress={() => { setError(null); loadResources() }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Réessayer</Text>
                </TouchableOpacity>
              </Card>
            </FadeInView>
          ) : filteredResources.length === 0 ? (
            <FadeInView animation="scale">
              <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 56, marginBottom: 16 }}>📁</Text>
                <Text style={{ color: BRAND_THEME.colors.gray[700], textAlign: 'center', fontSize: 17, fontWeight: '600' }}>
                  Aucune ressource disponible
                </Text>
                <Text style={{ color: BRAND_THEME.colors.gray[500], textAlign: 'center', fontSize: 14, marginTop: 8 }}>
                  pour la {user.year_of_study}ère année
                  {selectedType !== 'all' && ` (${getTypeLabel(selectedType)})`}
                </Text>
              </Card>
            </FadeInView>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredResources.map((resource, index) => (
                <FadeInView key={resource.id} delay={150 + index * 50} animation="slideUp">
                  <AnimatedResourceCard resource={resource} onPress={() => openResource(resource.url)} />
                </FadeInView>
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
function AnimatedFilterChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, tension: 100, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        marginRight: 10,
        backgroundColor: isSelected ? '#09B2AD' : BRAND_THEME.colors.gray[100],
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
function AnimatedResourceCard({ resource, onPress }: { resource: CourseResource; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 100, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()
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
      case 'google_drive': return 'rgba(66, 133, 244, 0.1)'
      case 'telegram': return 'rgba(0, 136, 204, 0.1)'
      case 'youtube': return 'rgba(255, 0, 0, 0.08)'
      case 'pdf': return 'rgba(220, 38, 38, 0.08)'
      default: return BRAND_THEME.colors.gray[100]
    }
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        ...BRAND_THEME.shadows.sm,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 48,
            height: 48,
            backgroundColor: getResourceColor(resource.type),
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ fontSize: 22 }}>{getResourceIcon(resource.type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontWeight: '600',
              fontSize: 16,
              marginBottom: 2,
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
            width: 32,
            height: 32,
            backgroundColor: 'rgba(9, 178, 173, 0.1)',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#09B2AD', fontSize: 16, fontWeight: '700' }}>→</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}

// Resources Skeleton
function ResourcesSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, ...BRAND_THEME.shadows.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Skeleton width={48} height={48} borderRadius={14} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Skeleton width="70%" height={18} style={{ marginBottom: 6 }} />
              <Skeleton width="50%" height={14} />
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}
