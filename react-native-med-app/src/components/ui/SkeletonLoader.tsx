// ============================================================================
// Skeleton Loader - Premium Loading States
// ============================================================================

import React, { useEffect, useRef } from 'react'
import { View, Animated, ViewStyle } from 'react-native'
import { BRAND_THEME } from '@/constants/theme'

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
  const shimmerValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
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
          backgroundColor: BRAND_THEME.colors.gray[200],
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
  return (
    <View
      style={[
        {
          backgroundColor: '#ffffff',
          borderRadius: 17,
          padding: 20,
          ...BRAND_THEME.shadows.sm,
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
  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 17,
        padding: 20,
        ...BRAND_THEME.shadows.lg,
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
