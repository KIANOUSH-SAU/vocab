import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useCurrentUser, useIsGuest } from "@store/userStore";
import { useWordStore } from "@store/wordStore";
import { useProgressStore, useStreak } from "@store/progressStore";
import { useDailyWord } from "@hooks/useDailyWord";
import { useAudio } from "@hooks/useAudio";
import { useTabFocusSync } from "@hooks/useRemoteSync";
import { colors, radii, shadows, fonts } from "@constants/theme";
import { AccentBlob } from "@components/ui/AccentBlob";
import { SectionLabel } from "@components/ui/SectionLabel";
import { AnimatedFire } from "@components/ui/AnimatedFire";
import {
  todayString,
  toDateString,
  buildCurrentWeekDates,
} from "@utils/dateUtils";

// ─── Helpers ──────────────────────────────────────────────────

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_COLORS = [
  "#7C5CFC", // Mon: Iris
  "#10B981", // Tue: Emerald
  "#F59E0B", // Wed: Amber
  "#38BDF8", // Thu: Sky
  "#EF4444", // Fri: Red
  "#FB7185", // Sat: Rose
  "#8B5CF6", // Sun: Violet
];

function getGreeting(firstName?: string | null): string {
  const h = new Date().getHours();
  const base =
    h < 5
      ? "Still up"
      : h < 12
        ? "Good morning"
        : h < 18
          ? "Good afternoon"
          : "Good evening";
  return firstName ? `${base}, ${firstName}` : base;
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Daily CTA (shown when today's session isn't done yet) ────

function DailyCTA({ streak }: { streak: number }) {
  const press = useSharedValue(1);
  const onPressIn = () => {
    press.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    press.value = withSpring(1, { damping: 15, stiffness: 300 });
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const headline =
    streak > 0 ? "Keep your streak alive" : "Start today's session";
  const subline =
    streak > 0
      ? `Complete today's 5 words to reach day ${streak + 1}`
      : "Just 5 words to ignite your first streak";

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push("/learning/session")}
        style={ctaStyles.touchable}
      >
        <LinearGradient
          colors={["#18181B", "#3F3F46"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ctaStyles.gradient}
        >
          <View style={ctaStyles.glow} />
          <View style={ctaStyles.content}>
            <View style={ctaStyles.textCol}>
              <Text style={ctaStyles.label}>TODAY'S SESSION</Text>
              <Text style={ctaStyles.title}>{headline}</Text>
              <Text style={ctaStyles.subtitle}>{subline}</Text>
            </View>
            <View style={ctaStyles.arrowCircle}>
              <Ionicons name="arrow-forward" size={22} color={colors.ink} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const ctaStyles = StyleSheet.create({
  touchable: {
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.float,
  },
  gradient: {
    borderRadius: radii.xl,
    padding: 20,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7C5CFC",
    opacity: 0.25,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  textCol: { flex: 1, gap: 4 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
});

// ─── Streak Flame Widget ──────────────────────────────────────

function StreakWidget({ count }: { count: number }) {
  const isDailySessionCompleted = useWordStore(
    (s) => s.isDailySessionCompleted,
  );
  const lastActiveDate = useProgressStore((s) => s.lastActiveDate);

  const todayStr = todayString();
  // Recompute the week and yesterday when todayStr changes (e.g. midnight
  // rollover causes a re-render that gets a different todayStr).
  const weekDates = useMemo(() => buildCurrentWeekDates(), [todayStr]);
  const yesterdayStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return toDateString(y);
  }, [todayStr]);

  // The stored streak only mutates on activity, so a user who missed a day
  // could still have a stale count > 0. Re-validate against lastActiveDate:
  //  - ends today     → streak is current
  //  - ends yesterday → streak is alive but today isn't done yet
  //  - older          → streak is broken, treat as 0
  const { displayCount, streakStart, streakEnd } = useMemo(() => {
    if (!count || !lastActiveDate) {
      return { displayCount: 0, streakStart: null, streakEnd: null };
    }

    let end: string | null = null;
    if (lastActiveDate === todayStr) end = todayStr;
    else if (lastActiveDate === yesterdayStr) end = yesterdayStr;

    if (!end) {
      return { displayCount: 0, streakStart: null, streakEnd: null };
    }

    const startDate = new Date(end);
    startDate.setDate(startDate.getDate() - (count - 1));
    return {
      displayCount: count,
      streakStart: toDateString(startDate),
      streakEnd: end,
    };
  }, [count, lastActiveDate, todayStr, yesterdayStr]);

  const weeklyHits = weekDates.reduce((acc, d) => {
    const s = toDateString(d);
    return (
      acc +
      (streakStart && streakEnd && s >= streakStart && s <= streakEnd ? 1 : 0)
    );
  }, 0);

  const todayCompleted = isDailySessionCompleted && lastActiveDate === todayStr;

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={streakStyles.container}>
      <View style={streakStyles.softGlow} />

      <View style={streakStyles.headerRow}>
        <View style={streakStyles.fireWrapper}>
          <AnimatedFire size={36} />
        </View>

        <View style={streakStyles.countCol}>
          <View style={streakStyles.countLine}>
            <Text style={streakStyles.count}>{displayCount}</Text>
            <Text style={streakStyles.countUnit}>
              {displayCount === 1 ? "day" : "days"}
            </Text>
          </View>
          <Text style={streakStyles.subtitle}>
            {todayCompleted
              ? "Today locked in — nice."
              : displayCount > 0
                ? "Finish today to keep the fire."
                : "Start a session to spark one."}
          </Text>
        </View>

        <View style={streakStyles.weekChip}>
          <Text style={streakStyles.weekChipValue}>{weeklyHits}/7</Text>
          <Text style={streakStyles.weekChipLabel}>this week</Text>
        </View>
      </View>

      <View style={streakStyles.dotsRow}>
        {weekDates.map((d, i) => {
          const dStr = toDateString(d);
          const isToday = dStr === todayStr;
          const isFuture = dStr > todayStr;
          const isInStreak = !!(
            streakStart &&
            streakEnd &&
            dStr >= streakStart &&
            dStr <= streakEnd
          );

          const color = DAY_COLORS[i];
          const todayPending = isToday && !todayCompleted;

          const dotBaseStyle = isInStreak
            ? { backgroundColor: color, borderWidth: 0 }
            : todayPending
              ? {
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: color,
                }
              : isFuture
                ? { backgroundColor: colors.borderSoft, borderWidth: 0 }
                : { backgroundColor: colors.borderSoft, borderWidth: 0 };

          const textColor = isInStreak
            ? "#FFFFFF"
            : todayPending
              ? color
              : colors.inkLight;

          return (
            <View key={i} style={streakStyles.dotSlot}>
              <Animated.View
                style={[
                  streakStyles.dot,
                  dotBaseStyle,
                  isInStreak && streakStyles.dotShadow,
                  todayPending && pulseStyle,
                ]}
              >
                <Text style={[streakStyles.dotText, { color: textColor }]}>
                  {DAY_LABELS[i]}
                </Text>
              </Animated.View>
              {isToday && <View style={streakStyles.todayMark} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 20,
    gap: 18,
    overflow: "hidden",
    ...shadows.card,
  },
  softGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FBBF24",
    opacity: 0.08,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fireWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  countCol: {
    flex: 1,
    gap: 2,
  },
  countLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  count: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -1,
    lineHeight: 36,
  },
  countUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink2,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.ink2,
  },
  weekChip: {
    backgroundColor: colors.borderSoft,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    gap: 2,
  },
  weekChipValue: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  weekChipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    color: colors.ink2,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  dotSlot: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dotShadow: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  dotText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  todayMark: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
});

// ─── Word of the Day Card (Blob Style) ────────────────────────

// Three small green dots scaling in sequence (stagger). All dots share the
// same cycle length, so once each one's initial delay elapses they remain
// offset by `LIVE_STAGGER_MS` forever — creating a continuous wave.
const LIVE_DOT_SIZE = 6;
const LIVE_DOT_GAP = 4;
const LIVE_CYCLE_MS = 2000;
const LIVE_STAGGER_MS = 400;
const LIVE_PEAK_SCALE = 1.9;

function LiveDot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(LIVE_PEAK_SCALE, {
            duration: LIVE_CYCLE_MS / 6,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: LIVE_CYCLE_MS,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [1, LIVE_PEAK_SCALE], [0.45, 1]),
  }));

  return <Animated.View style={[liveDotStyles.dot, dotStyle]} />;
}

function LiveDotPill() {
  return (
    <View style={liveDotStyles.row}>
      <LiveDot delay={0} />
      <LiveDot delay={LIVE_STAGGER_MS} />
      <LiveDot delay={LIVE_STAGGER_MS * 2} />
    </View>
  );
}

const liveDotStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: LIVE_DOT_GAP,
  },
  dot: {
    width: LIVE_DOT_SIZE,
    height: LIVE_DOT_SIZE,
    borderRadius: LIVE_DOT_SIZE / 2,
    backgroundColor: "#10B981",
  },
});

