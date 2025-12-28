// ============================================================================
// Premium Animation System - Ultra Smooth, Stunning Animations
// Creates a jaw-dropping, premium user experience
// ============================================================================

import { Animated, Easing, Platform } from 'react-native'

// Use native driver only on native platforms, not on web
// CRITICAL: This must be used in ALL animation calls to prevent web warnings
export const USE_NATIVE_DRIVER = Platform.OS !== 'web'

// ============================================================================
// Premium Timing Constants - Carefully Tuned for Delight
// ============================================================================

export const PREMIUM_TIMING = {
  // Ultra-fast micro-interactions
  micro: 80,
  // Quick but noticeable
  quick: 120,
  // Standard smooth transitions
  smooth: 180,
  // Elegant, deliberate animations
  elegant: 250,
  // Dramatic entrance animations
  dramatic: 350,
  // Slow, luxurious reveals
  luxurious: 450,
  // Continuous ambient animations
  ambient: 2000,
} as const

// ============================================================================
// Premium Easing Curves - Buttery Smooth Motion
// ============================================================================

export const PREMIUM_EASING = {
  // Apple-style smooth deceleration
  appleSmooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  // Material Design standard
  materialStandard: Easing.bezier(0.4, 0, 0.2, 1),
  // Dramatic entrance with overshoot
  dramaticEntrance: Easing.bezier(0.34, 1.56, 0.64, 1),
  // Soft bounce effect
  softBounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  // Elegant ease out
  elegantOut: Easing.bezier(0.16, 1, 0.3, 1),
  // Snappy response
  snappy: Easing.bezier(0.2, 0, 0, 1),
  // Gentle sine wave for ambient
  gentleSine: Easing.inOut(Easing.sin),
  // Exponential for dramatic reveals
  exponentialOut: Easing.out(Easing.exp),
  // Circular for smooth loops
  circularInOut: Easing.inOut(Easing.circle),
} as const

// ============================================================================
// Premium Spring Configurations
// ============================================================================

export const PREMIUM_SPRING = {
  // Gentle, elegant spring
  gentle: { friction: 8, tension: 60 },
  // Responsive, snappy spring
  snappy: { friction: 6, tension: 140 },
  // Bouncy, playful spring
  bouncy: { friction: 4, tension: 120 },
  // Stiff, precise spring
  stiff: { friction: 10, tension: 250 },
  // Wobbly, fun spring
  wobbly: { friction: 3, tension: 80 },
} as const

// ============================================================================
// Premium Animation Creators
// ============================================================================

/**
 * Creates a stunning logo entrance animation
 * - Scales from small with rotation
 * - Fades in with glow effect
 */
