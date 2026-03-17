import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { useWordById } from '@store/wordStore'
import { useAudio } from '@hooks/useAudio'
import { colors, typography, spacing, radii } from '@constants/theme'
import { BackButton } from '@components/ui/BackButton'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { SectionBadge } from '@components/ui/SectionBadge'

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const word = useWordById(id)
  const { state, play } = useAudio()

  if (!word) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Word not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} />

        <View style={styles.wordHeader}>
          <Text style={styles.wordTitle}>{word.word}</Text>
          <Text style={styles.phonetic}>{word.phonetic}</Text>
          <SectionBadge label={word.partOfSpeech.toUpperCase()} color={colors.textSecondary} />
        </View>

        <Card variant="default">
          <View style={styles.sectionInner}>
            <Text style={styles.sectionLabel}>DEFINITION</Text>
            <Text style={styles.definition}>{word.definition}</Text>
          </View>
        </Card>

        <Card variant="default">
          <View style={styles.sectionInner}>
            <Text style={styles.sectionLabel}>EXAMPLE</Text>
            <Text style={styles.example}>"{word.exampleSentence}"</Text>
          </View>
        </Card>

        {word.contextPassage ? (
          <Card variant="default">
            <View style={styles.sectionInner}>
              <Text style={styles.sectionLabel}>IN CONTEXT</Text>
              <Text style={styles.passage}>{word.contextPassage}</Text>
              <Button
                label={state === 'loading' ? 'Loading...' : state === 'playing' ? 'Stop' : 'Hear it'}
                onPress={() => play(word.contextPassage, `passage-${word.id}`)}
                variant="secondary"
                size="sm"
                icon={{
                  library: 'Ionicons',
                  name: state === 'playing' ? 'stop-circle' : 'play-circle',
                  position: 'left',
                }}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[6], gap: spacing[6] },
  wordHeader: { gap: spacing[2] },
  wordTitle: { ...typography.wordTitle, color: colors.textPrimary },
  phonetic: { ...typography.body, color: colors.textMuted },
  sectionInner: { gap: spacing[2] },
  sectionLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1 },
  definition: { ...typography.body, color: colors.textPrimary },
  example: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic' },
  passage: { ...typography.body, color: colors.textSecondary, lineHeight: 26 },
  error: { ...typography.body, color: colors.textMuted, padding: spacing[6] },
})
