import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useDailyWord } from "@hooks/useDailyWord";
import { useAudio } from "@hooks/useAudio";
import { useProgressStore } from "@store/progressStore";
import { isWordDueToday } from "@utils/spacedRepetition";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { AccentBlob } from "@components/ui/AccentBlob";
import { SectionLabel } from "@components/ui/SectionLabel";
import type { Word } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 80;
const SWIPE_EXIT_X = SCREEN_WIDTH * 1.2;

// ─── Gradient Card Stack ──────────────────────────────────────

const STACK_COLORS: [string, string][] = [
  [colors.iris, colors.irisDeeper], // top card
  ["#C4B5FD", colors.irisLight], // mid card
  [colors.irisSoft, colors.irisSoft], // back card
];

interface DailyStackProps {
  words: Word[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeLeftRef?: React.MutableRefObject<(() => void) | null>;
  swipeRightRef?: React.MutableRefObject<(() => void) | null>;
}

function DailyStack({
  words,
  onSwipeLeft,
  onSwipeRight,
  swipeLeftRef,
  swipeRightRef,
}: DailyStackProps) {
  const entrance = useSharedValue(0);
  const translateX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const isAnimating = useRef(false);
  const allDone = currentIndex >= words.length;

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 18, stiffness: 80 });
  }, []);

  const handleFlip = useCallback(() => setFlipped((f) => !f), []);

  const advanceCard = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating.current || allDone) return;
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      if (direction === "left") onSwipeLeft?.();
      if (direction === "right") onSwipeRight?.();
    },
    [allDone, onSwipeLeft, onSwipeRight, translateX],
  );

  const dismissCard = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating.current || allDone) return;
      isAnimating.current = true;
      const exitX = direction === "right" ? SWIPE_EXIT_X : -SWIPE_EXIT_X;
      translateX.value = withSpring(
        exitX,
        { damping: 20, stiffness: 120 },
        () => {
          runOnJS(advanceCard)(direction);
          isAnimating.current = false;
        },
      );
    },
    [allDone, translateX, advanceCard],
  );

  // Expose programmatic swipe triggers to parent via refs
  useEffect(() => {
    if (swipeLeftRef) swipeLeftRef.current = () => dismissCard("left");
    if (swipeRightRef) swipeRightRef.current = () => dismissCard("right");
  }, [swipeLeftRef, swipeRightRef, dismissCard]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .onUpdate((e) => {
          if (isAnimating.current) return;
          translateX.value = e.translationX;
        })
        .onEnd((e) => {
          if (isAnimating.current) return;
          if (e.translationX > SWIPE_THRESHOLD) {
            const exitX = SWIPE_EXIT_X;
            translateX.value = withSpring(
              exitX,
              { damping: 20, stiffness: 120 },
              () => {
                runOnJS(advanceCard)("right");
              },
            );
          } else if (e.translationX < -SWIPE_THRESHOLD) {
            const exitX = -SWIPE_EXIT_X;
            translateX.value = withSpring(
              exitX,
              { damping: 20, stiffness: 120 },
              () => {
                runOnJS(advanceCard)("left");
              },
            );
          } else {
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
          }
        }),
    [translateX, advanceCard],
  );

  // Build the visible stack: current word on top, next 2 behind
  const stackWords = useMemo(() => {
    if (allDone) return [];
    const result: Word[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = currentIndex + i;
      if (idx < words.length && words[idx]) result.push(words[idx]);
    }
    return result;
  }, [words, currentIndex, allDone]);

  if (allDone) {
    return (
      <View style={stackStyles.container}>
        <View style={stackStyles.doneCard}>
          <Ionicons name="checkmark-circle" size={40} color={colors.mint} />
          <Text style={stackStyles.doneTitle}>All done!</Text>
          <Text style={stackStyles.doneSubtitle}>
            You have reviewed all today's words.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={stackStyles.container}>
      {stackWords
        .slice()
        .reverse()
        .map((w, renderIdx) => {
          const stackPos = stackWords.length - 1 - renderIdx;
          const isTop = stackPos === 0;
          return (
            <DailyStackCard
              key={w.id + "-" + (currentIndex + stackPos)}
              word={w}
              stackIndex={stackPos}
              entrance={entrance}
              translateX={isTop ? translateX : undefined}
              flipped={isTop ? flipped : false}
              onFlip={isTop ? handleFlip : undefined}
              panGesture={isTop ? panGesture : undefined}
            />
          );
        })}
      {/* Page indicator */}
      <View style={stackStyles.dots}>
        {words.map((_, i) => (
          <View
            key={i}
            style={[
              stackStyles.dot,
              i === currentIndex && stackStyles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function DailyStackCard({
  word,
  stackIndex,
  entrance,
  translateX,
  flipped,
  onFlip,
  panGesture,
}: {
  word: Word;
  stackIndex: number;
  entrance: Animated.SharedValue<number>;
  translateX?: Animated.SharedValue<number>;
  flipped: boolean;
  onFlip?: () => void;
  panGesture?: ReturnType<typeof Gesture.Pan>;
}) {
  const animStyle = useAnimatedStyle(() => {
    const scales = [1.0, 0.94, 0.88];
    const translates = [0, 12, 22];
    const scale = interpolate(
      entrance.value,
      [0, 1],
      [0.9, scales[stackIndex] ?? 0.88],
    );
    const translateY = interpolate(
      entrance.value,
      [0, 1],
      [40, translates[stackIndex] ?? 22],
    );
    const opacity = interpolate(
      entrance.value,
      [0, 1],
      [0, stackIndex === 0 ? 1 : 0.85 - stackIndex * 0.15],
    );

    const tx = translateX?.value ?? 0;
    const rotate = interpolate(tx, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15]);

    return {
      transform: [
        { translateX: tx },
        { rotate: `${rotate}deg` },
        { scale },
        { translateY },
      ],
      opacity,
      zIndex: 10 - stackIndex,
    };
  });

  // Swipe direction overlay opacity
  const knowOverlayStyle = useAnimatedStyle(() => {
    const tx = translateX?.value ?? 0;
    const opacity = interpolate(tx, [0, SWIPE_THRESHOLD], [0, 0.35], Extrapolation.CLAMP);
    return { opacity };
  });

  const skipOverlayStyle = useAnimatedStyle(() => {
    const tx = translateX?.value ?? 0;
    const opacity = interpolate(tx, [0, -SWIPE_THRESHOLD], [0, 0.35], Extrapolation.CLAMP);
    return { opacity };
  });

  const gradientColors = STACK_COLORS[stackIndex] ?? STACK_COLORS[2];
  const isTop = stackIndex === 0;

  const cardContent = (
    <Animated.View style={[stackStyles.card, animStyle]}>
      <Pressable onPress={onFlip} disabled={!isTop}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={stackStyles.cardGradient}
        >
          {isTop ? (
            flipped ? (
              /* ─── Back: example sentence ─── */
              <>
                <Text style={stackStyles.backLabel}>EXAMPLE</Text>
                <Text style={stackStyles.backText}>
                  {word.exampleSentence}
                </Text>
                <View style={stackStyles.hintPill}>
                  <Text style={stackStyles.hintText}>Tap to flip back</Text>
                </View>
              </>
            ) : (
              /* ─── Front: word + definition ─── */
              <>
                {word.phonetic ? (
                  <Text style={stackStyles.phonetic}>{word.phonetic}</Text>
                ) : null}
                <Text style={stackStyles.cardWord}>{word.word}</Text>
                <Text style={stackStyles.cardDef} numberOfLines={3}>
                  {word.definition}
                </Text>
                <View style={stackStyles.hintPill}>
                  <Text style={stackStyles.hintText}>Tap to flip</Text>
                </View>
              </>
            )
          ) : null}

          {/* Swipe direction overlays (top card only) */}
          {isTop ? (
            <>
              <Animated.View
                style={[stackStyles.swipeOverlay, stackStyles.knowOverlay, knowOverlayStyle]}
                pointerEvents="none"
              />
              <Animated.View
                style={[stackStyles.swipeOverlay, stackStyles.skipOverlay, skipOverlayStyle]}
                pointerEvents="none"
              />
            </>
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  if (isTop && panGesture) {
    return <GestureDetector gesture={panGesture}>{cardContent}</GestureDetector>;
  }

  return cardContent;
}

const stackStyles = StyleSheet.create({
  container: {
    height: 220,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 4,
  },
  card: {
    position: "absolute",
    width: "100%",
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  cardGradient: {
    borderRadius: radii.lg,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 4,
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
  },
  knowOverlay: {
    backgroundColor: colors.mint,
  },
  skipOverlay: {
    backgroundColor: colors.coral,
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  cardWord: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
  },
  cardDef: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    paddingHorizontal: 12,
    lineHeight: 21,
    marginTop: 2,
  },
  backLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  backText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  hintPill: {
    position: "absolute",
    bottom: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  hintText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  doneCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 180,
    width: "100%",
    backgroundColor: colors.mintSoft,
    borderRadius: radii.lg,
  },
  doneTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
  },
  doneSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
  },
  dots: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.iris,
    width: 18,
  },
});

// ─── Action Buttons ───────────────────────────────────────────

function ActionButtons({
  onSkip,
  onAudio,
  onKnow,
}: {
  onSkip: () => void;
  onAudio: () => void;
  onKnow: () => void;
}) {
  return (
    <View style={actionStyles.row}>
      <Pressable style={[actionStyles.btn, actionStyles.skipBtn]} onPress={onSkip}>
        <Ionicons name="close" size={22} color={colors.coral} />
      </Pressable>
      <Pressable style={[actionStyles.btn, actionStyles.audioBtn]} onPress={onAudio}>
        <Ionicons name="volume-high" size={22} color={colors.ink2} />
      </Pressable>
      <Pressable style={[actionStyles.btn, actionStyles.knowBtn]} onPress={onKnow}>
        <Ionicons name="checkmark" size={22} color={colors.mint} />
      </Pressable>
    </View>
  );
}

const actionStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 16 },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  skipBtn: { borderColor: colors.coral, backgroundColor: colors.coralSoft },
  audioBtn: { borderColor: colors.border, backgroundColor: colors.card },
  knowBtn: { borderColor: colors.mint, backgroundColor: colors.mintSoft },
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

// ─── Word of the Day Deep Dive ────────────────────────────────

function WordOfTheDay({ word }: { word: Word }) {
  const { play } = useAudio();

  return (
    <View style={wotdStyles.card}>
      {/* Header */}
      <View style={wotdStyles.header}>
        <View style={wotdStyles.headerLeft}>
          <Text style={wotdStyles.wordTitle}>{word.word}</Text>
          {word.phonetic ? (
            <Text style={wotdStyles.phonetic}>{word.phonetic}</Text>
          ) : null}
        </View>
        <View style={wotdStyles.posBadge}>
          <Text style={wotdStyles.posText}>{word.partOfSpeech}</Text>
        </View>
      </View>

      <Text style={wotdStyles.definition}>{word.definition}</Text>

      <View style={wotdStyles.divider} />

      {/* Example */}
      <View style={wotdStyles.section}>
        <View style={wotdStyles.sectionHeader}>
          <View
            style={[wotdStyles.sectionDot, { backgroundColor: colors.iris }]}
          />
          <Text style={wotdStyles.sectionLabel}>EXAMPLE</Text>
        </View>
        <Text style={wotdStyles.sectionBody}>{word.exampleSentence}</Text>
      </View>

      {/* Pronunciation */}
      <Pressable onPress={() => play(word.word)}>
        <LinearGradient
          colors={[colors.irisSoft, colors.irisWash]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={wotdStyles.pronounceRow}
        >
          <View style={wotdStyles.playCircle}>
            <Ionicons name="volume-high" size={16} color="#fff" />
          </View>
          <Text style={wotdStyles.pronounceText}>
            Tap to hear pronunciation
          </Text>
        </LinearGradient>
      </Pressable>

      {/* Context */}
      {word.contextPassage ? (
        <>
          <View style={wotdStyles.divider} />
          <View style={wotdStyles.section}>
            <View style={wotdStyles.sectionHeader}>
              <View
                style={[wotdStyles.sectionDot, { backgroundColor: colors.amber }]}
              />
              <Text style={wotdStyles.sectionLabel}>IN CONTEXT</Text>
            </View>
            <Text style={wotdStyles.sectionBody}>{word.contextPassage}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const wotdStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    gap: 14,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { gap: 4, flex: 1 },
  wordTitle: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  phonetic: { fontFamily: fonts.mono, fontSize: 13, color: colors.iris },
  posBadge: {
    backgroundColor: colors.borderSoft,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  posText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink2,
    textTransform: "uppercase",
  },
  definition: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 24,
  },
  divider: { height: 1, backgroundColor: colors.border },
  section: { gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.inkLight,
    letterSpacing: 1.5,
  },
  sectionBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 22,
  },
  pronounceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.sm,
    padding: 12,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  pronounceText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.iris,
  },
});

// ─── CTA Button ───────────────────────────────────────────────

function StartButton({ count }: { count: number }) {
  return (
    <Pressable onPress={() => router.push("/learning/session")}>
      <LinearGradient
        colors={[colors.ink, "#27272A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={ctaStyles.button}
      >
        <Text style={ctaStyles.label}>Start Daily Session ({count} words)</Text>
        <Ionicons name="play" size={18} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
}

const ctaStyles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: "#fff" },
});

// ─── Main Learn Screen ────────────────────────────────────────

export default function LearnScreen() {
  const { words, isLoading, error, refresh } = useDailyWord();
  const { play } = useAudio();
  const { userWords } = useProgressStore();

  const swipeLeftRef = useRef<(() => void) | null>(null);
  const swipeRightRef = useRef<(() => void) | null>(null);

  const reviewCount = useMemo(() => {
    return Object.values(userWords).filter(
      (uw) => uw.status === "learning" && isWordDueToday(uw),
    ).length;
  }, [userWords]);

  // Pick the first word as "Word of the Day" spotlight
  const spotlightWord = words[0] ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Learn</Text>

        {/* Card stack + actions */}
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
          ) : words.length > 0 ? (
            <>
              <DailyStack
                words={words}
                swipeLeftRef={swipeLeftRef}
                swipeRightRef={swipeRightRef}
              />
              <ActionButtons
                onSkip={() => swipeLeftRef.current?.()}
                onAudio={() => {
                  if (spotlightWord) play(spotlightWord.word);
                }}
                onKnow={() => swipeRightRef.current?.()}
              />
              <StartButton count={words.length} />
            </>
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
            <WordOfTheDay word={spotlightWord} />
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
