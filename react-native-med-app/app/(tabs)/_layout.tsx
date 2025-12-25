// ============================================================================
// Tabs Layout - Premium Custom Icons from Figma
// ============================================================================

import { Tabs } from 'expo-router'
import { View, useWindowDimensions } from 'react-native'
import { HomeIcon, ResourcesIcon, ProfileIcon } from '@/components/icons'

export default function TabsLayout() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09B2AD',
          borderTopWidth: 0,
          height: isDesktop ? 70 : 90,
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
          fontSize: 14,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <HomeIcon size={32} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Ressources',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <ResourcesIcon size={32} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <ProfileIcon size={32} color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  )
}

// Tab Icon Wrapper with focus animation
function TabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      opacity: focused ? 1 : 0.6,
      transform: [{ scale: focused ? 1.1 : 1 }]
    }}>
      {children}
    </View>
  )
}
