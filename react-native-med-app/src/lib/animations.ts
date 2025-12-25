// ============================================================================
// Premium Animation Utilities - MCQ Study App
// Smooth, delightful animations for a premium user experience
// ============================================================================

import { Animated, Easing } from 'react-native'

// ============================================================================
// Animation Timing Presets
// ============================================================================

export const ANIMATION_DURATION = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const

export const ANIMATION_EASING = {
  // Standard easings
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  
  // Bounce effects
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
  
  // Custom premium easings
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  snappy: Easing.bezier(0.4, 0, 0.2, 1),
  premium: Easing.bezier(0.22, 1, 0.36, 1),
  spring: Easing.bezier(0.68, -0.55, 0.265, 1.55),
} as const

// ============================================================================
// Animation Creators
// ============================================================================

/**
 * Creates a fade-in animation
 */
export function createFadeIn(
  animatedValue: Animated.Value,
  duration = ANIMATION_DURATION.normal,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: ANIMATION_EASING.smooth,
    useNativeDriver: true,
  })
}

/**
 * Creates a fade-out animation
 */
export function createFadeOut(
  animatedValue: Animated.Value,
  duration = ANIMATION_DURATION.normal
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: ANIMATION_EASING.smooth,
    useNativeDriver: true,
  })
}

/**
 * Creates a slide-up animation with fade
 */
export function createSlideUp(
  translateY: Animated.Value,
  opacity: Animated.Value,
  duration = ANIMATION_DURATION.normal,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      delay,
      easing: ANIMATION_EASING.premium,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: ANIMATION_EASING.smooth,
      useNativeDriver: true,
    }),
  ])
}

/**
 * Creates a scale animation (for press effects)
 */
export function createScalePress(
  scaleValue: Animated.Value,
  toValue: number,
  duration = ANIMATION_DURATION.fast
): Animated.CompositeAnimation {
  return Animated.spring(scaleValue, {
    toValue,
    friction: 8,
    tension: 100,
    useNativeDriver: true,
  })
}

/**
 * Creates a pulse animation
 */
export function createPulse(
  scaleValue: Animated.Value,
  minScale = 0.95,
  maxScale = 1.05
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: maxScale,
        duration: ANIMATION_DURATION.slow,
        easing: ANIMATION_EASING.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: minScale,
        duration: ANIMATION_DURATION.slow,
        easing: ANIMATION_EASING.easeInOut,
        useNativeDriver: true,
      }),
    ])
  )
}

/**
 * Creates a shimmer/skeleton loading animation
 */
export function createShimmer(
  animatedValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: ANIMATION_EASING.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        easing: ANIMATION_EASING.linear,
        useNativeDriver: true,
      }),
    ])
  )
}

/**
 * Creates a staggered animation for lists
 */
export function createStaggeredAnimation(
  animations: Animated.CompositeAnimation[],
  staggerDelay = 50
): Animated.CompositeAnimation {
  return Animated.stagger(staggerDelay, animations)
}

/**
 * Creates a spring bounce animation
 */
export function createSpringBounce(
  animatedValue: Animated.Value,
  toValue: number
): Animated.CompositeAnimation {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 4,
    tension: 80,
    useNativeDriver: true,
  })
}

// ============================================================================
// Animation Hooks Helpers
// ============================================================================

/**
 * Initial values for common animations
 */
export const INITIAL_VALUES = {
  fadeIn: 0,
  slideUp: 30,
  scale: 1,
  scalePressed: 0.96,
} as const

/**
 * Creates animated values for a fade-slide animation
 */
export function createFadeSlideValues() {
  return {
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(INITIAL_VALUES.slideUp),
  }
}

/**
 * Creates animated value for scale press effect
 */
export function createScaleValue() {
  return new Animated.Value(1)
}
