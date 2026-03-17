import { Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography } from '@constants/theme'

interface Props {
  onPress: () => void
  label?: string
}

export function BackButton({ onPress, label = 'Back' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Go back`}
    >
      <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingRight: spacing[3],
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
})
