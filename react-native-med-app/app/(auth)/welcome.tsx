// ============================================================================
// Welcome Screen - Stunning Premium Landing with Jaw-Dropping Animations
// ============================================================================

import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, Image, Animated, useWindowDimensions, Platform } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { AnimatedButton } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import {
  PREMIUM_TIMING,
  PREMIUM_EASING,
  PREMIUM_SPRING,
  PREMIUM_INITIAL,
  USE_NATIVE_DRIVER,
} from '@/lib/premiumAnimations'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logo = require('../../assets/icon.png')

export default function WelcomeScreen() {
  const { width } = useWindowDimensions()
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const contentMaxWidth = isDesktop ? 1200 : 500

  // ========== Premium Animation Values ==========
  // Logo animations
  const logoScale = useRef(new Animated.Value(PREMIUM_INITIAL.logoScale)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const logoGlow = useRef(new Animated.Value(0)).current
  
  // Title animations
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleSlide = useRef(new Animated.Value(40)).current
  const titleScale = useRef(new Animated.Value(0.9)).current
  
  // Subtitle animations
  const subtitleOpacity = useRef(new Animated.Value(0)).current
  const subtitleSlide = useRef(new Animated.Value(25)).current
  
  // Badge animation
  const badgeOpacity = useRef(new Animated.Value(0)).current
  const badgeScale = useRef(new Animated.Value(0.5)).current
  
  // Tagline card animations
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const taglineSlide = useRef(new Animated.Value(60)).current
  const taglineScale = useRef(new Animated.Value(0.85)).current
  
  // Button animations (staggered)
  const button1Opacity = useRef(new Animated.Value(0)).current
  const button1Slide = useRef(new Animated.Value(40)).current
  const button1Scale = useRef(new Animated.Value(0.9)).current
  
  const button2Opacity = useRef(new Animated.Value(0)).current
  const button2Slide = useRef(new Animated.Value(40)).current
  const button2Scale = useRef(new Animated.Value(0.9)).current
  
  // Footer animation
  const footerOpacity = useRef(new Animated.Value(0)).current
  
  // Ambient animations
  const floatingY1 = useRef(new Animated.Value(0)).current
  const floatingY2 = useRef(new Animated.Value(0)).current
  const floatingY3 = useRef(new Animated.Value(0)).current
  const glowPulse = useRef(new Animated.Value(0.2)).current
  const breathingScale = useRef(new Animated.Value(1)).current
  
  // Store animation references for cleanup
  const animationsRef = useRef<Animated.CompositeAnimation[]>([])

  // ========== Ambient Animations (Continuous) ==========
  useEffect(() => {
    // Clear any existing animations
    animationsRef.current.forEach(anim => anim.stop())
    animationsRef.current = []
    
    // Create floating animation 1
    const floating1 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY1, {
          toValue: -12,
          duration: PREMIUM_TIMING.ambient,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(floatingY1, {
          toValue: 12,
          duration: PREMIUM_TIMING.ambient,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    )
    
    // Create floating animation 2
    const floating2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY2, {
          toValue: -18,
          duration: PREMIUM_TIMING.ambient * 1.2,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(floatingY2, {
          toValue: 18,
          duration: PREMIUM_TIMING.ambient * 1.2,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    )
    
    // Create floating animation 3
    const floating3 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY3, {
          toValue: -8,
          duration: PREMIUM_TIMING.ambient * 0.8,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(floatingY3, {
          toValue: 8,
          duration: PREMIUM_TIMING.ambient * 0.8,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    )

    // Create glow pulse animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: PREMIUM_TIMING.ambient * 0.8,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.15,
          duration: PREMIUM_TIMING.ambient * 0.8,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    )
    
    // Create breathing animation
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.03,
          duration: PREMIUM_TIMING.ambient,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: PREMIUM_TIMING.ambient,
          easing: PREMIUM_EASING.gentleSine,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    )
    
    // Store references and start animations
    animationsRef.current = [floating1, floating2, floating3, glow, breathing]
    animationsRef.current.forEach(anim => anim.start())
    
    // Cleanup: stop all animations when component unmounts or tab loses focus
    return () => {
      animationsRef.current.forEach(anim => anim.stop())
      animationsRef.current = []
    }
  }, [])

  // ========== Entrance Animation Sequence ==========
  useEffect(() => {
    // Total animation duration: 1 second (1000ms)
    // 7 phases with ~140ms stagger = ~1000ms total
    const staggerDelay = 140
    
    // Phase 1: Logo (immediate)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        ...PREMIUM_SPRING.stiff,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 150,
        easing: PREMIUM_EASING.elegantOut,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 200,
        easing: PREMIUM_EASING.dramaticEntrance,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(logoGlow, {
        toValue: 1,
        duration: 200,
        easing: PREMIUM_EASING.elegantOut,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start()
    
    // Phase 2: Title + Badge (140ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(titleSlide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(titleScale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(badgeScale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay)
    
    // Phase 3: Subtitle (280ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(subtitleSlide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 2)
    
    // Phase 4: Tagline card (420ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(taglineSlide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(taglineScale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 3)
    
    // Phase 5: First button (560ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(button1Opacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(button1Slide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(button1Scale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 4)
    
    // Phase 6: Second button (700ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(button2Opacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(button2Slide, { toValue: 0, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(button2Scale, { toValue: 1, ...PREMIUM_SPRING.stiff, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()
    }, staggerDelay * 5)
    
    // Phase 7: Footer (840ms, completes ~1000ms)
    setTimeout(() => {
      Animated.timing(footerOpacity, { toValue: 1, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }).start()
    }, staggerDelay * 6)
  }, [])

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  })


  // ========== Desktop Layout ==========
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', flexDirection: 'row' }}>
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
          {/* Static Decorative Elements (No Animation) */}
          <View style={{ 
            position: 'absolute', 
            top: -100, 
            right: -100, 
            width: 400, 
            height: 400, 
            borderRadius: 200, 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }} />
          <View style={{ 
            position: 'absolute', 
            bottom: -150, 
            left: -150, 
            width: 500, 
            height: 500, 
            borderRadius: 250, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }} />
          <View style={{ 
            position: 'absolute', 
            top: '30%', 
            left: '8%', 
            width: 120, 
            height: 120, 
            borderRadius: 60, 
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          }} />
          <View style={{ 
            position: 'absolute', 
            bottom: '20%', 
            right: '15%', 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }} />

          <View style={{
            alignItems: 'center',
            zIndex: 1,
          }}>
            {/* Static Logo Container (More Rounded) */}
            <View style={{
              width: 200,
              height: 200,
              borderRadius: 70, // Increased from 50 for more rounded appearance
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              // @ts-ignore
              backdropFilter: isWeb ? 'blur(30px)' : undefined,
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 40,
            }}>
              <Image 
                source={Logo}
                style={{ width: 140, height: 140, resizeMode: 'contain' }}
              />
            </View>
            
            <View>
              <Text style={{
                fontSize: 56,
                fontWeight: '900',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 8,
                letterSpacing: -2,
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 4 },
                textShadowRadius: 15,
              }}>
                FMC APP
              </Text>
            </View>
            
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
              FMC App • Study Everywhere
            </Text>
          </View>
        </LinearGradient>

        {/* Right Side - Form */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          backgroundColor: '#ffffff',
        }}>
          <View style={{ width: '100%', maxWidth: 460 }}>
            <View>
              <Text style={{
                fontSize: 42,
                fontWeight: '900',
                color: BRAND_THEME.colors.gray[900],
                marginBottom: 12,
                letterSpacing: -1.5,
              }}>
                Bienvenue 👋
              </Text>
            </View>
            
            <Text style={{
              fontSize: 18,
              color: BRAND_THEME.colors.gray[500],
              marginBottom: 48,
              lineHeight: 28,
            }}>
              Connectez-vous 
            </Text>

            {/* Static Buttons */}
            <View style={{ marginBottom: 16 }}>
              <AnimatedButton 
                title="Créer un compte" 
                onPress={() => router.push('/(auth)/register')}
                variant="primary"
                size="lg"
              />
            </View>
            
            <View>
              <AnimatedButton 
                title="Se connecter" 
                onPress={() => router.push('/(auth)/login')}
                variant="secondary"
                size="lg"
              />
            </View>

            <Text style={{
              fontSize: 13,
              color: BRAND_THEME.colors.gray[400],
              textAlign: 'center',
              marginTop: 32,
            }}>
              🔒 Plateforme sécurisée • 🇩🇿 Curriculum français
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // ========== Mobile/Tablet Layout ==========
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ minHeight: '100%', paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
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
            transform: [{ translateY: floatingY1 }],
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
          <Animated.View style={{ 
            position: 'absolute', 
            top: '40%', 
            left: '5%', 
            width: 60, 
            height: 60, 
            borderRadius: 30, 
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            transform: [{ translateY: floatingY3 }],
          }} />

          {/* Logo */}
          <Animated.View style={{
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, breathingScale) },
              { rotate: logoSpin }
            ],
            marginBottom: 24,
          }}>
            <Animated.View style={{
              width: isTablet ? 130 : 110,
              height: isTablet ? 130 : 110,
              borderRadius: isTablet ? 45 : 38, // Increased from 32 for more rounded appearance
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 30,
            }}>
              <Image 
                source={Logo}
                style={{
                  width: isTablet ? 90 : 75,
                  height: isTablet ? 90 : 75,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>
          </Animated.View>
          
          <Animated.View style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }, { scale: titleScale }],
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: isTablet ? 52 : 44,
              fontWeight: '900',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -1.5,
              textShadowColor: 'rgba(0, 0, 0, 0.15)',
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 15,
            }}>
              FMC APP
            </Text>
          </Animated.View>
          
          <Animated.View style={{
            opacity: badgeOpacity,
            transform: [{ scale: badgeScale }],
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
          </Animated.View>
        </LinearGradient>

        {/* Content Section */}
        <View style={{ 
          width: '100%', 
          maxWidth: contentMaxWidth, 
          paddingHorizontal: 24,
          alignSelf: 'center',
          marginTop: -40,
        }}>
          {/* Tagline Card */}
          <Animated.View style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineSlide }, { scale: taglineScale }],
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
            marginBottom: 16,
            opacity: button1Opacity,
            transform: [{ translateY: button1Slide }, { scale: button1Scale }],
          }}>
            <AnimatedButton 
              title="Créer un compte" 
              onPress={() => router.push('/(auth)/register')}
              variant="primary"
              size="lg"
            />
          </Animated.View>
          
          <Animated.View style={{ 
            opacity: button2Opacity,
            transform: [{ translateY: button2Slide }, { scale: button2Scale }],
          }}>
            <AnimatedButton 
              title="Se connecter" 
              onPress={() => router.push('/(auth)/login')}
              variant="secondary"
              size="lg"
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ opacity: footerOpacity, marginTop: 40, marginBottom: 24 }}>
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
