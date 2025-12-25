// ============================================================================
// Login Screen - Premium UI with Responsive Design
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
  useWindowDimensions
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
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

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const formOpacity = useRef(new Animated.Value(0)).current
  const formSlide = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
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

  // Desktop Layout
  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#ffffff' }}>
        {/* Left Side - Branding */}
        <View style={{
          flex: 1,
          backgroundColor: '#09B2AD',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative Elements */}
          <View style={{ 
            position: 'absolute', 
            top: -80, 
            right: -80, 
            width: 300, 
            height: 300, 
            borderRadius: 150, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)' 
          }} />
          <View style={{ 
            position: 'absolute', 
            bottom: -100, 
            left: -100, 
            width: 400, 
            height: 400, 
            borderRadius: 200, 
            backgroundColor: 'rgba(255, 255, 255, 0.03)' 
          }} />

          <Animated.View style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            alignItems: 'center',
          }}>
            <View style={{
              width: 140,
              height: 140,
              borderRadius: 35,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              // @ts-ignore
              backdropFilter: isWeb ? 'blur(20px)' : undefined,
            }}>
              <Image 
                source={Logo}
                style={{ width: 100, height: 100, resizeMode: 'contain' }}
              />
            </View>
            
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -1,
            }}>
              FMC Study App
            </Text>
            
            <Text style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              lineHeight: 26,
              maxWidth: 350,
            }}>
              Votre compagnon pour réussir vos examens médicaux
            </Text>
          </Animated.View>

          {/* Testimonial */}
          <View style={{
            marginTop: 60,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 400,
            // @ts-ignore
            backdropFilter: isWeb ? 'blur(10px)' : undefined,
          }}>
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.9)',
              fontStyle: 'italic',
              lineHeight: 24,
              marginBottom: 16,
            }}>
              "Cette application m'a aidé à améliorer mes résultats de 30% en seulement 2 mois de pratique régulière."
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
            }}>
              — Étudiant en 2ème année
            </Text>
          </View>
        </View>

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
            maxWidth: 420,
          }}>
            {/* Back Button */}
            <TouchableOpacity 
              style={{ marginBottom: 32 }}
              onPress={() => router.back()}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
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
              fontSize: 32,
              fontWeight: '800',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 8,
              letterSpacing: -0.5,
            }}>
              Bon retour ! 👋
            </Text>
            <Text style={{
              fontSize: 16,
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
            <View style={{ marginBottom: 24 }}>
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
            </View>

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

            <AnimatedButton 
              title="Se connecter"
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              size="lg"
            />

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

  // Mobile/Tablet Layout
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
          <View style={{ 
            flex: 1, 
            paddingHorizontal: 24, 
            paddingVertical: 32, 
            maxWidth: isTablet ? 500 : '100%', 
            alignSelf: 'center', 
            width: '100%' 
          }}>
            {/* Back Button */}
            <TouchableOpacity 
              style={{ marginBottom: 24 }}
              onPress={() => router.back()}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: BRAND_THEME.colors.gray[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ChevronLeftIcon size={24} color={BRAND_THEME.colors.gray[600]} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Header with Logo */}
            <Animated.View style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              alignItems: 'center',
              marginBottom: 36,
            }}>
              <View style={{
                width: isTablet ? 100 : 80,
                height: isTablet ? 100 : 80,
                borderRadius: 24,
                backgroundColor: 'rgba(9, 178, 173, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                ...BRAND_THEME.shadows.md,
              }}>
                <Image 
                  source={Logo}
                  style={{ 
                    width: isTablet ? 70 : 56, 
                    height: isTablet ? 70 : 56, 
                    resizeMode: 'contain' 
                  }}
                />
              </View>
              
              <Text style={{
                fontSize: isTablet ? 32 : 28,
                fontWeight: '800',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 8,
                letterSpacing: -0.5,
              }}>
                Bon retour !
              </Text>
              <Text style={{
                fontSize: 16,
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center',
              }}>
                Connectez-vous pour continuer
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View style={{
              opacity: formOpacity,
              transform: [{ translateY: formSlide }],
            }}>
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

              <View style={{ marginBottom: 24 }}>
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
              </View>

              <TouchableOpacity 
                style={{ marginBottom: 32, alignSelf: 'center' }}
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

              <AnimatedButton 
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                size="lg"
              />

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
            </Animated.View>

            {/* Footer */}
            <View style={{ marginTop: 'auto', paddingTop: 32, alignItems: 'center' }}>
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
