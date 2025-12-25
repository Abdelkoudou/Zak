// ============================================================================
// Results Screen - Light Sea Green Brand (Premium Animations)
// ============================================================================

import { useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router'
import { Card, Button, FadeInView, StaggeredList } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'
import { Ionicons } from '@expo/vector-icons'
import { CorrectIcon, FalseIcon, FileIcon } from '@/components/icons/ResultIcons'

export default function ResultsScreen() {
  const { total, correct, score, time, moduleName } = useLocalSearchParams<{
    total: string
    correct: string
    score: string
    time: string
    moduleName: string
  }>()

  const totalNum = parseInt(total || '0')
  const correctNum = parseInt(correct || '0')
  const scoreNum = parseFloat(score || '0')
  const timeNum = parseInt(time || '0')
  const incorrectNum = totalNum - correctNum

  // Animation values
  const scoreScale = useRef(new Animated.Value(0)).current
  const scoreRotate = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current
  const celebrationOpacity = useRef(new Animated.Value(0)).current

  // Run animations on focus
  useFocusEffect(
    useCallback(() => {
      // Reset animations
      scoreScale.setValue(0)
      scoreRotate.setValue(0)
      progressWidth.setValue(0)
      celebrationOpacity.setValue(0)

      // Score circle entrance with bounce
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Progress bar animation
      Animated.timing(progressWidth, {
        toValue: (correctNum / totalNum) * 100,
        duration: 1000,
        delay: 600,
        easing: ANIMATION_EASING.premium,
        useNativeDriver: false,
      }).start()

      // Celebration for good scores
      if (scoreNum >= 60) {
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(celebrationOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start()
      }
    }, [])
  )

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  const getScoreMessage = () => {
    if (scoreNum >= 80) return 'Excellent travail !'
    if (scoreNum >= 60) return 'Bon travail !'
    if (scoreNum >= 40) return 'Continuez vos efforts !'
    return 'Révisez et réessayez !'
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Résultat', headerBackVisible: false }} />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
          {/* Score Circle - Animated */}
          <FadeInView animation="scale" delay={0}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Animated.View style={{
                transform: [{ scale: scoreScale }],
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                ...BRAND_THEME.shadows.lg
              }}>
                <Ionicons 
                  name="book" 
                  size={48} 
                  color={BRAND_THEME.colors.gray[900]} 
                  style={{ marginBottom: 8 }}
                />
                <Text style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: BRAND_THEME.colors.gray[900]
                }}>
                  {scoreNum.toFixed(0)}%
                </Text>
              </Animated.View>
              
              <FadeInView animation="slideUp" delay={400}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 4
                }}>
                  {getScoreMessage()}
                </Text>
                <Text style={{
                  color: BRAND_THEME.colors.gray[600],
                  fontSize: 16,
                  textAlign: 'center'
                }}>
                  {moduleName}
                </Text>
              </FadeInView>
            </View>
          </FadeInView>

          {/* Stats Cards - Staggered Animation */}
          <FadeInView animation="slideUp" delay={500}>
            <Card variant="default" padding="md" style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <AnimatedStatItem 
                  label="Total" 
                  value={totalNum.toString()} 
                  icon={<FileIcon size={24} color={BRAND_THEME.colors.gray[900]} />}
                  delay={600}
                />
                <AnimatedStatItem 
                  label="Correctes" 
                  value={`${scoreNum.toFixed(0)}%`} 
                  icon={<CorrectIcon size={24} color={BRAND_THEME.colors.gray[900]} />}
                  delay={700}
                />
                <AnimatedStatItem 
                  label="Incorrectes" 
                  value={incorrectNum.toString()} 
                  icon={<FalseIcon size={24} color={BRAND_THEME.colors.gray[900]} />}
                  delay={800}
                />
              </View>
              
              <View style={{
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: BRAND_THEME.colors.gray[100],
                alignItems: 'center'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={20} color={BRAND_THEME.colors.gray[600]} style={{ marginRight: 8 }} />
                  <Text style={{ color: BRAND_THEME.colors.gray[600] }}>Temps : </Text>
                  <Text style={{
                    color: BRAND_THEME.colors.gray[900],
                    fontWeight: '600'
                  }}>
                    {formatTime(timeNum)}
                  </Text>
                </View>
              </View>
            </Card>
          </FadeInView>

          {/* Progress Bar - Animated */}
          <FadeInView animation="slideUp" delay={700}>
            <Card variant="default" padding="md" style={{ marginBottom: 32 }}>
              <Text style={{
                color: BRAND_THEME.colors.gray[600],
                fontSize: 14,
                marginBottom: 8
              }}>
                Progression
              </Text>
              
              <View style={{
                height: 16,
                backgroundColor: BRAND_THEME.colors.gray[100],
                borderRadius: 8,
                overflow: 'hidden',
                flexDirection: 'row',
                marginBottom: 8
              }}>
                <Animated.View style={{
                  height: '100%',
                  backgroundColor: BRAND_THEME.colors.primary[500],
                  borderRadius: 8,
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }} />
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{
                  color: BRAND_THEME.colors.primary[600],
                  fontSize: 14
                }}>
                  {correctNum} Correctes
                </Text>
                <Text style={{
                  color: BRAND_THEME.colors.gray[500],
                  fontSize: 14
                }}>
                  {incorrectNum} Incorrectes
                </Text>
              </View>
            </Card>
          </FadeInView>

          {/* Action Buttons - Animated */}
          <FadeInView animation="slideUp" delay={900}>
            <View style={{ gap: 12 }}>
              <AnimatedActionButton 
                title="Pratiquer à nouveau"
                onPress={() => router.back()}
                variant="primary"
              />

              <AnimatedActionButton 
                title="Retour à l'accueil"
                onPress={() => router.replace('/(tabs)')}
                variant="ghost"
              />
            </View>
          </FadeInView>
        </View>
      </SafeAreaView>
    </>
  )
}

// Animated Stat Item Component
function AnimatedStatItem({ 
  label, 
  value, 
  icon,
  delay = 0
}: { 
  label: string
  value: string
  icon: React.ReactNode
  delay?: number
}) {
  const scale = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      scale.setValue(0)
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        delay,
        useNativeDriver: true,
      }).start()
    }, [delay])
  )

  return (
    <Animated.View style={{ 
      alignItems: 'center', 
      flex: 1,
      transform: [{ scale }]
    }}>
      <View style={{ marginBottom: 4 }}>{icon}</View>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: BRAND_THEME.colors.gray[900],
        marginBottom: 2
      }}>
        {value}
      </Text>
      <Text style={{
        color: BRAND_THEME.colors.gray[600],
        fontSize: 12
      }}>
        {label}
      </Text>
    </Animated.View>
  )
}

// Animated Action Button
function AnimatedActionButton({
  title,
  onPress,
  variant = 'primary'
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'ghost'
}) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start()
  }

  if (variant === 'ghost') {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={{ paddingVertical: 16, alignItems: 'center' }}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Text style={{
            color: BRAND_THEME.colors.gray[700],
            fontWeight: '600',
            fontSize: 16
          }}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={{
          backgroundColor: BRAND_THEME.colors.primary[500],
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          ...BRAND_THEME.shadows.md
        }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={{
          color: '#ffffff',
          fontWeight: '600',
          fontSize: 16
        }}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
