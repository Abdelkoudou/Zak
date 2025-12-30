// ============================================================================
// Password Strength Indicator Component
// ============================================================================

import { View, Text, Animated } from 'react-native'
import { useEffect, useRef } from 'react'
import { getPasswordStrength, PasswordStrengthResult } from '@/lib/validation'
import { BRAND_THEME } from '@/constants/theme'

interface PasswordStrengthIndicatorProps {
  password: string
  show?: boolean
}

export function PasswordStrengthIndicator({ password, show = true }: PasswordStrengthIndicatorProps) {
  const widthAnim = useRef(new Animated.Value(0)).current
  
  const strength: PasswordStrengthResult = password ? getPasswordStrength(password) : {
    strength: 'weak',
    score: 0,
    label: '',
    color: BRAND_THEME.colors.gray[300]
  }
  
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: (strength.score / 4) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [strength.score])
  
  if (!show || !password) return null
  
  return (
    <View style={{ marginTop: 8 }}>
      {/* Progress bar */}
      <View style={{ 
        height: 4, 
        backgroundColor: BRAND_THEME.colors.gray[200], 
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <Animated.View 
          style={{ 
            height: '100%', 
            backgroundColor: strength.color,
            borderRadius: 2,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }} 
        />
      </View>
      
      {/* Label */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 12, color: strength.color, fontWeight: '500' }}>
          {strength.label}
        </Text>
        <Text style={{ fontSize: 11, color: BRAND_THEME.colors.gray[400] }}>
          {password.length}/8+ caractères
        </Text>
      </View>
      
      {/* Requirements hint */}
      {strength.score < 3 && (
        <Text style={{ 
          fontSize: 11, 
          color: BRAND_THEME.colors.gray[500], 
          marginTop: 4,
          lineHeight: 16
        }}>
          💡 Utilisez majuscules, minuscules, chiffres et caractères spéciaux
        </Text>
      )}
    </View>
  )
}

export default PasswordStrengthIndicator
