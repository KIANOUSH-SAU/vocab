import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useCurrentUser, useIsGuest, useUserStore } from '@store/userStore'
import { colors, typography, spacing } from '@constants/theme'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'

export default function ProfileScreen() {
  const user = useCurrentUser()
  const isGuest = useIsGuest()
  const reset = useUserStore(s => s.reset)

  const handleAuthNavigation = () => {
    // Navigate to the onboarding/auth pipeline
    router.replace('/(onboarding)/')
  }

  const handleLogout = () => {
    reset()
    router.replace('/(onboarding)/')
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <View style={styles.content}>
        <Text style={styles.headerTitle}>{isGuest ? 'Login / Sign Up' : 'Your Profile'}</Text>
        
        {isGuest ? (
          <Card variant="elevated">
            <Text style={styles.bodyText}>
              Create an account to save your vocabulary progress and sync across devices.
            </Text>
            <View style={styles.buttonContainer}>
              <Button label="Get Started" onPress={handleAuthNavigation} fullWidth />
            </View>
          </Card>
        ) : (
          <Card variant="elevated">
            <Text style={styles.bodyText}>Name: {user?.name}</Text>
            <Text style={styles.bodyText}>Level: {user?.level}</Text>
            <View style={styles.buttonContainer}>
              <Button label="Logout" onPress={handleLogout} variant="secondary" fullWidth />
            </View>
          </Card>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[6],
    gap: spacing[6],
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  bodyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  buttonContainer: {
    marginTop: spacing[4],
  },
})
