// ============================================================================
// Auth Callback - Handles deep link from email verification and password reset
// ============================================================================

import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, Platform, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { BRAND_THEME } from '@/constants/theme'
import { AnimatedButton, FadeInView } from '@/components/ui'

// Error message translations
const ERROR_MESSAGES: Record<string, string> = {
  'otp_expired': 'Le lien a expiré. Les liens de réinitialisation sont valides pendant 1 heure.',
  'access_denied': 'Accès refusé. Le lien est invalide ou a expiré.',
  'invalid_request': 'Requête invalide. Veuillez réessayer.',
  'Email link is invalid or has expired': 'Le lien a expiré. Les liens de réinitialisation sont valides pendant 1 heure.',
}

function getErrorMessage(error: string, errorCode?: string): string {
  // Check error code first
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode]
  }
  // Check error message
  if (ERROR_MESSAGES[error]) {
    return ERROR_MESSAGES[error]
  }
  // Return decoded error or default message
  return decodeURIComponent(error.replace(/\+/g, ' ')) || 'Une erreur est survenue.'
}

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isExpiredLink, setIsExpiredLink] = useState(false)
  const params = useLocalSearchParams()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // Get parameters from URL - check both query params and hash fragments
      let accessToken = params.access_token as string
      let refreshToken = params.refresh_token as string
      let type = params.type as string
      let error = params.error as string
      let errorCode = params.error_code as string
      let errorDescription = params.error_description as string
      let code = params.code as string

      // On web, Supabase sends tokens in URL hash fragments or uses PKCE with code
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hash = window.location.hash
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1))
          accessToken = accessToken || hashParams.get('access_token') || ''
          refreshToken = refreshToken || hashParams.get('refresh_token') || ''
          type = type || hashParams.get('type') || ''
          error = error || hashParams.get('error') || ''
          errorCode = errorCode || hashParams.get('error_code') || ''
          errorDescription = errorDescription || hashParams.get('error_description') || ''
        }
        
        // Also check URL search params (PKCE flow uses query params)
        const searchParams = new URLSearchParams(window.location.search)
        accessToken = accessToken || searchParams.get('access_token') || ''
        refreshToken = refreshToken || searchParams.get('refresh_token') || ''
        type = type || searchParams.get('type') || ''
        error = error || searchParams.get('error') || ''
        errorCode = errorCode || searchParams.get('error_code') || ''
        errorDescription = errorDescription || searchParams.get('error_description') || ''
        code = code || searchParams.get('code') || ''
      }

      // Check for error in URL
      if (error || errorDescription || errorCode) {
        const isExpired = errorCode === 'otp_expired' || 
                          errorDescription?.includes('expired') || 
                          error === 'access_denied'
        setIsExpiredLink(isExpired)
        setStatus('error')
        setMessage(getErrorMessage(errorDescription || error || errorCode, errorCode))
        return
      }

      // If we have a code (PKCE flow), Supabase should have already exchanged it
      // We just need to check the session and determine the type
      if (code || accessToken) {
        // Wait a moment for Supabase to process the code exchange
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // If we have tokens directly in the URL, set the session manually
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          const isExpired = sessionError.message?.includes('expired')
          setIsExpiredLink(isExpired)
          setStatus('error')
          setMessage(getErrorMessage(sessionError.message))
          return
        }
      }

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setStatus('error')
        setMessage(getErrorMessage(sessionError.message))
        return
      }

      if (!session) {
        // No session - something went wrong
        setStatus('error')
        setMessage('Session non trouvée. Le lien a peut-être expiré.')
        setIsExpiredLink(true)
        return
      }

      // Determine if this is a password recovery flow
      const isRecovery = 
        type === 'recovery' || 
        type === 'password_recovery' ||
        // @ts-ignore - Check AMR claims for recovery
        session.user?.amr?.some((a: any) => a.method === 'recovery') ||
        (session.user?.recovery_sent_at && 
          new Date(session.user.recovery_sent_at).getTime() > Date.now() - 3600000)

      if (isRecovery) {
        setStatus('success')
        setMessage('Vous pouvez maintenant changer votre mot de passe.')
        setTimeout(() => {
          router.replace('/(auth)/change-password')
        }, 1000)
        return
      }

      // Email verification or regular sign-in success
      setStatus('success')
      setMessage('Connexion réussie ! Redirection...')
      setTimeout(() => {
        router.replace('/(tabs)')
      }, 1500)

    } catch (error: any) {
      console.error('Auth callback error:', error)
      setStatus('error')
      setMessage(error?.message || 'Une erreur est survenue lors de la vérification.')
    }
  }

  const handleResendLink = () => {
    router.replace('/(auth)/forgot-password')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 24 
      }}>
        {status === 'loading' && (
          <FadeInView animation="scale">
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#09B2AD" />
              <Text style={{ 
                marginTop: 24, 
                fontSize: 18, 
                color: BRAND_THEME.colors.gray[600],
                textAlign: 'center'
              }}>
                Vérification en cours...
              </Text>
            </View>
          </FadeInView>
        )}

        {status === 'success' && (
          <FadeInView animation="scale">
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: 'rgba(9, 178, 173, 0.1)', 
                borderRadius: 50, 
                padding: 24, 
                marginBottom: 24 
              }}>
                <Text style={{ fontSize: 56 }}>✅</Text>
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 12,
                textAlign: 'center'
              }}>
                Succès !
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center'
              }}>
                {message}
              </Text>
            </View>
          </FadeInView>
        )}

        {status === 'error' && (
          <FadeInView animation="scale">
            <View style={{ alignItems: 'center', width: '100%', maxWidth: 400 }}>
              <View style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                borderRadius: 50, 
                padding: 24, 
                marginBottom: 24 
              }}>
                <Text style={{ fontSize: 56 }}>⏰</Text>
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 12,
                textAlign: 'center'
              }}>
                {isExpiredLink ? 'Lien expiré' : 'Erreur'}
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 24,
              }}>
                {message}
              </Text>
              
              {isExpiredLink && (
                <View style={{ width: '100%', marginBottom: 16 }}>
                  <AnimatedButton 
                    title="🔄 Demander un nouveau lien"
                    onPress={handleResendLink}
                    variant="primary"
                    size="lg"
                  />
                </View>
              )}
              
              <TouchableOpacity 
                onPress={() => router.replace('/(auth)/login')}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ 
                  color: BRAND_THEME.colors.gray[500], 
                  fontSize: 15,
                  textDecorationLine: 'underline',
                }}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        )}
      </View>
    </SafeAreaView>
  )
}
