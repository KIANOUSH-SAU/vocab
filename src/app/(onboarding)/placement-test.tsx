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
  withSpring,
} from "react-native-reanimated";
import { usePlacementTest } from "@hooks/usePlacementTest";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { MaxWidthContainer } from "@components/ui/MaxWidthContainer";
import { BackButton } from "@components/ui/BackButton";

export default function PlacementTestScreen() {
  const { fields, guest } = useLocalSearchParams<{
    fields: string;
    guest: string;
  }>();
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    isComplete,
    classifiedLevel,
    answer,
  } = usePlacementTest();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Card entrance animation
  const cardOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(32);

  // Progress bar width
  const progress = (currentIndex / totalQuestions) * 100;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  useEffect(() => {
    cardOpacity.value = 0;
    cardTranslate.value = 32;
    cardOpacity.value = withTiming(1, { duration: 350 });
    cardTranslate.value = withSpring(0, { damping: 22 });
    setSelectedIndex(null);
    ("");
  }, [currentIndex]);

  useEffect(() => {
    if (isComplete && classifiedLevel) {
      router.replace({
        pathname: "/(onboarding)/level-result",
        params: {
          level: classifiedLevel,
          fields,
          guest,
        },
      });
    }
  }, [isComplete, classifiedLevel]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setTimeout(() => answer(index), 420);
  };

  if (!currentQuestion) return null;

  const questionTypeLabel =
    currentQuestion.type === "recognition"
      ? "Word Check"
      : currentQuestion.type === "definition"
        ? "Definition"
        : currentQuestion.type === "readingComprehension"
          ? "Reading"
          : "Correct Usage";

  const questionTypeColor =
    currentQuestion.type === "recognition"
      ? colors.iris
      : currentQuestion.type === "definition"
        ? colors.sky
        : currentQuestion.type === "readingComprehension"
          ? colors.amber
          : colors.mint;

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepDot} />
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrap, progressStyle]}>
            <LinearGradient
              colors={[colors.iris, colors.irisLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>

        <View style={styles.content}>
          {/* Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counter}>
              {currentIndex + 1}
              <Text style={styles.counterTotal}> / {totalQuestions}</Text>
            </Text>
            {/* Question type badge */}
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${questionTypeColor}15` },
              ]}
            >
              <View
                style={[styles.typeDot, { backgroundColor: questionTypeColor }]}
              />
              <Text style={[styles.typeText, { color: questionTypeColor }]}>
                {questionTypeLabel}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Question card */}
            <Animated.View style={cardStyle}>
              <View style={styles.questionCard}>
                {currentQuestion.passage ? (
                  <>
                    <Text style={styles.passageText}>
                      {currentQuestion.passage}
                    </Text>
                    <View style={styles.separator} />
                  </>
                ) : null}
                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>
              </View>
            </Animated.View>

            {/* Options */}
            <Animated.View style={[styles.options, cardStyle]}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedIndex === i;
                const isDimmed = selectedIndex !== null && !isSelected;

                return (
                  <Pressable
                    key={i}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                      isDimmed && styles.optionDimmed,
                    ]}
                    onPress={() => handleSelect(i)}
                    disabled={selectedIndex !== null}
                    accessibilityLabel={option}
                  >
                    <View
                      style={[
                        styles.optionRadio,
                        isSelected && styles.optionRadioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.optionRadioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        isDimmed && styles.optionTextDimmed,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          </ScrollView>
        </View>

        {/* Footer hint */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={colors.inkLight}
          />
          <Text style={styles.hint}>No right or wrong — just be honest</Text>
        </View>
      </SafeAreaView>
    </MaxWidthContainer>
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
    paddingBottom: 8,
  },
  stepRow: { flexDirection: "row", gap: 6 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSoft,
  },
  stepDotActive: { backgroundColor: colors.iris, width: 24, borderRadius: 4 },

  progressTrack: {
    height: 4,
    backgroundColor: colors.borderSoft,
    marginHorizontal: 24,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  progressFillWrap: {
    height: "100%",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  progressGradient: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counter: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
  },
  counterTotal: {
    fontFamily: fonts.sans,
    fontSize: 18,
    color: colors.inkLight,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },

  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  passageText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 24,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: 18,
  },
  questionText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.ink,
    lineHeight: 28,
  },

  options: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.iris,
    backgroundColor: colors.irisSoft,
  },
  optionDimmed: { opacity: 0.35 },

  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioSelected: {
    borderColor: colors.iris,
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.iris,
  },

  optionText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
  },
  optionTextDimmed: { color: colors.inkLight },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  hint: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.inkLight,
  },
});
