import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { BackButton } from "@components/ui/BackButton";
import { useWordStore, useTodaysWords } from "@store/wordStore";
import { useExerciseSession } from "@hooks/useExerciseSession";
import { useProgressStore } from "@store/progressStore";
import { useCurrentUser } from "@store/userStore";
import type { Word } from "@/types";
import {
  colors,
  fonts,
  radii,
  shadows,
  spacing,
  springConfigs,
} from "@constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

// ─── Confetti ────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#0EA5E9",
  "#EF4444",
  "#FFD700",
  "#FF6B00",
];

function ConfettiParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const driftX = useMemo(() => (Math.random() - 0.5) * 200, []);
  const particleSize = useMemo(() => 4 + Math.random() * 6, []);
  const isCircle = useMemo(() => Math.random() > 0.5, []);
  const color = useMemo(
    () => CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    []
  );

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-20, 400]) },
      { translateX: interpolate(progress.value, [0, 1], [0, driftX]) },
      { scale: interpolate(progress.value, [0, 0.3, 1], [0, 1, 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 720])}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: particleSize,
          height: particleSize,
          backgroundColor: color,
          borderRadius: isCircle ? particleSize / 2 : 2,
          top: 0,
          left: "50%",
        },
        style,
      ]}
    />
  );
}

function ConfettiBurst() {
  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {Array.from({ length: 28 }).map((_, i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
    </View>
  );
}

const confettiStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    zIndex: 100,
  },
});

// ─── Progress Bar with Shimmer ───────────────────────────────

function ShimmerProgressBar({ progress }: { progress: number }) {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value * 200 }],
  }));

  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fillOuter, { width: `${progress}%` }]}>
        <LinearGradient
          colors={["#8B5CF6", "#C4B5FD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[progressStyles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 200, height: "100%" }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 16,
  },
  fillOuter: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});

// ─── Answer Option ───────────────────────────────────────────

type OptionState =
  | "default"
  | "pressed"
  | "correct"
  | "wrong"
  | "revealCorrect";

