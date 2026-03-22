import { useEffect } from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { oauthLogin } from "@services/appwriteService";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
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
    shadowOpacity: 0.3,
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
          {/* Field dots */}
          <Animated.View style={[styles.iconsRow, dotsStyle]}>
            {FIELDS.map((f, i) => (
              <AnimatedDot key={f.id} color={f.color} index={i} />
            ))}
          </Animated.View>

          {/* Hero */}
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

          {/* CTAs */}
          <Animated.View style={[styles.actions, buttonsStyle]}>
            {isReturning ? (
              <>
                <Pressable onPress={() => router.push("/(onboarding)/auth/login")}>
                  <LinearGradient
                    colors={[colors.ink, '#27272A']}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryLabel}>Go to your account</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </Pressable>
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
                <Pressable onPress={() => router.push("/(onboarding)/interests")}>
                  <LinearGradient
                    colors={[colors.ink, '#27272A']}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryLabel}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </Pressable>
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
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(onboarding)/interests",
                      params: { guest: "true" },
                    })
                  }
                  style={styles.guestLink}
                >
                  <Text style={styles.guestText}>
                    Try 3 words for free <Text style={styles.guestArrow}>→</Text>
                  </Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </MaxWidthContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  iconsRow: { flexDirection: "row", gap: 12 },
  hero: { gap: 16 },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: Platform.OS === "web" ? 72 : 64,
    color: colors.ink,
    letterSpacing: -2,
    lineHeight: Platform.OS === "web" ? 80 : 72,
  },
  period: { color: colors.iris },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 18,
    color: colors.ink2,
    lineHeight: 30,
  },
  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  primaryLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  guestLink: { alignItems: 'center', paddingVertical: 12 },
  guestText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink2 },
  guestArrow: { color: colors.iris },
});
