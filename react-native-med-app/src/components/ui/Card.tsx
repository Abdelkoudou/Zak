// ============================================================================
// Card Component - Light Sea Green Brand
// ============================================================================

import React from 'react'
import { View, ViewStyle } from 'react-native'
import { COMPONENT_THEMES, BRAND_THEME } from '@/constants/theme'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  style?: ViewStyle
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  style,
}) => {
  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: BRAND_THEME.borderRadius.lg,
      overflow: 'hidden',
    }

    // Padding styles
    const paddingStyles: Record<string, ViewStyle> = {
      none: {},
      sm: { padding: BRAND_THEME.spacing.sm },
      md: { padding: BRAND_THEME.spacing.md },
      lg: { padding: BRAND_THEME.spacing.lg },
    }

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: COMPONENT_THEMES.card.default.background,
        borderWidth: 1,
        borderColor: COMPONENT_THEMES.card.default.border,
        ...COMPONENT_THEMES.card.default.shadow,
      },
      elevated: {
        backgroundColor: COMPONENT_THEMES.card.elevated.background,
        ...COMPONENT_THEMES.card.elevated.shadow,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: BRAND_THEME.colors.primary[200],
      },
    }

    return {
      ...baseStyles,
      ...paddingStyles[padding],
      ...variantStyles[variant],
      ...style,
    }
  }

  return (
    <View style={getCardStyles()} className={className}>
      {children}
    </View>
  )
}