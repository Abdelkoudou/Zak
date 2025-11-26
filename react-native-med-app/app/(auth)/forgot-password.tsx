// ============================================================================
// Forgot Password Screen
// ============================================================================

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    }
  }

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 py-8 items-center justify-center">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
            <Text className="text-4xl">✉️</Text>
          </View>
          
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Email envoyé !
          </Text>
          
          <Text className="text-gray-500 text-center mb-8">
            Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
          </Text>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="bg-primary-500 py-4 px-8 rounded-xl">
              <Text className="text-white font-semibold text-lg">
                Retour à la connexion
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="mb-6">
                <Text className="text-primary-500 text-lg">← Retour</Text>
              </TouchableOpacity>
            </Link>
            
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Mot de passe oublié
            </Text>
            <Text className="text-gray-500">
              Entrez votre email pour recevoir un lien de réinitialisation
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <Text className="text-red-600">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="mb-6">
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

          {/* Submit Button */}
          <TouchableOpacity 
            className={`py-4 rounded-xl ${isLoading ? 'bg-primary-300' : 'bg-primary-500'}`}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Envoyer le lien
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
