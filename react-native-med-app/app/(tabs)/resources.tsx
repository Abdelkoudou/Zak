// ============================================================================
// Resources Screen - Premium UI with Dark Mode Support
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
import { useTheme } from '@/context/ThemeContext'
import { getResources } from '@/lib/resources'
import { CourseResource, ResourceType } from '@/types'
import { FadeInView, Skeleton } from '@/components/ui'
import { WebHeader } from '@/components/ui/WebHeader'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export default function ResourcesScreen() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const { width } = useWindowDimensions()
  
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const showWebHeader = isWeb && width >= 768
  const contentMaxWidth = 1200
  const columnCount = isDesktop ? 2 : 1
  
  const [resources, setResources] = useState<CourseResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all')

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
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: USE_NATIVE_DRIVER }),
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
    } catch {
      setError('Erreur lors de l\'ouverture du lien')
    }
  }

  if (!user || !user.year_of_study) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {showWebHeader && <WebHeader />}
        <FadeInView delay={200} animation="scale" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>🎓</Text>
          <Text style={{ color: colors.text, textAlign: 'center', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Connectez-vous</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 24 }}>pour accéder aux ressources de votre année d'étude</Text>
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
   const getYearLabel = () => {
    switch (user?.year_of_study) {
      case '1': return '1ère Année'
      case '2': return '2ème Année'
      case '3': return '3ème Année'
      default: return ''
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showWebHeader ? ['bottom'] : ['top', 'bottom']}>
      {showWebHeader && <WebHeader />}

      {/* Header */}
      <Animated.View style={{
        backgroundColor: colors.card,
        paddingHorizontal: isDesktop ? 32 : 24,
        paddingVertical: isDesktop ? 28 : 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: headerOpacity,
        transform: [{ translateY: headerSlide }],
        alignItems: 'center',
      }}>
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
          <View style={{ alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ marginBottom: isDesktop ? 0 : 16 }}>
              <Text style={{ fontSize: isDesktop ? 32 : 26, fontWeight: '800', color: colors.text, marginBottom: 4, letterSpacing: -0.5 }}>Ressources</Text>
            </View>

            {/* Type Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
             
              <AnimatedFilterChip label="📁 Drive" isSelected={selectedType === 'google_drive'} onPress={() => setSelectedType('google_drive')} colors={colors} />
              <AnimatedFilterChip label="💬 Telegram" isSelected={selectedType === 'telegram'} onPress={() => setSelectedType('telegram')} colors={colors} />
            </ScrollView>
          </View>
        </View>
      </Animated.View>

      {/* Resources List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: isDesktop ? 32 : 24, paddingVertical: isDesktop ? 32 : 20 }}>
          {isLoading ? (
            <ResourcesSkeleton columnCount={columnCount} colors={colors} isDark={isDark} />
          ) : error ? (
            <FadeInView animation="scale">
              <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 48, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 56, marginBottom: 20 }}>⚠️</Text>
                <Text style={{ color: colors.error, textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>{error}</Text>
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
                  onPress={() => { setError(null); loadResources() }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          ) : filteredResources.length === 0 ? (
            <FadeInView animation="scale">
              <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 48, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 64, marginBottom: 20 }}>📁</Text>
                <Text style={{ color: colors.text, textAlign: 'center', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Aucune ressource disponible</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 15 }}>
                  pour la {getYearLabel()} année{selectedType !== 'all' && ` (${getTypeLabel(selectedType)})`}
                </Text>
              </View>
            </FadeInView>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {filteredResources.map((resource, index) => (
                <View key={resource.id} style={{ width: `${100 / columnCount}%`, padding: 8 }}>
                  <FadeInView delay={150 + index * 50} animation="slideUp">
                    <AnimatedResourceCard resource={resource} onPress={() => openResource(resource.url)} colors={colors} isDark={isDark} />
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
function AnimatedFilterChip({ label, isSelected, onPress, colors }: { label: string; isSelected: boolean; onPress: () => void; colors: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
      }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: isSelected ? '#ffffff' : colors.textSecondary }}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

// Animated Resource Card
function AnimatedResourceCard({ resource, onPress, colors, isDark }: { resource: CourseResource; onPress: () => void; colors: any; isDark: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }).start()
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
      case 'google_drive': return { bg: isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.1)', accent: '#4285F4' }
      case 'telegram': return { bg: isDark ? 'rgba(0, 136, 204, 0.2)' : 'rgba(0, 136, 204, 0.1)', accent: '#0088CC' }
      case 'youtube': return { bg: isDark ? 'rgba(255, 0, 0, 0.15)' : 'rgba(255, 0, 0, 0.08)', accent: '#FF0000' }
      case 'pdf': return { bg: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)', accent: '#DC2626' }
      default: return { bg: colors.backgroundSecondary, accent: colors.textSecondary }
    }
  }

  const resourceColors = getResourceColor(resource.type)

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
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
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, backgroundColor: resourceColors.bg, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Text style={{ fontSize: 26 }}>{getResourceIcon(resource.type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4, letterSpacing: -0.2 }} numberOfLines={2}>{resource.title}</Text>
            {resource.description && (
              <Text style={{ color: colors.textMuted, fontSize: 14 }} numberOfLines={1}>{resource.description}</Text>
            )}
          </View>
          <View style={{ width: 40, height: 40, backgroundColor: colors.primaryMuted, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>→</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}

// Resources Skeleton
function ResourcesSkeleton({ columnCount, colors, isDark }: { columnCount: number; colors: any; isDark: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={{ width: `${100 / columnCount}%`, padding: 8 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border }}>
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