export function createLogoEntrance(
  scale: Animated.Value,
  opacity: Animated.Value,
  rotate: Animated.Value
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.spring(scale, {
      toValue: 1,
      ...PREMIUM_SPRING.bouncy,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: PREMIUM_TIMING.elegant,
      easing: PREMIUM_EASING.elegantOut,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.timing(rotate, {
      toValue: 1,
      duration: PREMIUM_TIMING.dramatic,
      easing: PREMIUM_EASING.dramaticEntrance,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
  ])
}

/**
 * Creates a premium text reveal animation
 * - Slides up with fade
 * - Uses elegant easing
 */
export function createTextReveal(
  opacity: Animated.Value,
  translateY: Animated.Value,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: PREMIUM_TIMING.smooth,
      delay,
      easing: PREMIUM_EASING.elegantOut,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.spring(translateY, {
      toValue: 0,
      delay,
      ...PREMIUM_SPRING.gentle,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
  ])
}

/**
 * Creates a button entrance with subtle bounce
 */
export function createButtonEntrance(
  opacity: Animated.Value,
  translateY: Animated.Value,
  scale: Animated.Value,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: PREMIUM_TIMING.smooth,
      delay,
      easing: PREMIUM_EASING.appleSmooth,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.spring(translateY, {
      toValue: 0,
      delay,
      ...PREMIUM_SPRING.snappy,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.spring(scale, {
      toValue: 1,
      delay,
      ...PREMIUM_SPRING.gentle,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
  ])
}

/**
 * Creates a floating ambient animation
 * - Gentle up/down movement
 * - Perfect for decorative elements
 */
export function createFloatingAnimation(
  translateY: Animated.Value,
  amplitude = 10
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -amplitude,
        duration: PREMIUM_TIMING.ambient,
        easing: PREMIUM_EASING.gentleSine,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateY, {
        toValue: amplitude,
        duration: PREMIUM_TIMING.ambient,
        easing: PREMIUM_EASING.gentleSine,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ])
  )
}

/**
 * Creates a pulsing glow animation
 * - Opacity pulses for glow effect
 */
export function createGlowPulse(
  opacity: Animated.Value,
  minOpacity = 0.2,
  maxOpacity = 0.6
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: maxOpacity,
        duration: PREMIUM_TIMING.ambient * 0.8,
        easing: PREMIUM_EASING.gentleSine,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacity, {
        toValue: minOpacity,
        duration: PREMIUM_TIMING.ambient * 0.8,
        easing: PREMIUM_EASING.gentleSine,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ])
  )
}

/**
 * Creates a scale breathing animation
 * - Subtle scale pulse for living feel
 */
export function createBreathingAnimation(
  scale: Animated.Value,
  minScale = 0.98,
  maxScale = 1.02
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(scale, {
        toValue: maxScale,
        duration: PREMIUM_TIMING.ambient,
        easing: PREMIUM_EASING.gentleSine,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(scale, {
        toValue: minScale,
        duration: PREMIUM_TIMING.ambient,
        easing: PREMIUM_EASING.gentleSine,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ])
  )
}

/**
 * Creates a shimmer/sparkle animation
 */
export function createShimmerAnimation(
  translateX: Animated.Value,
  width: number
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: width,
        duration: PREMIUM_TIMING.luxurious * 2,
        easing: PREMIUM_EASING.appleSmooth,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateX, {
        toValue: -width,
        duration: 0,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ])
  )
}

/**
 * Creates a premium press animation for buttons
 */
export function createPremiumPress(
  scale: Animated.Value,
  pressed: boolean
): Animated.CompositeAnimation {
  return Animated.spring(scale, {
    toValue: pressed ? 0.95 : 1,
    ...PREMIUM_SPRING.snappy,
    useNativeDriver: USE_NATIVE_DRIVER,
  })
}

/**
 * Creates a card entrance animation
 */
export function createCardEntrance(
  opacity: Animated.Value,
  translateY: Animated.Value,
  scale: Animated.Value,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: PREMIUM_TIMING.elegant,
      delay,
      easing: PREMIUM_EASING.elegantOut,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.spring(translateY, {
      toValue: 0,
      delay,
      ...PREMIUM_SPRING.gentle,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.spring(scale, {
      toValue: 1,
      delay,
      ...PREMIUM_SPRING.gentle,
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
  ])
}

// ============================================================================
// Premium Stagger Delays
// ============================================================================

export const STAGGER_DELAYS = {
  fast: 50,
  normal: 80,
  slow: 120,
  dramatic: 180,
} as const

// ============================================================================
// Initial Values for Animations
// ============================================================================

export const PREMIUM_INITIAL = {
  // Logo entrance
  logoScale: 0.3,
  logoOpacity: 0,
  logoRotate: 0,

  // Text reveal
  textOpacity: 0,
  textTranslateY: 30,

  // Button entrance
  buttonOpacity: 0,
  buttonTranslateY: 50,
  buttonScale: 0.9,

  // Card entrance
  cardOpacity: 0,
  cardTranslateY: 40,
  cardScale: 0.95,

  // Floating elements
  floatingY: 0,

  // Glow
  glowOpacity: 0.2,
} as const
