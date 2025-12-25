// ============================================================================
// Register Screen - Premium UI with Smooth Animations
// ============================================================================

import { useState, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  useWindowDimensions,
  Animated,
  Pressable
} from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { YEARS, SPECIALITIES } from '@/constants'
import { FACULTIES } from '@/constants/faculty'
import { WILAYAS } from '@/constants/regions'
import { YearLevel, Speciality, RegisterFormData } from '@/types'
import { BRAND_THEME } from '@/constants/theme'
import { FadeInView, AnimatedButton } from '@/components/ui'

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const contentMaxWidth = 600
  
  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-20)).current

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [speciality, setSpeciality] = useState<Speciality | ''>('')
  const [yearOfStudy, setYearOfStudy] = useState<YearLevel | ''>('')
  const [faculty, setFaculty] = useState('')
  const [region, setRegion] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Dropdown visibility
  const [showSpeciality, setShowSpeciality] = useState(false)
  const [showYear, setShowYear] = useState(false)
  const [showFaculty, setShowFaculty] = useState(false)
  const [showRegion, setShowRegion] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleRegister = async () => {
    if (!fullName.trim()) { setError('Veuillez entrer votre nom complet'); return }
    if (!email.trim()) { setError('Veuillez entrer votre email'); return }
    if (!password || password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    if (!speciality) { setError('Veuillez sélectionner votre spécialité'); return }
    if (!yearOfStudy) { setError('Veuillez sélectionner votre année d\'étude'); return }
    if (!faculty) { setError('Veuillez sélectionner votre faculté / annexe'); return }
    if (!region) { setError('Veuillez sélectionner votre wilaya'); return }
    if (!activationCode.trim()) { setError('Veuillez entrer votre code d\'activation'); return }

    setError(null)
    const formData: RegisterFormData = {
      email: email.trim(),
      password,
      confirmPassword,
      full_name: fullName.trim(),
      speciality: speciality as Speciality,
      year_of_study: yearOfStudy as YearLevel,
      faculty,
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <FadeInView animation="scale" style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center', alignItems: 'center', maxWidth: 500, alignSelf: 'center' }}>
          <View style={{ backgroundColor: 'rgba(9, 178, 173, 0.1)', borderRadius: 50, padding: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 56 }}>✉️</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: BRAND_THEME.colors.gray[900], marginBottom: 12, textAlign: 'center' }}>
            Vérifiez votre email
          </Text>
          <Text style={{ color: BRAND_THEME.colors.gray[500], textAlign: 'center', marginBottom: 8, fontSize: 16 }}>
            Un email de confirmation a été envoyé à :
          </Text>
          <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 18, marginBottom: 24 }}>{email}</Text>
          <View style={{ backgroundColor: 'rgba(9, 178, 173, 0.08)', borderRadius: 16, padding: 16, marginBottom: 32, width: '100%' }}>
            <Text style={{ color: BRAND_THEME.colors.gray[700], textAlign: 'center', lineHeight: 22 }}>
              Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.
            </Text>
          </View>
          <AnimatedButton title="Aller à la connexion" onPress={() => router.replace('/(auth)/login')} variant="primary" size="lg" />
        </FadeInView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 32, width: '100%', maxWidth: contentMaxWidth }}>
            {/* Header */}
            <Animated.View style={{ marginBottom: 24, opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
              <TouchableOpacity style={{ marginBottom: 24 }} onPress={() => router.back()}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND_THEME.colors.gray[100], alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: BRAND_THEME.colors.gray[600] }}>←</Text>
                </View>
              </TouchableOpacity>
              <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND_THEME.colors.gray[900], marginBottom: 8, letterSpacing: -0.5 }}>
                Créer un compte
              </Text>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 16 }}>
                Remplissez vos informations pour commencer
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <FadeInView animation="scale">
                <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <Text style={{ color: '#DC2626', fontSize: 15 }}>{error}</Text>
                </View>
              </FadeInView>
            )}

            {/* Form */}
            <FadeInView delay={100} animation="slideUp">
              <View style={{ gap: 16, zIndex: 300 }}>
                {/* Name & Email Row */}
                <View style={isDesktop ? { flexDirection: 'row', gap: 16 } : { gap: 16 }}>
                  <View style={isDesktop ? { flex: 1 } : {}}>
                    <FormLabel>Nom complet *</FormLabel>
                    <FormInput placeholder="Votre nom complet" value={fullName} onChangeText={setFullName} autoComplete="name" />
                  </View>
                  <View style={isDesktop ? { flex: 1 } : {}}>
                    <FormLabel>Email *</FormLabel>
                    <FormInput placeholder="votre@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>

                {/* Password Row */}
                <View style={isDesktop ? { flexDirection: 'row', gap: 16 } : { gap: 16 }}>
                  <View style={isDesktop ? { flex: 1 } : {}}>
                    <FormLabel>Mot de passe *</FormLabel>
                    <FormInput placeholder="Minimum 8 caractères" value={password} onChangeText={setPassword} secureTextEntry />
                  </View>
                  <View style={isDesktop ? { flex: 1 } : {}}>
                    <FormLabel>Confirmer *</FormLabel>
                    <FormInput placeholder="Répétez le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                  </View>
                </View>

                {/* Speciality & Year Row */}
                <View style={[isDesktop ? { flexDirection: 'row', gap: 16 } : { gap: 16 }, { zIndex: 50 }]}>
                  <View style={[isDesktop ? { flex: 1 } : {}, { zIndex: 20 }]}>
                    <FormLabel>Spécialité *</FormLabel>
                    <FormDropdown
                      value={speciality}
                      placeholder="Sélectionner"
                      isOpen={showSpeciality}
                      onToggle={() => { setShowSpeciality(!showSpeciality); setShowYear(false); setShowFaculty(false); setShowRegion(false) }}
                      options={SPECIALITIES.map(s => ({ value: s.value, label: s.label }))}
                      onSelect={(v) => { setSpeciality(v as Speciality); setShowSpeciality(false) }}
                    />
                  </View>
                  <View style={[isDesktop ? { flex: 1 } : {}, { zIndex: 10 }]}>
                    <FormLabel>Année d'étude *</FormLabel>
                    <FormDropdown
                      value={yearOfStudy ? YEARS.find(y => y.value === yearOfStudy)?.label || '' : ''}
                      placeholder="Sélectionner"
                      isOpen={showYear}
                      onToggle={() => { setShowYear(!showYear); setShowSpeciality(false); setShowFaculty(false); setShowRegion(false) }}
                      options={YEARS.map(y => ({ value: y.value, label: y.label }))}
                      onSelect={(v) => { setYearOfStudy(v as YearLevel); setShowYear(false) }}
                    />
                  </View>
                </View>

                {/* Faculty & Region Row */}
                <View style={[isDesktop ? { flexDirection: 'row', gap: 16 } : { gap: 16 }, { zIndex: 40 }]}>
                  <View style={[isDesktop ? { flex: 1 } : {}, { zIndex: 20 }]}>
                    <FormLabel>Faculté / Annexe *</FormLabel>
                    <FormDropdown
                      value={faculty ? FACULTIES.find(f => f.value === faculty)?.label || '' : ''}
                      placeholder="Sélectionner"
                      isOpen={showFaculty}
                      onToggle={() => { setShowFaculty(!showFaculty); setShowRegion(false); setShowSpeciality(false); setShowYear(false) }}
                      options={FACULTIES.map(f => ({ value: f.value, label: f.label }))}
                      onSelect={(v) => { setFaculty(v); setShowFaculty(false) }}
                      scrollable
                    />
                  </View>
                  <View style={[isDesktop ? { flex: 1 } : {}, { zIndex: 10 }]}>
                    <FormLabel>Wilaya *</FormLabel>
                    <FormDropdown
                      value={region}
                      placeholder="Sélectionner"
                      isOpen={showRegion}
                      onToggle={() => { setShowRegion(!showRegion); setShowFaculty(false); setShowSpeciality(false); setShowYear(false) }}
                      options={WILAYAS.map(w => ({ value: w.name, label: `${w.code} - ${w.name}` }))}
                      onSelect={(v) => { setRegion(v); setShowRegion(false) }}
                      scrollable
                    />
                  </View>
                </View>

                {/* Activation Code */}
                <View style={{ zIndex: 30 }}>
                  <FormLabel>Code d'activation *</FormLabel>
                  <FormInput placeholder="FMC-XXXX-XXXX" value={activationCode} onChangeText={setActivationCode} autoCapitalize="characters" />
                </View>
              </View>
            </FadeInView>

            {/* Register Button */}
            <FadeInView delay={200} animation="slideUp">
              <View style={{ marginTop: 32, zIndex: 200 }}>
                <AnimatedButton title="Créer mon compte" onPress={handleRegister} loading={isLoading} variant="primary" size="lg" />
              </View>
            </FadeInView>

            {/* Login Link */}
            <FadeInView delay={300} animation="fade">
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
                <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 15 }}>Déjà un compte ? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 15 }}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Form Label
