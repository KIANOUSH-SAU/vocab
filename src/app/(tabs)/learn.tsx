import { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
} from 'react-native-reanimated'
import { useDailyWord } from '@hooks/useDailyWord'
import { useAudio } from '@hooks/useAudio'
import { colors, spacing, radii, shadows, fonts } from '@constants/theme'
import { AccentBlob } from '@components/ui/AccentBlob'
import { SectionLabel } from '@components/ui/SectionLabel'

const MOCK_REVIEW_COUNT = 12

const WORD_OF_THE_DAY = {
  word: 'Leverage',
  phonetic: '/ˈlev.ər.ɪdʒ/',
  partOfSpeech: 'verb / noun',
  definition: 'To use something to maximum advantage; the power to influence outcomes.',
  etymology:
    'From Old French "levier" (to raise), derived from Latin "levare" meaning to lighten. Originally referred to the mechanical advantage of a lever, it evolved into a metaphor for strategic advantage.',
  scenario:
    'During the 2015 Paris Climate Accord, diplomat Christiana Figueres leveraged her coalition of small island nations to pressure major emitters — turning a perceived weakness into decisive influence.',
  scenarioSource: 'UN Climate Negotiations, 2015',
}

// ─── Gradient Card Stack ──────────────────────────────────────

const STACK_COLORS: [string, string][] = [
  [colors.iris, colors.irisDeeper],      // top card — deep gradient
  ['#C4B5FD', colors.irisLight],          // mid card
  [colors.irisSoft, colors.irisSoft],     // back card
]

function DailyStack({ words }: { words: { word: string; definition: string }[] }) {
  const entrance = useSharedValue(0)

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 18, stiffness: 80 })
  }, [])

  const displayed = words.slice(0, 3)
  const total = displayed.length

  return (
    <View style={stackStyles.container}>
      {displayed.map((w, i) => {
        const reverseI = total - 1 - i
        return (
          <DailyStackCard
            key={w.word + i}
            word={w.word}
            definition={w.definition}
            index={reverseI}
            entrance={entrance}
            isTop={reverseI === 0}
          />
        )
      })}
    </View>
  )
}

function DailyStackCard({
  word,
  definition,
  index,
  entrance,
  isTop,
}: {
  word: string
  definition: string
  index: number
  entrance: Animated.SharedValue<number>
  isTop: boolean
}) {
  const animStyle = useAnimatedStyle(() => {
    const scales = [1.0, 0.94, 0.88]
    const translates = [0, 14, 24]
    const scale = interpolate(entrance.value, [0, 1], [0.9, scales[index] ?? 0.88])
    const translateY = interpolate(entrance.value, [0, 1], [40, translates[index] ?? 24])
    const opacity = interpolate(entrance.value, [0, 1], [0, 1])
    return {
      transform: [{ scale }, { translateY }],
      opacity,
      zIndex: 10 - index,
    }
  })

  const gradientColors = STACK_COLORS[index] ?? STACK_COLORS[2]

  return (
    <Animated.View style={[stackStyles.card, animStyle]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={stackStyles.cardGradient}
      >
        {isTop ? (
          <>
            <Text style={stackStyles.phonetic}>{'/ˈlev.ər.ɪdʒ/'}</Text>
            <Text style={stackStyles.cardWord}>{word}</Text>
            <Text style={stackStyles.cardDef} numberOfLines={2}>{definition}</Text>
            <View style={stackStyles.hintPill}>
              <Text style={stackStyles.hintText}>Tap to flip</Text>
            </View>
          </>
        ) : null}
      </LinearGradient>
    </Animated.View>
  )
}

const stackStyles = StyleSheet.create({
  container: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  card: {
    position: 'absolute',
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: radii.lg,
    padding: 24,
    gap: 6,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardWord: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
  },
  cardDef: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  hintPill: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hintText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
})

// ─── Action Buttons ───────────────────────────────────────────

function ActionButtons() {
  return (
    <View style={actionStyles.row}>
      <Pressable style={[actionStyles.btn, actionStyles.skipBtn]}>
        <Ionicons name="close" size={22} color={colors.coral} />
      </Pressable>
      <Pressable style={[actionStyles.btn, actionStyles.audioBtn]}>
        <Ionicons name="volume-high" size={22} color={colors.ink2} />
      </Pressable>
      <Pressable style={[actionStyles.btn, actionStyles.knowBtn]}>
        <Ionicons name="checkmark" size={22} color={colors.mint} />
      </Pressable>
    </View>
  )
}

const actionStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  skipBtn: { borderColor: colors.coral, backgroundColor: colors.coralSoft },
  audioBtn: { borderColor: colors.border, backgroundColor: colors.card },
  knowBtn: { borderColor: colors.mint, backgroundColor: colors.mintSoft },
})

// ─── Review Card with Gradient Border ─────────────────────────

