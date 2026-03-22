import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { BackButton } from '@components/ui/BackButton'
import { colors, typography, spacing } from '@constants/theme'

export default function LettersModule() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.heading}>Letters Overseas</Text>
        <Text style={styles.subtitle}>Professional email & writing practice coming soon</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[6], gap: spacing[4] },
  heading: { ...typography.heading1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
})
