// ============================================================================
// Animated Button Component - Ultra Premium Press Effects
// ============================================================================

import React, { useRef } from 'react'
import { 
  Animated, 
  Pressable, 
  Text, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  View 
} from 'react-native'
import { BRAND_THEME } from '@/constants/theme'
import { PREMIUM_SPRING } from '@/lib/premiumAnimations'

interface AnimatedButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  style?: ViewStyle
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current
  const shadowOpacity = useRef(new Animated.Value(variant === 'primary' ? 0.15 : 0)).current

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 0.96,
          ...PREMIUM_SPRING.snappy,
          useNativeDriver: true,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0.05,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        ...PREMIUM_SPRING.bouncy,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: variant === 'primary' ? 0.15 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BRAND_THEME.borderRadius.lg,
      overflow: 'hidden',
    }

    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: BRAND_THEME.spacing.md,
        paddingVertical: BRAND_THEME.spacing.sm,
        minHeight: 40,
      },
      md: {
        paddingHorizontal: BRAND_THEME.spacing.lg,
        paddingVertical: BRAND_THEME.spacing.md,
        minHeight: 52,
      },
      lg: {
        paddingHorizontal: BRAND_THEME.spacing.xl,
        paddingVertical: BRAND_THEME.spacing.md + 4,
        minHeight: 60,
      },
    }

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled 
          ? BRAND_THEME.colors.gray[300] 
          : '#09B2AD',
        ...BRAND_THEME.shadows.md,
      },
      secondary: {
        backgroundColor: disabled 
          ? BRAND_THEME.colors.gray[100] 
          : 'rgba(9, 178, 173, 0.15)',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: disabled 
          ? BRAND_THEME.colors.gray[300] 
          : '#09B2AD',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth ? { width: '100%' } : {}),
      ...style,
    }
  }

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.3,
    }

    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    }

    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: disabled ? BRAND_THEME.colors.gray[500] : '#ffffff',
      },
      secondary: {
        color: disabled ? BRAND_THEME.colors.gray[500] : '#09B2AD',
      },
      outline: {
        color: disabled ? BRAND_THEME.colors.gray[500] : '#09B2AD',
      },
      ghost: {
        color: disabled ? BRAND_THEME.colors.gray[500] : '#09B2AD',
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#ffffff' : '#09B2AD'} 
        />
      )
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && iconPosition === 'left' && icon}
        <Text style={getTextStyles()}>{title}</Text>
        {icon && iconPosition === 'right' && icon}
      </View>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View style={[getButtonStyles(), { transform: [{ scale }] }]}>
        {renderContent()}
      </Animated.View>
    </Pressable>
  )
}
