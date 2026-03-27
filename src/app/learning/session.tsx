import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '@components/ui/BackButton'
import { colors, fonts, radii, shadows, spacing, springConfigs } from '@constants/theme'

// ─── Mock Quiz Data ──────────────────────────────────────────

const MOCK_QUESTIONS = [
  {
    word: 'collaborate',
    question: 'What does "collaborate" mean?',
    options: [
      'To work together with others',
      'To argue with someone',
      'To travel alone',
      'To forget something',
      'No idea',
    ],
    correctIndex: 0,
  },
  {
    word: 'resilient',
    question: 'What does "resilient" mean?',
    options: [
      'Easy to break',
      'Able to recover quickly from difficulties',
      'Very expensive',
      'Extremely fast',
      'No idea',
    ],
    correctIndex: 1,
  },
  {
    word: 'ambiguous',
    question: 'What does "ambiguous" mean?',
    options: [
      'Very clear',
      'Extremely large',
      'Open to more than one interpretation',
      'Related to science',
      'No idea',
    ],
    correctIndex: 2,
  },
  {
    word: 'eloquent',
    question: 'What does "eloquent" mean?',
    options: [
      'Shy and reserved',
      'Quick to anger',
      'Lacking emotion',
      'Fluent and persuasive in speaking',
      'No idea',
    ],
    correctIndex: 3,
  },
  {
    word: 'pragmatic',
    question: 'What does "pragmatic" mean?',
    options: [
      'Dealing with things in a practical way',
      'Being overly emotional',
      'Avoiding all risks',
      'Speaking multiple languages',
      'No idea',
    ],
    correctIndex: 0,
  },
]

// ─── Confetti ────────────────────────────────────────────────

const CONFETTI_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444', '#FFD700', '#FF6B00']

function ConfettiParticle({ index }: { index: number }) {
  const progress = useSharedValue(0)
  const driftX = useMemo(() => (Math.random() - 0.5) * 200, [])
  const particleSize = useMemo(() => 4 + Math.random() * 6, [])
  const isCircle = useMemo(() => Math.random() > 0.5, [])
  const delay = useMemo(() => Math.random() * 500, [])
  const color = useMemo(() => CONFETTI_COLORS[index % CONFETTI_COLORS.length], [])

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) })
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-20, 400]) },
      { translateX: interpolate(progress.value, [0, 1], [0, driftX]) },
      { scale: interpolate(progress.value, [0, 0.3, 1], [0, 1, 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 720])}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: particleSize,
          height: particleSize,
          backgroundColor: color,
          borderRadius: isCircle ? particleSize / 2 : 2,
          top: 0,
          left: '50%',
        },
        style,
      ]}
    />
  )
}

function ConfettiBurst() {
  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {Array.from({ length: 28 }).map((_, i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
    </View>
  )
}

const confettiStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    zIndex: 100,
  },
})

// ─── Progress Bar with Shimmer ───────────────────────────────

function ShimmerProgressBar({ progress }: { progress: number }) {
  const shimmerTranslate = useSharedValue(-1)

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    )
  }, [])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value * 200 }],
  }))

  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fillOuter, { width: `${progress}%` }]}>
        <LinearGradient
          colors={['#8B5CF6', '#C4B5FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[progressStyles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 200, height: '100%' }}
          />
        </Animated.View>
      </View>
    </View>
  )
}

const progressStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 16,
  },
  fillOuter: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
})

// ─── Answer Option ───────────────────────────────────────────

type OptionState = 'default' | 'pressed' | 'correct' | 'wrong' | 'revealCorrect'

