import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCurrentUser, useIsGuest } from '@store/userStore'
import { useStreak } from '@store/progressStore'
import { useDailyWord } from '@hooks/useDailyWord'
import { colors, typography, spacing, radii, shadows } from '@constants/theme'
import { Card } from '@components/ui/Card'
import { SectionBadge } from '@components/ui/SectionBadge'
import { IconCircle } from '@components/ui/IconCircle'

// Mock data — will be wired to Appwrite/Zustand later
const MOCK_PROGRESS = {
  sessionsCompleted: 2,
  weeklyGoal: 3,
  wordsMastered: 14,
  totalWords: 50,
}

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  )
}

const progressStyles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
})

const MODULES = [
  {
    title: 'Pronounce like a Pro',
    subtitle: 'Audio & phonics practice',
    icon: 'mic-outline' as const,
    color: colors.fields.engineering,
    route: '/modules/pronunciation' as const,
  },
  {
    title: 'Letters Overseas',
    subtitle: 'Professional emails & writing',
    icon: 'mail-outline' as const,
    color: colors.fields.law,
    route: '/modules/letters' as const,
  },
]

export default function HomeScreen() {
  const user = useCurrentUser()
  const isGuest = useIsGuest()
  const streak = useStreak()
  const { words, isLoading } = useDailyWord()

  const sessionPct = MOCK_PROGRESS.sessionsCompleted
  const sessionGoal = MOCK_PROGRESS.weeklyGoal
  const mastered = MOCK_PROGRESS.wordsMastered
  const total = MOCK_PROGRESS.totalWords

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {user?.name ? `Hey, ${user.name}` : 'Good morning'}
          </Text>
          <Card variant="elevated" padding={spacing[3]}>
            <View style={styles.streakInner}>
              <IconCircle library="Ionicons" name="flame" color={colors.warning} size="sm" />
              <View style={styles.streakText}>
                <Text style={styles.streakCount}>{streak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Guest banner */}
        {isGuest && (
          <Card variant="outlined">
            <View style={styles.guestInner}>
              <IconCircle library="Ionicons" name="information-circle-outline" color={colors.textMuted} size="sm" />
              <Text style={styles.guestText}>
                Create an account to save your progress
              </Text>
            </View>
          </Card>
        )}

        {/* Today's Words */}
        <View style={styles.section}>
          <SectionBadge label="Today's Words" color={colors.primaryGreen} />
          <View style={styles.wordList}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading your words...</Text>
            ) : (
              words.map((word) => (
                <Card
                  key={word.id}
                  variant="default"
                  onPress={() => router.push(`/word/${word.id}`)}
                >
                  <View style={styles.wordInfo}>
                    <Text style={styles.wordText}>{word.word}</Text>
                    <Text style={styles.wordPos}>{word.partOfSpeech}</Text>
                  </View>
                  <Text style={styles.wordDef} numberOfLines={2}>{word.definition}</Text>
                </Card>
              ))
            )}
          </View>
        </View>

        {/* Dopamine Zone — Progress */}
        <View style={styles.section}>
          <SectionBadge label="Your Progress" color={colors.fields.engineering} />
          <Card variant="elevated">
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Weekly Goal</Text>
                <Text style={styles.progressValue}>{sessionPct}/{sessionGoal}</Text>
              </View>
              <ProgressBar value={sessionPct} total={sessionGoal} color={colors.primaryGreen} />
              <Text style={styles.progressHint}>Complete sessions</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Vocabulary Mastery</Text>
                <Text style={styles.progressValue}>{mastered}/{total}</Text>
              </View>
              <ProgressBar value={mastered} total={total} color={colors.fields.law} />
              <Text style={styles.progressHint}>Words mastered</Text>
            </View>
          </Card>
        </View>

        {/* Mini-Modules */}
        <View style={styles.section}>
          <SectionBadge label="Quick Modules" color={colors.fields.sports} />
          <View style={styles.moduleList}>
            {MODULES.map((mod) => (
              <Card
                key={mod.route}
                variant="elevated"
                onPress={() => router.push(mod.route)}
              >
                <View style={styles.moduleInner}>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
                  </View>
                  <IconCircle
                    library="Ionicons"
                    name={mod.icon}
                    color={mod.color}
                    size="md"
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[6], gap: spacing[6], paddingBottom: 100 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { ...typography.heading2, color: colors.textPrimary, flex: 1 },
  streakInner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  streakText: { alignItems: 'flex-end' },
  streakCount: { ...typography.heading2, color: colors.textPrimary },
  streakLabel: { ...typography.caption, color: colors.textMuted },

  // Guest
  guestInner: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  guestText: { ...typography.small, color: colors.textSecondary, flex: 1 },

  // Sections
  section: { gap: spacing[3] },
  loadingText: { ...typography.body, color: colors.textMuted },

  // Word list
  wordList: { gap: spacing[3] },
  wordInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  wordText: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
  wordPos: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
  wordDef: { ...typography.small, color: colors.textSecondary, marginTop: spacing[1] },

  // Progress bars
  progressItem: { gap: spacing[2] },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...typography.smallMedium, color: colors.textPrimary },
  progressValue: { ...typography.caption, color: colors.textMuted },
  progressHint: { ...typography.caption, color: colors.textMuted },
  progressDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing[3] },

  // Modules
  moduleList: { gap: spacing[3] },
  moduleInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moduleText: { flex: 1, gap: spacing[1] },
  moduleTitle: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600' },
  moduleSubtitle: { ...typography.small, color: colors.textSecondary },
})
