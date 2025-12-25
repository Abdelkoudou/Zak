// ============================================================================
// Forgot Password Screen - Premium Animations
// ============================================================================

import { useState, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native'
import { Link, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { FadeInView, LoadingSpinner } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { BRAND_THEME } from '@/constants/theme'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Animation values
  const successScale = useRef(new Animated.Value(0)).current
  const successRotate = useRef(new Animated.Value(0)).current
  const buttonScale = useRef(new Animated.Value(1)).current

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email')
      return
    }

    setError(null)
    setIsLoading(true)
    
    const { error: resetError } = await resetPassword(email.trim())
    
    setIsLoading(false)
    
    if (resetError) {
      setError(resetError)
    } else {
      setSuccess(true)
      // Animate success state
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(successRotate, {
          toValue: 1,
          duration: 600,
          easing: ANIMATION_EASING.premium,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const handleButtonPressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start()
  }

  if (success) {
    const spin = successRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
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
            <Text style={{ fontSize: 40 }}>✉️</Text>
          </Animated.View>
          
          <FadeInView animation="slideUp" delay={300}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              textAlign: 'center',
              marginBottom: 8
            }}>
              Email envoyé !
            </Text>
          </FadeInView>
          
          <FadeInView animation="slideUp" delay={400}>
            <Text style={{
              color: BRAND_THEME.colors.gray[500],
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 22
            }}>
              Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
            </Text>
          </FadeInView>

          <FadeInView animation="slideUp" delay={500}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={{
                backgroundColor: BRAND_THEME.colors.primary[500],
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 12,
                ...BRAND_THEME.shadows.md
              }}>
                <Text style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: 16
                }}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </Link>
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
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
          {/* Header */}
          <FadeInView animation="slideUp" delay={0}>
            <View style={{ marginBottom: 32 }}>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ChevronLeftIcon size={20} color={BRAND_THEME.colors.primary[500]} strokeWidth={2.5} />
                    <Text style={{ color: BRAND_THEME.colors.primary[500], fontSize: 16, marginLeft: 4 }}>Retour</Text>
                  </View>
                </TouchableOpacity>
              </Link>
              
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 8
              }}>
                Mot de passe oublié
              </Text>
              <Text style={{ color: BRAND_THEME.colors.gray[500], lineHeight: 22 }}>
                Entrez votre email pour recevoir un lien de réinitialisation
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
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                color: BRAND_THEME.colors.gray[700],
                fontWeight: '500',
                marginBottom: 8
              }}>
                Email
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
                placeholder="votre@email.com"
                placeholderTextColor={BRAND_THEME.colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </FadeInView>

          {/* Submit Button */}
          <FadeInView animation="slideUp" delay={200}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={{
                  backgroundColor: isLoading 
                    ? BRAND_THEME.colors.primary[300] 
                    : BRAND_THEME.colors.primary[500],
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  ...BRAND_THEME.shadows.md
                }}
                onPress={handleResetPassword}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isLoading}
                activeOpacity={1}
              >
                {isLoading ? (
                  <LoadingSpinner size="small" color="#ffffff" />
                ) : (
                  <Text style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: 16
                  }}>
                    Envoyer le lien
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </FadeInView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
