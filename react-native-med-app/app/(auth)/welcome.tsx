// ============================================================================
// Welcome Screen - Premium Landing Page Design
// ============================================================================

import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, Image, Animated, useWindowDimensions, Platform } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AnimatedButton, FadeInView } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

const Logo = require('@/assets/images/logo.png')

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions()
  const isWeb = Platform.OS === 'web'
  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const contentMaxWidth = isDesktop ? 1200 : 500

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleSlide = useRef(new Animated.Value(30)).current
  const featuresOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
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
      Animated.timing(featuresOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Desktop Layout
  if (isDesktop) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#ffffff',
        flexDirection: 'row',
      }}>
        {/* Left Side - Hero */}
        <View style={{
          flex: 1,
          backgroundColor: '#09B2AD',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative Elements */}
          <View style={{ 
            position: 'absolute', 
            top: -100, 
            right: -100, 
            width: 400, 
            height: 400, 
            borderRadius: 200, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)' 
          }} />
          <View style={{ 
            position: 'absolute', 
            bottom: -150, 
            left: -150, 
            width: 500, 
            height: 500, 
            borderRadius: 250, 
            backgroundColor: 'rgba(255, 255, 255, 0.03)' 
          }} />
          <View style={{ 
            position: 'absolute', 
            top: '40%', 
            left: '10%', 
            width: 100, 
            height: 100, 
            borderRadius: 50, 
            backgroundColor: 'rgba(255, 255, 255, 0.04)' 
          }} />

          <Animated.View style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            alignItems: 'center',
            zIndex: 1,
          }}>
            <View style={{
              width: 180,
              height: 180,
              borderRadius: 45,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              // @ts-ignore
              backdropFilter: isWeb ? 'blur(20px)' : undefined,
            }}>
              <Image 
                source={Logo}
                style={{ width: 120, height: 120, resizeMode: 'contain' }}
              />
            </View>
            
            <Text style={{
              fontSize: 48,
              fontWeight: '800',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: -1,
            }}>
              FMC Study App
            </Text>
            
            <Text style={{
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.85)',
              textAlign: 'center',
              lineHeight: 30,
              maxWidth: 400,
            }}>
              La plateforme de préparation aux examens médicaux pour les étudiants algériens
            </Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View style={{
            opacity: featuresOpacity,
            flexDirection: 'row',
            marginTop: 60,
            gap: 40,
          }}>
            <StatBadge value="5000+" label="Questions" />
            <StatBadge value="50+" label="Modules" />
            <StatBadge value="3" label="Années" />
          </Animated.View>
        </View>

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
            maxWidth: 440,
          }}>
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 12,
              letterSpacing: -1,
            }}>
              Bienvenue 👋
            </Text>
            
            <Text style={{
              fontSize: 18,
              color: BRAND_THEME.colors.gray[500],
              marginBottom: 48,
              lineHeight: 28,
            }}>
              Connectez-vous pour accéder à vos cours et commencer à pratiquer
            </Text>

            {/* Features */}
            <View style={{ marginBottom: 48 }}>
              <FeatureItem 
                icon="📚" 
                title="Questions par module" 
                description="Organisées par année et type d'examen"
              />
              <FeatureItem 
                icon="📊" 
                title="Suivi de progression" 
                description="Statistiques détaillées de vos performances"
              />
              <FeatureItem 
                icon="💾" 
                title="Sauvegarde" 
                description="Gardez vos questions difficiles pour plus tard"
              />
            </View>

            {/* Buttons */}
            <View style={{ gap: 16 }}>
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

            <Text style={{
              fontSize: 13,
              color: BRAND_THEME.colors.gray[400],
              textAlign: 'center',
              marginTop: 32,
            }}>
              🔒 Plateforme sécurisée • 🇩🇿 Curriculum français
            </Text>
          </Animated.View>
        </View>
      </View>
    )
  }

  // Mobile/Tablet Layout
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
            <Animated.View style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              marginBottom: 32,
            }}>
              <View style={{
                width: isTablet ? 160 : 140,
                height: isTablet ? 160 : 140,
                borderRadius: 40,
                backgroundColor: 'rgba(9, 178, 173, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                ...BRAND_THEME.shadows.lg,
              }}>
                <Image 
                  source={Logo}
                  style={{
                    width: isTablet ? 110 : 100,
                    height: isTablet ? 110 : 100,
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
                fontSize: isTablet ? 42 : 36,
                fontWeight: '800',
                color: BRAND_THEME.colors.gray[900],
                textAlign: 'center',
                marginBottom: 12,
                letterSpacing: -1,
              }}>
                FMC Study App
              </Text>
              
              <Text style={{
                fontSize: isTablet ? 20 : 18,
                color: BRAND_THEME.colors.gray[500],
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 28,
              }}>
                Préparez vos examens médicaux{'\n'}avec confiance
              </Text>

              <View style={{
                backgroundColor: 'rgba(9, 178, 173, 0.1)',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 30,
              }}>
                <Text style={{
                  fontSize: 14,
                  color: '#09B2AD',
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }}>
                  🇩🇿 Curriculum français • Étudiants algériens
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Features (Tablet) */}
          {isTablet && (
            <Animated.View style={{ 
              opacity: featuresOpacity,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 24,
              marginBottom: 48,
            }}>
              <MiniFeature icon="📚" label="5000+ QCM" />
              <MiniFeature icon="📊" label="Statistiques" />
              <MiniFeature icon="💾" label="Sauvegarde" />
            </Animated.View>
          )}

          {/* Action Buttons */}
          <FadeInView delay={800} animation="slideUp">
            <View style={{ gap: 14 }}>
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
              🔒 Plateforme sécurisée pour étudiants en médecine
            </Text>
          </FadeInView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Stat Badge (Desktop)
function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
      }}>
        {label}
      </Text>
    </View>
  )
}

// Feature Item (Desktop)
function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'flex-start',
      marginBottom: 20,
    }}>
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(9, 178, 173, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
      }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '700',
          color: BRAND_THEME.colors.gray[900],
          marginBottom: 4,
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: 14,
          color: BRAND_THEME.colors.gray[500],
          lineHeight: 20,
        }}>
          {description}
        </Text>
      </View>
    </View>
  )
}

// Mini Feature (Tablet)
function MiniFeature({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{
      backgroundColor: BRAND_THEME.colors.gray[50],
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      minWidth: 120,
    }}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>{icon}</Text>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: BRAND_THEME.colors.gray[700],
      }}>
        {label}
      </Text>
    </View>
  )
}
