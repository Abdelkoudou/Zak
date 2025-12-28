// ============================================================================
// Results Screen - Premium UI with Dark Mode Support
// ============================================================================

import { useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'
import { Card, FadeInView } from '@/components/ui'
import { ANIMATION_EASING } from '@/lib/animations'
import { Ionicons } from '@expo/vector-icons'
import { CorrectIcon, FalseIcon, FileIcon } from '@/components/icons/ResultIcons'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export default function ResultsScreen() {
  const { total, correct, score, time, moduleName } = useLocalSearchParams<{
    total: string
    correct: string
    score: string
    time: string
    moduleName: string
  }>()

  const { colors, isDark } = useTheme()

  const totalNum = parseInt(total || '0')
  const correctNum = parseInt(correct || '0')
  const scoreNum = parseFloat(score || '0')
  const timeNum = parseInt(time || '0')
  const incorrectNum = totalNum - correctNum

  const scoreScale = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current
  const celebrationOpacity = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      scoreScale.setValue(0)
      progressWidth.setValue(0)
      celebrationOpacity.setValue(0)

      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scoreScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start()

      Animated.timing(progressWidth, {
        toValue: (correctNum / totalNum) * 100,
        duration: 1000,
        delay: 600,
        easing: ANIMATION_EASING.premium,
        useNativeDriver: false,
      }).start()

      if (scoreNum >= 60) {
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(celebrationOpacity, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
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
      <Stack.Screen options={{ title: 'Résultat', headerBackVisible: false, headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }} />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
          {/* Score Circle */}
          <FadeInView animation="scale" delay={0}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Animated.View style={{
                transform: [{ scale: scoreScale }],
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.15,
                shadowRadius: 8,
                elevation: 5,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Ionicons name="book" size={48} color={colors.text} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.text }}>{scoreNum.toFixed(0)}%</Text>
              </Animated.View>
              
              <FadeInView animation="slideUp" delay={400}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 4 }}>{getScoreMessage()}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 16, textAlign: 'center' }}>{moduleName}</Text>
              </FadeInView>
            </View>
          </FadeInView>

          {/* Stats Cards */}
          <FadeInView animation="slideUp" delay={500}>
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <AnimatedStatItem label="Total" value={totalNum.toString()} icon={<FileIcon size={26} color={colors.text} />} delay={600} colors={colors} />
                <AnimatedStatItem label="Correctes" value={`${scoreNum.toFixed(0)}%`} icon={<CorrectIcon size={26} color={colors.text} />} delay={700} colors={colors} />
                <AnimatedStatItem label="Incorrectes" value={incorrectNum.toString()} icon={<FalseIcon size={26} color={colors.text} />} delay={800} colors={colors} />
              </View>
              
              <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.textMuted }}>Temps : </Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{formatTime(timeNum)}</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Progress Bar */}
          <FadeInView animation="slideUp" delay={700}>
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 8 }}>Progression</Text>
              
              <View style={{ height: 16, backgroundColor: colors.backgroundSecondary, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', marginBottom: 8 }}>
                <Animated.View style={{
                  height: '100%',
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                }} />
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.primary, fontSize: 14 }}>{correctNum} Correctes</Text>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{incorrectNum} Incorrectes</Text>
              </View>
            </View>
          </FadeInView>

          {/* Action Buttons */}
          <FadeInView animation="slideUp" delay={900}>
            <View style={{ gap: 12 }}>
              <AnimatedActionButton title="Pratiquer à nouveau" onPress={() => router.back()} variant="primary" colors={colors} />
              <AnimatedActionButton title="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} variant="ghost" colors={colors} />
            </View>
          </FadeInView>
        </View>
      </SafeAreaView>
    </>
  )
}

// Animated Stat Item
function AnimatedStatItem({ label, value, icon, delay = 0, colors }: { label: string; value: string; icon: React.ReactNode; delay?: number; colors: any }) {
  const scale = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      scale.setValue(0)
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, delay, useNativeDriver: USE_NATIVE_DRIVER }).start()
    }, [delay])
  )

  return (
    <Animated.View style={{ alignItems: 'center', flex: 1, transform: [{ scale }] }}>
      <View style={{ marginBottom: 4 }}>{icon}</View>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 2 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
    </Animated.View>
  )
}

// Animated Action Button
function AnimatedActionButton({ title, onPress, variant = 'primary', colors }: { title: string; onPress: () => void; variant?: 'primary' | 'ghost'; colors: any }) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => { Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: USE_NATIVE_DRIVER }).start() }
  const handlePressOut = () => { Animated.spring(scale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: USE_NATIVE_DRIVER }).start() }

  if (variant === 'ghost') {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity style={{ paddingVertical: 16, alignItems: 'center' }} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 16 }}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