function ReviewCard({ count }: { count: number }) {
  const glow = useSharedValue(0)

  useEffect(() => {
    glow.value = withDelay(400, withTiming(1, { duration: 800 }))
  }, [])

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }))

  return (
    <Animated.View style={glowStyle}>
      <LinearGradient
        colors={[colors.iris, colors.irisLight, colors.iris]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={reviewStyles.gradientBorder}
      >
        <View style={reviewStyles.inner}>
          <View style={reviewStyles.left}>
            <LinearGradient
              colors={[colors.iris, colors.irisDeeper]}
              style={reviewStyles.iconBg}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
            </LinearGradient>
            <View style={reviewStyles.textBlock}>
              <Text style={reviewStyles.count}>{count} words to review</Text>
              <Text style={reviewStyles.hint}>Spaced repetition queue</Text>
            </View>
          </View>
          <View style={reviewStyles.arrow}>
            <Ionicons name="chevron-forward" size={18} color={colors.iris} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

const reviewStyles = StyleSheet.create({
  gradientBorder: { borderRadius: radii.lg + 2, padding: 2 },
  inner: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { gap: 2, flex: 1 },
  count: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2 },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.irisSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

// ─── Word of the Day Deep Dive ────────────────────────────────

function WordOfTheDay() {
  const w = WORD_OF_THE_DAY
  const { play } = useAudio()

  return (
    <View style={wotdStyles.card}>
      {/* Header */}
      <View style={wotdStyles.header}>
        <View style={wotdStyles.headerLeft}>
          <Text style={wotdStyles.wordTitle}>{w.word}</Text>
          <Text style={wotdStyles.phonetic}>{w.phonetic}</Text>
        </View>
        <View style={wotdStyles.posBadge}>
          <Text style={wotdStyles.posText}>{w.partOfSpeech}</Text>
        </View>
      </View>

      <Text style={wotdStyles.definition}>{w.definition}</Text>

      <View style={wotdStyles.divider} />

      {/* Etymology */}
      <View style={wotdStyles.section}>
        <View style={wotdStyles.sectionHeader}>
          <View style={[wotdStyles.sectionDot, { backgroundColor: colors.iris }]} />
          <Text style={wotdStyles.sectionLabel}>ETYMOLOGY</Text>
        </View>
        <Text style={wotdStyles.sectionBody}>{w.etymology}</Text>
      </View>

      {/* Pronunciation */}
      <Pressable onPress={() => play(w.word)}>
        <LinearGradient
          colors={[colors.irisSoft, colors.irisWash]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={wotdStyles.pronounceRow}
        >
          <View style={wotdStyles.playCircle}>
            <Ionicons name="volume-high" size={16} color="#fff" />
          </View>
          <Text style={wotdStyles.pronounceText}>Tap to hear pronunciation</Text>
        </LinearGradient>
      </Pressable>

      <View style={wotdStyles.divider} />

      {/* Scenario */}
      <View style={wotdStyles.section}>
        <View style={wotdStyles.sectionHeader}>
          <View style={[wotdStyles.sectionDot, { backgroundColor: colors.amber }]} />
          <Text style={wotdStyles.sectionLabel}>IN THE REAL WORLD</Text>
        </View>
        <Text style={wotdStyles.sectionBody}>{w.scenario}</Text>
        <Text style={wotdStyles.source}>— {w.scenarioSource}</Text>
      </View>
    </View>
  )
}

const wotdStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    gap: 14,
    ...shadows.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { gap: 4, flex: 1 },
  wordTitle: { fontFamily: fonts.serif, fontSize: 32, color: colors.ink, letterSpacing: -0.5 },
  phonetic: { fontFamily: fonts.mono, fontSize: 13, color: colors.iris },
  posBadge: {
    backgroundColor: colors.borderSoft,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  posText: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink2, textTransform: 'uppercase' },
  definition: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink2, lineHeight: 24 },
  divider: { height: 1, backgroundColor: colors.border },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.inkLight,
    letterSpacing: 1.5,
  },
  sectionBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, lineHeight: 22 },
  source: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkLight, fontStyle: 'italic', marginTop: 4 },
  pronounceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.sm,
    padding: 12,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pronounceText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.iris },
})

// ─── CTA Button ───────────────────────────────────────────────

function StartButton({ count }: { count: number }) {
  return (
    <Pressable onPress={() => router.push('/learning/session')}>
      <LinearGradient
        colors={[colors.ink, '#27272A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={ctaStyles.button}
      >
        <Text style={ctaStyles.label}>Start Daily Session ({count} words)</Text>
        <Ionicons name="play" size={18} color="#fff" />
      </LinearGradient>
    </Pressable>
  )
}

const ctaStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#fff' },
})

// ─── Main Learn Screen ────────────────────────────────────────

export default function LearnScreen() {
  const { words, isLoading } = useDailyWord()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Learn</Text>

        {/* Card stack + actions */}
        <View style={styles.section}>
          <AccentBlob placement="top-right" colorTheme="green" />
          <SectionLabel title="TODAY'S WORDS" />
          {isLoading ? (
            <View style={styles.loadingInner}>
              <Text style={styles.loadingText}>Loading session...</Text>
            </View>
          ) : words.length > 0 ? (
            <>
              <DailyStack words={words.map((w) => ({ word: w.word, definition: w.definition }))} />
              <ActionButtons />
              <StartButton count={words.length} />
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.mint} />
              <Text style={styles.emptyText}>All caught up for today!</Text>
            </View>
          )}
        </View>

        {/* Review Queue */}
        <View style={styles.section}>
          <AccentBlob placement="bottom-left" colorTheme="green" />
          <SectionLabel title="REVIEW QUEUE" />
          <ReviewCard count={MOCK_REVIEW_COUNT} />
        </View>

        {/* Word of the Day */}
        <View style={styles.section}>
          <AccentBlob placement="bottom-right" colorTheme="green" />
          <SectionLabel title="WORD OF THE DAY" />
          <WordOfTheDay />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 24, paddingBottom: 100 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  section: { gap: 12, position: 'relative' },
  loadingInner: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkLight },
  emptyCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    backgroundColor: colors.mintSoft,
    borderRadius: radii.lg,
  },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.mintText },
})
