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

export default function HomeScreen() {
  const user = useCurrentUser()
  const isGuest = useIsGuest()
  const streak = useStreak()
  const { words, isLoading } = useDailyWord()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[6], gap: spacing[6], paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { ...typography.heading2, color: colors.textPrimary, flex: 1 },
  streakInner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  streakText: { alignItems: 'flex-end' },
  streakCount: { ...typography.heading2, color: colors.textPrimary },
  streakLabel: { ...typography.caption, color: colors.textMuted },
  guestInner: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  guestText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  section: { gap: spacing[3] },
  wordList: { gap: spacing[3] },
  loadingText: { ...typography.body, color: colors.textMuted },
  wordInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  wordText: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
  wordPos: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
  wordDef: { ...typography.small, color: colors.textSecondary, marginTop: spacing[1] },
})
