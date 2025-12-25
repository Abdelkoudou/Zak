// ============================================================================
// Premium Animated Components with React Native Reanimated
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
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
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  SlideInUp,
  SlideInDown,
  ZoomIn,
  ZoomOut,
  BounceIn,
  Layout,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS, staggerDelay } from '@/lib/reanimated';

// ============================================================================
// Animated Card with Press Effect
// ============================================================================
interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  delay?: number;
  disabled?: boolean;
}

export function AnimatedPressable({ 
  children, 
  onPress, 
  style, 
  delay = 0,
  disabled = false 
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, TIMING_CONFIGS.normal));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.premium));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRING_CONFIGS.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Staggered List Item
// ============================================================================
interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
}

export function StaggeredItem({ children, index, style }: StaggeredItemProps) {
  const delay = staggerDelay(index, 60);
  
  return (
    <Animated.View
      entering={FadeIn.delay(delay).springify().damping(15)}
      style={style}
      layout={Layout.springify()}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Fade In View with Direction
// ============================================================================
type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInViewProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  style?: ViewStyle;
  distance?: number;
}

export function ReanimatedFadeIn({ 
  children, 
  direction = 'up', 
  delay = 0, 
  style,
  distance = 20 
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? distance : direction === 'down' ? -distance : 0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, TIMING_CONFIGS.normal));
    translateX.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.premium));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.premium));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Pulse Animation
// ============================================================================
interface PulseViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function PulseView({ children, style, intensity = 1.05 }: PulseViewProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Float Animation
// ============================================================================
interface FloatViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  distance?: number;
  duration?: number;
}

export function FloatView({ children, style, distance = 10, duration = 2000 }: FloatViewProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Glow Pulse
// ============================================================================
interface GlowPulseProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlowPulse({ children, style }: GlowPulseProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Shake Animation (for errors)
// ============================================================================
interface ShakeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  trigger?: boolean;
}

export function ShakeView({ children, style, trigger }: ShakeViewProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Animated Counter
// ============================================================================
interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  duration?: number;
}

export function AnimatedCounter({ value, style, duration = 1000 }: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    const displayValue = Math.round(animatedValue.value);
    return {
      // We can't directly animate text content, so we use opacity for effect
      opacity: 1,
    };
  });

  // For actual counter animation, we'd need to use a different approach
  // This is a simplified version
  return (
    <Animated.Text style={[style, animatedStyle]}>
      {value}
    </Animated.Text>
  );
}

// ============================================================================
// Skeleton Loader with Shimmer
// ============================================================================
interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

// ============================================================================
// Export entering/exiting animations for convenience
// ============================================================================
export const EnteringAnimations = {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  SlideInUp,
  SlideInDown,
  ZoomIn,
  ZoomOut,
  BounceIn,
};

export { Layout };
