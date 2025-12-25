// ============================================================================
// Login Screen - Ultra Premium UI with Smooth Animations
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
  Animated,
  Easing,
  useWindowDimensions
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/AuthContext'
import { Input, Alert as UIAlert, AnimatedButton, FadeInView } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { BRAND_THEME } from '@/constants/theme'

const Logo = require('@/assets/images/logo.png')

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth()
  const { width } = useWindowDimensions()
  
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Premium Animations
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const formOpacity = useRef(new Animated.Value(0)).current
  const formSlide = useRef(new Animated.Value(50)).current
  const inputsOpacity = useRef(new Animated.Value(0)).current
  const inputsSlide = useRef(new Animated.Value(30)).current
  const buttonOpacity = useRef(new Animated.Value(0)).current
  const buttonSlide = useRef(new Animated.Value(40)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const floatingY = useRef(new Animated.Value(0)).current

  // Floating animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY, {
          toValue: -12,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.7,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    // Premium entrance sequence
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      // Form header
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // Inputs
      Animated.parallel([
        Animated.timing(inputsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(inputsSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      // Button
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(buttonSlide, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email')
      return
    }
    if (!password) {
      setError('Veuillez entrer votre mot de passe')
      return
    }

    setError(null)
    const { error: loginError } = await signIn(email.trim(), password)
    
    if (loginError) {
      setError(loginError)
    } else {
      router.replace('/(tabs)')
    }
  }

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '0deg'],
  })

  // Desktop Layout
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
          {/* Animated Decorative Elements */}
          <Animated.View style={{ 
            position: 'absolute', 
            top: -80, 
            right: -80, 
            width: 300, 
            height: 300, 
            borderRadius: 150, 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: [{ translateY: floatingY }],
          }} />
          <Animated.View style={{ 
            position: 'absolute', 
            bottom: -100, 
            left: -100, 
            width: 400, 
            height: 400, 
            borderRadius: 200, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            opacity: glowPulse,
          }} />
          <Animated.View style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '5%', 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            transform: [{ translateY: Animated.multiply(floatingY, -0.7) }],
          }} />

          <Animated.View style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { rotate: logoSpin }],
            alignItems: 'center',
          }}>
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 36,
              // @ts-ignore
              backdropFilter: isWeb ? 'blur(25px)' : undefined,
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 25,
            }}>
              <Image 
                source={Logo}
                style={{ width: 110, height: 110, resizeMode: 'contain' }}
              />
            </View>
            
            <Text style={{
              fontSize: 48,
              fontWeight: '900',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 8,
              letterSpacing: -2,
              textShadowColor: 'rgba(0, 0, 0, 0.1)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 10,
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
          </Animated.View>

          {/* Testimonial Card */}
          <Animated.View style={{
            marginTop: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: 24,
            padding: 28,
            maxWidth: 420,
            // @ts-ignore
            backdropFilter: isWeb ? 'blur(15px)' : undefined,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            opacity: formOpacity,
          }}>
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.95)',
              fontStyle: 'italic',
              lineHeight: 26,
              marginBottom: 18,
            }}>
              "Cette application m'a aidé à améliorer mes résultats de 30% en seulement 2 mois de pratique régulière."
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 18 }}>👨‍⚕️</Text>
              </View>
              <View>
                <Text style={{
                  fontSize: 14,
                  color: '#ffffff',
                  fontWeight: '700',
                }}>
                  Étudiant en 2ème année
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.7)',
                }}>
                  Faculté de Médecine
                </Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Right Side - Form */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
        }}>
          <Animated.View style={{
            opacity: formOpacity,
            transform: [{ translateY: formSlide }],
            width: '100%',
            maxWidth: 440,
          }}>
            {/* Back Button */}
            <TouchableOpacity 
              style={{ marginBottom: 36 }}
              onPress={() => router.back()}
            >
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: BRAND_THEME.colors.gray[100],
                alignItems: 'center',
                justifyContent: 'center',
                // @ts-ignore
                ...(isWeb && { cursor: 'pointer', transition: 'all 0.2s ease' }),
              }}>
                <ChevronLeftIcon size={24} color={BRAND_THEME.colors.gray[600]} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

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

            {/* Error */}
            {error && (
              <FadeInView animation="scale">
                <UIAlert 
                  variant="error"
                  message={error}
                  onClose={() => setError(null)}
                  style={{ marginBottom: 24 }}
                />
              </FadeInView>
            )}

            {/* Form */}
            <Animated.View style={{ 
              marginBottom: 24,
              opacity: inputsOpacity,
              transform: [{ translateY: inputsSlide }],
            }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Text style={{ fontSize: 18 }}>📧</Text>}
                style={{ marginBottom: 20 }}
              />

              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
              />
            </Animated.View>

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

            <Animated.View style={{
              opacity: buttonOpacity,
              transform: [{ translateY: buttonSlide }],
            }}>
              <AnimatedButton 
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                size="lg"
              />
            </Animated.View>

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
          </Animated.View>
        </View>
      </View>
    )
  }

  // Mobile/Tablet Layout - Premium Design
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              transform: [{ translateY: floatingY }],
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
              onPress={() => router.back()}
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
              transform: [{ scale: logoScale }],
              alignItems: 'center',
            }}>
              <View style={{
                width: isTablet ? 90 : 75,
                height: isTablet ? 90 : 75,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#ffffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 15,
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
              
              <Text style={{
                fontSize: isTablet ? 36 : 30,
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: 4,
                letterSpacing: -1,
                textShadowColor: 'rgba(0, 0, 0, 0.1)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
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
          </LinearGradient>

          {/* Form Section */}
          <View style={{ 
            flex: 1, 
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
              opacity: formOpacity,
              transform: [{ translateY: formSlide }],
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

            {/* Error */}
            {error && (
              <FadeInView animation="scale">
                <UIAlert 
                  variant="error"
                  message={error}
                  onClose={() => setError(null)}
                  style={{ marginBottom: 24 }}
                />
              </FadeInView>
            )}

            {/* Form Inputs */}
            <Animated.View style={{
              opacity: inputsOpacity,
              transform: [{ translateY: inputsSlide }],
              marginBottom: 24,
            }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Text style={{ fontSize: 18 }}>📧</Text>}
                style={{ marginBottom: 16 }}
              />

              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
              />
            </Animated.View>

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

            <Animated.View style={{
              opacity: buttonOpacity,
              transform: [{ translateY: buttonSlide }],
            }}>
              <AnimatedButton 
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                size="lg"
              />
            </Animated.View>

            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 24,
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

            {/* Footer */}
            <View style={{ marginTop: 'auto', paddingTop: 24, alignItems: 'center' }}>
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
