// ============================================================================
// Premium Header Component - Animated Gradient Header
// ============================================================================

import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BRAND_THEME } from '@/constants/theme'
import { Badge } from './Badge'

interface PremiumHeaderProps {
  title: string
  subtitle?: string
  badges?: { label: string; variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' }[]
  rightContent?: React.ReactNode
  style?: ViewStyle
  compact?: boolean
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  subtitle,
  badges,
  rightContent,
  style,
  compact = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View
      style={[
        {
          backgroundColor: '#09B2AD',
          width: '100%',
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          paddingTop: compact ? 24 : 48,
          paddingBottom: compact ? 40 : 80,
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Subtitle */}
        {subtitle && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 16,
              fontWeight: '500',
              marginBottom: 4,
            }}
          >
            {subtitle}
          </Text>
        )}

        {/* Title Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              color: '#ffffff',
              fontSize: compact ? 24 : 28,
              fontWeight: 'bold',
              flex: 1,
            }}
          >
            {title}
          </Text>
          {rightContent}
        </View>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {badges.map((badge, index) => (
              <Badge
                key={index}
                label={badge.label}
                variant={badge.variant || 'secondary'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: 15,
                  paddingHorizontal: 12,
                }}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  )
}

// ============================================================================
// Simple Header - For inner screens
// ============================================================================

interface SimpleHeaderProps {
  title: string
  onBack?: () => void
  rightContent?: React.ReactNode
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  title,
  onBack,
  rightContent,
}) => {
  return (
    <View
      style={{
        backgroundColor: '#09B2AD',
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 24,
              marginRight: 16,
            }}
            onPress={onBack}
          >
            ←
          </Text>
        )}
        <Text
          style={{
            color: '#ffffff',
            fontSize: 20,
            fontWeight: '700',
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {rightContent}
    </View>
  )
}
