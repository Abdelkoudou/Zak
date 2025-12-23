// ============================================================================
// Alert Component - Light Sea Green Brand
// ============================================================================

import React from 'react'
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native'
import { BRAND_THEME } from '@/constants/theme'

interface AlertProps {
  title?: string
  message: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  onClose?: () => void
  className?: string
  style?: ViewStyle
}

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  variant = 'info',
  onClose,
  className = '',
  style,
}) => {
  const getAlertStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: BRAND_THEME.borderRadius.md,
      padding: BRAND_THEME.spacing.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    }

    const variantStyles: Record<string, ViewStyle> = {
      info: {
        backgroundColor: BRAND_THEME.colors.primary[50],
        borderColor: BRAND_THEME.colors.primary[200],
      },
      success: {
        backgroundColor: BRAND_THEME.colors.success[50],
        borderColor: BRAND_THEME.colors.success[200],
      },
      warning: {
        backgroundColor: BRAND_THEME.colors.warning[50],
        borderColor: BRAND_THEME.colors.warning[200],
      },
      error: {
        backgroundColor: BRAND_THEME.colors.error[50],
        borderColor: BRAND_THEME.colors.error[200],
      },
    }

    return {
      ...baseStyles,
      ...variantStyles[variant],
      ...style,
    }
  }

  const getIconStyles = (): TextStyle => {
    const variantColors: Record<string, string> = {
      info: BRAND_THEME.colors.primary[500],
      success: BRAND_THEME.colors.success[500],
      warning: BRAND_THEME.colors.warning[500],
      error: BRAND_THEME.colors.error[500],
    }

    return {
      fontSize: BRAND_THEME.typography.fontSizes.lg,
      color: variantColors[variant],
      marginRight: BRAND_THEME.spacing.sm,
      marginTop: 2,
    }
  }

  const getTitleStyles = (): TextStyle => {
    const variantColors: Record<string, string> = {
      info: BRAND_THEME.colors.primary[800],
      success: BRAND_THEME.colors.success[800],
      warning: BRAND_THEME.colors.warning[800],
      error: BRAND_THEME.colors.error[800],
    }

    return {
      fontSize: BRAND_THEME.typography.fontSizes.base,
      fontWeight: BRAND_THEME.typography.fontWeights.semibold,
      color: variantColors[variant],
      marginBottom: BRAND_THEME.spacing.xs,
    }
  }

  const getMessageStyles = (): TextStyle => {
    const variantColors: Record<string, string> = {
      info: BRAND_THEME.colors.primary[700],
      success: BRAND_THEME.colors.success[700],
      warning: BRAND_THEME.colors.warning[700],
      error: BRAND_THEME.colors.error[700],
    }

    return {
      fontSize: BRAND_THEME.typography.fontSizes.sm,
      color: variantColors[variant],
      lineHeight: BRAND_THEME.typography.lineHeights.normal * BRAND_THEME.typography.fontSizes.sm,
    }
  }

  const getCloseButtonStyles = (): ViewStyle => ({
    marginLeft: 'auto',
    padding: BRAND_THEME.spacing.xs,
  })

  const getCloseButtonTextStyles = (): TextStyle => {
    const variantColors: Record<string, string> = {
      info: BRAND_THEME.colors.primary[500],
      success: BRAND_THEME.colors.success[500],
      warning: BRAND_THEME.colors.warning[500],
      error: BRAND_THEME.colors.error[500],
    }

    return {
      fontSize: BRAND_THEME.typography.fontSizes.lg,
      color: variantColors[variant],
      fontWeight: BRAND_THEME.typography.fontWeights.bold,
    }
  }

  const getIcon = () => {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }
    return icons[variant]
  }

  return (
    <View style={getAlertStyles()} className={className}>
      <Text style={getIconStyles()}>{getIcon()}</Text>
      
      <View style={{ flex: 1 }}>
        {title && <Text style={getTitleStyles()}>{title}</Text>}
        <Text style={getMessageStyles()}>{message}</Text>
      </View>
      
      {onClose && (
        <TouchableOpacity style={getCloseButtonStyles()} onPress={onClose}>
          <Text style={getCloseButtonTextStyles()}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}