function AnswerOption({
  text,
  index,
  state,
  onPress,
  disabled,
}: {
  text: string;
  index: number;
  state: OptionState;
  onPress: () => void;
  disabled: boolean;
}) {
  const translateX = useSharedValue(0);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (state === "correct" || state === "revealCorrect") {
      translateX.value = withSpring(4, springConfigs.snappy);
    } else if (state === "wrong") {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 80 }),
        withTiming(6, { duration: 80 }),
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    } else {
      translateX.value = withSpring(0, springConfigs.snappy);
    }
  }, [state]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shakeX.value },
      { scale: state === "correct" ? 1.01 : 1 },
    ],
  }));

  const isCorrectState = state === "correct" || state === "revealCorrect";
  const isWrongState = state === "wrong";

  const borderColor = isCorrectState
    ? "#10B981"
    : isWrongState
      ? "#EF4444"
      : colors.border;

  const shadowStyle = isCorrectState
    ? {
        shadowColor: "#10B981",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      }
    : {};

  const letters = ["A", "B", "C", "D"];

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Animated.View
        style={[
          optionStyles.container,
          { borderColor },
          shadowStyle,
          animStyle,
        ]}
      >
        {isCorrectState ? (
          <LinearGradient
            colors={["#ECFDF5", colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : isWrongState ? (
          <LinearGradient
            colors={["#FEF2F2", colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <View
          style={[
            optionStyles.radio,
            isCorrectState && {
              borderColor: "#10B981",
              backgroundColor: "#10B981",
            },
            isWrongState && {
              borderColor: "#EF4444",
              backgroundColor: "#EF4444",
            },
          ]}
        >
          {isCorrectState ? (
            <Text style={optionStyles.radioSymbol}>✓</Text>
          ) : isWrongState ? (
            <Text style={optionStyles.radioSymbol}>✗</Text>
          ) : (
            <Text style={optionStyles.radioLetter}>{letters[index]}</Text>
          )}
        </View>

        <Text style={optionStyles.text}>{text}</Text>
      </Animated.View>
    </Pressable>
  );
}

const optionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    position: "relative",
    overflow: "hidden",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSymbol: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  radioLetter: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.inkLight,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.ink,
    fontFamily: fonts.sans,
    flex: 1,
  },
});

// ─── Word Highlight Component ────────────────────────────────

function WordHighlight({ word }: { word: string }) {
  return (
    <View
      style={{
        position: "relative",
        alignSelf: "flex-start",
        flexDirection: "row",
      }}
    >
      <Text style={highlightStyles.word}>"{word}"</Text>
      <View style={highlightStyles.underline} />
    </View>
  );
}

const highlightStyles = StyleSheet.create({
  word: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: "#6D28D9",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderRadius: 2,
    zIndex: -1,
  },
});

// ─── Multiple Choice Exercise ────────────────────────────────

function MultipleChoiceExercise({
  word,
  allWords,
  onCorrect,
  onWrong,
}: {
  word: Word;
  allWords: Word[];
  onCorrect: () => void;
  onWrong: (word: Word, context: string) => Promise<void>;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<
    "pending" | "correct" | "wrong"
  >("pending");
  const [showConfetti, setShowConfetti] = useState(false);

  // Build 4 options: 1 correct + 3 distractors
  const options = useMemo(() => {
    let distractorPool = word.distractors ? [...word.distractors] : [];

    // Fallback: if missing semantic distractors, pick from other words
    if (distractorPool.length < 3) {
      const otherDefs = allWords
        .filter((w) => w.id !== word.id)
        .map((w) => w.definition);
      const shuffledOthers = [...otherDefs].sort(() => Math.random() - 0.5);
      distractorPool = [...distractorPool, ...shuffledOthers].slice(0, 3);
    }

    // If STILL not enough unique distractors, add modified versions
    while (distractorPool.length < 3) {
      const base =
        distractorPool.length > 0
          ? distractorPool[distractorPool.length - 1]
          : word.definition;
      distractorPool.push(`Not: ${base}`);
    }

    // Shuffle and pick 3
    const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3);

    // Combine with correct answer and shuffle
    const combined = [
      { text: word.definition, isCorrect: true },
      ...distractors.map((d) => ({ text: d, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);

    return combined;
  }, [word.id]);

  const correctIndex = options.findIndex((o) => o.isCorrect);

  const handleSelect = useCallback(
    (index: number) => {
      if (answerState !== "pending") return;
      setSelectedIndex(index);

      if (options[index].isCorrect) {
        setAnswerState("correct");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        // Auto-advance after a brief delay
        setTimeout(() => onCorrect(), 1200);
      } else {
        setAnswerState("wrong");
        // Trigger wrong answer explanation, then auto-advance is handled by dismissExplanation
        onWrong(
          word,
          `Multiple choice: user picked "${options[index].text}" instead of "${word.definition}"`
        );
      }
    },
    [answerState, options, word, onCorrect, onWrong]
  );

  const getOptionState = (index: number): OptionState => {
    if (answerState === "pending") return "default";
    if (index === selectedIndex && answerState === "correct") return "correct";
    if (index === selectedIndex && answerState === "wrong") return "wrong";
    if (answerState === "wrong" && index === correctIndex)
      return "revealCorrect";
    return "default";
  };

  return (
    <View style={{ flex: 1 }}>
      {showConfetti && <ConfettiBurst />}

      {/* Question Card */}
      <View style={styles.questionCard}>
        <LinearGradient
          colors={["#8B5CF6", "#C4B5FD", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.questionCardStrip}
        />
        <Text style={styles.exerciseLabel}>MULTIPLE CHOICE</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
          <Text style={styles.questionText}>What does </Text>
          <WordHighlight word={word.word} />
          <Text style={styles.questionText}> mean?</Text>
        </View>
        {word.phonetic ? (
          <Text style={styles.phonetic}>{word.phonetic}</Text>
        ) : null}
      </View>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <AnswerOption
            key={`${word.id}-opt-${index}`}
            text={option.text}
            index={index}
            state={getOptionState(index)}
            onPress={() => handleSelect(index)}
            disabled={answerState !== "pending"}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Swipe (True/False) Exercise ─────────────────────────────

function SwipeExercise({
  word,
  allWords,
  onCorrect,
  onWrong,
}: {
  word: Word;
  allWords: Word[];
  onCorrect: () => void;
  onWrong: (word: Word, context: string) => Promise<void>;
}) {
  // Randomly decide if we show the true definition or a false one
  const { premise, isTrue } = useMemo(() => {
    const showTrue = Math.random() > 0.5;
    if (showTrue) {
      return {
        premise: word.definition,
        isTrue: true,
      };
    }
    
    // Pick a wrong definition from semantic distractors if available
    if (word.distractors && word.distractors.length > 0) {
      return {
        premise: word.distractors[Math.floor(Math.random() * word.distractors.length)],
        isTrue: false,
      };
    }

    // Fallback: Pick a wrong definition from another word
    const others = allWords.filter((w) => w.id !== word.id);
    const wrongWord =
      others.length > 0
        ? others[Math.floor(Math.random() * others.length)]
        : null;
    return {
      premise: wrongWord ? wrongWord.definition : "An unknown meaning",
      isTrue: false,
    };
  }, [word.id, word.distractors]);

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const handleAnswer = useCallback(
    (swipedRight: boolean) => {
      if (answered) return;
      setAnswered(true);

      const userSaidTrue = swipedRight;
      const isCorrectAnswer = userSaidTrue === isTrue;

      if (isCorrectAnswer) {
        setResult("correct");
        setTimeout(() => onCorrect(), 1000);
      } else {
        setResult("wrong");
        onWrong(
          word,
          `Swipe exercise: "${word.word}" means "${premise}" -- user said ${userSaidTrue ? "True" : "False"}, correct was ${isTrue ? "True" : "False"}`
        );
      }
    },
    [answered, isTrue, premise, word, onCorrect, onWrong]
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      if (answered) return;
      translateX.value = startX.value + event.translationX;
    })
    .onEnd((event) => {
      if (answered) return;
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const swipedRight = translateX.value > 0;
        translateX.value = withSpring(
          swipedRight ? SCREEN_WIDTH : -SCREEN_WIDTH,
          springConfigs.snappy
        );
        runOnJS(handleAnswer)(swipedRight);
      } else {
        translateX.value = withSpring(0, springConfigs.snappy);
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15]
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const trueOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      "clamp"
    ),
  }));

  const falseOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      "clamp"
    ),
  }));

  const resultBorderColor =
    result === "correct" ? "#10B981" : result === "wrong" ? "#EF4444" : colors.border;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={styles.exerciseLabelCentered}>SWIPE TRUE / FALSE</Text>
      <Text style={swipeStyles.hint}>
        <Ionicons name="arrow-back" size={12} color={colors.inkLight} /> False
        {"     "}True{" "}
        <Ionicons name="arrow-forward" size={12} color={colors.inkLight} />
      </Text>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            swipeStyles.card,
            { borderColor: resultBorderColor },
            cardAnimStyle,
          ]}
        >
          {/* TRUE overlay (green, right side) */}
          <Animated.View
            style={[swipeStyles.overlay, swipeStyles.trueOverlay, trueOverlayStyle]}
          >
            <Text style={swipeStyles.overlayText}>TRUE</Text>
          </Animated.View>

          {/* FALSE overlay (red, left side) */}
          <Animated.View
            style={[swipeStyles.overlay, swipeStyles.falseOverlay, falseOverlayStyle]}
          >
            <Text style={swipeStyles.overlayText}>FALSE</Text>
          </Animated.View>

          <Text style={swipeStyles.wordTitle}>{word.word}</Text>
          {word.phonetic ? (
            <Text style={swipeStyles.phonetic}>{word.phonetic}</Text>
          ) : null}
          <View style={swipeStyles.divider} />
          <Text style={swipeStyles.premiseLabel}>means:</Text>
          <Text style={swipeStyles.premise}>"{premise}"</Text>

          {result === "correct" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={swipeStyles.resultBadge}
            >
              <LinearGradient
                colors={["#ECFDF5", "#D1FAE5"]}
                style={swipeStyles.resultGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={[swipeStyles.resultText, { color: "#10B981" }]}>
                  Correct!
                </Text>
              </LinearGradient>
            </Animated.View>
          )}
          {result === "wrong" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={swipeStyles.resultBadge}
            >
              <LinearGradient
                colors={["#FEF2F2", "#FEE2E2"]}
                style={swipeStyles.resultGradient}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={[swipeStyles.resultText, { color: "#EF4444" }]}>
                  {isTrue ? "It was true!" : "It was false!"}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkLight,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 28,
    alignItems: "center",
    ...shadows.card,
    position: "relative",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  trueOverlay: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 0,
  },
  falseOverlay: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 0,
  },
  overlayText: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    letterSpacing: 4,
  },
  wordTitle: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    marginBottom: 4,
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.inkLight,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: "80%",
    marginVertical: 16,
  },
  premiseLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.inkLight,
    marginBottom: 8,
  },
  premise: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    textAlign: "center",
    lineHeight: 24,
  },
  resultBadge: {
    marginTop: 20,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  resultGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  resultText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
});

