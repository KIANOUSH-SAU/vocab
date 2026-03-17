import { useEffect } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { FIELDS } from '@constants/fields'
import { colors, spacing, radii, typography } from '@constants/theme'
import { MaxWidthContainer } from '@components/ui/MaxWidthContainer'
import { IconCircle } from '@components/ui/IconCircle'
import { Button } from '@components/ui/Button'

function useFadeUp(delay = 0) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(28)
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }))
    translateY.value = withDelay(delay, withTiming(0, { duration: 600 }))
  }, [])
  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))
}

export default function WelcomeScreen() {
  const dotsStyle = useFadeUp(0)
  const wordmarkStyle = useFadeUp(120)
  const taglineStyle = useFadeUp(240)
  const buttonsStyle = useFadeUp(360)

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>

          {/* Top — field icons */}
          <Animated.View style={[styles.iconsRow, dotsStyle]}>
            {FIELDS.map((f) => (
              <IconCircle
                key={f.id}
                library={f.icon.library}
                name={f.icon.name}
                color={f.color}
                size="sm"
              />
            ))}
          </Animated.View>

          {/* Middle — wordmark + tagline */}
          <View style={styles.hero}>
            <Animated.View style={wordmarkStyle}>
              <Text style={styles.wordmark}>
                vocab<Text style={styles.period}>.</Text>
              </Text>
            </Animated.View>

            <Animated.Text style={[styles.tagline, taglineStyle]}>
              Learn the words that{'\n'}matter for your career.
            </Animated.Text>
          </View>

          {/* Bottom — CTAs */}
          <Animated.View style={[styles.actions, buttonsStyle]}>
            <Button
              label="Get Started"
              onPress={() => router.push('/(onboarding)/interests')}
              variant="primary"
              size="lg"
              fullWidth
              icon={{ library: 'Ionicons', name: 'arrow-forward', position: 'right' }}
            />
            <Button
              label="Try 3 words for free"
              onPress={() =>
                router.push({ pathname: '/(onboarding)/interests', params: { guest: 'true' } })
              }
              variant="ghost"
              size="lg"
              fullWidth
            />
          </Animated.View>

        </View>
      </SafeAreaView>
    </MaxWidthContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    justifyContent: 'space-between',
  },

  // Icons
  iconsRow: { flexDirection: 'row', gap: spacing[3] },

  // Hero
  hero: { gap: spacing[4] },
  wordmark: {
    fontSize: Platform.OS === 'web' ? 72 : 64,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: Platform.OS === 'web' ? 80 : 72,
  },
  period: { color: '#3B82F6' },
  tagline: {
    ...typography.heading3,
    color: colors.textSecondary,
    lineHeight: 30,
    fontWeight: '400',
  },

  // Actions
  actions: { gap: spacing[3] },
})
