// ============================================================================
// Loading Spinner Component - Light Sea Green Brand
// ============================================================================

import React from 'react'
import { View, ActivityIndicator, Text, ViewStyle, TextStyle } from 'react-native'
import { BRAND_THEME } from '@/constants/theme'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  message?: string
  overlay?: boolean
  className?: string
  style?: ViewStyle
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = BRAND_THEME.colors.primary[500],
  message,
  overlay = false,
  className = '',
  style,
}) => {
  const getContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      padding: BRAND_THEME.spacing.lg,
    }

    if (overlay) {
      return {
        ...baseStyles,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1000,
        ...style,
      }
    }

    return {
      ...baseStyles,
      ...style,
    }
  }

  const getMessageStyles = (): TextStyle => ({
    fontSize: BRAND_THEME.typography.fontSizes.base,
    color: BRAND_THEME.colors.gray[600],
    marginTop: BRAND_THEME.spacing.md,
    textAlign: 'center',
  })

  return (
    <View style={getContainerStyles()} className={className}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={getMessageStyles()}>{message}</Text>}
    </View>
  )
}