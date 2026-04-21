import { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "@store/userStore";
import { updateUserDocument } from "@services/appwriteService";
import { LEVELS } from "@constants/levels";
import { FIELDS } from "@constants/fields";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { MaxWidthContainer } from "@components/ui/MaxWidthContainer";
import { BackButton } from "@components/ui/BackButton";
import type { Level, Field } from "@/types";

const LEVEL_GRADIENTS: Record<Level, [string, string]> = {
  A1: [colors.irisLight, colors.iris],
  A2: [colors.iris, colors.irisDark],
  B1: [colors.iris, colors.irisDeeper],
  B2: [colors.irisDark, colors.irisDeeper],
  C1: [colors.irisDeeper, "#4C2EBF"],
};

export default function LevelResultScreen() {
  const { level, fields, guest } = useLocalSearchParams<{
    level: Level;
    fields: string;
    guest: string;
  }>();
  const isGuest = guest === "true";
  const { user, setUser, setPendingOnboardingData } = useUserStore();
  const isAuthenticated = user && !user.isGuest;

  const levelMeta = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  const fieldList = (fields?.split(",").filter(Boolean) ?? []) as Field[];
  const fieldMetas = FIELDS.filter((f) => fieldList.includes(f.id));
  const gradient = LEVEL_GRADIENTS[level ?? "A1"];

  // Entrance animations
  const badgeScale = useSharedValue(0.6);
  const badgeOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(24);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    badgeScale.value = withSpring(1, { damping: 16, stiffness: 120 });
    badgeOpacity.value = withTiming(1, { duration: 400 });
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    contentTranslate.value = withDelay(300, withTiming(0, { duration: 500 }));
    btnOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const proceed = useCallback(async () => {
    if (isGuest && !isAuthenticated) {
      setUser({
        id: "guest",
        name: "Guest",
        level: level ?? "A1",
        fields: fieldList,
        voiceStyleId: "",
        isGuest: true,
      });
      router.replace("/(tabs)/home");
    } else if (isAuthenticated) {
      setUser({
        ...user!,
        level: level ?? "A1",
        fields: fieldList,
      });
      try {
        await updateUserDocument(user!.id, {
          level: level ?? "A1",
          fields: fieldList,
        });
      } catch (e) {
        console.error("Failed to update remote user document", e);
      }
      router.replace("/(tabs)/home");
    } else {
      setPendingOnboardingData({
        level: level ?? "A1",
        fields: fieldList,
      });
      router.push("/(onboarding)/auth/signup");
    }
  }, [isGuest, isAuthenticated, level, fieldList, user]);

  const goToLogin = useCallback(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/home");
    } else {
      setPendingOnboardingData({
        level: level ?? "A1",
        fields: fieldList,
      });
      router.push("/(onboarding)/auth/login");
    }
  }, [isAuthenticated, level, fieldList]);

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Level badge */}
          <Animated.View style={[styles.badgeWrapper, badgeStyle]}>
            <LinearGradient
              colors={gradient}
              style={styles.badge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.levelCode}>{level}</Text>
              <Text style={styles.levelName}>{levelMeta.label}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Info */}
          <Animated.View style={[styles.info, contentStyle]}>
            <Text style={styles.resultHeading}>Your English level</Text>
            <Text style={styles.description}>{levelMeta.description}</Text>

            {/* Fields */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>YOUR SELECTED FIELDS</Text>
              <View style={styles.fieldTags}>
                {fieldMetas.map((f) => (
                  <View
                    key={f.id}
                    style={[
                      styles.tag,
                      { borderColor: f.color, backgroundColor: `${f.color}10` },
                    ]}
                  >
                    <View
                      style={[styles.tagDot, { backgroundColor: f.color }]}
                    />
                    <Text style={[styles.tagText, { color: f.color }]}>
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* What to expect */}
            <View style={styles.expectCard}>
              <Text style={styles.expectTitle}>What happens next</Text>
              <View style={styles.expectList}>
                <ExpectItem
                  text="5 words selected daily, just for your field"
                  color={colors.iris}
                  icon="book"
                />
                <ExpectItem
                  text="Learn through swipe cards, audio & fill-in-blank"
                  color={colors.sky}
                  icon="headset"
                />
                <ExpectItem
                  text="Words repeat until you've truly mastered them"
                  color={colors.mint}
                  icon="repeat"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <Animated.View style={[styles.footer, btnStyle]}>
          <Pressable onPress={proceed}>
            <LinearGradient
              colors={[colors.ink, "#27272A"]}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryLabel}>
                {isGuest && !isAuthenticated
                  ? "Start Learning"
                  : isAuthenticated
                    ? "Start Learning"
                    : "Create Account & Start"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
          {isGuest && !isAuthenticated ? (
            <Text style={styles.guestNote}>
              Progress saved locally · Create an account anytime
            </Text>
          ) : isAuthenticated ? null : (
            <Pressable onPress={goToLogin} style={styles.ghostBtn}>
              <Text style={styles.ghostLabel}>I already have an account</Text>
            </Pressable>
          )}
        </Animated.View>
      </SafeAreaView>
    </MaxWidthContainer>
  );
}

function ExpectItem({
  text,
  color,
  icon,
}: {
  text: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={styles.expectItem}>
      <LinearGradient colors={[color, `${color}CC`]} style={styles.expectIcon}>
        <Ionicons name={icon as any} size={14} color="#fff" />
      </LinearGradient>
      <Text style={styles.expectText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  stepRow: { flexDirection: "row", gap: 6 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSoft,
  },
  stepDotActive: { backgroundColor: colors.iris, width: 24, borderRadius: 4 },

  scroll: {
    padding: 24,
    gap: 32,
    paddingBottom: 16,
  },

  // Badge
  badgeWrapper: { alignSelf: "flex-start" },
  badge: {
    borderRadius: radii.xl,
    paddingHorizontal: 28,
    paddingVertical: 28,
    gap: 4,
    minWidth: 180,
    ...shadows.iris,
  },
  levelCode: {
    fontFamily: fonts.serif,
    fontSize: 72,
    color: "#fff",
    letterSpacing: -2,
    lineHeight: 76,
  },
  levelName: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.2,
  },

  // Info
  info: { gap: 24 },
  resultHeading: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 26,
  },

  // Fields
  fieldSection: { gap: 12 },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.inkLight,
    letterSpacing: 1.5,
  },
  fieldTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },

  // What to expect
  expectCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  expectTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  expectList: { gap: 12 },
  expectItem: { flexDirection: "row", gap: 12, alignItems: "center" },
  expectIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  expectText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  primaryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
  ghostBtn: { alignItems: "center", paddingVertical: 10 },
  ghostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink2,
  },
  guestNote: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.inkLight,
    textAlign: "center",
  },
});
