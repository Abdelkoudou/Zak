// ============================================================================
// Skeleton Loader - Premium Loading States with Dark Mode
// ============================================================================

import React, { useEffect, useRef } from 'react'
import { View, Animated, ViewStyle, Platform } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme()
  const shimmerValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [])

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  )
}

// ============================================================================
// Card Skeleton - For module cards
// ============================================================================

export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors, isDark } = useTheme()
  
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 17,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={16} />
        </View>
        <Skeleton width={100} height={40} borderRadius={15} />
      </View>
    </View>
  )
}

// ============================================================================
// Stats Skeleton - For stats cards
// ============================================================================

export const StatsSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme()
  
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 17,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
            <Skeleton width={50} height={20} style={{ marginBottom: 4 }} />
            <Skeleton width={70} height={14} />
          </View>
        ))}
      </View>
    </View>
  )
}

// ============================================================================
// List Skeleton - For lists
// ============================================================================

interface ListSkeletonProps {
  count?: number
  style?: ViewStyle
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3, style }) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} style={{ marginBottom: 12 }} />
      ))}
    </View>
  )
}