// ─── Wrong Answer Explanation Overlay ────────────────────────

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
      style={explanationStyles.overlay}
    >
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={explanationStyles.card}
      >
        <View style={explanationStyles.iconRow}>
          <Ionicons name="bulb-outline" size={24} color={colors.iris} />
          <Text style={explanationStyles.title}>Let's review</Text>
        </View>

        {isExplaining ? (
          <View style={explanationStyles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.iris} />
            <Text style={explanationStyles.loadingText}>
              Generating explanation...
            </Text>
          </View>
        ) : (
          <Text style={explanationStyles.text}>{explanation}</Text>
        )}

        {!isExplaining && (
          <Pressable onPress={onDismiss}>
            <LinearGradient
              colors={[colors.ink, "#27272A"]}
              style={explanationStyles.button}
            >
              <Text style={explanationStyles.buttonText}>Got it</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const explanationStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    ...shadows.float,
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
    color: colors.ink,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkLight,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 23,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    ...shadows.button,
  },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
});

// ─── Results Screen ──────────────────────────────────────────

function ResultsScreen({
  stats,
}: {
  stats: { correct: number; wrong: number; skipped: number; totalCards: number };
}) {
  const setSessionStats = useProgressStore((s) => s.setSessionStats);

  // Streak is updated by the page-level effect when isComplete flips to true
  // (see SessionScreen below). We only persist stats here.
  useEffect(() => {
    setSessionStats(stats);
  }, []);

  const scorePercent =
    stats.totalCards > 0
      ? Math.round((stats.correct / stats.totalCards) * 100)
      : 0;

  // Animate the score circle
  const scoreProgress = useSharedValue(0);
  useEffect(() => {
    scoreProgress.value = withDelay(
      400,
      withTiming(scorePercent / 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [scorePercent]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ConfettiBurst />

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Text style={resultStyles.emoji}>
          {scorePercent >= 80 ? "🎉" : scorePercent >= 50 ? "💪" : "📚"}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(400).springify()}
        style={resultStyles.scoreContainer}
      >
        <View style={resultStyles.scoreCircle}>
          <Text style={resultStyles.scoreNumber}>
            {stats.correct}/{stats.totalCards}
          </Text>
          <Text style={resultStyles.scoreLabel}>correct</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).springify()}
        style={{ width: "100%", paddingHorizontal: 32 }}
      >
        <Text style={resultStyles.title}>
          {scorePercent >= 80
            ? "Excellent work!"
            : scorePercent >= 50
              ? "Good progress!"
              : "Keep practicing!"}
        </Text>

        {/* Stats breakdown */}
        <View style={resultStyles.statsGrid}>
          <View style={resultStyles.statItem}>
            <View
              style={[resultStyles.statDot, { backgroundColor: "#10B981" }]}
            />
            <Text style={resultStyles.statValue}>{stats.correct}</Text>
            <Text style={resultStyles.statLabel}>Correct</Text>
          </View>
          <View style={resultStyles.statItem}>
            <View
              style={[resultStyles.statDot, { backgroundColor: "#EF4444" }]}
            />
            <Text style={resultStyles.statValue}>{stats.wrong}</Text>
            <Text style={resultStyles.statLabel}>Wrong</Text>
          </View>
          <View style={resultStyles.statItem}>
            <View
              style={[resultStyles.statDot, { backgroundColor: colors.inkLight }]}
            />
            <Text style={resultStyles.statValue}>{stats.skipped}</Text>
            <Text style={resultStyles.statLabel}>Skipped</Text>
          </View>
        </View>

        <Text style={resultStyles.percentText}>{scorePercent}% accuracy</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(800).springify()}
        style={{ width: "100%", paddingHorizontal: 24, marginTop: 32 }}
      >
        <Pressable onPress={() => router.back()}>
          <LinearGradient
            colors={[colors.ink, "#27272A"]}
            style={resultStyles.button}
          >
            <Text style={resultStyles.buttonText}>Back to Learn</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  scoreContainer: {
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.iris,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.iris,
  },
  scoreNumber: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
  },
  scoreLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkLight,
    marginTop: 2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
    textAlign: "center",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.inkLight,
  },
  percentText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.iris,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
});

