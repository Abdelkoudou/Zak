// ============================================================================
// Tabs Layout - Premium Tab Bar with Responsive Design
// ============================================================================

import { useRef, useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, useWindowDimensions, Animated, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeIcon, ResourcesIcon, ProfileIcon } from '@/components/icons'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export default function TabsLayout() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 768
  
  // Hide tab bar on desktop web (use header navigation instead)
  const showTabBar = !isWeb || !isDesktop
  
  // Calculate tab bar height accounting for safe area (edge-to-edge on Android 15)
  const baseHeight = Platform.OS === 'ios' ? 66 : Platform.OS === 'web' ? 70 : 66
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Platform.OS === 'web' ? 10 : Math.max(insets.bottom, 24)
  const tabBarHeight = baseHeight + bottomPadding

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: showTabBar ? {
          backgroundColor: '#09B2AD',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: Platform.OS === 'web' ? 10 : 12,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
        } : { display: 'none' },
        tabBarActiveTintColor: '#1E1E1E',
        tabBarInactiveTintColor: 'rgba(30, 30, 30, 0.5)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: Platform.OS === 'web' ? 4 : 2,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: Platform.OS === 'web' ? 4 : 0,
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
              <HomeIcon size={26} color={color} />
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
              <ResourcesIcon size={26} color={color} />
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
              <ProfileIcon size={26} color={color} />
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
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.5,
        duration: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start()
  }

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[props.style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
    >
      <Animated.View style={{ 
        alignItems: 'center', 
        justifyContent: 'center',
        transform: [{ scale: scaleAnim }],
        flexDirection: 'column',
        gap: Platform.OS === 'web' ? 2 : 0,
      }}>
        {props.children}
      </Animated.View>
    </Pressable>
  )
}
