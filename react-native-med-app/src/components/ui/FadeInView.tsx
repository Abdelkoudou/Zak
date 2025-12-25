// ============================================================================
// Fade In View - Animated Container with Focus Support
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

type AnimationType = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  animation?: AnimationType
  style?: ViewStyle
  replayOnFocus?: boolean
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = ANIMATION_DURATION.fast,
  animation = 'slideUp',
  style,
  replayOnFocus = true,
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(animation === 'slideUp' ? 12 : animation === 'slideDown' ? -12 : 0)).current
  const translateX = useRef(new Animated.Value(animation === 'slideLeft' ? 12 : animation === 'slideRight' ? -12 : 0)).current
  const scale = useRef(new Animated.Value(animation === 'scale' ? 0.95 : 1)).current

  const runAnimation = useCallback(() => {
    // Reset values
    opacity.setValue(0)
    if (animation === 'slideUp') translateY.setValue(12)
    else if (animation === 'slideDown') translateY.setValue(-12)
    else translateY.setValue(0)
    
    if (animation === 'slideLeft') translateX.setValue(12)
    else if (animation === 'slideRight') translateX.setValue(-12)
    else translateX.setValue(0)
    
    if (animation === 'scale') scale.setValue(0.95)
    else scale.setValue(1)

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: ANIMATION_EASING.smooth,
        useNativeDriver: true,
      }),
    ]

    if (animation === 'slideUp' || animation === 'slideDown') {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay,
          easing: ANIMATION_EASING.premium,
          useNativeDriver: true,
        })
      )
    }

    if (animation === 'slideLeft' || animation === 'slideRight') {
      animations.push(
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          delay,
          easing: ANIMATION_EASING.premium,
          useNativeDriver: true,
        })
      )
    }

    if (animation === 'scale') {
      animations.push(
        Animated.timing(scale, {
          toValue: 1,
          duration,
          delay,
          easing: ANIMATION_EASING.premium,
          useNativeDriver: true,
        })
      )
    }

    Animated.parallel(animations).start()
  }, [animation, delay, duration])

  // Run on focus if enabled
  useFocusEffect(
    useCallback(() => {
      if (replayOnFocus) {
        runAnimation()
      }
    }, [replayOnFocus, runAnimation])
  )

  // Also run on initial mount
  useEffect(() => {
    if (!replayOnFocus) {
      runAnimation()
    }
  }, [])

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
  staggerDelay = 40,
  animation = 'slideUp',
  style,
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView 
          key={index} 
          delay={index * staggerDelay} 
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
