// ============================================================================
// Register Screen
// ============================================================================

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { YEARS, SPECIALITIES } from '@/constants'
import { WILAYAS } from '@/constants/regions'
import { YearLevel, Speciality, RegisterFormData } from '@/types'

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const contentMaxWidth = 600
  
  // Form state
  // ... (rest of the state remains the same)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [speciality, setSpeciality] = useState<Speciality | ''>('')
  const [yearOfStudy, setYearOfStudy] = useState<YearLevel | ''>('')
  const [region, setRegion] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Dropdown visibility
  const [showSpeciality, setShowSpeciality] = useState(false)
  const [showYear, setShowYear] = useState(false)
  const [showRegion, setShowRegion] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  const handleRegister = async () => {
    // ... (logic remains same)
    if (!fullName.trim()) { setError('Veuillez entrer votre nom complet'); return; }
    if (!email.trim()) { setError('Veuillez entrer votre email'); return; }
    if (!password || password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (!speciality) { setError('Veuillez sélectionner votre spécialité'); return; }
    if (!yearOfStudy) { setError('Veuillez sélectionner votre année d\'étude'); return; }
    if (!region) { setError('Veuillez sélectionner votre wilaya'); return; }
    if (!activationCode.trim()) { setError('Veuillez entrer votre code d\'activation'); return; }

    setError(null)
    const formData: RegisterFormData = {
      email: email.trim(),
      password,
      confirmPassword,
      full_name: fullName.trim(),
      speciality: speciality as Speciality,
      year_of_study: yearOfStudy as YearLevel,
      region,
      activation_code: activationCode.trim().toUpperCase(),
    }
    const { error: registerError, needsEmailVerification } = await signUp(formData)
    if (registerError) { setError(registerError) }
    else if (needsEmailVerification) { setShowEmailVerification(true) }
    else { router.replace('/(tabs)') }
  }

  // Email verification success screen
  if (showEmailVerification) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 py-8 justify-center items-center self-center" style={{ maxWidth: 500 }}>
          <View className="bg-green-100 rounded-full p-6 mb-6">
            <Text className="text-5xl">✉️</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">Vérifiez votre email</Text>
          <Text className="text-gray-600 text-center mb-2">Un email de confirmation a été envoyé à :</Text>
          <Text className="text-primary-500 font-semibold text-lg mb-6">{email}</Text>
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 w-full">
            <Text className="text-blue-800 text-center">Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.</Text>
          </View>
          <TouchableOpacity className="bg-primary-500 py-4 px-8 rounded-xl w-full" onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-white text-center font-semibold text-lg">Aller à la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View className="px-6 py-8 w-full" style={{ maxWidth: contentMaxWidth }}>
            {/* Header */}
            <View className="mb-6">
              <Link href="/(auth)/welcome" asChild>
                <TouchableOpacity className="mb-6">
                  <Text className="text-primary-500 text-lg">← Retour</Text>
                </TouchableOpacity>
              </Link>
              <Text className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</Text>
              <Text className="text-gray-500">Remplissez vos informations pour commencer</Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <Text className="text-red-600">{error}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-4">
              <View className={isDesktop ? 'flex-row gap-4' : 'space-y-4'}>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Nom complet *</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="Votre nom complet" value={fullName} onChangeText={setFullName} autoComplete="name" />
                </View>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Email *</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="votre@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                </View>
              </View>

              <View className={isDesktop ? 'flex-row gap-4' : 'space-y-4'}>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Mot de passe *</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="Minimum 8 caractères" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
                </View>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Confirmer le mot de passe *</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="Répétez le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
                </View>
              </View>

              <View className={isDesktop ? 'flex-row gap-4' : 'space-y-4'}>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Spécialité *</Text>
                  <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" onPress={() => setShowSpeciality(!showSpeciality)}>
                    <Text className={speciality ? 'text-gray-900' : 'text-gray-400'}>{speciality || 'Sélectionner'}</Text>
                  </TouchableOpacity>
                  {showSpeciality && (
                    <View className="bg-white border border-gray-200 rounded-xl mt-1 absolute top-full w-full z-10 shadow-lg">
                      {SPECIALITIES.map((s) => (
                        <TouchableOpacity key={s.value} className="px-4 py-3 border-b border-gray-100" onPress={() => { setSpeciality(s.value); setShowSpeciality(false); }}>
                          <Text className="text-gray-900">{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Année d'étude *</Text>
                  <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" onPress={() => setShowYear(!showYear)}>
                    <Text className={yearOfStudy ? 'text-gray-900' : 'text-gray-400'}>{yearOfStudy ? YEARS.find(y => y.value === yearOfStudy)?.label : 'Sélectionner'}</Text>
                  </TouchableOpacity>
                  {showYear && (
                    <View className="bg-white border border-gray-200 rounded-xl mt-1 absolute top-full w-full z-10 shadow-lg">
                      {YEARS.map((y) => (
                        <TouchableOpacity key={y.value} className="px-4 py-3 border-b border-gray-100" onPress={() => { setYearOfStudy(y.value); setShowYear(false); }}>
                          <Text className="text-gray-900">{y.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View className={isDesktop ? 'flex-row gap-4' : 'space-y-4'}>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Wilaya *</Text>
                  <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" onPress={() => setShowRegion(!showRegion)}>
                    <Text className={region ? 'text-gray-900' : 'text-gray-400'}>{region || 'Sélectionner'}</Text>
                  </TouchableOpacity>
                  {showRegion && (
                    <View className="bg-white border border-gray-200 rounded-xl mt-1 absolute top-full w-full z-10 shadow-lg max-h-48 overflow-hidden">
                      <ScrollView nestedScrollEnabled>
                        {WILAYAS.map((w) => (
                          <TouchableOpacity key={w.code} className="px-4 py-3 border-b border-gray-100" onPress={() => { setRegion(w.name); setShowRegion(false); }}>
                            <Text className="text-gray-900">{w.code} - {w.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-gray-700 font-medium mb-2">Code d'activation *</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 uppercase" placeholder="FMC-XXXX-XXXX" value={activationCode} onChangeText={setActivationCode} autoCapitalize="characters" />
                </View>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity className={`py-4 rounded-xl mt-8 ${isLoading ? 'bg-primary-300' : 'bg-primary-500'}`} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-semibold text-lg">Créer mon compte</Text>}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-500">Déjà un compte ? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity><Text className="text-primary-500 font-semibold">Se connecter</Text></TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
