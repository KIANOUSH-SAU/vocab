import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { FIELDS } from '@constants/fields'
import { colors, spacing, radii, typography, shadows } from '@constants/theme'
import { MaxWidthContainer } from '@components/ui/MaxWidthContainer'
import { IconCircle } from '@components/ui/IconCircle'
import { CheckIcon } from '@components/ui/CheckIcon'
import { Button } from '@components/ui/Button'
import { SectionBadge } from '@components/ui/SectionBadge'
import type { Field } from '@/types'

function AnimatedFieldCard({
  field,
  selected,
  onToggle,
  index,
}: {
  field: (typeof FIELDS)[number]
  selected: boolean
  onToggle: () => void
  index: number
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(24)
  const scale = useSharedValue(1)
  const borderOpacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }))
    translateY.value = withDelay(index * 80, withTiming(0, { duration: 400 }))
  }, [])

  useEffect(() => {
    borderOpacity.value = withTiming(selected ? 1 : 0, { duration: 200 })
    scale.value = withSpring(selected ? 1.01 : 1, { damping: 20 })
  }, [selected])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }))

  return (
    <Animated.View style={containerStyle}>
      <Pressable onPress={onToggle} accessibilityLabel={field.label}>
        <View style={[styles.card, selected && { borderColor: field.color }, shadows.soft]}>

          {/* Tinted overlay when selected */}
          <Animated.View
            style={[styles.cardOverlay, { backgroundColor: field.color }, overlayStyle]}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <IconCircle
                library={field.icon.library}
                name={field.icon.name}
                color={field.color}
                size="md"
              />
              <View style={styles.cardText}>
                <Text style={[styles.fieldName, selected && { color: field.color }]}>
                  {field.label}
                </Text>
                <Text style={styles.fieldDesc}>{field.description}</Text>
              </View>
            </View>

            <CheckIcon checked={selected} color={field.color} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function InterestsScreen() {
  const { guest } = useLocalSearchParams<{ guest?: string }>()
  const isGuest = guest === 'true'
  const [selected, setSelected] = useState<Field[]>([])

  const toggle = (field: Field) =>
    setSelected((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    )

  const proceed = () => {
    if (selected.length === 0) return
    router.push({
      pathname: '/(onboarding)/placement-test',
      params: { fields: selected.join(','), guest: isGuest ? 'true' : 'false' },
    })
  }

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionBadge label="Choose Your Field" color={colors.primaryGreen} />
          <Text style={styles.title}>Pick your field</Text>
          <Text style={styles.subtitle}>
            We'll find words you'll actually use at work.{'\n'}You can pick more than one.
          </Text>

          <View style={styles.cards}>
            {FIELDS.map((field, i) => (
              <AnimatedFieldCard
                key={field.id}
                field={field}
                selected={selected.includes(field.id)}
                onToggle={() => toggle(field.id)}
                index={i}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={selected.length === 0 ? 'Pick at least one' : `Continue  (${selected.length})`}
            onPress={proceed}
            variant="primary"
            size="lg"
            fullWidth
            disabled={selected.length === 0}
            icon={selected.length > 0 ? { library: 'Ionicons', name: 'arrow-forward', position: 'right' } : undefined}
          />
        </View>

      </SafeAreaView>
    </MaxWidthContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    padding: spacing[6],
    paddingBottom: spacing[2],
    gap: spacing[4],
  },

  title: { ...typography.heading1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 26 },

  cards: { gap: spacing[3], marginTop: spacing[2] },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    gap: spacing[3],
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  cardText: { flex: 1, gap: 3 },
  fieldName: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600' },
  fieldDesc: { ...typography.small, color: colors.textMuted, lineHeight: 18 },

  footer: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
})
