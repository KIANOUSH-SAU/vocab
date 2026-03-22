import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { usePlacementTest } from '@hooks/usePlacementTest'
import { colors, spacing, radii, typography, shadows } from '@constants/theme'
import { MaxWidthContainer } from '@components/ui/MaxWidthContainer'
import { BackButton } from '@components/ui/BackButton'
import { SectionBadge } from '@components/ui/SectionBadge'
import { Card } from '@components/ui/Card'

export default function PlacementTestScreen() {
  const { fields, guest } = useLocalSearchParams<{ fields: string; guest: string }>()
  const { currentQuestion, currentIndex, totalQuestions, isComplete, classifiedLevel, answer } =
    usePlacementTest()

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Card entrance animation
  const cardOpacity = useSharedValue(0)
  const cardTranslate = useSharedValue(32)

  // Progress bar width
  const progress = (currentIndex / totalQuestions) * 100
  const progressWidth = useSharedValue(0)

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 400 })
  }, [progress])

  useEffect(() => {
    cardOpacity.value = 0
    cardTranslate.value = 32
    cardOpacity.value = withTiming(1, { duration: 350 })
    cardTranslate.value = withSpring(0, { damping: 22 })
    setSelectedIndex(null)
  }, [currentIndex])

  useEffect(() => {
    if (isComplete && classifiedLevel) {
      router.replace({
        pathname: '/(onboarding)/level-result',
        params: { level: classifiedLevel, fields, guest },
      })
    }
  }, [isComplete, classifiedLevel])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }))

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }))

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return
    setSelectedIndex(index)
    setTimeout(() => answer(index), 420)
  }

  if (!currentQuestion) return null

  const questionTypeLabel =
    currentQuestion.type === 'recognition'
      ? 'Word Check'
      : currentQuestion.type === 'definition'
      ? 'Definition'
      : 'Correct Usage'

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[2], paddingBottom: spacing[2] }}>
          <BackButton onPress={() => router.back()} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        <View style={styles.content}>

          {/* Counter */}
          <Text style={styles.counter}>
            {currentIndex + 1} <Text style={styles.counterTotal}>/ {totalQuestions}</Text>
          </Text>

          {/* Question card */}
          <Animated.View style={cardStyle}>
            <Card variant="elevated">
              <View style={styles.questionInner}>
                <SectionBadge label={questionTypeLabel} color={colors.textSecondary} />
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </View>
            </Card>
          </Animated.View>

          {/* Options */}
          <Animated.View style={[styles.options, cardStyle]}>
            {currentQuestion.options.map((option, i) => {
              const isSelected = selectedIndex === i
              const isDimmed = selectedIndex !== null && !isSelected

              return (
                <Pressable
                  key={i}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    isDimmed && styles.optionDimmed,
                  ]}
                  onPress={() => handleSelect(i)}
                  disabled={selectedIndex !== null}
                  accessibilityLabel={option}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? colors.textPrimary : colors.border}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                      isDimmed && styles.optionTextDimmed,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              )
            })}
          </Animated.View>

        </View>

        {/* Footer hint */}
        <View style={styles.footer}>
          <Text style={styles.hint}>No right or wrong — just be honest</Text>
        </View>

      </SafeAreaView>
    </MaxWidthContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  progressTrack: {
    height: 3,
    backgroundColor: colors.surface,
    marginHorizontal: spacing[6],
    marginTop: spacing[2],
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: radii.pill,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    gap: spacing[6],
  },

  counter: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  counterTotal: {
    color: colors.textMuted,
    fontWeight: '400',
  },

  questionInner: {
    gap: spacing[3],
  },
  questionText: {
    ...typography.heading3,
    color: colors.textPrimary,
    lineHeight: 28,
  },

  options: { gap: spacing[3] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.soft,
  },
  optionSelected: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.elevated,
  },
  optionDimmed: { opacity: 0.35 },

  optionText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  optionTextSelected: { color: colors.textPrimary, fontWeight: '600' },
  optionTextDimmed: { color: colors.textMuted },

  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  hint: { ...typography.caption, color: colors.textMuted },
})
