// ============================================================================
// Welcome Screen - Ultra Premium Landing Page with Smooth Animations
// ============================================================================

import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, Image, Animated, useWindowDimensions, Platform, Easing } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { AnimatedButton } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logo = require('@/assets/images/logo.png')

export default function WelcomeScreen() {
  const { width } = useWindowDimensions()
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const contentMaxWidth = isDesktop ? 1200 : 500

  // Premium Animations
  const logoScale = useRef(new Animated.Value(0.3)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleSlide = useRef(new Animated.Value(50)).current
  const subtitleOpacity = useRef(new Animated.Value(0)).current
  const buttonsSlide = useRef(new Animated.Value(80)).current
  const buttonsOpacity = useRef(new Animated.Value(0)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const floatingY = useRef(new Animated.Value(0)).current

  // Floating animation for decorative elements
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY, {
          toValue: -15,
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

    // Glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.8,
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
      // Logo entrance with bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Title slide in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(titleSlide, {
          toValue: 0,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fade
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Buttons
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  })

  // Desktop Layout
  if (isDesktop) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#ffffff',
        flexDirection: 'row',
      }}>
        {/* Left Side - Hero with Gradient */}
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
            top: -100, 
            right: -100, 
            width: 400, 
            height: 400, 
            borderRadius: 200, 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: [{ translateY: floatingY }],
          }} />
          <Animated.View style={{ 
            position: 'absolute', 
            bottom: -150, 
            left: -150, 
            width: 500, 
            height: 500, 
            borderRadius: 250, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            opacity: glowPulse,
          }} />
          <Animated.View style={{ 
            position: 'absolute', 
            top: '30%', 
            left: '8%', 
            width: 120, 
            height: 120, 
            borderRadius: 60, 
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            transform: [{ translateY: Animated.multiply(floatingY, -0.5) }],
          }} />
          <Animated.View style={{ 
            position: 'absolute', 
            bottom: '20%', 
            right: '15%', 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            transform: [{ translateY: Animated.multiply(floatingY, 0.7) }],
          }} />

          <Animated.View style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { rotate: logoSpin }],
            alignItems: 'center',
            zIndex: 1,
          }}>
            {/* Glowing Logo Container */}
            <Animated.View style={{
              width: 200,
              height: 200,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              // @ts-ignore
              backdropFilter: isWeb ? 'blur(30px)' : undefined,
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 30,
            }}>
              <Image 
                source={Logo}
                style={{ width: 140, height: 140, resizeMode: 'contain' }}
              />
            </Animated.View>
            
            <Text style={{
              fontSize: 56,
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
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              marginBottom: 16,
            }}>
              <Text style={{
                fontSize: 14,
                color: '#ffffff',
                fontWeight: '700',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}>
                Premium Medical Learning
              </Text>
            </View>
            
            <Text style={{
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              lineHeight: 32,
              maxWidth: 420,
              fontWeight: '500',
            }}>
              La plateforme de préparation aux examens médicaux pour les étudiants algériens
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Right Side - Form */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          backgroundColor: '#ffffff',
        }}>
          <Animated.View style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
            width: '100%',
            maxWidth: 460,
          }}>
            <Text style={{
              fontSize: 42,
              fontWeight: '900',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 12,
              letterSpacing: -1.5,
            }}>
              Bienvenue 👋
            </Text>
            
            <Animated.Text style={{
              fontSize: 18,
              color: BRAND_THEME.colors.gray[500],
              marginBottom: 48,
              lineHeight: 28,
              opacity: subtitleOpacity,
            }}>
              Connectez-vous pour accéder à vos cours et commencer à pratiquer
            </Animated.Text>

            {/* Animated Buttons */}
            <Animated.View style={{ 
              gap: 16,
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsSlide }],
            }}>
              <AnimatedButton 
                title="Créer un compte" 
                onPress={() => router.push('/(auth)/register')}
                variant="primary"
                size="lg"
              />
              
              <AnimatedButton 
                title="Se connecter" 
                onPress={() => router.push('/(auth)/login')}
                variant="secondary"
                size="lg"
              />
            </Animated.View>

            <Animated.Text style={{
              fontSize: 13,
              color: BRAND_THEME.colors.gray[400],
              textAlign: 'center',
              marginTop: 32,
              opacity: buttonsOpacity,
            }}>
              🔒 Plateforme sécurisée • 🇩🇿 Curriculum français
            </Animated.Text>
          </Animated.View>
        </View>
      </View>
    )
  }

  // Mobile/Tablet Layout - Premium Design
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Gradient Header */}
        <LinearGradient
          colors={['#0D9488', '#09B2AD', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            paddingTop: 60,
            paddingBottom: 80,
            paddingHorizontal: 24,
            alignItems: 'center',
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Decorative Circles */}
          <Animated.View style={{ 
            position: 'absolute', 
            top: -50, 
            right: -50, 
            width: 200, 
            height: 200, 
            borderRadius: 100, 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: [{ translateY: floatingY }],
          }} />
          <Animated.View style={{ 
            position: 'absolute', 
            bottom: -30, 
            left: -30, 
            width: 150, 
            height: 150, 
            borderRadius: 75, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            opacity: glowPulse,
          }} />

          {/* Logo */}
          <Animated.View style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            marginBottom: 24,
          }}>
            <View style={{
              width: isTablet ? 130 : 110,
              height: isTablet ? 130 : 110,
              borderRadius: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            }}>
              <Image 
                source={Logo}
                style={{
                  width: isTablet ? 90 : 75,
                  height: isTablet ? 90 : 75,
                  resizeMode: 'contain',
                }}
              />
            </View>
          </Animated.View>
          
          <Animated.View style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: isTablet ? 52 : 44,
              fontWeight: '900',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -1.5,
              textShadowColor: 'rgba(0, 0, 0, 0.1)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 10,
            }}>
              FMC APP
            </Text>
            
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
              <Text style={{
                fontSize: 11,
                color: '#ffffff',
                fontWeight: '700',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}>
                Premium Medical Learning
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Content Section */}
        <View style={{ 
          flex: 1, 
          width: '100%', 
          maxWidth: contentMaxWidth, 
          paddingHorizontal: 24,
          alignSelf: 'center',
          marginTop: -40,
        }}>
          {/* Tagline Card */}
          <Animated.View style={{
            opacity: subtitleOpacity,
            backgroundColor: '#ffffff',
            borderRadius: 28,
            paddingVertical: 28,
            paddingHorizontal: 24,
            marginBottom: 32,
            ...BRAND_THEME.shadows.lg,
            borderWidth: 1,
            borderColor: 'rgba(9, 178, 173, 0.1)',
          }}>
            <Text style={{
              fontSize: isTablet ? 22 : 20,
              color: BRAND_THEME.colors.gray[800],
              textAlign: 'center',
              lineHeight: 30,
              fontWeight: '600',
            }}>
              Préparez vos examens médicaux{'\n'}avec confiance 🎯
            </Text>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 20,
              gap: 10,
            }}>
              <View style={{
                backgroundColor: 'rgba(9, 178, 173, 0.1)',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 14,
              }}>
                <Text style={{ fontSize: 13, color: '#09B2AD', fontWeight: '600' }}>
                  🇩🇿 Algérie
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(9, 178, 173, 0.1)',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 14,
              }}>
                <Text style={{ fontSize: 13, color: '#09B2AD', fontWeight: '600' }}>
                  🇫🇷 Curriculum français
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={{ 
            gap: 16,
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsSlide }],
          }}>
            <AnimatedButton 
              title="Créer un compte" 
              onPress={() => router.push('/(auth)/register')}
              variant="primary"
              size="lg"
            />
            
            <AnimatedButton 
              title="Se connecter" 
              onPress={() => router.push('/(auth)/login')}
              variant="secondary"
              size="lg"
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ opacity: buttonsOpacity, marginTop: 40, marginBottom: 24 }}>
            <Text style={{
              fontSize: 13,
              color: BRAND_THEME.colors.gray[400],
              textAlign: 'center',
            }}>
              🔒 Plateforme sécurisée pour étudiants en médecine
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
