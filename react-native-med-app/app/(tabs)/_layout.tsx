// ============================================================================
// Tabs Layout - Premium Tab Bar with Smooth Animations
// ============================================================================

import { useRef, useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, useWindowDimensions, Animated, Pressable } from 'react-native'
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
          height: isDesktop ? 70 : 85,
          paddingBottom: isDesktop ? 10 : 25,
          paddingTop: 12,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          bottom: 0,
          left: isDesktop ? (width - Math.min(width, 600)) / 2 : 0,
          right: isDesktop ? (width - Math.min(width, 600)) / 2 : 0,
          width: isDesktop ? Math.min(width, 600) : '100%',
          elevation: 0,
          shadowColor: '#09B2AD',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          borderBottomLeftRadius: isDesktop ? 28 : 0,
          borderBottomRightRadius: isDesktop ? 28 : 0,
          marginBottom: isDesktop ? 20 : 0,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.3,
        },
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <HomeIcon size={28} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Ressources',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <ResourcesIcon size={28} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <ProfileIcon size={28} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
  )
}

// Animated Tab Icon with scale effect
function AnimatedTabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.15 : 1)).current
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.5)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [focused])

  return (
    <Animated.View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      opacity: opacityAnim,
      transform: [{ scale: scaleAnim }],
    }}>
      {children}
      {focused && (
        <View style={{
          position: 'absolute',
          bottom: -8,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#ffffff',
        }} />
      )}
    </Animated.View>
  )
}

// Animated Tab Button with press effect
function AnimatedTabButton(props: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[props.style, { flex: 1 }]}
    >
      <Animated.View style={{ 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        transform: [{ scale: scaleAnim }],
      }}>
        {props.children}
      </Animated.View>
    </Pressable>
  )
}
