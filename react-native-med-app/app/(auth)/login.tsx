// ============================================================================
// Login Screen - Light Sea Green Brand
// ============================================================================

import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { Button, Input, Alert } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    // Validation
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
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
            {/* Header */}
            <View style={{ marginBottom: 32 }}>
              <TouchableOpacity 
                style={{ marginBottom: 24 }}
                onPress={() => router.back()}
              >
                <Text style={{ 
                  color: BRAND_THEME.colors.primary[600], 
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  ← Retour
                </Text>
              </TouchableOpacity>
              
              {/* Brand Logo */}
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: BRAND_THEME.colors.primary[500],
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                ...BRAND_THEME.shadows.md
              }}>
                <Text style={{ color: '#ffffff', fontSize: 28 }}>🩺</Text>
              </View>
              
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 8
              }}>
                Bon retour !
              </Text>
              <Text style={{
                fontSize: 16,
                color: BRAND_THEME.colors.gray[600]
              }}>
                Connectez-vous à votre compte pour continuer
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <Alert 
                variant="error"
                message={error}
                onClose={() => setError(null)}
                style={{ marginBottom: 24 }}
              />
            )}

            {/* Form */}
            <View style={{ marginBottom: 24 }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Text style={{ color: BRAND_THEME.colors.gray[500] }}>📧</Text>}
                style={{ marginBottom: 16 }}
              />

              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Text style={{ color: BRAND_THEME.colors.gray[500] }}>🔒</Text>}
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={{ marginBottom: 32 }}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={{
                color: BRAND_THEME.colors.primary[600],
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '500'
              }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button 
              title="Se connecter"
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              size="lg"
              style={{ marginBottom: 16 }}
            />

            {/* Register Link */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ color: BRAND_THEME.colors.gray[600] }}>
                Pas encore de compte ? 
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{
                  color: BRAND_THEME.colors.primary[600],
                  fontWeight: '600',
                  marginLeft: 4
                }}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ 
              marginTop: 'auto',
              paddingTop: 32,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 14,
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center'
              }}>
                Plateforme sécurisée pour étudiants en médecine
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
