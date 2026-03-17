import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors, radii } from '@constants/theme'

interface Props {
  checked: boolean
  color: string
  size?: number
}

export function CheckIcon({ checked, color, size = 24 }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(checked ? 1 : 0.8, { damping: 16, stiffness: 200 }) }],
    opacity: withSpring(checked ? 1 : 0.5, { damping: 16, stiffness: 200 }),
  }))

  return (
    <Animated.View
      style={[
        styles.circle,
        animatedStyle,
        {
          width: size,
          height: size,
          borderColor: checked ? color : colors.textMuted,
          backgroundColor: checked ? color : 'transparent',
        },
      ]}
    >
      {checked && (
        <Ionicons name="checkmark" size={size * 0.65} color="#FFFFFF" />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
