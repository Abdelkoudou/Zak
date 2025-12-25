// ============================================================================
// Fade In View - Animated Container for Smooth Entrances
// ============================================================================

import React, { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { 
  createSlideUp, 
  createFadeIn,
  ANIMATION_DURATION 
} from '@/lib/animations'

type AnimationType = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  animation?: AnimationType
  style?: ViewStyle
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = ANIMATION_DURATION.normal,
  animation = 'slideUp',
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(animation === 'slideUp' ? 20 : animation === 'slideDown' ? -20 : 0)).current
  const translateX = useRef(new Animated.Value(animation === 'slideLeft' ? 20 : animation === 'slideRight' ? -20 : 0)).current
  const scale = useRef(new Animated.Value(animation === 'scale' ? 0.9 : 1)).current

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]

    if (animation === 'slideUp' || animation === 'slideDown') {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay,
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
          useNativeDriver: true,
        })
      )
    }

    if (animation === 'scale') {
      animations.push(
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          delay,
          useNativeDriver: true,
        })
      )
    }

    Animated.parallel(animations).start()
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
// Staggered List - Animate list items with delay
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
          animation={animation}
          style={style}
        >
          {child}
        </FadeInView>
      ))}
    </>
  )
}
