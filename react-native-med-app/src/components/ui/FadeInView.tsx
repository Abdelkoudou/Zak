// ============================================================================
// Fade In View - Premium Animated Container with Focus Support
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react'
import { Animated, ViewStyle, Platform } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { PREMIUM_TIMING, PREMIUM_EASING, PREMIUM_SPRING } from '@/lib/premiumAnimations'

type AnimationType = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  animation?: AnimationType
  style?: ViewStyle
  /** Whether to replay animation on screen focus (default: true on native, false on web) */
  replayOnFocus?: boolean
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = PREMIUM_TIMING.quick,
  animation = 'slideUp',
  style,
  // Default to false on web to prevent animations replaying on tab visibility changes
  replayOnFocus = Platform.OS !== 'web',
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(animation === 'slideUp' ? 15 : animation === 'slideDown' ? -15 : 0)).current
  const translateX = useRef(new Animated.Value(animation === 'slideLeft' ? 15 : animation === 'slideRight' ? -15 : 0)).current
  const scale = useRef(new Animated.Value(animation === 'scale' ? 0.92 : 1)).current
  const hasAnimated = useRef(false)
  const currentAnimation = useRef<Animated.CompositeAnimation | null>(null)

  const runAnimation = useCallback(() => {
    // Stop any running animation first
    if (currentAnimation.current) {
      currentAnimation.current.stop()
    }
    
    // Reset values
    opacity.setValue(0)
    if (animation === 'slideUp') translateY.setValue(15)
    else if (animation === 'slideDown') translateY.setValue(-15)
    else translateY.setValue(0)
    
    if (animation === 'slideLeft') translateX.setValue(15)
    else if (animation === 'slideRight') translateX.setValue(-15)
    else translateX.setValue(0)
    
    if (animation === 'scale') scale.setValue(0.92)
    else scale.setValue(1)

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: PREMIUM_EASING.appleSmooth,
        useNativeDriver: true,
      }),
    ]

    if (animation === 'slideUp' || animation === 'slideDown') {
      animations.push(
        Animated.spring(translateY, {
          toValue: 0,
          delay,
          ...PREMIUM_SPRING.snappy,
          useNativeDriver: true,
        })
      )
    }

    if (animation === 'slideLeft' || animation === 'slideRight') {
      animations.push(
        Animated.spring(translateX, {
          toValue: 0,
          delay,
          ...PREMIUM_SPRING.snappy,
          useNativeDriver: true,
        })
      )
    }

    if (animation === 'scale') {
      animations.push(
        Animated.spring(scale, {
          toValue: 1,
          delay,
          ...PREMIUM_SPRING.bouncy,
          useNativeDriver: true,
        })
      )
    }

    currentAnimation.current = Animated.parallel(animations)
    currentAnimation.current.start(() => {
      hasAnimated.current = true
    })
  }, [animation, delay, duration])

  // Run on focus if enabled (primarily for native)
  useFocusEffect(
    useCallback(() => {
      if (replayOnFocus) {
        runAnimation()
      }
      
      return () => {
        // Cleanup: stop animation when losing focus
        if (currentAnimation.current) {
          currentAnimation.current.stop()
        }
      }
    }, [replayOnFocus, runAnimation])
  )

  // Run on initial mount (for web or when replayOnFocus is false)
  useEffect(() => {
    if (!replayOnFocus && !hasAnimated.current) {
      runAnimation()
    }
    
    return () => {
      // Cleanup on unmount
      if (currentAnimation.current) {
        currentAnimation.current.stop()
      }
    }
  }, [replayOnFocus, runAnimation])

  const animatedStyle = {
    opacity,
    transform: [
      { translateY },
      { translateX },
      { scale },
    ],
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

// ============================================================================
// Staggered List - Animate list items with delay (replays on focus)
// ============================================================================

interface StaggeredListProps {
  children: React.ReactNode[]
  staggerDelay?: number
  animation?: AnimationType
  style?: ViewStyle
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 50,
  animation = 'slideUp',
  style,
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView 
          key={index} 
          delay={index * staggerDelay} 
          duration={PREMIUM_TIMING.quick}
          animation={animation}
          style={style}
          replayOnFocus={true}
        >
          {child}
        </FadeInView>
      ))}
    </>
  )
}
