// ============================================================================
// Premium Animation Utilities - MCQ Study App
// Smooth, delightful animations for a premium user experience
// ============================================================================

import { Animated, Easing, Platform } from 'react-native'
import { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { PREMIUM_TIMING, PREMIUM_EASING, PREMIUM_SPRING } from './premiumAnimations'

// Use native driver only on native platforms, not on web
// CRITICAL: This must be used in ALL animation calls to prevent web warnings
export const USE_NATIVE_DRIVER = Platform.OS !== 'web'

// ============================================================================
// Animation Timing Presets (Legacy - use PREMIUM_TIMING instead)
// ============================================================================

export const ANIMATION_DURATION = {
  instant: 80,
  fast: PREMIUM_TIMING.quick,
  normal: PREMIUM_TIMING.smooth,
  slow: PREMIUM_TIMING.elegant,
  verySlow: PREMIUM_TIMING.dramatic,
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

  // Premium easings (mapped from premiumAnimations)
  smooth: PREMIUM_EASING.appleSmooth,
  snappy: PREMIUM_EASING.snappy,
  premium: PREMIUM_EASING.elegantOut,
  spring: PREMIUM_EASING.dramaticEntrance,
} as const

// ============================================================================
// Custom Hook: useAnimateOnFocus
// Replays animations every time screen comes into focus
// ============================================================================

export function useAnimateOnFocus() {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(15)).current
  const scale = useRef(new Animated.Value(0.97)).current

  useFocusEffect(
    useCallback(() => {
      // Reset values
      opacity.setValue(0)
      translateY.setValue(15)
      scale.setValue(0.97)

      // Run entrance animation with premium springs
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: PREMIUM_TIMING.quick,
          easing: PREMIUM_EASING.appleSmooth,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          ...PREMIUM_SPRING.snappy,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...PREMIUM_SPRING.gentle,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start()

      return () => {
        // Optional: animate out when leaving
      }
    }, [])
  )

  return { opacity, translateY, scale }
}

// ============================================================================
// Custom Hook: useStaggerAnimateOnFocus
// For staggered list animations that replay on focus
// ============================================================================

export function useStaggerAnimateOnFocus(itemCount: number, staggerDelay = 50) {
  const animations = useRef(
    Array.from({ length: Math.max(itemCount, 20) }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(15),
    }))
  ).current

  useFocusEffect(
    useCallback(() => {
      // Reset all values
      animations.forEach((anim) => {
        anim.opacity.setValue(0)
        anim.translateY.setValue(15)
      })

      // Create staggered animations with premium springs
      const animationSequence = animations.slice(0, itemCount).map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: PREMIUM_TIMING.quick,
            delay: index * staggerDelay,
            easing: PREMIUM_EASING.appleSmooth,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.spring(anim.translateY, {
            toValue: 0,
            delay: index * staggerDelay,
            ...PREMIUM_SPRING.snappy,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      )

      Animated.parallel(animationSequence).start()
    }, [itemCount])
  )

  return animations
}

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
    useNativeDriver: USE_NATIVE_DRIVER,
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
    useNativeDriver: USE_NATIVE_DRIVER,
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
      useNativeDriver: USE_NATIVE_DRIVER,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: ANIMATION_EASING.smooth,
      useNativeDriver: USE_NATIVE_DRIVER,
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
    useNativeDriver: USE_NATIVE_DRIVER,
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
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(scaleValue, {
        toValue: minScale,
        duration: ANIMATION_DURATION.slow,
        easing: ANIMATION_EASING.easeInOut,
        useNativeDriver: USE_NATIVE_DRIVER,
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
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        easing: ANIMATION_EASING.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
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
    useNativeDriver: USE_NATIVE_DRIVER,
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
