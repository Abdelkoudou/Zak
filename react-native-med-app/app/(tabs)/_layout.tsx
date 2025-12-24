// ============================================================================
// Tabs Layout
// ============================================================================

import { Tabs } from 'expo-router'
import { View, Text, useWindowDimensions } from 'react-native'

export default function TabsLayout() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 1024

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09B2AD',
          borderTopWidth: 0,
          height: isDesktop ? 60 : 80,
          paddingBottom: isDesktop ? 0 : 20,
          paddingTop: 10,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: 'absolute',
          bottom: 0,
          left: isDesktop ? (width - Math.min(width, 600)) / 2 : 0,
          right: isDesktop ? (width - Math.min(width, 600)) / 2 : 0,
          width: isDesktop ? Math.min(width, 600) : '100%',
          elevation: 0,
          borderBottomLeftRadius: isDesktop ? 25 : 0,
          borderBottomRightRadius: isDesktop ? 25 : 0,
          marginBottom: isDesktop ? 20 : 0,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acceuil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🏠" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
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
