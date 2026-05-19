import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useWordStore, useTodaysWords } from "@store/wordStore";
import { useExerciseSession } from "@hooks/useExerciseSession";
import { useProgressStore } from "@store/progressStore";
import { useCurrentUser } from "@store/userStore";
import { isWordDueToday } from "@utils/spacedRepetition";
import type { Word, PartOfSpeech } from "@/types";
import { fonts, springConfigs } from "@constants/theme";

// ─── Spec palette (swiper-ui.md §2) ──────────────────────────

const c = {
  brand50: "#EEEDFE",
  brand100: "#E0DCF1",
  brand300: "#7F77DD",
  brand600: "#534AB7",
  brand800: "#3C3489",
  canvas: "#FAF8FF",
  surface: "#FFFFFF",
  ink: "#1A1733",
  ink2: "#6B6585",
  ink3: "#9994B0",
  rule: "rgba(83,74,183,0.12)",
  border: "rgba(83,74,183,0.16)",
  successFg: "#0F6E56",
  warnBg: "#FAECE7",
  warnFg: "#993C1D",
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 110;
const SWIPE_OUT_MS = 340;
const STACK_DEPTH = 3;

// ─── Premise builder (True/False mechanic) ───────────────────

type Premise = { text: string; isTrue: boolean };

function buildPremise(word: Word, allWords: Word[]): Premise {
  const showTrue = Math.random() > 0.5;
  if (showTrue) return { text: word.definition, isTrue: true };

  if (word.distractors && word.distractors.length > 0) {
    const pick = word.distractors[Math.floor(Math.random() * word.distractors.length)];
    return { text: pick, isTrue: false };
  }

  const others = allWords.filter((w) => w.id !== word.id);
  if (others.length > 0) {
    const wrong = others[Math.floor(Math.random() * others.length)];
    return { text: wrong.definition, isTrue: false };
  }
  return { text: "An unrelated meaning", isTrue: false };
}

const POS_LABEL: Record<PartOfSpeech, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  adverb: "Adverb",
  other: "Word",
};

// ─── Top bar ─────────────────────────────────────────────────

function ProgressSegments({ total, current }: { total: number; current: number }) {
  return (
    <View style={topStyles.progress}>
      {Array.from({ length: total }).map((_, i) => {
        const bg = i < current ? c.brand600 : i === current ? c.brand300 : c.brand100;
        return <View key={i} style={[topStyles.seg, { backgroundColor: bg }]} />;
      })}
    </View>
  );
}

function StreakChip({ count }: { count: number }) {
  return (
    <View style={topStyles.streak}>
      <Text style={topStyles.flame}>🔥</Text>
      <Text style={topStyles.streakNum}>{count}</Text>
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={topStyles.close}>
      <Ionicons name="close" size={18} color={c.brand800} />
    </Pressable>
  );
}

const topStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: c.brand50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  flame: { fontSize: 13 },
  streakNum: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: c.brand800,
  },
});

// ─── Card (stacked, draggable when on top) ───────────────────

interface StackCardProps {
  word: Word;
  premise: Premise;
  depth: number; // 0 = top, 1, 2 = behind
  isTop: boolean;
  flipped: boolean;
  onTap: () => void;
  onSwipe: (dir: 1 | -1) => void;
}

