import { View, Text, StyleSheet } from 'react-native'
import { radii } from '@constants/theme'

interface Props {
  label: string
  color?: string
}

export function SectionBadge({ label, color = '#A0A0A0' }: Props) {
  const bgHex = Math.round(0.15 * 255).toString(16).padStart(2, '0')

  return (
    <View style={[styles.badge, { backgroundColor: `${color}${bgHex}` }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
})
