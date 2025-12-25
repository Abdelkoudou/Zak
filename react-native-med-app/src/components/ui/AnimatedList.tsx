// ============================================================================
// Animated List Components - Staggered Animations for Lists
// ============================================================================

import React, { useEffect, useRef } from 'react'
import { Animated, View, ViewStyle, FlatList, FlatListProps } from 'react-native'
import { ANIMATION_DURATION } from '@/lib/animations'

// ============================================================================
// Animated List Item - Individual item with entrance animation
// ============================================================================

interface AnimatedListItemProps {
  children: React.ReactNode
  index: number
  staggerDelay?: number
  style?: ViewStyle
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  staggerDelay = 50,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current
  const scale = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    const delay = index * staggerDelay

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [index])

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}

// ============================================================================
// Animated FlatList - FlatList with animated items
// ============================================================================

interface AnimatedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: (info: { item: T; index: number }) => React.ReactElement
  staggerDelay?: number
  itemStyle?: ViewStyle
}

export function AnimatedFlatList<T>({
  renderItem,
  staggerDelay = 50,
  itemStyle,
  ...props
}: AnimatedFlatListProps<T>) {
  return (
    <FlatList
      {...props}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index} staggerDelay={staggerDelay} style={itemStyle}>
          {renderItem({ item, index })}
        </AnimatedListItem>
      )}
    />
  )
}

// ============================================================================
// Grid Animation Wrapper - For grid layouts
// ============================================================================

interface AnimatedGridProps {
  children: React.ReactNode[]
  columns: number
  staggerDelay?: number
  gap?: number
  style?: ViewStyle
}

export const AnimatedGrid: React.FC<AnimatedGridProps> = ({
  children,
  columns,
  staggerDelay = 50,
  gap = 12,
  style,
}) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -gap / 2,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => (
        <AnimatedListItem
          key={index}
          index={index}
          staggerDelay={staggerDelay}
          style={{
            width: `${100 / columns}%`,
            padding: gap / 2,
          }}
        >
          {child}
        </AnimatedListItem>
      ))}
    </View>
  )
}
