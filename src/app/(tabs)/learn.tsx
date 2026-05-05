import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
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
  withSpring,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useDailyWord } from "@hooks/useDailyWord";
import { useAudio } from "@hooks/useAudio";
import { useTabFocusSync } from "@hooks/useRemoteSync";
import { useProgressStore } from "@store/progressStore";
import { useWordStore } from "@store/wordStore";
import { isWordDueToday } from "@utils/spacedRepetition";
import { colors, radii, shadows, fonts } from "@constants/theme";
import { AccentBlob } from "@components/ui/AccentBlob";
import { SectionLabel } from "@components/ui/SectionLabel";
import { WordDetailsCard } from "@components/word/WordDetailsCard";
import { todayString } from "@utils/dateUtils";
import type { Word } from "@/types";

// ─── Practice Invite Card ─────────────────────────────────────

function PracticeInviteCard({ words }: { words: Word[] }) {
  const front = words[0];

  const press = useSharedValue(1);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const onPressIn = () => {
    press.value = withSpring(0.97, { damping: 15, stiffness: 280 });
  };
  const onPressOut = () => {
    press.value = withSpring(1, { damping: 15, stiffness: 280 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: press.value },
      { translateY: interpolate(float.value, [0, 0.5, 1], [0, -3, 0]) },
    ],
  }));

  const deepBackStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 0.5, 1], [0, 2, 0]) },
    ],
  }));

  const midBackStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 0.5, 1], [0, 1, 0]) },
    ],
  }));

  if (!front) return null;

  const hasBackCards = words.length > 1;
  const hasDeepBackCard = words.length > 2;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => router.push("/learning/session")}
    >
      <View style={teaserStyles.stackWrapper}>
        {/* Deep back card peek */}
        {hasDeepBackCard && (
          <Animated.View
            style={[teaserStyles.backCard, teaserStyles.backCardDeep, deepBackStyle]}
          >
            <LinearGradient
              colors={[colors.irisWash, colors.irisSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={teaserStyles.backGradient}
            />
          </Animated.View>
        )}

        {/* Mid back card peek */}
        {hasBackCards && (
          <Animated.View
            style={[teaserStyles.backCard, teaserStyles.backCardMid, midBackStyle]}
          >
            <LinearGradient
              colors={["#C4B5FD", colors.irisLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={teaserStyles.backGradient}
            />
          </Animated.View>
        )}

        {/* Front card */}
        <Animated.View style={[teaserStyles.frontCard, frontStyle]}>
          <LinearGradient
            colors={[colors.iris, colors.irisDeeper]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={teaserStyles.frontGradient}
          >
            <View style={teaserStyles.glowOne} />
            <View style={teaserStyles.glowTwo} />

            <View style={teaserStyles.topRow}>
              <View style={teaserStyles.countPill}>
                <View style={teaserStyles.countDot} />
                <Text style={teaserStyles.countText}>
                  {words.length} WORDS READY
                </Text>
              </View>
              <View style={teaserStyles.stackIcon}>
                <Ionicons
                  name="layers"
                  size={14}
                  color="rgba(255,255,255,0.88)"
                />
              </View>
            </View>

            <View style={teaserStyles.wordBlock}>
              {front.phonetic ? (
                <Text style={teaserStyles.phonetic}>{front.phonetic}</Text>
              ) : null}
              <Text
                style={teaserStyles.word}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {front.word}
              </Text>
              <Text style={teaserStyles.definition} numberOfLines={2}>
                {front.definition}
              </Text>
            </View>

            <View style={teaserStyles.ctaBar}>
              <View style={teaserStyles.ctaTextCol}>
                <Text style={teaserStyles.ctaHeadline}>
                  Start today's session
                </Text>
                <Text style={teaserStyles.ctaSub}>
                  ~5 minutes · earn your streak
                </Text>
              </View>
              <View style={teaserStyles.ctaArrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.ink} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const teaserStyles = StyleSheet.create({
  stackWrapper: {
    position: "relative",
    paddingTop: 18,
  },
  backCard: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 68,
    overflow: "hidden",
    borderRadius: radii.lg,
  },
  backCardDeep: {
    top: 0,
    marginHorizontal: 26,
  },
  backCardMid: {
    top: 9,
    marginHorizontal: 13,
  },
  backGradient: {
    flex: 1,
    borderRadius: radii.lg,
  },
  frontCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.iris,
  },
  frontGradient: {
    padding: 22,
    minHeight: 260,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  glowOne: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  glowTwo: {
    position: "absolute",
    bottom: -40,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  countText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 1,
  },
  stackIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  wordBlock: {
    gap: 4,
    marginVertical: 8,
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  word: {
    fontFamily: fonts.serif,
    fontSize: 42,
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 48,
  },
  definition: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 21,
    marginTop: 6,
  },
  ctaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  ctaTextCol: { flex: 1 },
  ctaHeadline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: "#fff",
  },
  ctaSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  ctaArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
});

// ─── All Done Card ────────────────────────────────────────────

function AllDoneCard({ wordCount }: { wordCount: number }) {
  const checkScale = useSharedValue(0);
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withDelay(
      120,
      withSpring(1, { damping: 10, stiffness: 140 }),
    );
    ringPulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ringPulse.value, [0, 1], [1, 1.8]) }],
    opacity: interpolate(ringPulse.value, [0, 1], [0.35, 0]),
  }));

  return (
    <View style={doneStyles.card}>
      <LinearGradient
        colors={["#ECFDF5", "#D1FAE5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={doneStyles.gradient}
      >
        <View style={doneStyles.iconWrap}>
          <Animated.View style={[doneStyles.pulseRing, ringStyle]} />
          <Animated.View style={[doneStyles.iconCircle, checkStyle]}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </Animated.View>
        </View>

        <Text style={doneStyles.title}>All done for today</Text>
        <Text style={doneStyles.subtitle}>
          You finished today's {wordCount > 0 ? wordCount : 5} words. Come back
          tomorrow for a fresh set.
        </Text>

        <Pressable
          style={doneStyles.reviewBtn}
          onPress={() => router.push("/(tabs)/review")}
        >
          <Text style={doneStyles.reviewBtnText}>Review earlier words</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.mintText} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const doneStyles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  gradient: {
    padding: 28,
    alignItems: "center",
    gap: 10,
    minHeight: 260,
    justifyContent: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  pulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
    maxWidth: 320,
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  reviewBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.mintText,
  },
});

