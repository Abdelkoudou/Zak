// ============================================================================
// Entry Point - Redirect based on auth state
// ============================================================================

import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Platform } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()
  const [isRecoveryFlow, setIsRecoveryFlow] = useState<boolean | null>(null)
  const [checkingRecovery, setCheckingRecovery] = useState(true)

  useEffect(() => {
    // Check if this is a password recovery flow
    const checkRecoveryFlow = async () => {
      try {
        // On web, check URL for recovery indicators
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash
          const search = window.location.search
          const fullUrl = hash + search
          
          // Check for recovery type in URL
          if (fullUrl.includes('type=recovery') || fullUrl.includes('type=password_recovery')) {
            setIsRecoveryFlow(true)
            setCheckingRecovery(false)
            return
          }
        }

        // Check session for recovery indicators
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Check AMR claims for recovery method
          // @ts-ignore
          const hasRecoveryAmr = session.user.amr?.some((a: any) => a.method === 'recovery')
          
          // Check if recovery was sent recently (within last hour)
          const recoverySentAt = session.user.recovery_sent_at
          const isRecentRecovery = recoverySentAt && 
            new Date(recoverySentAt).getTime() > Date.now() - 3600000

          if (hasRecoveryAmr || isRecentRecovery) {
            setIsRecoveryFlow(true)
            setCheckingRecovery(false)
            return
          }
        }

        setIsRecoveryFlow(false)
      } catch (error) {
        setIsRecoveryFlow(false)
      } finally {
        setCheckingRecovery(false)
      }
    }

    checkRecoveryFlow()
  }, [])

  // Show loading while checking auth state or recovery flow
  if (isLoading || checkingRecovery) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#09B2AD" />
      </View>
    )
  }

  // If this is a recovery flow, redirect to change password
  if (isRecoveryFlow) {
    return <Redirect href="/(auth)/change-password" />
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/welcome" />
}