function FormLabel({ children }: { children: string }) {
  return <Text style={{ color: BRAND_THEME.colors.gray[700], fontWeight: '600', marginBottom: 8, fontSize: 14 }}>{children}</Text>
}

// Form Input
function FormInput(props: any) {
  return (
    <TextInput
      {...props}
      style={{
        backgroundColor: BRAND_THEME.colors.gray[50],
        borderWidth: 1,
        borderColor: BRAND_THEME.colors.gray[200],
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: BRAND_THEME.colors.gray[900],
      }}
      placeholderTextColor={BRAND_THEME.colors.gray[400]}
    />
  )
}

// Form Dropdown
function FormDropdown({ value, placeholder, isOpen, onToggle, options, onSelect, scrollable }: {
  value: string
  placeholder: string
  isOpen: boolean
  onToggle: () => void
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
  scrollable?: boolean
}) {
  return (
    <View>
      <TouchableOpacity
        style={{
          backgroundColor: BRAND_THEME.colors.gray[50],
          borderWidth: 1,
          borderColor: isOpen ? '#09B2AD' : BRAND_THEME.colors.gray[200],
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onPress={onToggle}
      >
        <Text style={{ color: value ? BRAND_THEME.colors.gray[900] : BRAND_THEME.colors.gray[400], fontSize: 16 }}>
          {value || placeholder}
        </Text>
        <Text style={{ color: BRAND_THEME.colors.gray[400] }}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={{
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: BRAND_THEME.colors.gray[200],
          borderRadius: 14,
          marginTop: 4,
          position: 'absolute',
          top: '100%',
          width: '100%',
          maxHeight: scrollable ? 200 : undefined,
          ...BRAND_THEME.shadows.lg,
          zIndex: 100,
        }}>
          {scrollable ? (
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {options.map((opt) => (
                <TouchableOpacity key={opt.value} style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BRAND_THEME.colors.gray[100] }} onPress={() => onSelect(opt.value)}>
                  <Text style={{ color: BRAND_THEME.colors.gray[900], fontSize: 15 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            options.map((opt) => (
              <TouchableOpacity key={opt.value} style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BRAND_THEME.colors.gray[100] }} onPress={() => onSelect(opt.value)}>
                <Text style={{ color: BRAND_THEME.colors.gray[900], fontSize: 15 }}>{opt.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  )
}
