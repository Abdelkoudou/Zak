// ============================================================================
// Confirm Modal - Beautiful cross-platform confirmation dialog
// ============================================================================

import React, { useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Platform,
  Dimensions,
  Pressable
} from 'react-native'
import { useTheme } from '@/context/ThemeContext'

const USE_NATIVE_DRIVER = Platform.OS !== 'web'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  icon?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  icon = '⚠️',
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark } = useTheme()
  
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0.8)).current
  const modalOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start()
    } else {
      backdropOpacity.setValue(0)
      modalScale.setValue(0.8)
      modalOpacity.setValue(0)
    }
  }, [visible])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => onCancel())
  }

  const handleConfirm = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => onConfirm())
  }

  const isDestructive = variant === 'destructive'
  const confirmBgColor = isDestructive ? colors.error : colors.primary
  const confirmTextColor = '#ffffff'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable 
        style={{ flex: 1 }}
        onPress={handleClose}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
            opacity: backdropOpacity,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 24,
                width: Math.min(SCREEN_WIDTH - 48, 400),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.5 : 0.25,
                shadowRadius: 20,
                elevation: 10,
                borderWidth: 1,
                borderColor: colors.border,
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              }}
            >
              {/* Icon */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: isDestructive ? colors.errorLight : colors.warningLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{icon}</Text>
                </View>
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.text,
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textMuted,
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: 24,
                }}
              >
                {message}
              </Text>

              {/* Buttons */}
              <View style={{ gap: 12 }}>
                {/* Confirm Button */}
                <TouchableOpacity
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: confirmBgColor,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: confirmTextColor,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
