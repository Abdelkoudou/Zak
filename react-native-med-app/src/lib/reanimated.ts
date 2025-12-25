// ============================================================================
// Reanimated Animation Utilities - Premium Smooth Animations
// ============================================================================

import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

// Premium spring configurations
export const SPRING_CONFIGS = {
  // Snappy - Quick response, minimal overshoot
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  // Bouncy - Playful with noticeable bounce
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 1,
  },
  // Smooth - Elegant, no overshoot
  smooth: {
    damping: 25,
    stiffness: 150,
    mass: 1,
  },
  // Gentle - Slow and graceful
  gentle: {
    damping: 15,
    stiffness: 100,
    mass: 1.2,
  },
  // Premium - Apple-like feel
  premium: {
    damping: 18,
    stiffness: 200,
    mass: 0.9,
  },
} as const;

// Timing configurations
export const TIMING_CONFIGS = {
  fast: { duration: 200, easing: Easing.out(Easing.cubic) },
  normal: { duration: 300, easing: Easing.inOut(Easing.cubic) },
  slow: { duration: 500, easing: Easing.inOut(Easing.quad) },
  premium: { duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
} as const;

// Animation presets
export const createEntranceAnimation = (
  value: SharedValue<number>,
  delay: number = 0
) => {
  'worklet';
  value.value = withDelay(
    delay,
    withSpring(1, SPRING_CONFIGS.premium)
  );
};

export const createExitAnimation = (
  value: SharedValue<number>,
  callback?: () => void
) => {
  'worklet';
  value.value = withTiming(0, TIMING_CONFIGS.fast, (finished) => {
    if (finished && callback) {
      runOnJS(callback)();
    }
  });
};

// Stagger animation helper
export const staggerDelay = (index: number, baseDelay: number = 50) => {
  return index * baseDelay;
};

// Interpolation helpers
export const createFadeInterpolation = (progress: SharedValue<number>) => {
  'worklet';
  return interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
};

export const createSlideInterpolation = (
  progress: SharedValue<number>,
  distance: number = 30
) => {
  'worklet';
  return interpolate(progress.value, [0, 1], [distance, 0], Extrapolation.CLAMP);
};

export const createScaleInterpolation = (
  progress: SharedValue<number>,
  from: number = 0.9
) => {
  'worklet';
  return interpolate(progress.value, [0, 1], [from, 1], Extrapolation.CLAMP);
};

// Pulse animation
export const createPulseAnimation = (value: SharedValue<number>) => {
  'worklet';
  value.value = withRepeat(
    withSequence(
      withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
};

// Float animation (up and down)
export const createFloatAnimation = (value: SharedValue<number>, distance: number = 10) => {
  'worklet';
  value.value = withRepeat(
    withSequence(
      withTiming(-distance, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
    ),
    -1,
    true
  );
};

// Shake animation
export const createShakeAnimation = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

// Press animation
export const createPressAnimation = (
  scale: SharedValue<number>,
  pressed: boolean
) => {
  'worklet';
  scale.value = withSpring(pressed ? 0.96 : 1, SPRING_CONFIGS.snappy);
};

// Export reanimated hooks for convenience
export {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
};

export type { SharedValue };
