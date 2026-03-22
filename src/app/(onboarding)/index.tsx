import { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { FIELDS } from "@constants/fields";
import { useUserStore } from "@store/userStore";
import { oauthLogin, isAppwriteConfigured } from "@services/appwriteService";
import { colors, spacing, radii, typography } from "@constants/theme";
import { MaxWidthContainer } from "@components/ui/MaxWidthContainer";
import { Button } from "@components/ui/Button";

function useFadeUp(delay = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600 }));
  }, []);
  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function AnimatedDot({ color, index }: { color: string; index: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      600 + index * 150,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    backgroundColor: color,
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  }));

  return <Animated.View style={style} />;
}

export default function WelcomeScreen() {
  const lastLoggedInEmail = useUserStore((s) => s.lastLoggedInEmail);
  const isReturning = Boolean(lastLoggedInEmail);

  const dotsStyle = useFadeUp(0);
  const wordmarkStyle = useFadeUp(120);
  const taglineStyle = useFadeUp(240);
  const buttonsStyle = useFadeUp(360);

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          {/* Top — field dots */}
          <Animated.View style={[styles.iconsRow, dotsStyle]}>
            {FIELDS.map((f, i) => (
              <AnimatedDot key={f.id} color={f.color} index={i} />
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
              Learn the words that{"\n"}matter for your career.
            </Animated.Text>
          </View>

          {/* Bottom — CTAs */}
          <Animated.View style={[styles.actions, buttonsStyle]}>
            {isReturning ? (
              <>
                <Button
                  label="Go to your account"
                  onPress={() => router.push("/(onboarding)/auth/login")}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={{
                    library: "Ionicons",
                    name: "arrow-forward",
                    position: "right",
                  }}
                />
                <Button
                  label="Start fresh"
                  onPress={() => router.push("/(onboarding)/interests")}
                  variant="ghost"
                  size="lg"
                  fullWidth
                />
              </>
            ) : (
              <>
                <Button
                  label="Create an account"
                  onPress={() => router.push("/(onboarding)/interests")}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={{
                    library: "Ionicons",
                    name: "arrow-forward",
                    position: "right",
                  }}
                />
                <Button
                  label="Continue with Google"
                  onPress={() => oauthLogin("google")}
                  variant="google"
                  size="lg"
                  fullWidth
                  icon={{
                    source: require("../../../assets/images/google-icon.png"),
                    position: "left",
                  }}
                />
                <Button
                  label="Continue with Apple"
                  onPress={() => oauthLogin("apple")}
                  variant="apple"
                  size="lg"
                  fullWidth
                  icon={{
                    library: "Ionicons",
                    name: "logo-apple",
                    position: "left",
                  }}
                />
                <Button
                  label="Try 3 words for free"
                  onPress={() =>
                    router.push({
                      pathname: "/(onboarding)/interests",
                      params: { guest: "true" },
                    })
                  }
                  variant="ghost"
                  size="lg"
                  fullWidth
                />
              </>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </MaxWidthContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    justifyContent: "space-between",
  },

  // Icons
  iconsRow: { flexDirection: "row", gap: spacing[3] },

  // Hero
  hero: { gap: spacing[4] },
  wordmark: {
    fontSize: Platform.OS === "web" ? 72 : 64,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: Platform.OS === "web" ? 80 : 72,
  },
  period: { color: "#3B82F6" },
  tagline: {
    ...typography.heading3,
    color: colors.textSecondary,
    lineHeight: 30,
    fontWeight: "400",
  },

  // Actions
  actions: { gap: spacing[3] },
});
