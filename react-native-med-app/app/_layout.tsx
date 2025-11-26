// ============================================================================
// Root Layout
// ============================================================================

import '../global.css'

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from '@/context/AuthContext'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await SplashScreen.hideAsync()
    }
    hideSplash()
  }, [])

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="module/[id]" options={{ headerShown: true, title: 'Module' }} />
        <Stack.Screen name="practice/[moduleId]" options={{ headerShown: true, title: 'Practice' }} />
        <Stack.Screen name="practice/results" options={{ headerShown: true, title: 'Results' }} />
        <Stack.Screen name="saved/index" options={{ headerShown: true, title: 'Saved Questions' }} />
      </Stack>
    </AuthProvider>
  )
}
