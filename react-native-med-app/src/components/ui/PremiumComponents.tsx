// ============================================================================
// Premium UI Components - Enhanced for Web
// ============================================================================

import { useRef, useEffect, useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  ViewStyle, 
  TextStyle,
  useWindowDimensions,
  Platform
} from 'react-native'
import { BRAND_THEME } from '@/constants/theme'

// ============================================================================
// Premium Card with Glassmorphism
// ============================================================================
interface PremiumCardProps {
  children: React.ReactNode
  variant?: 'default' | 'glass' | 'elevated' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  style?: ViewStyle
  onPress?: () => void
  animated?: boolean
}

export function PremiumCard({ 
  children, 
  variant = 'default', 
  padding = 'md',
  style,
  onPress,
  animated = true
}: PremiumCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isWeb = Platform.OS === 'web'

  const handlePressIn = () => {
    if (onPress && animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  const paddingStyles: Record<string, number> = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  }

  const getVariantStyles = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 20,
      overflow: 'hidden',
    }

    switch (variant) {
      case 'glass':
        return {
          ...base,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          // @ts-ignore - web styles
          ...(isWeb && {
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }),
          ...BRAND_THEME.shadows.lg,
        }
      case 'elevated':
        return {
          ...base,
          backgroundColor: '#ffffff',
          ...BRAND_THEME.shadows.lg,
        }
      case 'gradient':
        return {
          ...base,
          backgroundColor: '#09B2AD',
        }
      default:
        return {
          ...base,
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: BRAND_THEME.colors.gray[100],
          ...BRAND_THEME.shadows.sm,
        }
    }
  }

  const content = (
    <Animated.View style={[
      getVariantStyles(),
      { padding: paddingStyles[padding] },
      { transform: [{ scale: scaleAnim }] },
      // @ts-ignore - web styles
      isWeb && { transition: 'all 0.2s ease' },
      style,
    ]}>
      {children}
    </Animated.View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

// ============================================================================
// Premium Button
// ============================================================================
interface PremiumButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

export function PremiumButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: PremiumButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isWeb = Platform.OS === 'web'

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const sizeStyles: Record<string, { paddingH: number; paddingV: number; fontSize: number; height: number }> = {
    sm: { paddingH: 16, paddingV: 8, fontSize: 14, height: 40 },
    md: { paddingH: 24, paddingV: 12, fontSize: 16, height: 48 },
    lg: { paddingH: 32, paddingV: 16, fontSize: 18, height: 56 },
  }

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: 'rgba(9, 178, 173, 0.1)',
          },
          text: {
            color: '#09B2AD',
          },
        }
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: '#09B2AD',
          },
          text: {
            color: '#09B2AD',
          },
        }
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: BRAND_THEME.colors.gray[700],
          },
        }
      default:
        return {
          container: {
            backgroundColor: disabled ? BRAND_THEME.colors.gray[300] : '#09B2AD',
            shadowColor: '#09B2AD',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0 : 0.3,
            shadowRadius: 12,
            elevation: disabled ? 0 : 4,
          },
          text: {
            color: disabled ? BRAND_THEME.colors.gray[500] : '#ffffff',
          },
        }
    }
  }

  const styles = getVariantStyles()
  const sizeStyle = sizeStyles[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <Animated.View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: sizeStyle.paddingH,
          height: sizeStyle.height,
          borderRadius: 16,
          transform: [{ scale: scaleAnim }],
        },
        styles.container,
        fullWidth && { width: '100%' },
        // @ts-ignore - web styles
        isWeb && { 
          transition: 'all 0.2s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
        },
      ]}>
        {loading ? (
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: variant === 'primary' ? 'rgba(255,255,255,0.3)' : 'rgba(9,178,173,0.3)',
            borderTopColor: variant === 'primary' ? '#ffffff' : '#09B2AD',
          }} />
        ) : (
          <>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[
              {
                fontSize: sizeStyle.fontSize,
                fontWeight: '600',
              },
              styles.text,
            ]}>
              {title}
            </Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

// ============================================================================
// Stats Card
// ============================================================================
interface StatsCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color?: string
}

