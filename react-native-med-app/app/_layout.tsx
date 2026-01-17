// ============================================================================
// Root Layout - Crash-Safe Implementation
// ============================================================================

import '../global.css'

import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { AppVisibilityProvider } from '@/context/AppVisibilityContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Lazy-loaded modules - prevent crashes from top-level imports
let _Platform: typeof import('react-native').Platform | null = null
let _supabase: typeof import('@/lib/supabase').supabase | null = null
let _SplashScreen: typeof import('expo-splash-screen') | null = null
let _Linking: typeof import('expo-linking') | null = null
let _OfflineContentService: typeof import('@/lib/offline-content').OfflineContentService | null = null

// Load Platform safely
function getPlatform() {
  if (!_Platform) {
    try {
      _Platform = require('react-native').Platform
    } catch {
      // Fallback
    }
  }
  return _Platform
}

// Load supabase safely
function getSupabase() {
  if (!_supabase) {
    try {
      _supabase = require('@/lib/supabase').supabase
    } catch {
      // Fallback
    }
  }
  return _supabase
}

// Initialize native modules safely (only on native platforms)
function initNativeModules() {
  const platform = getPlatform()
  if (platform?.OS === 'web') return
  
  try {
    _SplashScreen = require('expo-splash-screen')
    _SplashScreen?.preventAutoHideAsync().catch(() => {})
  } catch {
    // Silent fail
  }
  
  try {
    _Linking = require('expo-linking')
  } catch {
    // Silent fail
  }
}

// Call init once at module load (but safely)
try {
  initNativeModules()
} catch {
  // Silent fail - app should still work
}

// Check offline content status on startup (no auto-download - user controls from profile)
async function checkOfflineContentStatus(): Promise<void> {
  const platform = getPlatform()
  if (platform?.OS === 'web') return
  
  try {
    if (!_OfflineContentService) {
      const module = require('@/lib/offline-content')
      _OfflineContentService = module.OfflineContentService
    }
    
    if (!_OfflineContentService) return
    
    // Just check status - don't auto-download (user controls from profile)
    const { hasUpdate, remoteVersion, error } = await _OfflineContentService.checkForUpdates()
    
    if (__DEV__) {
      if (error) {
        console.log('[Offline] Status check:', error)
      } else if (hasUpdate && remoteVersion) {
        console.log(`[Offline] Update available: v${remoteVersion.version} (${remoteVersion.total_questions} questions)`)
      } else {
        const localVersion = await _OfflineContentService.getLocalVersion()
        if (localVersion) {
          console.log(`[Offline] Content ready: v${localVersion.version} (${localVersion.total_questions} questions)`)
        } else {
          console.log('[Offline] No local content - user can download from profile')
        }
      }
    }
  } catch (error) {
    // Silent fail - don't interrupt user experience
    if (__DEV__) {
      console.warn('[Offline] Status check failed:', error)
    }
  }
}

function RootLayoutContent() {
  const { isDark, colors } = useTheme()
  const initStarted = useRef(false)

  useEffect(() => {
    const platform = getPlatform()
    if (platform?.OS === 'web') return
    
    if (initStarted.current) return
    initStarted.current = true

    const initApp = async () => {
      try {
        // Check offline content status (no auto-download)
        await Promise.race([
          checkOfflineContentStatus().catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 3000))
        ])
      } catch {
        // Silent fail
      } finally {
        // Always hide splash
        try {
          await _SplashScreen?.hideAsync()
        } catch {
          // Silent fail
        }
      }
    }
    initApp()

    // Handle deep links for auth
    const handleDeepLink = async (url: string) => {
      if (url.includes('access_token') || url.includes('refresh_token')) {
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '')
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const supabase = getSupabase()
          await supabase?.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        }
      }
    }

    // Listen for incoming deep links
    const subscription = _Linking?.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    // Check if app was opened via deep link
    _Linking?.getInitialURL().then((url) => {
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
    <ErrorBoundary>
      <AppVisibilityProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutContent />
          </AuthProvider>
        </ThemeProvider>
      </AppVisibilityProvider>
    </ErrorBoundary>
  )
}
