// ============================================================================
// Login Screen
// ============================================================================

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'

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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="mb-8">
              <Link href="/(auth)/welcome" asChild>
                <TouchableOpacity className="mb-6">
                  <Text className="text-primary-500 text-lg">← Retour</Text>
                </TouchableOpacity>
              </Link>
              
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Connexion
              </Text>
              <Text className="text-gray-500">
                Connectez-vous à votre compte
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <Text className="text-red-600">{error}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-4 mb-6">
              {/* Email */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Email</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Mot de passe</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
            </View>

            {/* Forgot Password */}
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity className="mb-8">
                <Text className="text-primary-500 text-center">
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Login Button */}
            <TouchableOpacity 
              className={`py-4 rounded-xl mb-4 ${isLoading ? 'bg-primary-300' : 'bg-primary-500'}`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Se connecter
                </Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center">
              <Text className="text-gray-500">Pas encore de compte ? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-500 font-semibold">S'inscrire</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
