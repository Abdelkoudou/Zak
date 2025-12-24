// ============================================================================
// Input Component - Light Sea Green Brand
// ============================================================================

import React, { useState } from 'react'
import { View, TextInput, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native'
import { COMPONENT_THEMES, BRAND_THEME } from '@/constants/theme'

interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  error?: string
  disabled?: boolean
  secureTextEntry?: boolean
  multiline?: boolean
  numberOfLines?: number
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
  className?: string
  style?: ViewStyle
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const getContainerStyles = (): ViewStyle => ({
    marginBottom: BRAND_THEME.spacing.sm,
    ...style,
  })

  const getLabelStyles = (): TextStyle => ({
    fontSize: BRAND_THEME.typography.fontSizes.sm,
    fontWeight: BRAND_THEME.typography.fontWeights.medium,
    color: BRAND_THEME.colors.gray[700],
    marginBottom: BRAND_THEME.spacing.xs,
  })

  const getInputContainerStyles = (): ViewStyle => ({
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    borderWidth: 1,
    borderRadius: BRAND_THEME.borderRadius.md,
    backgroundColor: disabled 
      ? BRAND_THEME.colors.gray[50] 
      : COMPONENT_THEMES.input.default.background,
    borderColor: error 
      ? BRAND_THEME.colors.error[500]
      : isFocused 
        ? COMPONENT_THEMES.input.default.borderFocus
        : COMPONENT_THEMES.input.default.border,
    paddingHorizontal: BRAND_THEME.spacing.md,
    paddingVertical: multiline ? BRAND_THEME.spacing.md : BRAND_THEME.spacing.sm,
    minHeight: multiline ? 80 : 44,
  })

  const getInputStyles = (): TextStyle => ({
    flex: 1,
    fontSize: BRAND_THEME.typography.fontSizes.base,
    color: disabled 
      ? BRAND_THEME.colors.gray[500] 
      : COMPONENT_THEMES.input.default.text,
    textAlignVertical: multiline ? 'top' : 'center',
    paddingVertical: 0, // Remove default padding
  })

  const getErrorStyles = (): TextStyle => ({
    fontSize: BRAND_THEME.typography.fontSizes.sm,
    color: BRAND_THEME.colors.error[500],
    marginTop: BRAND_THEME.spacing.xs,
  })

  const getIconContainerStyles = (position: 'left' | 'right'): ViewStyle => ({
    marginLeft: position === 'right' ? BRAND_THEME.spacing.xs : 0,
    marginRight: position === 'left' ? BRAND_THEME.spacing.xs : 0,
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <View style={getContainerStyles()} className={className}>
      {label && <Text style={getLabelStyles()}>{label}</Text>}
      
      <View style={getInputContainerStyles()}>
        {leftIcon && (
          <View style={getIconContainerStyles('left')}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyles()}
          placeholder={placeholder}
          placeholderTextColor={COMPONENT_THEMES.input.default.placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={getIconContainerStyles('right')}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={getErrorStyles()}>{error}</Text>}
    </View>
  )
}