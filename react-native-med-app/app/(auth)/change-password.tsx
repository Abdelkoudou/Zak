// ============================================================================
// Change Password Screen - For password reset flow
// ============================================================================

import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { FadeInView, AnimatedButton, PasswordStrengthIndicator } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { BRAND_THEME } from '@/constants/theme'
import { USE_NATIVE_DRIVER } from '@/lib/animations'
import { validatePassword, validatePasswordMatch } from '@/lib/validation'

// Countdown duration in seconds
const REDIRECT_COUNTDOWN = 8

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN)

  // Animation values
  const successScale = useRef(new Animated.Value(0)).current
  const successRotate = useRef(new Animated.Value(0)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  // Countdown effect when success
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      router.replace('/(auth)/login')
    }
  }, [success, countdown])

  // Progress bar animation when success
  useEffect(() => {
    if (success) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: REDIRECT_COUNTDOWN * 1000,
        useNativeDriver: false,
      }).start()
    }
  }, [success])

  const handleChangePassword = async () => {
    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error)
      return
    }

    // Validate password match
    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.isValid) {
      setError(matchValidation.error)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      console.log('[ChangePassword] Updating password...')
      
      // Add timeout to prevent endless loading
      const updatePromise = supabase.auth.updateUser({
        password: password,
      })
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('La mise à jour a pris trop de temps. Veuillez réessayer.')), 15000)
      })
      
      const { error: updateError } = await Promise.race([updatePromise, timeoutPromise])

      if (updateError) {
        console.error('[ChangePassword] Update error:', updateError.message)
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      console.log('[ChangePassword] Password updated successfully!')
      
      // Sign out after password change to clear the recovery session
      console.log('[ChangePassword] Signing out...')
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ])
      } catch (signOutError) {
        console.warn('[ChangePassword] Sign out warning:', signOutError)
      }

      console.log('[ChangePassword] Showing success with countdown')
      setIsLoading(false)
      setSuccess(true)
      
      // Animate success state
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(successRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start()

    } catch (err: any) {
      console.error('[ChangePassword] Unexpected error:', err)
      setError(err?.message || 'Une erreur est survenue. Veuillez réessayer.')
      setIsLoading(false)
    }
  }

  if (success) {
    const spin = successRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    })

    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    })

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            transform: [{ scale: successScale }, { rotate: spin }],
            width: 80,
            height: 80,
            backgroundColor: BRAND_THEME.colors.success[100],
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </Animated.View>
          
          <FadeInView animation="slideUp" delay={300}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              textAlign: 'center',
              marginBottom: 8
            }}>
              Mot de passe modifié !
            </Text>
          </FadeInView>
          
          <FadeInView animation="slideUp" delay={400}>
            <Text style={{
              color: BRAND_THEME.colors.gray[500],
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22
            }}>
              Votre mot de passe a été mis à jour avec succès.
            </Text>
          </FadeInView>

          {/* Progress bar and countdown */}
          <FadeInView animation="slideUp" delay={500}>
            <View style={{ width: '100%', maxWidth: 300, alignItems: 'center' }}>
              {/* Countdown text */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: 16,
                backgroundColor: BRAND_THEME.colors.primary[50],
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
              }}>
                <ActivityIndicator size="small" color={BRAND_THEME.colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={{ 
                  color: BRAND_THEME.colors.primary[600], 
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Redirection dans {countdown}s...
                </Text>
              </View>

              {/* Progress bar */}
              <View style={{
                width: '100%',
                height: 6,
                backgroundColor: BRAND_THEME.colors.gray[200],
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <Animated.View style={{
                  height: '100%',
                  backgroundColor: BRAND_THEME.colors.primary[500],
                  borderRadius: 3,
                  width: progressWidth,
                }} />
              </View>

              {/* Skip button */}
              <TouchableOpacity 
                style={{ marginTop: 24, paddingVertical: 12 }}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={{ 
                  color: BRAND_THEME.colors.gray[500], 
                  fontSize: 14,
                  textDecorationLine: 'underline',
                }}>
                  Aller à la connexion maintenant
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ minHeight: '100%', paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
            {/* Header */}
            <FadeInView animation="slideUp" delay={0}>
              <View style={{ marginBottom: 32 }}>
                <TouchableOpacity 
                  style={{ marginBottom: 24 }}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ChevronLeftIcon size={20} color={BRAND_THEME.colors.primary[500]} strokeWidth={2.5} />
                    <Text style={{ color: BRAND_THEME.colors.primary[500], fontSize: 16, marginLeft: 4 }}>Retour</Text>
                  </View>
                </TouchableOpacity>
                
                <Text style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 8
                }}>
                  Nouveau mot de passe
                </Text>
                <Text style={{ color: BRAND_THEME.colors.gray[500], lineHeight: 22 }}>
                  Entrez votre nouveau mot de passe
                </Text>
              </View>
            </FadeInView>

            {/* Error Message */}
            {error && (
              <FadeInView animation="scale" delay={0} replayOnFocus={false}>
                <View style={{
                  backgroundColor: BRAND_THEME.colors.error[50],
                  borderWidth: 1,
                  borderColor: BRAND_THEME.colors.error[100],
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24
                }}>
                  <Text style={{ color: BRAND_THEME.colors.error[600] }}>{error}</Text>
                </View>
              </FadeInView>
            )}

            {/* Form */}
            <FadeInView animation="slideUp" delay={100}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: BRAND_THEME.colors.gray[700],
                  fontWeight: '500',
                  marginBottom: 8
                }}>
                  Nouveau mot de passe
                </Text>
                <TextInput
                  style={{
                    backgroundColor: BRAND_THEME.colors.gray[50],
                    borderWidth: 1,
                    borderColor: BRAND_THEME.colors.gray[200],
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: BRAND_THEME.colors.gray[900],
                    fontSize: 16
                  }}
                  placeholder="Minimum 8 caractères"
                  placeholderTextColor={BRAND_THEME.colors.gray[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <PasswordStrengthIndicator password={password} />
              </View>
            </FadeInView>

            <FadeInView animation="slideUp" delay={150}>
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: BRAND_THEME.colors.gray[700],
                  fontWeight: '500',
                  marginBottom: 8
                }}>
                  Confirmer le mot de passe
                </Text>
                <TextInput
                  style={{
                    backgroundColor: BRAND_THEME.colors.gray[50],
                    borderWidth: 1,
                    borderColor: BRAND_THEME.colors.gray[200],
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: BRAND_THEME.colors.gray[900],
                    fontSize: 16
                  }}
                  placeholder="Répétez le mot de passe"
                  placeholderTextColor={BRAND_THEME.colors.gray[400]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>
            </FadeInView>

            {/* Submit Button */}
            <FadeInView animation="slideUp" delay={200}>
              <AnimatedButton
                title="Changer le mot de passe"
                onPress={handleChangePassword}
                loading={isLoading}
                variant="primary"
                size="lg"
              />
            </FadeInView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
