// ============================================================================
// Animated Card Component - Premium UI with Smooth Animations
// ============================================================================

import React, { useEffect, useRef } from 'react'
import { Animated, TouchableOpacity, ViewStyle, Pressable } from 'react-native'
import { COMPONENT_THEMES, BRAND_THEME } from '@/constants/theme'
import { 
  createFadeIn, 
  createSlideUp, 
  createScalePress,
  ANIMATION_DURATION,
  INITIAL_VALUES 
} from '@/lib/animations'

interface AnimatedCardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outline' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onPress?: () => void
  delay?: number
  animateOnMount?: boolean
  style?: ViewStyle
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  delay = 0,
  animateOnMount = true,
  style,
}) => {
  // Animation values
  const opacity = useRef(new Animated.Value(animateOnMount ? 0 : 1)).current
  const translateY = useRef(new Animated.Value(animateOnMount ? INITIAL_VALUES.slideUp : 0)).current
  const scale = useRef(new Animated.Value(1)).current

  // Mount animation
  useEffect(() => {
    if (animateOnMount) {
      createSlideUp(translateY, opacity, ANIMATION_DURATION.normal, delay).start()
    }
  }, [animateOnMount, delay])

  // Press handlers
  const handlePressIn = () => {
    if (onPress) {
      createScalePress(scale, INITIAL_VALUES.scalePressed).start()
    }
  }

  const handlePressOut = () => {
    if (onPress) {
      createScalePress(scale, 1).start()
    }
  }

  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: BRAND_THEME.borderRadius.xl,
      overflow: 'hidden',
    }

    const paddingStyles: Record<string, ViewStyle> = {
      none: {},
      sm: { padding: BRAND_THEME.spacing.sm },
      md: { padding: BRAND_THEME.spacing.md },
      lg: { padding: BRAND_THEME.spacing.lg },
    }

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: BRAND_THEME.colors.gray[100],
        ...BRAND_THEME.shadows.sm,
      },
      elevated: {
        backgroundColor: '#ffffff',
        ...BRAND_THEME.shadows.lg,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: BRAND_THEME.colors.primary[200],
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...BRAND_THEME.shadows.md,
      },
    }

    return {
      ...baseStyles,
      ...paddingStyles[padding],
      ...variantStyles[variant],
      ...style,
    }
  }

  const animatedStyle = {
    opacity,
    transform: [
      { translateY },
      { scale },
    ],
  }

  const CardContent = (
    <Animated.View style={[getCardStyles(), animatedStyle]}>
      {children}
    </Animated.View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {CardContent}
      </Pressable>
    )
  }

  return CardContent
}
