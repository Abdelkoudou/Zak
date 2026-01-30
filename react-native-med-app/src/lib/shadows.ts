// ============================================================================
// Cross-Platform Shadow Utility
// Handles shadow styles for both native and web platforms
// ============================================================================

import { Platform, ViewStyle } from 'react-native';

interface ShadowConfig {
  color?: string;
  offset?: { width: number; height: number };
  opacity: number;
  radius: number;
  elevation?: number;
}

/**
 * Creates cross-platform shadow styles.
 * On web, uses CSS boxShadow. On native, uses React Native shadow props.
 */
export function createShadow({
  color = '#000',
  offset = { width: 0, height: 2 },
  opacity,
  radius,
  elevation = 3,
}: ShadowConfig): ViewStyle {
  if (Platform.OS === 'web') {
    // Convert to CSS boxShadow for web
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(0,0,0,${opacity})`,
    } as unknown as ViewStyle;
  }
  
  // Native shadow props
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/**
 * Predefined shadow presets for common use cases
 */
export const shadowPresets = {
  sm: (isDark = false): ViewStyle => createShadow({
    opacity: isDark ? 0.2 : 0.05,
    radius: 2,
    offset: { width: 0, height: 1 },
    elevation: 1,
  }),
  
  md: (isDark = false): ViewStyle => createShadow({
    opacity: isDark ? 0.3 : 0.1,
    radius: 4,
    offset: { width: 0, height: 2 },
    elevation: 3,
  }),
  
  lg: (isDark = false): ViewStyle => createShadow({
    opacity: isDark ? 0.4 : 0.15,
    radius: 8,
    offset: { width: 0, height: 4 },
    elevation: 6,
  }),
};
