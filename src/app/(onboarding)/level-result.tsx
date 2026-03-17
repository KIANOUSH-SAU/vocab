import { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useUserStore } from '@store/userStore'
import { LEVELS } from '@constants/levels'
import { FIELDS } from '@constants/fields'
import { colors, spacing, radii, typography } from '@constants/theme'
import { MaxWidthContainer } from '@components/ui/MaxWidthContainer'
import { IconCircle } from '@components/ui/IconCircle'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import type { Level, Field } from '@/types'

const LEVEL_GRADIENTS: Record<Level, [string, string]> = {
  A1: ['#374151', '#1F2937'],
  A2: ['#1e3a5f', '#1e3a5f'],
  B1: ['#1e3d59', '#1a3a4a'],
  B2: ['#312e81', '#1e1b4b'],
  C1: ['#4c1d95', '#2e1065'],
}

export default function LevelResultScreen() {
  const { level, fields, guest } = useLocalSearchParams<{
    level: Level
    fields: string
    guest: string
  }>()
  const isGuest = guest === 'true'
  const { setUser } = useUserStore()

  const levelMeta = LEVELS.find((l) => l.id === level) ?? LEVELS[0]
  const fieldList = (fields?.split(',').filter(Boolean) ?? []) as Field[]
  const fieldMetas = FIELDS.filter((f) => fieldList.includes(f.id))
  const gradient = LEVEL_GRADIENTS[level ?? 'A1']

  // Entrance animations
  const badgeScale = useSharedValue(0.6)
  const badgeOpacity = useSharedValue(0)
  const contentOpacity = useSharedValue(0)
  const contentTranslate = useSharedValue(24)
  const btnOpacity = useSharedValue(0)

  useEffect(() => {
    badgeScale.value = withSpring(1, { damping: 16, stiffness: 120 })
    badgeOpacity.value = withTiming(1, { duration: 400 })
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500 }))
    contentTranslate.value = withDelay(300, withTiming(0, { duration: 500 }))
    btnOpacity.value = withDelay(600, withTiming(1, { duration: 400 }))
  }, [])

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }))
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }))
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }))

  const proceed = () => {
    setUser({
      id: isGuest ? 'guest' : '',
      name: isGuest ? 'Guest' : '',
      level: level ?? 'A1',
      fields: fieldList,
      voiceStyleId: '',
      isGuest,
    })
    router.replace('/(tabs)/home')
  }

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* Level badge */}
          <Animated.View style={[styles.badgeWrapper, badgeStyle]}>
            <LinearGradient
              colors={gradient}
              style={styles.badge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.levelCode}>{level}</Text>
              <Text style={styles.levelName}>{levelMeta.label}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Info */}
          <Animated.View style={[styles.info, contentStyle]}>
            <Text style={styles.resultHeading}>Your English level</Text>
            <Text style={styles.description}>{levelMeta.description}</Text>

            {/* Fields */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Your selected fields</Text>
              <View style={styles.fieldTags}>
                {fieldMetas.map((f) => (
                  <View key={f.id} style={[styles.tag, { borderColor: f.color }]}>
                    <IconCircle
                      library={f.icon.library}
                      name={f.icon.name}
                      color={f.color}
                      size="sm"
                      bgOpacity={0}
                    />
                    <Text style={[styles.tagText, { color: f.color }]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* What to expect */}
            <Card variant="outlined">
              <View style={styles.expectInner}>
                <Text style={styles.expectTitle}>What happens next</Text>
                <View style={styles.expectList}>
                  <ExpectItem text="5 words selected daily, just for your field" />
                  <ExpectItem text="Learn through swipe cards, audio & fill-in-blank" />
                  <ExpectItem text="Words repeat until you've truly mastered them" />
                </View>
              </View>
            </Card>
          </Animated.View>

        </ScrollView>

        {/* CTA */}
        <Animated.View style={[styles.footer, btnStyle]}>
          <Button
            label="Start Learning"
            onPress={proceed}
            variant="primary"
            size="lg"
            fullWidth
            icon={{ library: 'Ionicons', name: 'arrow-forward', position: 'right' }}
          />
          {isGuest && (
            <Text style={styles.guestNote}>
              Progress saved locally · Create an account anytime
            </Text>
          )}
        </Animated.View>

      </SafeAreaView>
    </MaxWidthContainer>
  )
}

function ExpectItem({ text }: { text: string }) {
  return (
    <View style={styles.expectItem}>
      <Ionicons name="checkmark-circle" size={18} color={colors.primaryGreen} />
      <Text style={styles.expectText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing[6],
    gap: spacing[8],
    paddingBottom: spacing[4],
  },

  // Badge
  badgeWrapper: { alignSelf: 'flex-start' },
  badge: {
    borderRadius: radii.card,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
    gap: spacing[1],
    minWidth: 180,
  },
  levelCode: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 76,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.2,
  },

  // Info
  info: { gap: spacing[6] },
  resultHeading: { ...typography.heading2, color: colors.textPrimary },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 26 },

  // Fields
  fieldSection: { gap: spacing[3] },
  fieldLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  fieldTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  tagText: { ...typography.smallMedium },

  // What to expect
  expectInner: { gap: spacing[3] },
  expectTitle: { ...typography.smallMedium, color: colors.textSecondary },
  expectList: { gap: spacing[2] },
  expectItem: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' },
  expectText: { ...typography.small, color: colors.textSecondary, flex: 1, lineHeight: 20 },

  // Footer
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[3],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  guestNote: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
})