function AnswerOption({
  text,
  index,
  state,
  onPress,
  disabled,
}: {
  text: string
  index: number
  state: OptionState
  onPress: () => void
  disabled: boolean
}) {
  const translateX = useSharedValue(0)
  const shakeX = useSharedValue(0)

  useEffect(() => {
    if (state === 'correct' || state === 'revealCorrect') {
      translateX.value = withSpring(4, springConfigs.snappy)
    } else if (state === 'wrong') {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 80 }),
        withTiming(6, { duration: 80 }),
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      )
    } else {
      translateX.value = withSpring(0, springConfigs.snappy)
    }
  }, [state])

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shakeX.value },
      { scale: state === 'correct' ? 1.01 : 1 },
    ],
  }))

  const isCorrectState = state === 'correct' || state === 'revealCorrect'
  const isWrongState = state === 'wrong'

  const borderColor = isCorrectState
    ? '#10B981'
    : isWrongState
    ? '#EF4444'
    : colors.border

  const shadowStyle = isCorrectState
    ? { shadowColor: '#10B981', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } }
    : isWrongState
    ? {}
    : {}

  const letters = ['A', 'B', 'C', 'D']

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Animated.View style={[optionStyles.container, { borderColor }, shadowStyle, animStyle]}>
        {isCorrectState ? (
          <LinearGradient
            colors={['#ECFDF5', colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : isWrongState ? (
          <LinearGradient
            colors={['#FEF2F2', colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <View style={[
          optionStyles.radio,
          isCorrectState && { borderColor: '#10B981', backgroundColor: '#10B981' },
          isWrongState && { borderColor: '#EF4444', backgroundColor: '#EF4444' },
        ]}>
          {isCorrectState ? (
            <Text style={optionStyles.radioSymbol}>✓</Text>
          ) : isWrongState ? (
            <Text style={optionStyles.radioSymbol}>✗</Text>
          ) : (
            <Text style={optionStyles.radioLetter}>{letters[index]}</Text>
          )}
        </View>

        <Text style={optionStyles.text}>{text}</Text>
      </Animated.View>
    </Pressable>
  )
}

const optionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSymbol: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  radioLetter: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.inkLight,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    flex: 1,
  },
})

// ─── Word Highlight Component ────────────────────────────────

function WordHighlight({ word }: { word: string }) {
  return (
    <View style={{ position: 'relative', alignSelf: 'flex-start', flexDirection: 'row' }}>
      <Text style={highlightStyles.word}>"{word}"</Text>
      <View style={highlightStyles.underline} />
    </View>
  )
}

const highlightStyles = StyleSheet.create({
  word: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: '#6D28D9',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 2,
    zIndex: -1,
  },
})

// ─── Main Quiz Screen ────────────────────────────────────────

export default function LearningSession() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<'pending' | 'correct' | 'wrong'>('pending')
  const [showConfetti, setShowConfetti] = useState(false)

  const question = MOCK_QUESTIONS[currentQ]
  const totalQuestions = MOCK_QUESTIONS.length
  const progress = ((currentQ + (answerState !== 'pending' ? 1 : 0)) / totalQuestions) * 100

  const handleSelect = useCallback((index: number) => {
    if (answerState !== 'pending') return
    setSelectedIndex(index)

    if (index === question.correctIndex) {
      setAnswerState('correct')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    } else {
      setAnswerState('wrong')
    }
  }, [answerState, question.correctIndex])

  const handleNext = useCallback(() => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1)
      setSelectedIndex(null)
      setAnswerState('pending')
    } else {
      router.back()
    }
  }, [currentQ, totalQuestions])

  const getOptionState = (index: number): OptionState => {
    if (answerState === 'pending') return 'default'
    if (index === selectedIndex && answerState === 'correct') return 'correct'
    if (index === selectedIndex && answerState === 'wrong') return 'wrong'
    if (answerState === 'wrong' && index === question.correctIndex) return 'revealCorrect'
    return 'default'
  }

  return (
    <LinearGradient
      colors={['#F5F0FF', colors.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.container}>
        {showConfetti && <ConfettiBurst />}

        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.counterContainer}>
            <Text style={styles.counterNumber}>{currentQ + 1}</Text>
            <Text style={styles.counterTotal}> / {totalQuestions}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Progress Bar */}
        <ShimmerProgressBar progress={progress} />

        {/* Question Card */}
        <View style={styles.questionCard}>
          <LinearGradient
            colors={['#8B5CF6', '#C4B5FD', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.questionCardStrip}
          />
          <Text style={styles.questionText}>
            What does <WordHighlight word={question.word} /> mean?
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <AnswerOption
              key={index}
              text={option}
              index={index}
              state={getOptionState(index)}
              onPress={() => handleSelect(index)}
              disabled={answerState !== 'pending'}
            />
          ))}
        </View>

        {/* Next Button (visible after answering) */}
        {answerState !== 'pending' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.nextBtnContainer}>
            <Pressable onPress={handleNext}>
              <LinearGradient
                colors={[colors.ink, '#27272A']}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  {currentQ < totalQuestions - 1 ? 'Next Question' : 'Finish'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.inkLight} />
          <Text style={styles.footerText}>No right or wrong — just be honest</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  counterNumber: {
    fontFamily: fonts.serif,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  counterTotal: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '300',
    color: colors.inkLight,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 18,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  questionCardStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  questionText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 13 * 1.5,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  optionsContainer: {
    gap: 0,
  },
  nextBtnContainer: {
    marginTop: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  nextBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkLight,
  },
})
