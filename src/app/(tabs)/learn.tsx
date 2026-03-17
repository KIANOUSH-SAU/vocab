import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, spacing } from '@constants/theme'
import { useDailyWord } from '@hooks/useDailyWord'
import { SectionBadge } from '@components/ui/SectionBadge'
import { Card } from '@components/ui/Card'
import { IconCircle } from '@components/ui/IconCircle'

export default function LearnScreen() {
  const { words, isLoading } = useDailyWord()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SectionBadge label="Daily Session" color={colors.primaryGreen} />
        <Text style={styles.title}>Learn</Text>
        {/* TODO: ExerciseSession component — renders useExerciseSession with today's words */}
        <Card variant="outlined">
          <View style={styles.placeholderInner}>
            <IconCircle library="Ionicons" name="school-outline" color={colors.primaryGreen} size="lg" />
            {isLoading ? (
              <Text style={styles.placeholder}>Loading session...</Text>
            ) : (
              <Text style={styles.placeholder}>
                {words.length} words ready{'\n'}Exercise session coming soon
              </Text>
            )}
          </View>
        </Card>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing[6], gap: spacing[4], paddingBottom: 100 },
  title: { ...typography.heading1, color: colors.textPrimary },
  placeholderInner: { alignItems: 'center', gap: spacing[4], paddingVertical: spacing[6] },
  placeholder: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
})