// ─── Empty State ─────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
      <Ionicons name="book-outline" size={48} color={colors.inkLight} />
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 22,
          color: colors.ink,
          marginTop: 16,
          textAlign: "center",
        }}
      >
        No words for today
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 14,
          color: colors.inkLight,
          marginTop: 8,
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        Come back tomorrow or check the Learn tab to load new words.
      </Text>
      <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
        <LinearGradient
          colors={[colors.ink, "#27272A"]}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: radii.md,
            ...shadows.button,
          }}
        >
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: "#fff" }}
          >
            Go Back
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Main Session Screen ─────────────────────────────────────

export default function LearningSession() {
  const todaysWords = useTodaysWords();
  const session = useExerciseSession(todaysWords);

  const {
    currentCard,
    progress,
    isComplete,
    sessionStats,
    explanation,
    isExplaining,
    onCorrect,
    onWrong,
    onSkip,
    dismissExplanation,
  } = session;

  const progressPercent =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  const { checkAndUpdateStreak } = useProgressStore();
  const { setDailySessionCompleted } = useWordStore();

  const user = useCurrentUser();

  useEffect(() => {
    if (isComplete) {
      setDailySessionCompleted(true);
      checkAndUpdateStreak(user?.id);
    }
  }, [isComplete, user?.id]);

  // Loading state
  if (todaysWords.length === 0) {
    return (
      <LinearGradient
        colors={["#F5F0FF", colors.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: 32 }} />
          </View>
          <EmptyState />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Results screen
  if (isComplete) {
    return (
      <LinearGradient
        colors={["#F5F0FF", colors.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      >
        <SafeAreaView style={styles.container}>
          <ResultsScreen stats={sessionStats} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Active exercise
  return (
    <LinearGradient
      colors={["#F5F0FF", colors.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.container}>
        {/* Explanation Overlay */}
        <ExplanationOverlay
          explanation={explanation}
          isExplaining={isExplaining}
          onDismiss={dismissExplanation}
        />

        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.counterContainer}>
            <Text style={styles.counterNumber}>{progress.completed + 1}</Text>
            <Text style={styles.counterTotal}> / {progress.total}</Text>
          </View>
          <Pressable onPress={onSkip} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Progress Bar */}
        <ShimmerProgressBar progress={progressPercent} />

        {/* Exercise Content */}
        {currentCard && currentCard.type === "multipleChoice" && (
          <MultipleChoiceExercise
            key={currentCard.id}
            word={currentCard.word}
            allWords={todaysWords}
            onCorrect={onCorrect}
            onWrong={onWrong}
          />
        )}

        {currentCard && currentCard.type === "swipe" && (
          <SwipeExercise
            key={currentCard.id}
            word={currentCard.word}
            allWords={todaysWords}
            onCorrect={onCorrect}
            onWrong={onWrong}
          />
        )}

        {/* Fallback for other exercise types -- render as multiple choice */}
        {currentCard &&
          currentCard.type !== "multipleChoice" &&
          currentCard.type !== "swipe" && (
            <MultipleChoiceExercise
              key={currentCard.id}
              word={currentCard.word}
              allWords={todaysWords}
              onCorrect={onCorrect}
              onWrong={onWrong}
            />
          )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={colors.inkLight}
          />
          <Text style={styles.footerText}>
            {currentCard?.word.word
              ? `Learning: ${currentCard.word.word}`
              : "Daily practice"}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  counterNumber: {
    fontFamily: fonts.serif,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  counterTotal: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "300",
    color: colors.inkLight,
  },
  skipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.iris,
  },
  exerciseLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.iris,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  exerciseLabelCentered: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.iris,
    marginBottom: 8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 18,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  questionCardStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  questionText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 13 * 1.5,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkLight,
    marginTop: 8,
  },
  optionsContainer: {
    gap: 0,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: "auto",
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkLight,
  },
});
