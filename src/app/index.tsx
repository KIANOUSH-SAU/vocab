import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useCurrentUser, useUserStore } from '@store/userStore'
import { getCurrentSession, isAppwriteConfigured } from '@services/appwriteService'
import { colors } from '@constants/theme'

export default function Index() {
  const user = useCurrentUser()
  const isSessionChecked = useUserStore((s) => s.isSessionChecked)
  const setSessionChecked = useUserStore((s) => s.setSessionChecked)
  const logout = useUserStore((s) => s.logout)

  useEffect(() => {
    async function checkSession() {
      try {
        // No user or guest — no Appwrite check needed
        if (!user || user.isGuest) {
          setSessionChecked(true)
          return
        }

        // Authenticated user — verify Appwrite session is still valid
        if (isAppwriteConfigured) {
          const session = await getCurrentSession()
          if (!session) {
            // Session expired — preserve lastLoggedInEmail via logout (not reset)
            logout()
          }
        }
      } catch {
        // Network error during check — let user through (offline tolerance)
      } finally {
        setSessionChecked(true)
        SplashScreen.hideAsync()
      }
    }

    checkSession()
  }, [])

  // Show nothing while checking session (splash screen stays visible)
  if (!isSessionChecked) {
    return <View style={styles.loading}><ActivityIndicator color={colors.iris} /></View>
  }

  if (!user) return <Redirect href="/(onboarding)/" />
  return <Redirect href="/(tabs)/home" />
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
