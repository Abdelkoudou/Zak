// ============================================================================
// Tabs Layout
// ============================================================================

import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🏠" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Ressources',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="📚" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="👤" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

// Tab Icon Component
function TabIcon({ icon, color, focused }: { icon: string; color: string; focused: boolean }) {
  return (
    <View className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-60'}`}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </View>
  )
}