function WordOfDayCard() {
  const { words } = useDailyWord();
  const { play } = useAudio();
  const word = words[0];

  const playScale = useSharedValue(1);
  const onPlayIn = () => {
    playScale.value = withSpring(0.92, { damping: 12, stiffness: 280 });
  };
  const onPlayOut = () => {
    playScale.value = withSpring(1, { damping: 12, stiffness: 280 });
  };
  const playStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const w = word ?? {
    word: "Resilient",
    phonetic: "/rɪˈzɪl.i.ənt/",
    definition:
      "Able to withstand or recover quickly from difficult conditions",
    partOfSpeech: "adjective",
  };

  return (
    <View style={wotdStyles.wrapper}>
      <AccentBlob placement="top-right" colorTheme="purple" opacity={0.18} />
      <AccentBlob
        placement="bottom-left"
        colorTheme="blue"
        opacity={0.12}
        size={160}
      />
      <View style={wotdStyles.card}>
        <View style={wotdStyles.topRow}>
          {(w as any).partOfSpeech && (
            <View style={wotdStyles.posChip}>
              <Text style={wotdStyles.posText}>{(w as any).partOfSpeech}</Text>
            </View>
          )}
          <LiveDotPill />
        </View>

        <View style={wotdStyles.wordRow}>
          <View style={wotdStyles.wordCol}>
            <View style={wotdStyles.wordLine}>
              <Text
                style={wotdStyles.word}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {w.word}
              </Text>
              {w.phonetic ? (
                <Text style={wotdStyles.phonetic} numberOfLines={1}>
                  {w.phonetic}
                </Text>
              ) : null}
            </View>
          </View>
          <Animated.View style={playStyle}>
            <Pressable
              onPressIn={onPlayIn}
              onPressOut={onPlayOut}
              onPress={() => play(w.word)}
              style={wotdStyles.playBtn}
              hitSlop={8}
            >
              <Ionicons name="play" size={14} color="#fff" />
            </Pressable>
          </Animated.View>
        </View>

        <View style={wotdStyles.divider} />

        <Text style={wotdStyles.definition}>{w.definition}</Text>

        <View style={wotdStyles.footer}>
          <Pressable
            onPress={() => router.push("/celebExplains")}
            style={wotdStyles.learnMore}
          >
            <Text style={wotdStyles.learnMoreText}>Learn more</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.iris} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const wotdStyles = StyleSheet.create({
  wrapper: { position: "relative" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 24,
    gap: 8,
    shadowColor: "#7C5CFC",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 36,
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  posChip: {
    backgroundColor: colors.irisSoft,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  posText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.iris,
    textTransform: "lowercase",
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginVertical: 4,
  },
  wordCol: {
    flex: 1,
    minWidth: 0, // lets the inner row shrink instead of pushing the play button
  },
  wordLine: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 2,
  },
  word: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.ink,
    letterSpacing: -1,
    lineHeight: 42,
    flexShrink: 1,
  },
  phonetic: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.iris,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  definition: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  learnMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  learnMoreText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.iris,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
});

