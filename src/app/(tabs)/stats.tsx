import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, typography, spacing } from '@constants/theme'
import { useUserWords, useStreak } from '@store/progressStore'
import { Card } from '@components/ui/Card'
import { SectionBadge } from '@components/ui/SectionBadge'
import { IconCircle } from '@components/ui/IconCircle'

const STAT_ICONS = [
  { library: 'Ionicons' as const, name: 'flame', color: '#F59E0B' },
  { library: 'Ionicons' as const, name: 'checkmark-circle', color: '#10B981' },
  { library: 'Ionicons' as const, name: 'book', color: '#3B82F6' },
  { library: 'Ionicons' as const, name: 'analytics', color: '#8B5CF6' },
]

export default function StatsScreen() {
  const userWords = useUserWords()
  const streak = useStreak()

  const all = Object.values(userWords)
  const mastered = all.filter((w) => w.status === 'mastered').length
  const learning = all.filter((w) => w.status === 'learning').length
  const totalAttempts = all.reduce((sum, w) => sum + w.totalAttempts, 0)
  const totalCorrect = all.reduce((sum, w) => sum + w.correctAttempts, 0)
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const stats = [
    { label: 'Day Streak', value: `${streak}` },
    { label: 'Mastered', value: `${mastered}` },
    { label: 'Learning', value: `${learning}` },
    { label: 'Accuracy', value: `${accuracy}%` },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionBadge label="Progress" color={colors.primaryGreen} />
        <Text style={styles.title}>Your Progress</Text>

        <View style={styles.grid}>
          {stats.map((stat, i) => (
            <Card key={stat.label} variant="default">
              <View style={styles.cardInner}>
                <IconCircle
                  library={STAT_ICONS[i].library}
                  name={STAT_ICONS[i].name}
                  color={STAT_ICONS[i].color}
                  size="sm"
                />
                <Text style={styles.cardValue}>{stat.value}</Text>
                <Text style={styles.cardLabel}>{stat.label}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[6], gap: spacing[4], paddingBottom: 100 },
  title: { ...typography.heading1, color: colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  cardInner: {
    flex: 1,
    minWidth: '45%',
    gap: spacing[2],
  },
  cardValue: { ...typography.heading1, color: colors.textPrimary },
  cardLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
})
