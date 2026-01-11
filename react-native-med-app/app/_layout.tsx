// ============================================================================
// Root Layout
// ============================================================================

import '../global.css'

import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { AppVisibilityProvider } from '@/context/AppVisibilityContext'
import { supabase } from '@/lib/supabase'

// Lazy import for OfflineContentService to prevent crashes
let OfflineContentService: typeof import('@/lib/offline-content').OfflineContentService | null = null

// Conditionally import native-only modules with error handling
let SplashScreen: typeof import('expo-splash-screen') | null = null
let Linking: typeof import('expo-linking') | null = null

// Safe initialization of native modules
if (Platform.OS !== 'web') {
  try {
    SplashScreen = require('expo-splash-screen')
    Linking = require('expo-linking')
    // Wrap in try-catch to prevent crash if SplashScreen fails
    SplashScreen?.preventAutoHideAsync().catch(() => {
      // Silent fail - splash screen might already be hidden
    })
  } catch (error) {
    // Silent fail - continue without splash screen management
    if (__DEV__) {
      console.warn('[Layout] Failed to load native modules:', error)
    }
  }
}

// Silent background sync for offline content - completely safe
async function syncOfflineContent(): Promise<void> {
  if (Platform.OS === 'web') return
  
  try {
    // Lazy load the offline content service
    if (!OfflineContentService) {
      try {
        const module = require('@/lib/offline-content')
        OfflineContentService = module.OfflineContentService
      } catch (loadError) {
        if (__DEV__) {
          console.warn('[Layout] Failed to load OfflineContentService:', loadError)
        }
        return
      }
    }
    
    if (!OfflineContentService) return
    
    const { hasUpdate } = await OfflineContentService.checkForUpdates()
    if (hasUpdate) {
      await OfflineContentService.downloadUpdates()
      if (__DEV__) {
        console.log('✅ Offline content synced successfully')
      }
    }
  } catch (error) {
    // Silent fail - don't interrupt user experience
    if (__DEV__) {
      console.warn('⚠️ Offline sync failed (will retry later):', error)
    }
  }
}

function RootLayoutContent() {
  const { isDark, colors } = useTheme()
  const initStarted = useRef(false)

  useEffect(() => {
    // Skip native-only code on web
    if (Platform.OS === 'web') return
    
    // Prevent double initialization
    if (initStarted.current) return
    initStarted.current = true

    // Hide splash screen after offline sync completes (or timeout)
    const initApp = async () => {
      try {
        // Sync offline content during splash screen with timeout
        await Promise.race([
          syncOfflineContent().catch(() => {}), // Catch any errors
          new Promise(resolve => setTimeout(resolve, 3000)) // Max 3s wait
        ])
      } catch (error) {
        // Silent fail - app should start regardless
        if (__DEV__) {
          console.warn('[Layout] Init error:', error)
        }
      } finally {
        // Always hide splash after sync attempt
        try {
          await SplashScreen?.hideAsync()
        } catch (splashError) {
          // Silent fail - splash might already be hidden
        }
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
