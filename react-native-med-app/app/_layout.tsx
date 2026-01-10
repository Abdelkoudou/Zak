// ============================================================================
// Root Layout
// ============================================================================

import '../global.css'

import { useEffect } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { AppVisibilityProvider } from '@/context/AppVisibilityContext'
import { supabase } from '@/lib/supabase'
import { OfflineContentService } from '@/lib/offline-content'

// Conditionally import native-only modules
let SplashScreen: typeof import('expo-splash-screen') | null = null
let Linking: typeof import('expo-linking') | null = null

if (Platform.OS !== 'web') {
  SplashScreen = require('expo-splash-screen')
  Linking = require('expo-linking')
  SplashScreen?.preventAutoHideAsync()
}

// Silent background sync for offline content
async function syncOfflineContent() {
  if (Platform.OS === 'web') return
  
  try {
    const { hasUpdate } = await OfflineContentService.checkForUpdates()
    if (hasUpdate) {
      // Download silently in background
      await OfflineContentService.downloadUpdates()
      if (__DEV__) {
        console.log('✅ Offline content synced successfully')
      }
    }
  } catch (error) {
    // Silent fail - don't interrupt user experience
    if (__DEV__) {
      console.log('⚠️ Offline sync failed (will retry later):', error)
    }
  }
}

function RootLayoutContent() {
  const { isDark, colors } = useTheme()

  useEffect(() => {
    // Skip native-only code on web
    if (Platform.OS === 'web') return

    // Hide splash screen after offline sync completes (or timeout)
    const initApp = async () => {
      try {
        // Sync offline content during splash screen
        await Promise.race([
          syncOfflineContent(),
          new Promise(resolve => setTimeout(resolve, 3000)) // Max 3s wait
        ])
      } finally {
        // Always hide splash after sync attempt
        await SplashScreen?.hideAsync()
      }
    }
    initApp()

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
    const subscription = Linking?.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    // Check if app was opened via deep link
    Linking?.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })

    return () => {
      subscription?.remove()
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
    <AppVisibilityProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </ThemeProvider>
    </AppVisibilityProvider>
  )
}