// ─── Review Card with Gradient Border ─────────────────────────

function ReviewCard({ count }: { count: number }) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withDelay(400, withTiming(1, { duration: 800 }));
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={glowStyle}>
      <LinearGradient
        colors={[colors.iris, colors.irisLight, colors.iris]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={reviewStyles.gradientBorder}
      >
        <View style={reviewStyles.inner}>
          <View style={reviewStyles.left}>
            <LinearGradient
              colors={[colors.iris, colors.irisDeeper]}
              style={reviewStyles.iconBg}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
            </LinearGradient>
            <View style={reviewStyles.textBlock}>
              <Text style={reviewStyles.count}>{count} words to review</Text>
              <Text style={reviewStyles.hint}>Spaced repetition queue</Text>
            </View>
          </View>
          <View style={reviewStyles.arrow}>
            <Ionicons name="chevron-forward" size={18} color={colors.iris} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const reviewStyles = StyleSheet.create({
  gradientBorder: { borderRadius: radii.lg + 2, padding: 2 },
  inner: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { gap: 2, flex: 1 },
  count: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2 },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.irisSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});

// Word of the Day deep-dive card now lives in @components/word/WordDetailsCard
// so the same UI is reused by the Celeb Explains screen.

// ─── Main Learn Screen ────────────────────────────────────────

export default function LearnScreen() {
  useTabFocusSync();
  const { words, isLoading, error, refresh } = useDailyWord();
  const { userWords } = useProgressStore();
  const isDailySessionCompleted = useWordStore(
    (s) => s.isDailySessionCompleted,
  );
  const lastActiveDate = useProgressStore((s) => s.lastActiveDate);
  const todayCompleted =
    isDailySessionCompleted && lastActiveDate === todayString();

  const wordCache = useWordStore((s) => s.wordCache);

  const reviewCount = useMemo(() => {
    return Object.values(userWords).filter(
      (uw) =>
        uw.status === "learning" && isWordDueToday(uw) && wordCache[uw.wordId],
    ).length;
  }, [userWords, wordCache]);

  const spotlightWord = words[0] ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Learn</Text>

        {/* Today's practice */}
        <View style={styles.section}>
          <AccentBlob placement="top-right" colorTheme="green" />
          <SectionLabel title="TODAY'S WORDS" />
          {isLoading ? (
            <View style={styles.loadingInner}>
              <Text style={styles.loadingText}>Loading session...</Text>
            </View>
          ) : error ? (
            <Pressable onPress={refresh} style={styles.errorCard}>
              <Ionicons name="alert-circle" size={32} color={colors.coral} />
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          ) : todayCompleted ? (
            <AllDoneCard wordCount={words.length} />
          ) : words.length > 0 ? (
            <PracticeInviteCard words={words} />
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.mint} />
              <Text style={styles.emptyText}>All caught up for today!</Text>
            </View>
          )}
        </View>

        {/* Review Queue */}
        <View style={styles.section}>
          <AccentBlob placement="bottom-left" colorTheme="green" />
          <SectionLabel title="REVIEW QUEUE" />
          <ReviewCard count={reviewCount} />
        </View>

        {/* Word of the Day */}
        {spotlightWord ? (
          <View style={styles.section}>
            <AccentBlob placement="bottom-right" colorTheme="green" />
            <SectionLabel title="WORD OF THE DAY" />
            <WordDetailsCard word={spotlightWord} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 24, paddingBottom: 100 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  section: { gap: 12, position: "relative" },
  loadingInner: { alignItems: "center", paddingVertical: 40 },
  loadingText: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkLight },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
    backgroundColor: colors.mintSoft,
    borderRadius: radii.lg,
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.mintText,
  },
  errorCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 32,
    backgroundColor: colors.coralSoft,
    borderRadius: radii.lg,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.coral,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.ink2,
  },
});
