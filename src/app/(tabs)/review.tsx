import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, typography, spacing } from '@constants/theme'
import { useUserWords } from '@store/progressStore'
import { isWordDueToday } from '@utils/spacedRepetition'
import { SectionBadge } from '@components/ui/SectionBadge'
import { Card } from '@components/ui/Card'
import { IconCircle } from '@components/ui/IconCircle'

export default function ReviewScreen() {
  const userWords = useUserWords()
  const dueCount = Object.values(userWords).filter(
    (uw) => uw.status === 'learning' && isWordDueToday(uw)
  ).length

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SectionBadge label="Spaced Repetition" color={colors.fields.law} />
        <Text style={styles.title}>Review</Text>
        <Card variant="outlined">
          <View style={styles.placeholderInner}>
            <IconCircle library="Ionicons" name="refresh-outline" color={colors.fields.law} size="lg" />
            <Text style={styles.subtitle}>{dueCount} words due today</Text>
          </View>
        </Card>
        {/* TODO: Spaced repetition review session */}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing[6], gap: spacing[4], paddingBottom: 100 },
  title: { ...typography.heading1, color: colors.textPrimary },
  placeholderInner: { alignItems: 'center', gap: spacing[4], paddingVertical: spacing[6] },
  subtitle: { ...typography.body, color: colors.textSecondary },
})
