import { View, Pressable, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors, spacing, radii, shadows, springConfigs } from '@constants/theme'

interface Props {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: number
  onPress?: () => void
  accessibilityLabel?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const VARIANT_STYLES = {
  default: { bg: colors.card, shadow: shadows.sm, borderWidth: 0, borderColor: 'transparent' },
  elevated: { bg: colors.card, shadow: shadows.card, borderWidth: 0, borderColor: 'transparent' },
  outlined: { bg: colors.card, shadow: null, borderWidth: 1, borderColor: colors.border },
} as const

export function Card({
  children,
  variant = 'default',
  padding = spacing[4],
  onPress,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfigs.snappy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.snappy)
  }

  const v = VARIANT_STYLES[variant]

  const cardStyle = [
    styles.card,
    {
      backgroundColor: v.bg,
      borderWidth: v.borderWidth,
      borderColor: v.borderColor,
      padding,
    },
    v.shadow,
  ]

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        style={[animatedStyle, ...cardStyle]}
      >
        {children}
      </AnimatedPressable>
    )
  }

  return (
    <Animated.View style={[animatedStyle, ...cardStyle]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
})
