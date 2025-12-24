// ============================================================================
// Button Component - Light Sea Green Brand
// ============================================================================

import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { COMPONENT_THEMES, BRAND_THEME } from '@/constants/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BRAND_THEME.borderRadius.md,
      ...BRAND_THEME.shadows.sm,
    }

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: BRAND_THEME.spacing.md,
        paddingVertical: BRAND_THEME.spacing.xs,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: BRAND_THEME.spacing.lg,
        paddingVertical: BRAND_THEME.spacing.sm,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: BRAND_THEME.spacing.xl,
        paddingVertical: BRAND_THEME.spacing.md,
        minHeight: 52,
      },
    }

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled 
          ? BRAND_THEME.colors.gray[300] 
          : COMPONENT_THEMES.button.primary.background,
      },
      secondary: {
        backgroundColor: disabled 
          ? BRAND_THEME.colors.gray[100] 
          : COMPONENT_THEMES.button.secondary.background,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled 
          ? BRAND_THEME.colors.gray[300] 
          : COMPONENT_THEMES.button.outline.border,
      },
      ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: BRAND_THEME.typography.fontWeights.semibold,
      textAlign: 'center',
    }

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: BRAND_THEME.typography.fontSizes.sm },
      md: { fontSize: BRAND_THEME.typography.fontSizes.base },
      lg: { fontSize: BRAND_THEME.typography.fontSizes.lg },
    }

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: disabled 
          ? BRAND_THEME.colors.gray[500] 
          : COMPONENT_THEMES.button.primary.text,
      },
      secondary: {
        color: disabled 
          ? BRAND_THEME.colors.gray[500] 
          : COMPONENT_THEMES.button.secondary.text,
      },
      outline: {
        color: disabled 
          ? BRAND_THEME.colors.gray[500] 
          : COMPONENT_THEMES.button.outline.text,
      },
      ghost: {
        color: disabled 
          ? BRAND_THEME.colors.gray[500] 
          : BRAND_THEME.colors.primary[600],
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={className}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#ffffff' : BRAND_THEME.colors.primary[500]} 
        />
      ) : (
        <>
          {icon && <Text style={{ marginRight: BRAND_THEME.spacing.xs }}>{icon}</Text>}
          <Text style={getTextStyles()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}