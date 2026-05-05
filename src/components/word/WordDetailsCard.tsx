import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAudio } from "@hooks/useAudio";
import { colors, radii, shadows, fonts } from "@constants/theme";
import type { Word } from "@/types";

/**
 * Visual card showing every learner-facing detail of a Word: title, phonetic,
 * part of speech, definition, an EXAMPLE block, a tap-to-pronounce row, and
 * an optional IN CONTEXT block. Used by the Learn tab's spotlight section
 * and by the Celeb Explains screen.
 */
export function WordDetailsCard({ word }: { word: Word }) {
  const { play } = useAudio();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.wordTitle}>{word.word}</Text>
          {word.phonetic ? (
            <Text style={styles.phonetic}>{word.phonetic}</Text>
          ) : null}
        </View>
        <View style={styles.posBadge}>
          <Text style={styles.posText}>{word.partOfSpeech}</Text>
        </View>
      </View>

      <Text style={styles.definition}>{word.definition}</Text>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: colors.iris }]} />
          <Text style={styles.sectionLabel}>EXAMPLE</Text>
        </View>
        <Text style={styles.sectionBody}>{word.exampleSentence}</Text>
      </View>

      <Pressable onPress={() => play(word.word)}>
        <LinearGradient
          colors={[colors.irisSoft, colors.irisWash]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pronounceRow}
        >
          <View style={styles.playCircle}>
            <Ionicons name="volume-high" size={16} color="#fff" />
          </View>
          <Text style={styles.pronounceText}>Tap to hear pronunciation</Text>
        </LinearGradient>
      </Pressable>

      {word.contextPassage ? (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.sectionDot, { backgroundColor: colors.amber }]}
              />
              <Text style={styles.sectionLabel}>IN CONTEXT</Text>
            </View>
            <Text style={styles.sectionBody}>{word.contextPassage}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
