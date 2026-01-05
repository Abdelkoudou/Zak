// ============================================================================
// Login Screen - Stunning Premium UI with Jaw-Dropping Animations
// ============================================================================

import { useState, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Image,
  useWindowDimensions,
  Animated,
} from 'react-native'
import { router, useNavigation, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/AuthContext'
import { Input, Alert as UIAlert, AnimatedButton, FadeInView } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { BRAND_THEME } from '@/constants/theme'
import { validateEmail } from '@/lib/validation'
import {
  PREMIUM_TIMING,
  PREMIUM_EASING,
  PREMIUM_SPRING,
  USE_NATIVE_DRIVER,
  createFloatingAnimation,
  createGlowPulse,
} from '@/lib/premiumAnimations'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logo = require('../../assets/icon.png')

// Helper to parse URL errors (for password reset redirects)
function parseUrlErrors(): { error: string | null; errorCode: string | null; isPasswordResetError: boolean } {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { error: null, errorCode: null, isPasswordResetError: false }
  }

  try {
    const hash = window.location.hash
    const search = window.location.search
    
    // Parse hash parameters
    let errorDescription = ''
    let errorCode = ''
    
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1))
      errorDescription = hashParams.get('error_description') || ''
      errorCode = hashParams.get('error_code') || ''
    }
    
    // Also check query params
    if (search) {
      const searchParams = new URLSearchParams(search)
      errorDescription = errorDescription || searchParams.get('error_description') || ''
      errorCode = errorCode || searchParams.get('error_code') || ''
    }
    
    if (errorDescription) {
      // Decode and translate common errors
      const decodedError = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      
      // Map error codes to French messages
      const errorMessages: Record<string, string> = {
        'otp_expired': 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.',
        'access_denied': 'Accès refusé. Le lien est invalide ou a expiré.',
      }
      
      const friendlyMessage = errorMessages[errorCode] || decodedError
      const isPasswordResetError = errorCode === 'otp_expired' || errorDescription.includes('expired')
      
      // Clear the URL hash/params after reading
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      
      return { error: friendlyMessage, errorCode, isPasswordResetError }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return { error: null, errorCode: null, isPasswordResetError: false }
}

