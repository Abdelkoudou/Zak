// ============================================================================
// Resources Screen - Light Sea Green Brand (Matching Design)
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getResources } from '@/lib/resources'
import { CourseResource, ResourceType } from '@/types'

import { Card, LoadingSpinner } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export default function ResourcesScreen() {
  const { user } = useAuth()
  
  const [resources, setResources] = useState<CourseResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all')

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
    } catch (error) {
      console.error('Error loading resources:', error)
      setError('Erreur lors du chargement des ressources')
      setResources([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user, selectedType])

  useEffect(() => {
    loadResources()
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
      console.error('Error opening URL:', error)
      setError('Erreur lors de l\'ouverture du lien')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <LoadingSpinner message="Chargement des ressources..." />
      </SafeAreaView>
    )
  }

  // Show message if user is not authenticated or doesn't have year_of_study
  if (!user || !user.year_of_study) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎓</Text>
          <Text style={{
            color: BRAND_THEME.colors.gray[600],
            textAlign: 'center',
            fontSize: 16,
            marginBottom: 8
          }}>
            Veuillez vous connecter et compléter votre profil
          </Text>
          <Text style={{
            color: BRAND_THEME.colors.gray[500],
            textAlign: 'center',
            fontSize: 14
          }}>
            pour accéder aux ressources de votre année d'étude
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Filter resources based on selected type
  const filteredResources = selectedType === 'all' ? resources : resources.filter(r => r.type === selectedType)

  // Get type label for display
  const getTypeLabel = (type: ResourceType) => {
    switch (type) {
      case 'google_drive':
        return 'Drive'
      case 'telegram':
        return 'Telegram'
      case 'youtube':
        return 'YouTube'
      case 'pdf':
        return 'PDF'
      default:
        return 'Autre'
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
      {/* Header - Matching Design */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BRAND_THEME.colors.gray[100]
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: BRAND_THEME.colors.gray[900],
          marginBottom: 4
        }}>
          Resources
        </Text>
        <Text style={{
          color: BRAND_THEME.colors.gray[600],
          fontSize: 14
        }}>
          Cours Et Documents Pour Vos Etudes
        </Text>
      </View>

      {/* Type Filter - Matching Design */}
      <View style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: BRAND_THEME.colors.gray[100]
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          <FilterChip 
            label="Tous" 
            isSelected={selectedType === 'all'}
            onPress={() => setSelectedType('all')}
          />
          <FilterChip 
            label="Drive" 
            isSelected={selectedType === 'google_drive'}
            onPress={() => setSelectedType('google_drive')}
          />
          <FilterChip 
            label="Telegram" 
            isSelected={selectedType === 'telegram'}
            onPress={() => setSelectedType('telegram')}
          />
          <FilterChip 
            label="YouTube" 
            isSelected={selectedType === 'youtube'}
            onPress={() => setSelectedType('youtube')}
          />
          <FilterChip 
            label="PDF" 
            isSelected={selectedType === 'pdf'}
            onPress={() => setSelectedType('pdf')}
          />
        </ScrollView>
      </View>

      {/* Resources List - Matching Design */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={BRAND_THEME.colors.primary[500]}
          />
        }
      >
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {error ? (
            <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
              <Text style={{
                color: BRAND_THEME.colors.error[600],
                textAlign: 'center',
                fontSize: 16,
                marginBottom: 8
              }}>
                {error}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: BRAND_THEME.colors.primary[500],
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginTop: 8
                }}
                onPress={() => {
                  setError(null)
                  loadResources()
                }}
              >
                <Text style={{ color: 'white', fontWeight: '500' }}>
                  Réessayer
                </Text>
              </TouchableOpacity>
            </Card>
          ) : filteredResources.length === 0 ? (
            <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📁</Text>
              <Text style={{
                color: BRAND_THEME.colors.gray[600],
                textAlign: 'center',
                fontSize: 16
              }}>
                Aucune ressource disponible
              </Text>
              {user?.year_of_study && (
                <Text style={{
                  color: BRAND_THEME.colors.gray[500],
                  textAlign: 'center',
                  fontSize: 14,
                  marginTop: 8
                }}>
                  pour la {user.year_of_study}ère année
                  {selectedType !== 'all' && ` (${getTypeLabel(selectedType)})`}
                </Text>
              )}
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredResources.map((resource) => (
                <ResourceCard 
                  key={resource.id}
                  resource={resource}
                  onPress={() => openResource(resource.url)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Filter Chip Component - Matching Design
function FilterChip({ 
  label, 
  isSelected, 
  onPress 
}: { 
  label: string
  isSelected: boolean
  onPress: () => void 
}) {
  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: isSelected ? BRAND_THEME.colors.primary[100] : BRAND_THEME.colors.gray[100]
      }}
      onPress={onPress}
    >
      <Text style={{
        fontWeight: '500',
        color: isSelected ? BRAND_THEME.colors.primary[700] : BRAND_THEME.colors.gray[700]
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// Resource Card Component - Matching Design
function ResourceCard({ 
  resource, 
  onPress 
}: { 
  resource: CourseResource
  onPress: () => void 
}) {
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'google_drive':
        return '📁'
      case 'telegram':
        return '💬'
      case 'youtube':
        return '📺'
      case 'pdf':
        return '📄'
      default:
        return '📋'
    }
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: BRAND_THEME.colors.gray[100],
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <Text style={{ fontSize: 20 }}>{getResourceIcon(resource.type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[900],
              fontWeight: '500',
              fontSize: 16
            }} numberOfLines={2}>
              {resource.title}
            </Text>
            {resource.description && (
              <Text style={{
                color: BRAND_THEME.colors.gray[600],
                fontSize: 14,
                marginTop: 4
              }} numberOfLines={1}>
                {resource.description}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}
