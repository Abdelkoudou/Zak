// ============================================================================
// Auth Callback - Handles deep link from email verification
// ============================================================================

import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { BRAND_THEME } from '@/constants/theme'
import { AnimatedButton, FadeInView } from '@/components/ui'

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const params = useLocalSearchParams()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // Get the URL hash parameters (Supabase sends tokens in URL fragment)
      const accessToken = params.access_token as string
      const refreshToken = params.refresh_token as string
      const type = params.type as string

      // If we have tokens in the URL, set the session
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setStatus('error')
          setMessage(error.message)
          return
        }

        // Check what type of callback this is
        if (type === 'recovery') {
          // Password reset - redirect to password change screen
          setStatus('success')
          setMessage('Vous pouvez maintenant changer votre mot de passe.')
          setTimeout(() => {
            router.replace('/(auth)/change-password')
          }, 1500)
          return
        }

        // Email verification success
        setStatus('success')
        setMessage('Email vérifié avec succès ! Redirection...')
        setTimeout(() => {
          router.replace('/(tabs)')
        }, 1500)
        return
      }

      // Try to get session from URL (Supabase might handle it automatically)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }

      if (session) {
        setStatus('success')
        setMessage('Connexion réussie ! Redirection...')
        setTimeout(() => {
          router.replace('/(tabs)')
        }, 1500)
      } else {
        // No session found, redirect to login
        setStatus('success')
        setMessage('Email vérifié ! Veuillez vous connecter.')
        setTimeout(() => {
          router.replace('/(auth)/login')
        }, 2000)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Une erreur est survenue lors de la vérification.')
    }
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
            <View style={{ alignItems: 'center', width: '100%' }}>
              <View style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                borderRadius: 50, 
                padding: 24, 
                marginBottom: 24 
              }}>
                <Text style={{ fontSize: 56 }}>❌</Text>
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 12,
                textAlign: 'center'
              }}>
                Erreur
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center',
                marginBottom: 32
              }}>
                {message}
              </Text>
              <AnimatedButton 
                title="Retour à la connexion"
                onPress={() => router.replace('/(auth)/login')}
                variant="primary"
                size="lg"
              />
            </View>
          </FadeInView>
        )}
      </View>
    </SafeAreaView>
  )
}
