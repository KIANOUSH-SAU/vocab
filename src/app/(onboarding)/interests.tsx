import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { FIELDS } from "@constants/fields";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { MaxWidthContainer } from "@components/ui/MaxWidthContainer";
import { BackButton } from "@components/ui/BackButton";
import type { Field } from "@/types";

function AnimatedFieldCard({
  field,
  selected,
  onToggle,
  index,
}: {
  field: (typeof FIELDS)[number];
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 80, withTiming(0, { duration: 400 }));
  }, []);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.02 : 1, { damping: 20 });
  }, [selected]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={containerStyle}>
      <Pressable onPress={onToggle} accessibilityLabel={field.label}>
        <View
          style={[
            styles.card,
            selected && { borderColor: field.color, borderWidth: 2 },
          ]}
        >
          {/* Color accent strip */}
          <View style={[styles.cardAccent, { backgroundColor: field.color }]} />

          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              {/* Colored icon circle */}
              <LinearGradient
                colors={[field.color, `${field.color}CC`]}
                style={styles.iconCircle}
              >
                <Ionicons
                  name={field.icon.name as any}
                  size={22}
                  color="#fff"
                />
              </LinearGradient>

              <View style={styles.cardText}>
                <Text style={styles.fieldName}>{field.label}</Text>
                <Text style={styles.fieldDesc}>{field.description}</Text>
              </View>
            </View>

            {/* Check circle */}
            <View
              style={[
                styles.checkCircle,
                selected && {
                  backgroundColor: field.color,
                  borderColor: field.color,
                },
              ]}
            >
              {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function InterestsScreen() {
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuest = guest === "true";
  const [selected, setSelected] = useState<Field[]>([]);

  const toggle = (field: Field) =>
    setSelected((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );

  const proceed = () => {
    if (selected.length === 0) return;
    router.push({
      pathname: "/(onboarding)/placement-test",
      params: { fields: selected.join(","), guest: isGuest ? "true" : "false" },
    });
  };

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <BackButton onPress={() => router.back()} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
          </View>

          <Text style={styles.title}>Pick your field</Text>
          <Text style={styles.subtitle}>
            We'll find words you'll actually use at work.{"\n"}You can pick more
            than one.
          </Text>

          <View style={styles.cards}>
            {FIELDS.map((field, i) => (
              <AnimatedFieldCard
                key={field.id}
                field={field}
                selected={selected.includes(field.id)}
                onToggle={() => toggle(field.id)}
                index={i}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={proceed}
            disabled={selected.length === 0}
            style={{ opacity: selected.length === 0 ? 0.4 : 1 }}
          >
            <LinearGradient
              colors={[colors.ink, "#27272A"]}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryLabel}>
                {selected.length === 0
                  ? "Pick at least one"
                  : `Continue  (${selected.length})`}
              </Text>
              {selected.length > 0 && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </MaxWidthContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: {
    padding: 24,
    paddingBottom: 8,
    gap: 16,
  },

  stepRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSoft,
  },
  stepDotActive: { backgroundColor: colors.iris, width: 24, borderRadius: 4 },

  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 26,
  },

  cards: { gap: 12, marginTop: 8 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  cardAccent: {
    height: 3,
    width: "100%",
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 3 },
  fieldName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.ink,
  },
  fieldDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
});
