import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useDailyWord } from "@hooks/useDailyWord";
import { WordDetailsCard } from "@components/word/WordDetailsCard";
import { BackButton } from "@components/ui/BackButton";
import { SectionLabel } from "@components/ui/SectionLabel";
import { colors, fonts } from "@constants/theme";

/**
 * Celeb Explains — full-page deep dive for the Word of the Day. Today this
 * just renders the same WordDetailsCard the Learn tab uses; future iterations
 * will add a celebrity portrait and voice playback.
 */
export default function CelebExplainsScreen() {
  const { words, isLoading } = useDailyWord();
  const word = words[0] ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <SectionLabel title="CELEB EXPLAINS" />
          <Text style={styles.title}>Word of the Day</Text>
        </View>

        {isLoading && !word ? (
          <View style={styles.loadingBlock}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : word ? (
          <WordDetailsCard word={word} />
        ) : (
          <View style={styles.loadingBlock}>
            <Text style={styles.loadingText}>No word available right now.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  content: {
    padding: 14,
    gap: 16,
    paddingBottom: 64,
  },
  titleBlock: {
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  loadingBlock: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkLight,
  },
});
