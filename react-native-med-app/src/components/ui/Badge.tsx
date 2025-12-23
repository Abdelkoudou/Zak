// ============================================================================
// Badge Component - Light Sea Green Brand
// ============================================================================

import React from 'react'
import { View, Text, ViewStyle, TextStyle } from 'react-native'
import { BRAND_THEME } from '@/constants/theme'

interface BadgeProps {
  label: string
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: ViewStyle
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
}) => {
  const getBadgeStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      alignSelf: 'flex-start',
      borderRadius: BRAND_THEME.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    }

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: BRAND_THEME.spacing.xs,
        paddingVertical: 2,
        minHeight: 20,
      },
      md: {
        paddingHorizontal: BRAND_THEME.spacing.sm,
        paddingVertical: BRAND_THEME.spacing.xs,
        minHeight: 24,
      },
      lg: {
        paddingHorizontal: BRAND_THEME.spacing.md,
        paddingVertical: BRAND_THEME.spacing.xs,
        minHeight: 28,
      },
    }

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: BRAND_THEME.colors.primary[100],
      },
      secondary: {
        backgroundColor: BRAND_THEME.colors.primary[50],
      },
      success: {
        backgroundColor: BRAND_THEME.colors.success[100],
      },
      error: {
        backgroundColor: BRAND_THEME.colors.error[100],
      },
      warning: {
        backgroundColor: BRAND_THEME.colors.warning[100],
      },
      gray: {
        backgroundColor: BRAND_THEME.colors.gray[100],
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    }
  }

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: BRAND_THEME.typography.fontWeights.medium,
      textAlign: 'center',
    }

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: BRAND_THEME.typography.fontSizes.xs },
      md: { fontSize: BRAND_THEME.typography.fontSizes.sm },
      lg: { fontSize: BRAND_THEME.typography.fontSizes.base },
    }

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: BRAND_THEME.colors.primary[700],
      },
      secondary: {
        color: BRAND_THEME.colors.primary[600],
      },
      success: {
        color: BRAND_THEME.colors.success[600],
      },
      error: {
        color: BRAND_THEME.colors.error[600],
      },
      warning: {
        color: BRAND_THEME.colors.warning[600],
      },
      gray: {
        color: BRAND_THEME.colors.gray[600],
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  return (
    <View style={getBadgeStyles()} className={className}>
      <Text style={getTextStyles()}>{label}</Text>
    </View>
  )
}