export function StatsCard({ label, value, icon, trend, color = '#09B2AD' }: StatsCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: isDesktop ? 24 : 16,
      flex: 1,
      minWidth: isDesktop ? 180 : 100,
      ...BRAND_THEME.shadows.md,
      borderWidth: 1,
      borderColor: BRAND_THEME.colors.gray[100],
    }}>
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: `${color}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}>
        {icon}
      </View>
      
      <Text style={{
        fontSize: isDesktop ? 28 : 24,
        fontWeight: '800',
        color: BRAND_THEME.colors.gray[900],
        marginBottom: 4,
        letterSpacing: -0.5,
      }}>
        {value}
      </Text>
      
      <Text style={{
        fontSize: 14,
        color: BRAND_THEME.colors.gray[500],
        fontWeight: '500',
      }}>
        {label}
      </Text>

      {trend && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: trend.isPositive ? BRAND_THEME.colors.success[500] : BRAND_THEME.colors.error[500],
          }}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
          <Text style={{
            fontSize: 12,
            color: BRAND_THEME.colors.gray[400],
            marginLeft: 4,
          }}>
            vs last week
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

// ============================================================================
// Module Card (Enhanced)
// ============================================================================
interface ModuleCardProps {
  name: string
  questionCount: number
  progress?: number
  onPress: () => void
}

export function ModuleCard({ name, questionCount, progress, onPress }: ModuleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: isDesktop ? 20 : 16,
        borderWidth: 1,
        borderColor: BRAND_THEME.colors.gray[100],
        ...BRAND_THEME.shadows.sm,
        // @ts-ignore - web styles
        ...(Platform.OS === 'web' && {
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{
              fontSize: isDesktop ? 18 : 16,
              fontWeight: '700',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 6,
              letterSpacing: -0.3,
            }} numberOfLines={2}>
              {name}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontSize: 14,
                color: BRAND_THEME.colors.gray[500],
                fontWeight: '500',
              }}>
                {questionCount} Questions
              </Text>
              
              {progress !== undefined && progress > 0 && (
                <View style={{
                  marginLeft: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <View style={{
                    width: 60,
                    height: 4,
                    backgroundColor: BRAND_THEME.colors.gray[100],
                    borderRadius: 2,
                    marginRight: 6,
                  }}>
                    <View style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: '#09B2AD',
                      borderRadius: 2,
                    }} />
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: '#09B2AD',
                    fontWeight: '600',
                  }}>
                    {progress}%
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={{
            backgroundColor: 'rgba(9, 178, 173, 0.1)',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 14,
          }}>
            <Text style={{
              color: '#09B2AD',
              fontWeight: '700',
              fontSize: 14,
            }}>
              Pratiquer →
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ============================================================================
// Section Header
// ============================================================================
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    }}>
      <View>
        <Text style={{
          fontSize: 22,
          fontWeight: '800',
          color: BRAND_THEME.colors.gray[900],
          letterSpacing: -0.5,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: BRAND_THEME.colors.gray[500],
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={{
            fontSize: 14,
            color: '#09B2AD',
            fontWeight: '600',
          }}>
            {action.label} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ============================================================================
// Empty State
// ============================================================================
interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: { label: string; onPress: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    }}>
      <Text style={{ fontSize: 64, marginBottom: 20 }}>{icon}</Text>
      <Text style={{
        fontSize: 20,
        fontWeight: '700',
        color: BRAND_THEME.colors.gray[900],
        marginBottom: 8,
        textAlign: 'center',
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 16,
        color: BRAND_THEME.colors.gray[500],
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
      }}>
        {description}
      </Text>
      
      {action && (
        <View style={{ marginTop: 24 }}>
          <PremiumButton
            title={action.label}
            onPress={action.onPress}
            variant="primary"
          />
        </View>
      )}
    </View>
  )
}

// ============================================================================
// Animated Counter
// ============================================================================
interface AnimatedCounterProps {
  value: number
  duration?: number
  style?: TextStyle
}

export function AnimatedCounter({ value, duration = 1000, style }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    animatedValue.setValue(0)
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start()

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v))
    })

    return () => {
      animatedValue.removeListener(listener)
    }
  }, [value, duration])

  return (
    <Text style={style}>
      {displayValue}
    </Text>
  )
}

export default {
  PremiumCard,
  PremiumButton,
  StatsCard,
  ModuleCard,
  SectionHeader,
  EmptyState,
  AnimatedCounter,
}
