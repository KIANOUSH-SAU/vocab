import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet, Platform, ActivityIndicator, View } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import {
  DMSerifDisplay_400Regular,
} from '@expo-google-fonts/dm-serif-display'
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono'
import { colors } from '@constants/theme'

SplashScreen.preventAutoHideAsync()

// On web, set the page background so no flash
if (Platform.OS === 'web') {
  // @ts-ignore
  if (typeof document !== 'undefined') {
    document.body.style.backgroundColor = colors.bg
    document.body.style.margin = '0'
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  })

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.iris} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
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
          name="learning/session"
          options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }}
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
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
})
