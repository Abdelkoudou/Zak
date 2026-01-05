// ============================================================================
// Register Screen - Ultra Premium UI with Smooth Animations
// ============================================================================

import { useState, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  useWindowDimensions,
  Animated,
  Easing,
  Image
} from 'react-native'
import { router, useNavigation, useLocalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/AuthContext'
import { YEARS, SPECIALITIES } from '@/constants'
import { FACULTIES } from '@/constants/faculty'
import { WILAYAS } from '@/constants/regions'
import { YearLevel, Speciality, RegisterFormData } from '@/types'
import { BRAND_THEME } from '@/constants/theme'
import { FadeInView, AnimatedButton, PasswordStrengthIndicator } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { 
  validateEmail, 
  validatePassword, 
  validatePasswordMatch, 
  validateActivationCode,
  validateRequired,
  validateSelection,
  sanitizeEmail,
  sanitizeActivationCode,
  sanitizeText
} from '@/lib/validation'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

const Logo = require('../../assets/icon.png')

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth()
  const { width } = useWindowDimensions()
  const navigation = useNavigation()
  const searchParams = useLocalSearchParams<{ code?: string }>()
  const isDesktop = width >= 768
  const contentMaxWidth = 600
  
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back()
    } else {
      router.replace('/(auth)/welcome')
    }
  }
  
  // Premium Animations
  const headerOpacity = useRef(new Animated.Value(0)).current
  const headerSlide = useRef(new Animated.Value(-30)).current
  const formOpacity = useRef(new Animated.Value(0)).current
  const formSlide = useRef(new Animated.Value(40)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const floatingY = useRef(new Animated.Value(0)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current

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
  const [codeFromDeepLink, setCodeFromDeepLink] = useState(false)

  // Dropdown visibility
  const [showSpeciality, setShowSpeciality] = useState(false)
  const [showYear, setShowYear] = useState(false)
  const [showFaculty, setShowFaculty] = useState(false)
  const [showRegion, setShowRegion] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  // Handle deep link code parameter
  useEffect(() => {
    // Check URL params from expo-router
    if (searchParams.code) {
      setActivationCode(searchParams.code)
      setCodeFromDeepLink(true)
    }
    
    // For web: also check window.location for query params
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const codeFromUrl = urlParams.get('code')
      if (codeFromUrl) {
        setActivationCode(codeFromUrl)
        setCodeFromDeepLink(true)
      }
    }
    
    // Also handle direct deep links (for native)
    if (Platform.OS !== 'web') {
      const handleDeepLink = (event: { url: string }) => {
        const { queryParams } = Linking.parse(event.url)
        if (queryParams?.code && typeof queryParams.code === 'string') {
          setActivationCode(queryParams.code)
          setCodeFromDeepLink(true)
        }
      }
      
      // Check initial URL
      Linking.getInitialURL().then((url) => {
        if (url) {
          const { queryParams } = Linking.parse(url)
          if (queryParams?.code && typeof queryParams.code === 'string') {
            setActivationCode(queryParams.code)
            setCodeFromDeepLink(true)
          }
        }
      })
      
      // Listen for incoming links
      const subscription = Linking.addEventListener('url', handleDeepLink)
      
      return () => {
        subscription.remove()
      }
    }
  }, [searchParams.code])

  // Floating animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(floatingY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.6,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    // Premium entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(headerSlide, { toValue: 0, friction: 7, tension: 50, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(formSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    ]).start()
  }, [])

  const handleRegister = async () => {
    // Validate full name
    const nameValidation = validateRequired(fullName, 'votre nom complet')
    if (!nameValidation.isValid) { setError(nameValidation.error); return }
    
    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) { setError(emailValidation.error); return }
    
    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) { setError(passwordValidation.error); return }
    
    // Validate password confirmation
    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.isValid) { setError(matchValidation.error); return }
    
    // Validate selections
    const specialityValidation = validateSelection(speciality, 'votre spécialité')
    if (!specialityValidation.isValid) { setError(specialityValidation.error); return }
    
    // Check if speciality is available
    if (speciality === 'Pharmacie' || speciality === 'Dentaire') {
      setError('Cette spécialité sera bientôt disponible. Veuillez sélectionner Médecine pour le moment.');
      return;
    }
    
    const yearValidation = validateSelection(yearOfStudy, 'votre année d\'étude')
    if (!yearValidation.isValid) { setError(yearValidation.error); return }
    
    // Check if year is available for the selected speciality
    if (speciality === 'Médecine' && yearOfStudy !== '2') {
      setError('Seule la 2ème année de Médecine est actuellement disponible. Les autres années seront bientôt disponibles.');
      return;
    }
    
    const facultyValidation = validateSelection(faculty, 'votre faculté / annexe')
    if (!facultyValidation.isValid) { setError(facultyValidation.error); return }
    
    const regionValidation = validateSelection(region, 'votre wilaya')
    if (!regionValidation.isValid) { setError(regionValidation.error); return }
    
    // Validate activation code format
    const codeValidation = validateActivationCode(activationCode)
    if (!codeValidation.isValid) { setError(codeValidation.error); return }

    setError(null)
    const formData: RegisterFormData = {
      email: sanitizeEmail(email),
      password,
      confirmPassword,
      full_name: sanitizeText(fullName),
      speciality: speciality as Speciality,
      year_of_study: yearOfStudy as YearLevel,
      faculty,
      region,
      activation_code: sanitizeActivationCode(activationCode),
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
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ minHeight: '100%', paddingBottom: 60 }} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Premium Gradient Header */}
          <LinearGradient
            colors={['#0D9488', '#09B2AD', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: 16,
              paddingBottom: 40,
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
              top: -30, 
              right: -30, 
              width: 120, 
              height: 120, 
              borderRadius: 60, 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              transform: [{ translateY: floatingY }],
            }} />
            <Animated.View style={{ 
              position: 'absolute', 
              bottom: -20, 
              left: -20, 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              opacity: glowPulse,
            }} />

            {/* Back Button */}
            <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
              <TouchableOpacity style={{ marginBottom: 16 }} onPress={handleGoBack}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeftIcon size={22} color="#ffffff" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Header Content */}
            <Animated.View style={{ 
              alignItems: 'center',
              opacity: headerOpacity,
              transform: [{ translateY: headerSlide }],
            }}>
              <Animated.View style={{
                width: 70,
                height: 70,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                transform: [{ scale: logoScale }],
              }}>
                <Image 
                  source={Logo}
                  style={{ width: 48, height: 48, resizeMode: 'contain' }}
                />
              </Animated.View>
              
              <Text style={{
                fontSize: 28,
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: 4,
                letterSpacing: -0.5,
                textShadowColor: 'rgba(0, 0, 0, 0.1)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}>
                Créer un compte
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '600',
              }}>
                Rejoignez FMC APP et optimiser votre révision
              </Text>
            </Animated.View>
          </LinearGradient>

          {/* Form Section */}
          <Animated.View style={{ 
            paddingHorizontal: 24, 
            paddingTop: 24,
            width: '100%', 
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            opacity: formOpacity,
            transform: [{ translateY: formSlide }],
          }}>
            {/* Error Message */}
            {error && (
              <FadeInView animation="scale">
                <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                  <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '600' }}>⚠️ {error}</Text>
                </View>
              </FadeInView>
            )}

            {/* Form */}
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
                    <PasswordStrengthIndicator password={password} />
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
                      options={SPECIALITIES.map(s => ({ 
                        value: s.value, 
                        label: s.value === 'Pharmacie' || s.value === 'Dentaire' 
                          ? `${s.label} (Bientôt disponible)` 
                          : s.label,
                        disabled: s.value === 'Pharmacie' || s.value === 'Dentaire'
                      }))}
                      onSelect={(v) => { 
                        setSpeciality(v as Speciality); 
                        setShowSpeciality(false);
                        // Reset year when changing speciality
                        if (v !== 'Médecine') {
                          setYearOfStudy('');
                        }
                      }}
                    />
                  </View>
                  <View style={[isDesktop ? { flex: 1 } : {}, { zIndex: 10 }]}>
                    <FormLabel>Année d'étude *</FormLabel>
                    <FormDropdown
                      value={yearOfStudy ? YEARS.find(y => y.value === yearOfStudy)?.label || '' : ''}
                      placeholder="Sélectionner"
                      isOpen={showYear}
                      onToggle={() => { setShowYear(!showYear); setShowSpeciality(false); setShowFaculty(false); setShowRegion(false) }}
                      options={YEARS.map(y => {
                        // If Médecine is selected, only allow 2ème année
                        if (speciality === 'Médecine') {
                          return {
                            value: y.value,
                            label: y.value === '2' 
                              ? y.label 
                              : `${y.label} (Bientôt disponible)`,
                            disabled: y.value !== '2'
                          };
                        }
                        // For other specialities (when they become available), show all years
                        return { value: y.value, label: y.label, disabled: false };
                      })}
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
                    <FormLabel>Wilaya / residence *</FormLabel>
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
                  <View style={{ position: 'relative' }}>
                    <FormInput 
                      placeholder="FMC-XXXX-XXXX" 
                      value={activationCode} 
                      onChangeText={(text: string) => {
                        setActivationCode(text)
                        setCodeFromDeepLink(false)
                      }} 
                      autoCapitalize="characters"
                      style={codeFromDeepLink ? {
                        backgroundColor: 'rgba(9, 178, 173, 0.1)',
                        borderColor: '#09B2AD',
                        borderWidth: 2,
                      } : undefined}
                    />
                    {codeFromDeepLink && (
                      <View style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: [{ translateY: -10 }],
                        backgroundColor: '#09B2AD',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                          ✓ Auto-rempli
                        </Text>
                      </View>
                    )}
                  </View>
                  {codeFromDeepLink ? (
                    <Text style={{ 
                      color: '#09B2AD', 
                      fontSize: 12, 
                      marginTop: 4,
                      fontWeight: '500',
                    }}>
                      Code d'activation reçu depuis votre achat en ligne
                    </Text>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => {
                        // URL to the buy page (db-interface deployed)
                        const buyUrl = 'https://fmc-interface.vercel.app/buy'
                        if (Platform.OS === 'web') {
                          window.open(buyUrl, '_blank')
                        } else {
                          Linking.openURL(buyUrl)
                        }
                      }}
                      style={{ marginTop: 8 }}
                    >
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignSelf: 'flex-start',
                      }}>
                        <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '600' }}>
                          🛒 Acheter un code d'activation
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

            {/* Register Button */}
            <View style={{ marginTop: 28, zIndex: 200 }}>
              <AnimatedButton title="Créer mon compte" onPress={handleRegister} loading={isLoading} variant="primary" size="lg" />
            </View>

            {/* Login Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              <Text style={{ color: BRAND_THEME.colors.gray[500], fontSize: 15 }}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: '#09B2AD', fontWeight: '700', fontSize: 15 }}>Se connecter</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ fontSize: 13, color: BRAND_THEME.colors.gray[400], textAlign: 'center' }}>
                🔒 Vos données sont sécurisées
              </Text>
            </View>
          </Animated.View>
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
function FormDropdown({ value, placeholder, isOpen, onToggle, options, onSelect, scrollable, disabledOptions }: {
  value: string
  placeholder: string
  isOpen: boolean
  onToggle: () => void
  options: { value: string; label: string; disabled?: boolean }[]
  onSelect: (value: string) => void
  scrollable?: boolean
  disabledOptions?: string[]
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
          maxHeight: scrollable ? 250 : undefined,
          ...BRAND_THEME.shadows.lg,
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {scrollable ? (
            <ScrollView 
              style={{ maxHeight: 250 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((opt) => (
                <TouchableOpacity 
                  key={opt.value} 
                  style={{ 
                    paddingHorizontal: 16, 
                    paddingVertical: 14, 
                    borderBottomWidth: 1, 
                    borderBottomColor: BRAND_THEME.colors.gray[100],
                    opacity: opt.disabled ? 0.5 : 1,
                  }} 
                  onPress={() => !opt.disabled && onSelect(opt.value)}
                  disabled={opt.disabled}
                >
                  <Text style={{ 
                    color: opt.disabled ? BRAND_THEME.colors.gray[400] : BRAND_THEME.colors.gray[900], 
                    fontSize: 15 
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            options.map((opt) => (
              <TouchableOpacity 
                key={opt.value} 
                style={{ 
                  paddingHorizontal: 16, 
                  paddingVertical: 14, 
                  borderBottomWidth: 1, 
                  borderBottomColor: BRAND_THEME.colors.gray[100],
                  opacity: opt.disabled ? 0.5 : 1,
                }} 
                onPress={() => !opt.disabled && onSelect(opt.value)}
                disabled={opt.disabled}
              >
                <Text style={{ 
                  color: opt.disabled ? BRAND_THEME.colors.gray[400] : BRAND_THEME.colors.gray[900], 
                  fontSize: 15 
                }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  )
}