// ─── Progress Section ─────────────────────────────────────────

function ProgressSection() {
  const userWords = useProgressStore((s) => s.userWords);
  const wordCache = useWordStore((s) => s.wordCache);

  const { mastered, learning, struggling } = useMemo(() => {
    // Only count words that actually exist in the words collection
    const all = Object.values(userWords).filter((w) => wordCache[w.wordId]);
    const mastered = all.filter((w) => w.status === "mastered").length;
    const struggling = all.filter((w) => {
      if (w.status !== "learning") return false;
      const total = w.totalAttempts;
      if (total < 3) return false;
      const correct = Number(w.correctAttempts);
      return correct / total < 0.5;
    }).length;
    const learning =
      all.filter((w) => w.status === "learning" || w.status === "new").length -
      struggling;
    return { mastered, learning: Math.max(0, learning), struggling };
  }, [userWords, wordCache]);

  return (
    <View style={progStyles.wrapper}>
      <AccentBlob placement="bottom-left" colorTheme="green" opacity={0.18} />
      <View style={progStyles.container}>
        <View style={progStyles.row}>
          <ProgressCard
            label="Mastered"
            value={mastered}
            gradient={["#7C5CFC", "#5B3FD4"]}
            icon="school"
            color="#7C5CFC"
            delay={0}
          />
          <ProgressCard
            label="Learning"
            value={learning}
            gradient={["#10B981", "#059669"]}
            icon="book"
            color="#10B981"
            delay={120}
          />
          <ProgressCard
            label="Struggling"
            value={struggling}
            gradient={["#F59E0B", "#D97706"]}
            icon="flame"
            color="#F59E0B"
            delay={240}
          />
        </View>
        <Text style={progStyles.hint}>
          Words added on the Review page count as Learning.
        </Text>
      </View>
    </View>
  );
}

