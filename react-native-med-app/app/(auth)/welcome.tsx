// ============================================================================
// Welcome Screen - Premium UI with Smooth Animations
// ============================================================================

import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, Image, Animated } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AnimatedButton, FadeInView } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

const Logo = require('@/assets/images/logo.png')

export default function WelcomeScreen() {
  const contentMaxWidth = 500

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleSlide = useRef(new Animated.Value(30)).current

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title animation
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          flex: 1, 
          width: '100%', 
          maxWidth: contentMaxWidth, 
          paddingHorizontal: 24, 
          paddingVertical: 40,
          justifyContent: 'center',
        }}>
          {/* Logo & Title Section */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            {/* Animated Logo */}
            <Animated.View style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              marginBottom: 32,
            }}>
              <View style={{
                width: 140,
                height: 140,
                borderRadius: 35,
                backgroundColor: 'rgba(9, 178, 173, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                ...BRAND_THEME.shadows.lg,
              }}>
                <Image 
                  source={Logo}
                  style={{
                    width: 100,
                    height: 100,
                    resizeMode: 'contain',
                  }}
                />
              </View>
            </Animated.View>
            
            {/* Animated Title */}
            <Animated.View style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleSlide }],
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 36,
                fontWeight: '800',
                color: BRAND_THEME.colors.gray[900],
                textAlign: 'center',
                marginBottom: 12,
                letterSpacing: -1,
              }}>
                FMC Study App
              </Text>
              
              <Text style={{
                fontSize: 18,
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 26,
              }}>
                Préparez vos examens médicaux{'\n'}avec confiance
              </Text>

              <View style={{
                backgroundColor: 'rgba(9, 178, 173, 0.1)',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 25,
              }}>
                <Text style={{
                  fontSize: 14,
                  color: '#09B2AD',
                  fontWeight: '600',
                  letterSpacing: 0.5,
                }}>
                  🇩🇿 Curriculum français • Étudiants algériens
                </Text>
              </View>
            </Animated.View>
          </View>

        
       

          {/* Action Buttons */}
          <FadeInView delay={800} animation="slideUp">
            <View style={{ gap: 12 }}>
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
            </View>
          </FadeInView>

          {/* Footer */}
          <FadeInView delay={1000} animation="fade">
            <Text style={{
              fontSize: 13,
              color: BRAND_THEME.colors.gray[400],
              textAlign: 'center',
              marginTop: 40,
            }}>
              Plateforme sécurisée pour étudiants en médecine
            </Text>
          </FadeInView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
