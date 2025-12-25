// ============================================================================
// Root Layout
// ============================================================================

import '../global.css'

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

function RootLayoutContent() {
  const { isDark, colors } = useTheme()

  useEffect(() => {
    // Hide splash screen after a short delay
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await SplashScreen.hideAsync()
    }
    hideSplash()

    // Handle deep links for auth
    const handleDeepLink = async (url: string) => {
      if (url.includes('access_token') || url.includes('refresh_token')) {
        // Extract tokens from URL and set session
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '')
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        }
      }
    }

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="module/[id]" options={{ headerShown: true, title: 'Module' }} />
        <Stack.Screen name="practice/[moduleId]" options={{ headerShown: true, title: 'Practice' }} />
        <Stack.Screen name="practice/results" options={{ headerShown: true, title: 'Results' }} />
        <Stack.Screen name="saved/index" options={{ headerShown: true, title: 'Saved Questions' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
