import { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { useCurrentUser, useIsGuest } from '@store/userStore'
import { useStreak } from '@store/progressStore'
import { useDailyWord } from '@hooks/useDailyWord'
import { colors, spacing, radii, shadows, fonts } from '@constants/theme'

// Mock data
const MOCK_PROGRESS = {
  sessionsCompleted: 2,
  weeklyGoal: 3,
  wordsMastered: 14,
  totalWords: 50,
}

// ─── Animated Blob Shape ──────────────────────────────────────

function BlobShape() {
  const morph = useSharedValue(0)

  useEffect(() => {
    morph.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [])

  const blobStyle = useAnimatedStyle(() => {
    const t = morph.value
    return {
      borderTopLeftRadius: 60 + t * 20,
      borderTopRightRadius: 40 + t * 30,
      borderBottomLeftRadius: 50 - t * 15,
      borderBottomRightRadius: 50 + t * 20,
    }
  })

  return (
    <Animated.View style={[styles.blob, blobStyle]}>
      <LinearGradient
        colors={['#C4B5FD', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

// ─── Streak Flame Widget ──────────────────────────────────────

function StreakWidget({ count }: { count: number }) {
  const flameScale = useSharedValue(1)
  const flameRotate = useSharedValue(0)

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 375 }),
        withTiming(1.0, { duration: 375 }),
      ),
      -1,
    )
    flameRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 500 }),
        withTiming(3, { duration: 500 }),
      ),
      -1,
      true,
    )
  }, [])

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotate.value}deg` },
    ],
  }))

  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = new Date().getDay() // 0=Sun
  const dayIndex = today === 0 ? 6 : today - 1

  return (
    <View style={streakStyles.container}>
      <Animated.Text style={[streakStyles.flame, flameStyle]}>🔥</Animated.Text>
      <Text style={streakStyles.count}>{count}</Text>
      <Text style={streakStyles.label}>day streak</Text>
      <View style={streakStyles.dotsRow}>
        {DAYS.map((d, i) => {
          const state = i < dayIndex ? 'done' : i === dayIndex ? 'today' : 'future'
          return (
            <View
              key={i}
              style={[
                streakStyles.dot,
                state === 'done' && streakStyles.dotDone,
                state === 'today' && streakStyles.dotToday,
                state === 'future' && streakStyles.dotFuture,
              ]}
            >
              <Text
                style={[
                  streakStyles.dotText,
                  (state === 'done' || state === 'today') && { color: '#fff' },
                ]}
              >
                {d}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const streakStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    ...shadows.card,
  },
  flame: { fontSize: 38 },
  count: { fontFamily: fonts.serif, fontSize: 36, color: colors.ink },
  label: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.iris },
  dotToday: { backgroundColor: colors.amber },
  dotFuture: { backgroundColor: colors.borderSoft },
  dotText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.ink2 },
})

// ─── Word of the Day Card (Blob Style) ────────────────────────

function WordOfDayCard() {
  const { words } = useDailyWord()
  const word = words[0]

  const w = word ?? {
    word: 'Resilient',
    phonetic: '/rɪˈzɪl.i.ənt/',
    definition: 'Able to withstand or recover quickly from difficult conditions',
    partOfSpeech: 'adjective',
    fields: ['engineering'],
  }

  return (
    <View style={wotdStyles.wrapper}>
      <BlobShape />
      <View style={wotdStyles.card}>
        <Text style={wotdStyles.label}>WORD OF THE DAY</Text>
        <Text style={wotdStyles.word}>{w.word}</Text>
        <Text style={wotdStyles.phonetic}>{w.phonetic}</Text>
        <View style={wotdStyles.divider} />
        <Text style={wotdStyles.definition}>{w.definition}</Text>
        <View style={wotdStyles.footer}>
          <View style={wotdStyles.fieldChip}>
            <Text style={wotdStyles.fieldText}>
              {(w.fields?.[0] ?? 'general').charAt(0).toUpperCase() + (w.fields?.[0] ?? 'general').slice(1)}
            </Text>
          </View>
          <Pressable style={wotdStyles.playBtn}>
            <Ionicons name="play" size={14} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const wotdStyles = StyleSheet.create({
  wrapper: { position: 'relative' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    gap: 10,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.ink2,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  word: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, letterSpacing: -0.5 },
  phonetic: { fontFamily: fonts.mono, fontSize: 13, color: colors.iris },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  definition: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  fieldChip: {
    backgroundColor: colors.irisSoft,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fieldText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.iris },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

// ─── Progress Section ─────────────────────────────────────────

function ProgressSection() {
  const { sessionsCompleted, weeklyGoal, wordsMastered, totalWords } = MOCK_PROGRESS

  return (
    <View style={progStyles.container}>
      <View style={progStyles.row}>
        <ProgressCard
          label="Weekly Goal"
          value={sessionsCompleted}
          total={weeklyGoal}
          gradient={['#2DD4A8', '#059669']}
          icon="checkmark-circle"
        />
        <ProgressCard
          label="Mastery"
          value={wordsMastered}
          total={totalWords}
          gradient={['#7C5CFC', '#5B3FD4']}
          icon="school"
        />
      </View>
    </View>
  )
}

function ProgressCard({ label, value, total, gradient, icon }: {
  label: string; value: number; total: number; gradient: [string, string]; icon: string
}) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0

  return (
    <View style={progStyles.card}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={progStyles.iconBg}
      >
        <Ionicons name={icon as any} size={18} color="#fff" />
      </LinearGradient>
      <Text style={progStyles.cardLabel}>{label}</Text>
      <Text style={progStyles.cardValue}>
        {value}<Text style={progStyles.cardTotal}>/{total}</Text>
      </Text>
      <View style={progStyles.track}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[progStyles.fill, { width: `${pct * 100}%` }]}
        />
      </View>
    </View>
  )
}

const progStyles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    gap: 8,
    ...shadows.card,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  cardValue: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.ink },
  cardTotal: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkLight },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
})

// ─── Module Cards ─────────────────────────────────────────────

function ModuleCards() {
  return (
    <View style={modStyles.container}>
      <Pressable
        onPress={() => router.push('/modules/pronunciation')}
        style={modStyles.card}
      >
        <LinearGradient
          colors={[colors.iris, colors.irisDeeper]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={modStyles.gradient}
        >
          <View style={modStyles.inner}>
            <View style={modStyles.text}>
              <Text style={modStyles.title}>Pronounce like a Pro</Text>
              <Text style={modStyles.subtitle}>Audio & phonics practice</Text>
            </View>
            <View style={modStyles.iconCircle}>
              <Ionicons name="mic" size={22} color={colors.iris} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={() => router.push('/modules/letters')}
        style={modStyles.card}
      >
        <LinearGradient
          colors={['#38BDF8', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={modStyles.gradient}
        >
          <View style={modStyles.inner}>
            <View style={modStyles.text}>
              <Text style={modStyles.title}>Letters Overseas</Text>
              <Text style={modStyles.subtitle}>Professional emails & writing</Text>
            </View>
            <View style={modStyles.iconCircle}>
              <Ionicons name="mail" size={22} color="#0284C7" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const modStyles = StyleSheet.create({
  container: { gap: 12 },
  card: { borderRadius: radii.lg, overflow: 'hidden', ...shadows.iris },
  gradient: { borderRadius: radii.lg },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  text: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

// ─── Main Home Screen ─────────────────────────────────────────

export default function HomeScreen() {
  const user = useCurrentUser()
  const isGuest = useIsGuest()
  const streak = useStreak()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>
          {user?.name ? `Hello, ${user.name}` : 'Good morning'}
        </Text>

        {/* Guest banner */}
        {isGuest && (
          <LinearGradient
            colors={[colors.irisSoft, colors.irisWash]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.guestBanner}
          >
            <Ionicons name="sparkles" size={18} color={colors.iris} />
            <Text style={styles.guestText}>
              Create an account to save your progress
            </Text>
          </LinearGradient>
        )}

        {/* Streak Widget */}
        <StreakWidget count={streak} />

        {/* Word of the Day */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WORD OF THE DAY</Text>
          <WordOfDayCard />
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR PROGRESS</Text>
          <ProgressSection />
        </View>

        {/* Quick Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK MODULES</Text>
          <ModuleCards />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 20, paddingBottom: 100 },

  greeting: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },

  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#D4C9FE',
  },
  guestText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.iris, flex: 1 },

  section: { gap: 12 },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.inkLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})