export default function LoginScreen() {
  const { signIn, resetPassword, isLoading } = useAuth()
  const { width } = useWindowDimensions()
  const navigation = useNavigation()
  const params = useLocalSearchParams()
  
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back()
    } else {
      router.replace('/(auth)/welcome')
    }
  }
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showResendLink, setShowResendLink] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Check for URL errors on mount (password reset errors)
  useEffect(() => {
    const { error: urlError, isPasswordResetError } = parseUrlErrors()
    if (urlError) {
      setError(urlError)
      setShowResendLink(isPasswordResetError)
    }
  }, [])

  // ========== Premium Animation Values ==========
  // Logo animations
  const logoScale = useRef(new Animated.Value(0.3)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  
  // Header animations
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(30)).current
  
  // Welcome card animations
  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardSlide = useRef(new Animated.Value(50)).current
  const cardScale = useRef(new Animated.Value(0.9)).current
  
  // Input animations (staggered)
  const input1Opacity = useRef(new Animated.Value(0)).current
  const input1Slide = useRef(new Animated.Value(30)).current
  
  const input2Opacity = useRef(new Animated.Value(0)).current
  const input2Slide = useRef(new Animated.Value(30)).current
  
  // Forgot password link
  const forgotOpacity = useRef(new Animated.Value(0)).current
  
  // Button animations
  const buttonOpacity = useRef(new Animated.Value(0)).current
  const buttonSlide = useRef(new Animated.Value(40)).current
  const buttonScale = useRef(new Animated.Value(0.9)).current
  
  // Footer animation
  const footerOpacity = useRef(new Animated.Value(0)).current
  
  // Ambient animations
  const floatingY1 = useRef(new Animated.Value(0)).current
  const floatingY2 = useRef(new Animated.Value(0)).current
  const glowPulse = useRef(new Animated.Value(0.2)).current
  const breathingScale = useRef(new Animated.Value(1)).current

  // ========== Ambient Animations ==========
  useEffect(() => {
    createFloatingAnimation(floatingY1, 10).start()
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY2, {
          toValue: -15,
          duration: PREMIUM_TIMING.ambient * 1.1,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(floatingY2, {
          toValue: 15,
          duration: PREMIUM_TIMING.ambient * 1.1,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start()

    createGlowPulse(glowPulse, 0.15, 0.45).start()
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.02,
          duration: PREMIUM_TIMING.ambient,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: PREMIUM_TIMING.ambient,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start()
  }, [])

  // ========== Entrance Animation Sequence ==========
  useEffect(() => {
    // Total animation duration: 1 second (1000ms)
    // 6 phases with ~160ms stagger = ~1000ms total
    const staggerDelay = 160
    
    // Phase 1: Logo (immediate)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        ...PREMIUM_SPRING.stiff,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 150,
        easing: PREMIUM_EASING.elegantOut,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 200,
        easing: PREMIUM_EASING.dramaticEntrance,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start()
    
    // Phase 2: Header (160ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(headerSlide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay)
    
    // Phase 3: Welcome card (320ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(cardSlide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(cardScale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 2)
    
    // Phase 4: Both inputs together (480ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(input1Opacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(input1Slide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(input2Opacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(input2Slide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 3)
    
    // Phase 5: Forgot + Button (640ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(forgotOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(buttonSlide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(buttonScale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 4)
    
    // Phase 6: Footer (800ms, completes ~1000ms)
    setTimeout(() => {
      Animated.timing(footerOpacity, { toValue: 1, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }).start()
    }, staggerDelay * 5)
  }, [])

  const handleLogin = async () => {
    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setError(emailValidation.error)
      return
    }
    
    // Validate password is not empty
    if (!password) {
      setError('Veuillez entrer votre mot de passe')
      return
    }

    setError(null)
    setShowResendLink(false)
    
    console.log('[Login] Starting login...')
    const { error: loginError } = await signIn(email.trim().toLowerCase(), password)
    console.log('[Login] Login result:', { hasError: !!loginError, error: loginError })
    
    if (loginError) {
      setError(loginError)
    } else {
      console.log('[Login] Success, redirecting to tabs...')
      router.replace('/(tabs)')
    }
  }

  const handleResendResetLink = async () => {
    if (!email) {
      setError('Veuillez entrer votre email pour recevoir un nouveau lien')
      return
    }
    
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setError(emailValidation.error)
      return
    }

    setIsResending(true)
    setError(null)
    
    const { error: resetError } = await resetPassword(email.trim().toLowerCase())
    
    setIsResending(false)
    
    if (resetError) {
      setError(resetError)
    } else {
      setResendSuccess(true)
      setShowResendLink(false)
      setError(null)
    }
  }

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '0deg'],
  })


  // ========== Desktop Layout ==========
  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#ffffff' }}>
        {/* Left Side - Premium Branding */}
        <LinearGradient
          colors={['#0D9488', '#09B2AD', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 60,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Static Decorative Elements (No Animation) */}
          <View style={{ 
            position: 'absolute', 
            top: -80, 
            right: -80, 
            width: 300, 
            height: 300, 
            borderRadius: 150, 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }} />
          <View style={{ 
            position: 'absolute', 
            bottom: -100, 
            left: -100, 
            width: 400, 
            height: 400, 
            borderRadius: 200, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }} />
          <View style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '5%', 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          }} />

          <View style={{
            alignItems: 'center',
          }}>
            {/* Static Logo Container (More Rounded) */}
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 55, // Increased from 40 for more rounded appearance
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 36,
              // @ts-ignore
              backdropFilter: isWeb ? 'blur(25px)' : undefined,
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 30,
            }}>
              <Image 
                source={Logo}
                style={{ width: 110, height: 110, resizeMode: 'contain' }}
              />
            </View>
            
            <View style={{
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 48,
                fontWeight: '900',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 8,
                letterSpacing: -2,
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 4 },
                textShadowRadius: 12,
              }}>
                FMC APP
              </Text>
              
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 16,
                marginBottom: 12,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#ffffff',
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}>
                  Premium Medical Learning
                </Text>
              </View>
              
              <Text style={{
                fontSize: 18,
                color: 'rgba(255, 255, 255, 0.85)',
                textAlign: 'center',
                lineHeight: 28,
                maxWidth: 360,
              }}>
                Votre compagnon pour réussir vos examens médicaux
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Right Side - Form */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
        }}>
          <View style={{ width: '100%', maxWidth: 440 }}>
            {/* Back Button */}
            <TouchableOpacity 
              style={{ marginBottom: 36 }}
              onPress={handleGoBack}
            >
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: BRAND_THEME.colors.gray[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ChevronLeftIcon size={24} color={BRAND_THEME.colors.gray[600]} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <View>
              <Text style={{
                fontSize: 38,
                fontWeight: '900',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 8,
                letterSpacing: -1,
              }}>
                Bon retour ! 👋
              </Text>
              <Text style={{
                fontSize: 17,
                color: BRAND_THEME.colors.gray[500],
                marginBottom: 40,
              }}>
                Connectez-vous pour continuer votre apprentissage
              </Text>
            </View>

            {/* Success Message for Resend */}
            {resendSuccess && (
              <FadeInView animation="scale">
                <View style={{
                  backgroundColor: 'rgba(9, 178, 173, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(9, 178, 173, 0.3)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                }}>
                  <Text style={{ color: '#09B2AD', fontSize: 15, fontWeight: '600' }}>
                    ✅ Un nouveau lien a été envoyé à votre email !
                  </Text>
                </View>
              </FadeInView>
            )}

            {/* Error */}
            {error && (
              <FadeInView animation="scale">
                <View style={{ marginBottom: 24 }}>
                  <UIAlert 
                    variant="error"
                    message={error}
                    onClose={() => { setError(null); setShowResendLink(false); }}
                  />
                  {showResendLink && (
                    <TouchableOpacity 
                      style={{ 
                        marginTop: 12, 
                        backgroundColor: 'rgba(9, 178, 173, 0.1)',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                      onPress={handleResendResetLink}
                      disabled={isResending}
                    >
                      <Text style={{ color: '#09B2AD', fontWeight: '600', fontSize: 14 }}>
                        {isResending ? 'Envoi en cours...' : '🔄 Renvoyer un nouveau lien'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </FadeInView>
            )}

            {/* Form */}
            <View style={{ marginBottom: 20 }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Text style={{ fontSize: 18 }}>📧</Text>}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
              />
            </View>

            <View>
              <TouchableOpacity 
                style={{ marginBottom: 32, alignSelf: 'flex-start' }}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={{
                  color: '#09B2AD',
                  fontSize: 15,
                  fontWeight: '600',
                }}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>

            <View>
              <AnimatedButton 
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                size="lg"
              />
            </View>

            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 32,
            }}>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 15 }}>
                Pas encore de compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{
                  color: '#09B2AD',
                  fontWeight: '700',
                  fontSize: 15,
                }}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // ========== Mobile/Tablet Layout ==========
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
          {/* Top Gradient Header */}
          <LinearGradient
            colors={['#0D9488', '#09B2AD', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: 20,
              paddingBottom: 50,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 36,
              borderBottomRightRadius: 36,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Animated Decorative Circles */}
            <Animated.View style={{ 
              position: 'absolute', 
              top: -40, 
              right: -40, 
              width: 150, 
              height: 150, 
              borderRadius: 75, 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              transform: [{ translateY: floatingY1 }],
            }} />
            <Animated.View style={{ 
              position: 'absolute', 
              bottom: -20, 
              left: -20, 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              opacity: glowPulse,
            }} />

            {/* Back Button */}
            <TouchableOpacity 
              style={{ marginBottom: 20 }}
              onPress={handleGoBack}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ChevronLeftIcon size={22} color="#ffffff" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Logo */}
            <Animated.View style={{
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, breathingScale) },
                { rotate: logoSpin }
              ],
              alignItems: 'center',
            }}>
              <View style={{
                width: isTablet ? 90 : 75,
                height: isTablet ? 90 : 75,
                borderRadius: isTablet ? 32 : 26, // Increased from 22 for more rounded appearance
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#ffffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}>
                <Image 
                  source={Logo}
                  style={{ 
                    width: isTablet ? 60 : 50, 
                    height: isTablet ? 60 : 50, 
                    resizeMode: 'contain' 
                  }}
                />
              </View>
              
              <Animated.View style={{
                opacity: headerOpacity,
                transform: [{ translateY: headerSlide }],
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: isTablet ? 36 : 30,
                  fontWeight: '900',
                  color: '#ffffff',
                  marginBottom: 4,
                  letterSpacing: -1,
                  textShadowColor: 'rgba(0, 0, 0, 0.15)',
                  textShadowOffset: { width: 0, height: 3 },
                  textShadowRadius: 10,
                }}>
                  FMC APP
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '600',
                }}>
                  Connexion à votre compte
                </Text>
              </Animated.View>
            </Animated.View>
          </LinearGradient>

          {/* Form Section */}
          <View style={{ 
            paddingHorizontal: 24, 
            paddingTop: 32,
            paddingBottom: 32, 
            maxWidth: isTablet ? 500 : '100%', 
            alignSelf: 'center', 
            width: '100%',
            marginTop: -24,
          }}>
            {/* Welcome Card */}
            <Animated.View style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardSlide }, { scale: cardScale }],
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              ...BRAND_THEME.shadows.lg,
              borderWidth: 1,
              borderColor: 'rgba(9, 178, 173, 0.1)',
            }}>
              <Text style={{
                fontSize: isTablet ? 28 : 24,
                fontWeight: '800',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 6,
                letterSpacing: -0.5,
              }}>
                Bon retour ! 👋
              </Text>
              <Text style={{
                fontSize: 15,
                color: BRAND_THEME.colors.gray[500],
              }}>
                Connectez-vous pour continuer
              </Text>
            </Animated.View>

            {/* Success Message for Resend */}
            {resendSuccess && (
              <FadeInView animation="scale">
                <View style={{
                  backgroundColor: 'rgba(9, 178, 173, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(9, 178, 173, 0.3)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                }}>
                  <Text style={{ color: '#09B2AD', fontSize: 15, fontWeight: '600' }}>
                    ✅ Un nouveau lien a été envoyé à votre email !
                  </Text>
                </View>
              </FadeInView>
            )}

            {/* Error */}
            {error && (
              <FadeInView animation="scale">
                <View style={{ marginBottom: 24 }}>
                  <UIAlert 
                    variant="error"
                    message={error}
                    onClose={() => { setError(null); setShowResendLink(false); }}
                  />
                  {showResendLink && (
                    <TouchableOpacity 
                      style={{ 
                        marginTop: 12, 
                        backgroundColor: 'rgba(9, 178, 173, 0.1)',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                      onPress={handleResendResetLink}
                      disabled={isResending}
                    >
                      <Text style={{ color: '#09B2AD', fontWeight: '600', fontSize: 14 }}>
                        {isResending ? 'Envoi en cours...' : '🔄 Renvoyer un nouveau lien'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </FadeInView>
            )}

            {/* Form Inputs */}
            <Animated.View style={{
              opacity: input1Opacity,
              transform: [{ translateY: input1Slide }],
              marginBottom: 16,
            }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Text style={{ fontSize: 18 }}>📧</Text>}
              />
            </Animated.View>

            <Animated.View style={{
              opacity: input2Opacity,
              transform: [{ translateY: input2Slide }],
              marginBottom: 24,
            }}>
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
              />
            </Animated.View>

            <Animated.View style={{ opacity: forgotOpacity }}>
              <TouchableOpacity 
                style={{ marginBottom: 28, alignSelf: 'center' }}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={{
                  color: '#09B2AD',
                  fontSize: 15,
                  fontWeight: '600',
                }}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{
              opacity: buttonOpacity,
              transform: [{ translateY: buttonSlide }, { scale: buttonScale }],
            }}>
              <AnimatedButton 
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                size="lg"
              />
            </Animated.View>

            <Animated.View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 24,
              opacity: footerOpacity,
            }}>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 15 }}>
                Pas encore de compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{
                  color: '#09B2AD',
                  fontWeight: '700',
                  fontSize: 15,
                }}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={{ paddingTop: 24, alignItems: 'center' }}>
              <Text style={{
                fontSize: 13,
                color: BRAND_THEME.colors.gray[400],
                textAlign: 'center',
              }}>
                🔒 Connexion sécurisée
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
