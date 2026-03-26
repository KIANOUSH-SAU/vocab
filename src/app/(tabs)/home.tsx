import { useEffect } from "react";
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
} from "react-native-reanimated";
import { useCurrentUser, useIsGuest } from "@store/userStore";
import { useStreak } from "@store/progressStore";
import { useDailyWord } from "@hooks/useDailyWord";
import { useAudio } from "@hooks/useAudio";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { AccentBlob } from "@components/ui/AccentBlob";
import { SectionLabel } from "@components/ui/SectionLabel";
import { AnimatedFire } from "@components/ui/AnimatedFire";

// Mock data
const MOCK_PROGRESS = {
  sessionsCompleted: 2,
  weeklyGoal: 3,
  wordsMastered: 14,
  totalWords: 50,
};

// ─── Streak Flame Widget ──────────────────────────────────────

function StreakWidget({ count }: { count: number }) {
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay(); // 0=Sun
  const dayIndex = today === 0 ? 6 : today - 1;

  return (
    <LinearGradient
      colors={["#FF8C00", "#FF6B00", "#E85D04"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={streakStyles.container}
    >
      {/* Inner radial glow approximation */}
      <View style={streakStyles.innerGlow} />

      {/* Animated SVG Fire */}
      <AnimatedFire size={80} />

      <Text style={streakStyles.count}>{count}</Text>
      <Text style={streakStyles.label}>DAY STREAK</Text>

      <View style={streakStyles.dotsRow}>
        {DAYS.map((d, i) => {
          const state =
            i < dayIndex ? "done" : i === dayIndex ? "today" : "future";
          return (
            <View
              key={i}
              style={[
                streakStyles.dot,
                state === "done" && streakStyles.dotDone,
                state === "today" && streakStyles.dotToday,
                state === "future" && streakStyles.dotFuture,
              ]}
            >
              <Text
                style={[
                  streakStyles.dotText,
                  state === "done" && streakStyles.dotTextDone,
                  state === "today" && streakStyles.dotTextToday,
                ]}
              >
                {d}
              </Text>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const streakStyles = StyleSheet.create({
  container: {
    borderRadius: 32,
    padding: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 4,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 48,
    elevation: 16,
  },
  innerGlow: {
    position: "absolute",
    top: "10%",
    left: "25%",
    width: "50%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255, 200, 50, 0.25)",
  },
  count: {
    fontFamily: fonts.serif,
    fontSize: 56,
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    lineHeight: 56,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 20,
  },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  dotDone: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#FFC832",
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  dotToday: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    transform: [{ scale: 1.1 }],
  },
  dotFuture: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  dotText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  dotTextDone: {
    color: "#FFFFFF",
  },
  dotTextToday: {
    color: "#E85D04",
  },
});

// ─── Word of the Day Card (Blob Style) ────────────────────────

function WordOfDayCard() {
  const { words } = useDailyWord();
  const { play } = useAudio();
  const word = words[0];

  const w = word ?? {
    word: "Resilient",
    phonetic: "/rɪˈzɪl.i.ənt/",
    definition:
      "Able to withstand or recover quickly from difficult conditions",
    partOfSpeech: "adjective",
    fields: ["engineering"],
  };

  return (
    <View style={wotdStyles.wrapper}>
      <AccentBlob placement="top-right" />
      <View style={wotdStyles.card}>
        <Text style={wotdStyles.label}>WORD OF THE DAY</Text>
        <Text style={wotdStyles.word}>{w.word}</Text>
        <Text style={wotdStyles.phonetic}>{w.phonetic}</Text>
        <View style={wotdStyles.divider} />
        <Text style={wotdStyles.definition}>{w.definition}</Text>
        <View style={wotdStyles.footer}>
          <View style={wotdStyles.fieldChip}>
            <Text style={wotdStyles.fieldText}>
              {(w.fields?.[0] ?? "general").charAt(0).toUpperCase() +
                (w.fields?.[0] ?? "general").slice(1)}
            </Text>
          </View>
          <Pressable style={wotdStyles.playBtn} onPress={() => play(w.word)}>
            <Ionicons name="play" size={14} color="#fff" />
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
    borderRadius: 24,
    padding: 24,
    gap: 10,
    shadowColor: "#7C5CFC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.ink2,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  word: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  phonetic: { fontFamily: fonts.mono, fontSize: 13, color: colors.iris },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  definition: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 21,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  fieldChip: {
    backgroundColor: colors.irisSoft,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fieldText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.iris },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Progress Section ─────────────────────────────────────────

function ProgressSection() {
  const { sessionsCompleted, weeklyGoal, wordsMastered, totalWords } =
    MOCK_PROGRESS;

  return (
    <View style={progStyles.wrapper}>
      <AccentBlob placement="bottom-left" />
      <View style={progStyles.container}>
        <View style={progStyles.row}>
          <ProgressCard
            label="Weekly Goal"
            value={sessionsCompleted}
            total={weeklyGoal}
            gradient={["#2DD4A8", "#059669"]}
            icon="checkmark-circle"
          />
          <ProgressCard
            label="Mastery"
            value={wordsMastered}
            total={totalWords}
            gradient={["#7C5CFC", "#5B3FD4"]}
            icon="school"
          />
        </View>
      </View>
    </View>
  );
}

function ProgressCard({
  label,
  value,
  total,
  gradient,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  gradient: [string, string];
  icon: string;
}) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0;

  return (
    <View style={progStyles.card}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={progStyles.iconBg}
      >
        <Ionicons name={icon as any} size={18} color="#fff" />
      </LinearGradient>
      <Text style={progStyles.cardLabel}>{label}</Text>
      <Text style={progStyles.cardValue}>
        {value}
        <Text style={progStyles.cardTotal}>/{total}</Text>
      </Text>
      <View style={progStyles.track}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[progStyles.fill, { width: `${pct * 100}%` }]}
        />
      </View>
    </View>
  );
}

const progStyles = StyleSheet.create({
  wrapper: { position: "relative" },
  container: { gap: 12, position: "relative" },
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    gap: 8,
    ...shadows.card,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  cardValue: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.ink },
  cardTotal: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkLight },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderSoft,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
});

// ─── Module Cards ─────────────────────────────────────────────

function ModuleCards() {
  return (
    <View style={modStyles.wrapper}>
      <AccentBlob placement="bottom-right" />
      <View style={modStyles.container}>
        <Pressable
          onPress={() => router.push("/modules/pronunciation")}
          style={modStyles.card}
        >
          <LinearGradient
            colors={[colors.iris, colors.irisDeeper]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={modStyles.gradient}
          >
            <View style={modStyles.inner}>
              <View style={modStyles.text}>
                <Text style={modStyles.title}>Pronounce like a Pro</Text>
                <Text style={modStyles.subtitle}>Audio & phonics practice</Text>
              </View>
              <View style={modStyles.iconCircle}>
                <Ionicons name="mic" size={22} color={colors.iris} />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => router.push("/modules/letters")}
          style={modStyles.card}
        >
          <LinearGradient
            colors={["#38BDF8", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={modStyles.gradient}
          >
            <View style={modStyles.inner}>
              <View style={modStyles.text}>
                <Text style={modStyles.title}>Letters Overseas</Text>
                <Text style={modStyles.subtitle}>
                  Professional emails & writing
                </Text>
              </View>
              <View style={modStyles.iconCircle}>
                <Ionicons name="mail" size={22} color="#0284C7" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
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
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Main Home Screen ─────────────────────────────────────────

export default function HomeScreen() {
  const user = useCurrentUser();
  const isGuest = useIsGuest();
  const streak = useStreak();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text style={styles.greeting}>
          {user?.name ? `Hello, ${user.name}` : "Good morning"}
        </Text>

        {/* Guest banner */}
        {isGuest && (
          <Pressable
            style={styles.guestAlert}
            onPress={() => router.push("/(onboarding)/auth/signup")}
          >
            <Ionicons name="alert-circle" size={20} color={colors.amberText} />
            <Text style={styles.guestAlertText}>
              Create an account to save your progress
            </Text>
          </Pressable>
        )}

        {/* Streak Widget */}
        <StreakWidget count={streak} />

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

  greeting: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },

  guestAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.amberSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.sm,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  guestAlertText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.amberText,
  },

  section: { gap: 12 },
});