function StackCard({
  word,
  premise,
  depth,
  isTop,
  flipped,
  onTap,
  onSwipe,
}: StackCardProps) {
  const depthAnim = useSharedValue(depth);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const exiting = useSharedValue(0); // -1 left, +1 right, 0 idle

  useEffect(() => {
    depthAnim.value = withSpring(depth, springConfigs.gentle);
  }, [depth]);

  const tapGesture = Gesture.Tap()
    .enabled(isTop)
    .maxDistance(8)
    .onEnd((_e, success) => {
      if (success) runOnJS(onTap)();
    });

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      if (exiting.value !== 0) return;
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd(() => {
      if (exiting.value !== 0) return;
      if (Math.abs(dragX.value) > SWIPE_THRESHOLD) {
        const dir: 1 | -1 = dragX.value > 0 ? 1 : -1;
        exiting.value = dir;
        dragX.value = withTiming(dir * (SCREEN_WIDTH + 80), {
          duration: SWIPE_OUT_MS,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        });
        runOnJS(onSwipe)(dir);
      } else {
        dragX.value = withSpring(0, springConfigs.snappy);
        dragY.value = withSpring(0, springConfigs.snappy);
      }
    });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => {
    const translateY = depthAnim.value * 8 + dragY.value * 0.3;
    const scale = 1 - depthAnim.value * 0.04;
    const rotate = dragX.value * 0.06;
    const opacity =
      exiting.value !== 0
        ? interpolate(
            Math.abs(dragX.value),
            [SWIPE_THRESHOLD, SCREEN_WIDTH],
            [1, 0],
            Extrapolation.CLAMP
          )
        : depth > 2
          ? 0
          : 1;
    return {
      transform: [
        { translateX: dragX.value },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
      opacity,
      zIndex: 10 - Math.round(depthAnim.value),
    };
  });

  const stampRightStyle = useAnimatedStyle(() => ({
    opacity:
      dragX.value > 0
        ? interpolate(dragX.value, [0, 120], [0, 1], Extrapolation.CLAMP)
        : 0,
  }));

  const stampLeftStyle = useAnimatedStyle(() => ({
    opacity:
      dragX.value < 0
        ? interpolate(-dragX.value, [0, 120], [0, 1], Extrapolation.CLAMP)
        : 0,
  }));

  const transStyle = useAnimatedStyle(() => ({
    opacity: withTiming(flipped ? 1 : 0, { duration: 250 }),
    transform: [{ translateY: withTiming(flipped ? 0 : 6, { duration: 250 }) }],
  }));

  const tapHintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(flipped ? 0 : 1, { duration: 200 }),
  }));

  const posLabel = `${POS_LABEL[word.partOfSpeech] ?? "Word"} · English`;

  // Split example sentence so the headword is bold-purple, like the spec.
  const exampleParts = useMemo(() => {
    const re = new RegExp(`(${word.word})`, "gi");
    return word.exampleSentence.split(re);
  }, [word.exampleSentence, word.word]);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        entering={FadeIn.duration(220)}
        style={[cardStyles.card, cardStyle]}
      >
        <View style={cardStyles.posPill}>
          <Text style={cardStyles.posPillText}>{posLabel}</Text>
        </View>

        <Text style={cardStyles.word}>{word.word}</Text>
        {word.phonetic ? (
          <Text style={cardStyles.phonetic}>{word.phonetic}</Text>
        ) : null}

        <View style={cardStyles.divider} />

        <Text style={cardStyles.label}>Could mean</Text>
        <Text style={cardStyles.premise}>{premise.text}</Text>

        <Animated.View style={[cardStyles.verifyBox, transStyle]}>
          <Text style={cardStyles.verifyLabel}>
            {premise.isTrue ? "Yes — correct meaning" : "Actually means"}
          </Text>
          <Text style={cardStyles.verifyText}>{word.definition}</Text>
        </Animated.View>

        {word.exampleSentence ? (
          <Text style={cardStyles.sentence}>
            {exampleParts.map((part, i) =>
              part.toLowerCase() === word.word.toLowerCase() ? (
                <Text key={i} style={cardStyles.sentenceWord}>
                  {part}
                </Text>
              ) : (
                <Text key={i}>{part}</Text>
              )
            )}
          </Text>
        ) : null}

        <Animated.Text style={[cardStyles.tapHint, tapHintStyle]}>
          Tap to verify
        </Animated.Text>

        <Animated.View
          style={[cardStyles.stamp, cardStyles.stampRight, stampRightStyle]}
        >
          <Text style={[cardStyles.stampText, { color: c.successFg }]}>TRUE</Text>
        </Animated.View>
        <Animated.View
          style={[cardStyles.stamp, cardStyles.stampLeft, stampLeftStyle]}
        >
          <Text style={[cardStyles.stampText, { color: c.warnFg }]}>FALSE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.surface,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: 24,
  },
  posPill: {
    alignSelf: "flex-start",
    backgroundColor: c.brand50,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  posPillText: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: c.brand800,
    letterSpacing: 0.99,
    textTransform: "uppercase",
  },
  word: {
    fontFamily: fonts.serif,
    fontSize: 42,
    color: c.ink,
    marginTop: 20,
    marginBottom: 6,
    letterSpacing: -0.6,
    lineHeight: 44,
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 15,
    fontStyle: "italic",
    color: c.ink2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.rule,
    marginTop: 20,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: c.ink3,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  premise: {
    fontFamily: fonts.serif,
    fontSize: 21,
    fontWeight: "500",
    color: c.brand600,
    lineHeight: 28,
  },
  verifyBox: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: c.brand50,
  },
  verifyLabel: {
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
    color: c.brand800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  verifyText: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: c.ink,
    lineHeight: 20,
  },
  sentence: {
    fontSize: 14,
    fontFamily: fonts.serif,
    fontStyle: "italic",
    color: c.ink2,
    lineHeight: 22,
    marginTop: "auto",
  },
  sentenceWord: {
    color: c.brand600,
    fontStyle: "normal",
    fontFamily: fonts.sansMedium,
  },
  tapHint: {
    position: "absolute",
    bottom: 84,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    color: c.ink3,
    fontFamily: fonts.sans,
  },
  stamp: {
    position: "absolute",
    top: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  stampRight: {
    right: 24,
    transform: [{ rotate: "12deg" }],
    borderColor: c.successFg,
  },
  stampLeft: {
    left: 24,
    transform: [{ rotate: "-12deg" }],
    borderColor: c.warnFg,
  },
  stampText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 1.3,
  },
});

