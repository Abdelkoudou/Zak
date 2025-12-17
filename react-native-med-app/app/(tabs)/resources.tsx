// ============================================================================
// Resources Screen
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getResources } from '@/lib/resources'
import { CourseResource, ResourceType } from '@/types'
import { RESOURCE_TYPES } from '@/constants'

export default function ResourcesScreen() {
  const { user } = useAuth()
  
  const [resources, setResources] = useState<CourseResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all')

  const loadResources = useCallback(async () => {
    if (!user?.year_of_study) return

    try {
      const filters = selectedType === 'all' 
        ? { year: user.year_of_study }
        : { year: user.year_of_study, type: selectedType }
      
      const { resources: data } = await getResources(filters)
      setResources(data)
    } catch (error) {
      console.error('Error loading resources:', error)
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
      }
    } catch (error) {
      console.error('Error opening URL:', error)
    }
  }

  const getResourceIcon = (type: ResourceType) => {
    return RESOURCE_TYPES.find(t => t.value === type)?.icon || '🔗'
  }

  // Group resources by module
  const groupedResources = resources.reduce((acc, resource) => {
    const key = resource.module_name
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(resource)
    return acc
  }, {} as Record<string, CourseResource[]>)

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Ressources</Text>
        <Text className="text-gray-500">Cours et documents pour vos études</Text>
      </View>

      {/* Type Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <FilterChip 
          label="Tout" 
          isSelected={selectedType === 'all'}
          onPress={() => setSelectedType('all')}
        />
        {RESOURCE_TYPES.map((type) => (
          <FilterChip 
            key={type.value}
            label={`${type.icon} ${type.label}`}
            isSelected={selectedType === type.value}
            onPress={() => setSelectedType(type.value)}
          />
        ))}
      </ScrollView>

      {/* Resources List */}
      <ScrollView
        className="flex"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 py-4">
          {resources.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-4xl mb-4">📁</Text>
              <Text className="text-gray-500 text-center">
                Aucune ressource disponible
              </Text>
            </View>
          ) : (
            Object.entries(groupedResources).map(([moduleName, moduleResources]) => (
              <View key={moduleName} className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  {moduleName}
                </Text>
                <View className="space-y-2">
                  {moduleResources.map((resource) => (
                    <ResourceCard 
                      key={resource.id}
                      resource={resource}
                      icon={getResourceIcon(resource.type)}
                      onPress={() => openResource(resource.url)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}

// Filter Chip Component
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
      className={`px-4 py-2 rounded-full mr-2 ${
        isSelected ? 'bg-primary-500' : 'bg-gray-100'
      }`}
      onPress={onPress}
    >
      <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// Resource Card Component
function ResourceCard({ 
  resource, 
  icon,
  onPress 
}: { 
  resource: CourseResource
  icon: string
  onPress: () => void 
}) {
  return (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4 flex-row items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 bg-primary-50 rounded-xl items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium" numberOfLines={2}>
          {resource.title}
        </Text>
        {resource.description && (
          <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
            {resource.description}
          </Text>
        )}
      </View>
      <Text className="text-primary-500 text-xl">→</Text>
    </TouchableOpacity>
  )
}
