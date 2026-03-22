import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet, Platform } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { colors } from '@constants/theme'

SplashScreen.preventAutoHideAsync()

// On web, set the page background to black so no white flash
if (Platform.OS === 'web') {
  // @ts-ignore
  if (typeof document !== 'undefined') {
    document.body.style.backgroundColor = '#000000'
    document.body.style.margin = '0'
  }
}

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: Platform.OS === 'web' ? 'none' : 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="word/[id]"
          options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modules/pronunciation"
          options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }}
        />
        <Stack.Screen
          name="modules/letters"
          options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }}
        />
      </Stack>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
})