// ─── Wrong-answer explanation overlay (kept) ─────────────────

function ExplanationOverlay({
  explanation,
  isExplaining,
  onDismiss,
}: {
  explanation: string | null;
  isExplaining: boolean;
  onDismiss: () => void;
}) {
  if (!explanation && !isExplaining) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={overlayStyles.scrim}
    >
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={overlayStyles.card}
      >
        <View style={overlayStyles.iconRow}>
          <Ionicons name="bulb-outline" size={22} color={c.brand600} />
          <Text style={overlayStyles.title}>Let's review</Text>
        </View>
        {isExplaining ? (
          <View style={overlayStyles.loading}>
            <ActivityIndicator size="small" color={c.brand600} />
            <Text style={overlayStyles.loadingText}>Generating explanation…</Text>
          </View>
        ) : (
          <Text style={overlayStyles.text}>{explanation}</Text>
        )}
        {!isExplaining && (
          <Pressable onPress={onDismiss} style={overlayStyles.btn}>
            <Text style={overlayStyles.btnText}>Got it</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const overlayStyles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,23,51,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
    padding: 24,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: c.brand800,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: c.ink2,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: c.ink,
    lineHeight: 23,
    marginBottom: 20,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: c.brand600,
  },
  btnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
});

// ─── Completion overlay (Nibble-style) ───────────────────────

function CompletionOverlay({
  stats,
  durationSec,
  onRestart,
  onClose,
}: {
  stats: { correct: number; wrong: number; skipped: number; totalCards: number };
  durationSec: number;
  onRestart: () => void;
  onClose: () => void;
}) {
  const known = stats.correct;
  const review = stats.wrong;
  const mins = Math.floor(durationSec / 60);
  const secs = Math.floor(durationSec % 60);
  const minLabel = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <View style={completeStyles.wrap}>
      <View style={completeStyles.orb}>
        <Ionicons name="trophy-outline" size={42} color={c.brand600} />
      </View>
      <Text style={completeStyles.title}>Session complete</Text>
      <Text style={completeStyles.subtitle}>
        Nice rhythm. Come back tomorrow to keep the streak going.
      </Text>

      <View style={completeStyles.statsRow}>
        <View style={completeStyles.statCard}>
          <Text style={completeStyles.statValue}>{known}</Text>
          <Text style={completeStyles.statLabel}>Known</Text>
        </View>
        <View style={completeStyles.statCard}>
          <Text style={completeStyles.statValue}>{review}</Text>
          <Text style={completeStyles.statLabel}>Review</Text>
        </View>
        <View style={completeStyles.statCard}>
          <Text style={completeStyles.statValue}>{minLabel}</Text>
          <Text style={completeStyles.statLabel}>Minutes</Text>
        </View>
      </View>

      <Pressable onPress={onClose} style={completeStyles.primaryBtn}>
        <Text style={completeStyles.primaryBtnText}>Back to Learn</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </Pressable>
      <Pressable onPress={onRestart} hitSlop={8}>
        <Text style={completeStyles.restart}>Start another session</Text>
      </Pressable>
    </View>
  );
}

const completeStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  orb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: c.brand50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: c.brand800,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: c.ink2,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    alignItems: "center",
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: c.brand800,
  },
  statLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: c.ink3,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginTop: 3,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 18,
    backgroundColor: c.brand600,
    width: "100%",
    marginBottom: 14,
  },
  primaryBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
  restart: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: c.brand600,
    textDecorationLine: "underline",
  },
});

// ─── Empty state ─────────────────────────────────────────────

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <View style={emptyStyles.wrap}>
      <Ionicons name="book-outline" size={48} color={c.ink3} />
      <Text style={emptyStyles.title}>No words for today</Text>
      <Text style={emptyStyles.subtitle}>
        Come back tomorrow or check the Learn tab to load new words.
      </Text>
      <Pressable onPress={onBack} style={emptyStyles.btn}>
        <Ionicons name="arrow-back" size={16} color="#fff" />
        <Text style={emptyStyles.btnText}>Go back</Text>
      </Pressable>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: c.brand800,
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: c.ink2,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.brand600,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
    marginTop: 24,
  },
  btnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
});

// ─── Main session screen ─────────────────────────────────────

export default function LearningSession() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const todaysWords = useTodaysWords();
  const { userWords } = useProgressStore();
  const wordCache = useWordStore((s) => s.wordCache);

  const reviewWords = useMemo(
    () =>
      Object.values(userWords)
        .filter(
          (uw) =>
            uw.status === "learning" && isWordDueToday(uw) && wordCache[uw.wordId]
        )
        .map((uw) => wordCache[uw.wordId]!),
    [userWords, wordCache]
  );

  const sessionWords = mode === "review" ? reviewWords : todaysWords;
  const session = useExerciseSession(sessionWords);
  const {
    currentCard,
    progress,
    isComplete,
    sessionStats,
    explanation,
    isExplaining,
    onCorrect,
    onWrong,
    dismissExplanation,
  } = session;

  // Premises stable per word.id, regenerated when sessionWords change.
  const premiseMap = useMemo(() => {
    const map: Record<string, Premise> = {};
    for (const w of sessionWords) map[w.id] = buildPremise(w, sessionWords);
    return map;
  }, [sessionWords]);

  const [streak, setStreak] = useState(0);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [sessionStart] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const { checkAndUpdateStreak } = useProgressStore();
  const { setDailySessionCompleted } = useWordStore();
  const user = useCurrentUser();

  useEffect(() => {
    if (mode !== "review" && isComplete && todaysWords.length > 0) {
      setDailySessionCompleted(true);
      checkAndUpdateStreak(user?.id);
    }
    if (isComplete && endedAt === null) setEndedAt(Date.now());
  }, [isComplete, user?.id, todaysWords.length, mode]);

  const toggleFlip = useCallback((wordId: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  }, []);

  const commitAnswer = useCallback(
    (word: Word, premise: Premise, userSaidTrue: boolean) => {
      const correct = userSaidTrue === premise.isTrue;
      if (correct) {
        setStreak((s) => s + 1);
        // Wait for the swipe-out animation, then advance via the hook.
        setTimeout(() => onCorrect(), SWIPE_OUT_MS);
      } else {
        setStreak(0);
        setTimeout(
          () =>
            onWrong(
              word,
              `Swipe T/F: user said ${userSaidTrue ? "True" : "False"}, correct was ${premise.isTrue ? "True" : "False"} for premise "${premise.text}"`
            ),
          SWIPE_OUT_MS
        );
      }
    },
    [onCorrect, onWrong]
  );

  const handleSwipe = useCallback(
    (dir: 1 | -1) => {
      if (!currentCard) return;
      const word = currentCard.word;
      const premise = premiseMap[word.id];
      if (!premise) return;
      commitAnswer(word, premise, dir === 1);
    },
    [currentCard, premiseMap, commitAnswer]
  );

  const restart = useCallback(() => {
    // useExerciseSession's queue is memoized on the words ref, so the cleanest
    // way to start over is to re-enter the route — that fully remounts the hook.
    router.replace({
      pathname: "/learning/session",
      params: { mode: mode ?? "daily", _r: String(Date.now()) },
    });
  }, [mode]);

  // Loading
  if (sessionWords.length === 0) {
    return (
      <LinearGradient colors={[c.canvas, c.canvas]} style={styles.bg}>
        <SafeAreaView style={styles.container}>
          <View style={topStyles.bar}>
            <CloseButton onPress={() => router.back()} />
            <View style={{ flex: 1 }} />
          </View>
          <EmptyState onBack={() => router.back()} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Complete
  if (isComplete) {
    const elapsedSec = ((endedAt ?? Date.now()) - sessionStart) / 1000;
    return (
      <LinearGradient colors={[c.canvas, c.canvas]} style={styles.bg}>
        <SafeAreaView style={styles.container}>
          <View style={topStyles.bar}>
            <CloseButton onPress={() => router.back()} />
            <View style={{ flex: 1 }} />
          </View>
          <CompletionOverlay
            stats={sessionStats}
            durationSec={elapsedSec}
            onRestart={restart}
            onClose={() => router.back()}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Build the visible stack: top + 2 behind.
  const visibleWords: { word: Word; depth: number }[] = [];
  for (let d = 0; d < STACK_DEPTH; d++) {
    const wIndex = progress.completed + d;
    if (wIndex < sessionWords.length) {
      visibleWords.push({ word: sessionWords[wIndex], depth: d });
    }
  }
  // Reverse so deepest paints first; top card is the last child.
  const stackChildren = visibleWords.slice().reverse();

  const topPremise =
    currentCard && premiseMap[currentCard.word.id]
      ? premiseMap[currentCard.word.id]
      : null;

  return (
    <LinearGradient colors={[c.canvas, c.canvas]} style={styles.bg}>
      <SafeAreaView style={styles.container}>
        <ExplanationOverlay
          explanation={explanation}
          isExplaining={isExplaining}
          onDismiss={dismissExplanation}
        />

        <View style={topStyles.bar}>
          <CloseButton onPress={() => router.back()} />
          <ProgressSegments total={progress.total} current={progress.completed} />
          <StreakChip count={streak} />
        </View>

        <View style={styles.stack}>
          {stackChildren.map(({ word, depth }) => {
            const premise = premiseMap[word.id];
            if (!premise) return null;
            return (
              <StackCard
                key={word.id}
                word={word}
                premise={premise}
                depth={depth}
                isTop={depth === 0}
                flipped={flippedIds.has(word.id)}
                onTap={() => toggleFlip(word.id)}
                onSwipe={handleSwipe}
              />
            );
          })}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            <Ionicons name="arrow-back" size={11} color={c.ink3} /> False
          </Text>
          <Text style={styles.hintText}>Tap to verify</Text>
          <Text style={styles.hintText}>
            True <Ionicons name="arrow-forward" size={11} color={c.ink3} />
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => topPremise && handleSwipe(-1)}
            style={[styles.actionBtn, styles.falseBtn]}
          >
            <Ionicons name="bookmark-outline" size={16} color={c.warnFg} />
            <Text style={[styles.actionLabel, { color: c.warnFg }]}>False</Text>
          </Pressable>
          <Pressable
            onPress={() => topPremise && handleSwipe(1)}
            style={[styles.actionBtn, styles.trueBtn]}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={[styles.actionLabel, { color: "#fff" }]}>True</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  stack: {
    height: 430,
    marginTop: 4,
    marginBottom: 14,
    position: "relative",
  },
  hint: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 4,
    marginBottom: 14,
  },
  hintText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: c.ink3,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  falseBtn: {
    backgroundColor: c.warnBg,
  },
  trueBtn: {
    backgroundColor: c.brand600,
  },
  actionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
});
