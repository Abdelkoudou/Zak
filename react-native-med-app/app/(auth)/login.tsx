// ============================================================================
// Login Screen - Premium UI with Smooth Animations
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
  Animated 
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
          <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32, maxWidth: 500, alignSelf: 'center', width: '100%' }}>
            {/* Back Button */}
            <TouchableOpacity 
              style={{ marginBottom: 24 }}
              onPress={() => router.back()}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
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
              marginBottom: 32,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: 'rgba(9, 178, 173, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <Image 
                  source={Logo}
                  style={{ width: 56, height: 56, resizeMode: 'contain' }}
                />
              </View>
              
              <Text style={{
                fontSize: 28,
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
              {/* Error Message */}
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

              {/* Input Fields */}
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

              {/* Forgot Password */}
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

              {/* Login Button */}
              <AnimatedButton 
                title="Se connecter"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                size="lg"
              />

              {/* Register Link */}
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