function ProgressCard({
  label,
  value,
  gradient,
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  gradient: [string, string];
  icon: string;
  color: string;
  delay?: number;
}) {
  const countVal = useSharedValue(0);
  useEffect(() => {
    countVal.value = withDelay(
      delay,
      withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [value, delay]);

  const animatedCount = useAnimatedStyle(() => ({})); // trigger re-render

  return (
    <View style={progStyles.card}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={progStyles.iconBg}
      >
        <Ionicons name={icon as any} size={16} color="#fff" />
      </LinearGradient>

      <Text style={[progStyles.cardValue, { color }]}>{value}</Text>
      <Text style={progStyles.cardLabel}>{label}</Text>
    </View>
  );
}

const progStyles = StyleSheet.create({
  wrapper: { position: "relative" },
  container: { gap: 8, position: "relative" },
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 14,
    gap: 4,
    ...shadows.card,
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  cardValue: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.ink2,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.inkLight,
    textAlign: "center",
    marginTop: 4,
  },
});

// ─── Module Cards ─────────────────────────────────────────────

function ModuleCards() {
  return (
    <View style={modStyles.wrapper}>
      <AccentBlob placement="bottom-right" colorTheme="orange" opacity={0.12} />
      <View style={modStyles.container}>
        <ModuleCard
          onPress={() => router.push("/modules/pronunciation")}
          title="Pronounce like a Pro"
          subtitle="Audio & phonics practice"
          icon="mic"
          gradient={[colors.iris, colors.irisDeeper]}
          iconColor={colors.iris}
        />
        <ModuleCard
          onPress={() => router.push("/modules/letters")}
          title="Letters Overseas"
          subtitle="Professional emails & writing"
          icon="mail"
          gradient={["#38BDF8", "#0284C7"]}
          iconColor="#0284C7"
        />
      </View>
    </View>
  );
}

function ModuleCard({
  onPress,
  title,
  subtitle,
  icon,
  gradient,
  iconColor,
}: {
  onPress: () => void;
  title: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
  iconColor: string;
}) {
  const scale = useSharedValue(1);
  const onIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };
  const onOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={onPress}
        style={modStyles.card}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={modStyles.gradient}
        >
          <View style={modStyles.inner}>
            <View style={modStyles.text}>
              <Text style={modStyles.title}>{title}</Text>
              <Text style={modStyles.subtitle}>{subtitle}</Text>
            </View>
            <View style={modStyles.iconCircle}>
              <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const modStyles = StyleSheet.create({
  wrapper: { position: "relative" },
  container: { gap: 12, position: "relative" },
  card: { borderRadius: radii.lg, overflow: "hidden", ...shadows.iris },
  gradient: { borderRadius: radii.lg },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  text: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: "#fff" },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Main Home Screen ─────────────────────────────────────────

export default function HomeScreen() {
  useTabFocusSync();
  const user = useCurrentUser();
  const isGuest = useIsGuest();
  const streak = useStreak();
  const isDailySessionCompleted = useWordStore(
    (s) => s.isDailySessionCompleted,
  );
  const lastActiveDate = useProgressStore((s) => s.lastActiveDate);

  const firstName = user?.name ? user.name.split(" ")[0] : null;
  const todayCompleted =
    isDailySessionCompleted && lastActiveDate === todayString();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.dateLabel}>{getFormattedDate()}</Text>
          <Text style={styles.greeting}>{getGreeting(firstName)}</Text>
        </View>

        {/* Guest banner */}
        {isGuest && (
          <Pressable
            style={styles.guestAlert}
            onPress={() => router.push("/(onboarding)/auth/signup")}
          >
            <View style={styles.guestIconWrap}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.amberText}
              />
            </View>
            <Text style={styles.guestAlertText}>
              Create an account to save your progress
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.amberText}
            />
          </Pressable>
        )}

        {/* Streak Widget */}
        <StreakWidget count={streak} />

        {/* Daily CTA (only when today's session isn't done) */}
        {!todayCompleted && <DailyCTA streak={streak} />}

        {/* Word of the Day */}
        <View style={styles.section}>
          <SectionLabel title="WORD OF THE DAY" />
          <WordOfDayCard />
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <SectionLabel title="YOUR PROGRESS" />
          <ProgressSection />
        </View>

        {/* Quick Modules */}
        <View style={styles.section}>
          <SectionLabel title="QUICK MODULES" />
          <ModuleCards />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 20, paddingBottom: 100 },

  header: {
    gap: 4,
    marginTop: 4,
  },
  dateLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.ink2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.7,
    lineHeight: 36,
  },

  guestAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.amberSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  guestIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  guestAlertText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.amberText,
  },

  section: { gap: 12 },
});
