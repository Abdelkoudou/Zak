// ============================================================================
// Tabs Layout - Premium Tab Bar with Responsive Design
// ============================================================================

import { useRef, useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, useWindowDimensions, Animated, Pressable, Platform } from 'react-native'
import { HomeIcon, ResourcesIcon, ProfileIcon } from '@/components/icons'

export default function TabsLayout() {
  const { width } = useWindowDimensions()
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 768
  
  // Hide tab bar on desktop web (use header navigation instead)
  const showTabBar = !isWeb || !isDesktop

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: showTabBar ? {
          backgroundColor: '#09B2AD',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 25,
          paddingTop: 12,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowColor: '#09B2AD',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        } : { display: 'none' },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.3,
        },
        tabBarButton: showTabBar ? (props) => <AnimatedTabButton {...props} /> : () => null,
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
    </Animated.View>
  )
}

// Animated Tab Button with press effect
function AnimatedTabButton(props: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isFocused = props.accessibilityState?.selected

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
        {isFocused && (
          <View style={{
            position: 'absolute',
            bottom: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#ffffff',
          }} />
        )}
      </Animated.View>
    </Pressable>
  )
}
