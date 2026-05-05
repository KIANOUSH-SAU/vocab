import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUserWords } from "@store/progressStore";
import { useWordStore } from "@store/wordStore";
import { useTabFocusSync } from "@hooks/useRemoteSync";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { AccentBlob } from "@components/ui/AccentBlob";
import { AddWordModal } from "@components/word/AddWordModal";
import type { UserWord, Word, IntervalIndex } from "@/types";




// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({
  status,
  isStruggling,
}: {
  status: string;
  isStruggling: boolean;
}) {
  if (isStruggling) {
    return (
      <View style={[badgeStyles.badge, { backgroundColor: colors.coralSoft }]}>
        <Text style={[badgeStyles.text, { color: colors.coralText }]}>
          Struggling
        </Text>
      </View>
    );
  }
  if (status === "mastered") {
    return (
      <View style={[badgeStyles.badge, { backgroundColor: colors.mintSoft }]}>
        <Text style={[badgeStyles.text, { color: colors.mintText }]}>
          Mastered
        </Text>
      </View>
    );
  }
  return (
    <View style={[badgeStyles.badge, { backgroundColor: colors.amberSoft }]}>
      <Text style={[badgeStyles.text, { color: colors.amberText }]}>
        Learning
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
});

// ─── Mastery Meter ────────────────────────────────────────────

function MasteryMeter({
  intervalIndex,
  isStruggling,
}: {
  intervalIndex: IntervalIndex;
  isStruggling: boolean;
}) {
  // Rough percentage mappings for visual weight
  const pct = isStruggling ? 0.2 : (intervalIndex + 1) / 5;

  const barColor = isStruggling
    ? colors.coral
    : intervalIndex === 4
      ? colors.mint
      : colors.amber;

  return (
    <View style={[meterStyles.shadowWrapper, { shadowColor: barColor }]}>
      <View style={meterStyles.track}>
        <View
          style={[
            meterStyles.fill,
            { width: `${pct * 100}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  shadowWrapper: {
    width: 48,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  track: {
    flex: 1,
    backgroundColor: colors.borderSoft,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

// ─── Filter Chips ─────────────────────────────────────────────

type FilterKey = "all" | "learning" | "struggling" | "mastered";

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: "all", label: "All", color: colors.ink },
  { key: "learning", label: "Learning", color: colors.amber },
  { key: "struggling", label: "Struggling", color: colors.coral },
  { key: "mastered", label: "Mastered", color: colors.mint },
];

function FilterChips({
  active,
  onSelect,
}: {
  active: FilterKey;
  onSelect: (k: FilterKey) => void;
}) {
  return (
    <View style={chipStyles.row}>
      {FILTERS.map((f) => {
        const isActive = f.key === active;
        return (
          <Pressable
            key={f.key}
            onPress={() => onSelect(f.key)}
            style={[
              chipStyles.chip,
              isActive && { backgroundColor: f.color, borderColor: f.color },
            ]}
          >
            <Text
              style={[
                chipStyles.chipText,
                isActive && chipStyles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
});

// ─── Word Row ─────────────────────────────────────────────────

function WordRow({ word, userWord }: { word: Word; userWord: UserWord }) {
  const correctNum =
    typeof userWord.correctAttempts === "string"
      ? parseInt(userWord.correctAttempts, 10) || 0
      : userWord.correctAttempts;
  const isStruggling =
    userWord.totalAttempts >= 3 && correctNum / userWord.totalAttempts < 0.5;

  return (
    <Pressable
      onPress={() => router.push(`/word/${word.id}`)}
      style={rowStyles.container}
    >
      <View style={rowStyles.main}>
        <View style={rowStyles.topRow}>
          <Text style={rowStyles.word}>{word.word}</Text>
          <StatusBadge status={userWord.status} isStruggling={isStruggling} />
        </View>
        <View style={rowStyles.midRow}>
          <Text style={rowStyles.phonetic}>{word.phonetic}</Text>
          <Text style={rowStyles.level}>{word.level}</Text>
        </View>
        <Text style={rowStyles.definition} numberOfLines={1}>
          {word.definition}
        </Text>
      </View>
      <MasteryMeter
        intervalIndex={userWord.intervalIndex}
        isStruggling={isStruggling}
      />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    ...shadows.sm,
  },
  main: { flex: 1, gap: 4 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  word: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  midRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  phonetic: { fontFamily: fonts.mono, fontSize: 12, color: colors.iris },
  level: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.inkLight },
  definition: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2 },
});

// ─── Main Review Screen ───────────────────────────────────────

export default function ReviewScreen() {
  useTabFocusSync();
  const storeUserWords = useUserWords();
  const wordCache = useWordStore((s) => s.wordCache);
  const todaysWords = useWordStore((s) => s.todaysWords);
  const isDailySessionCompleted = useWordStore(
    (s) => s.isDailySessionCompleted,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [addOpen, setAddOpen] = useState(false);

  const vault = useMemo(() => {
    const entries = Object.values(storeUserWords);

    // Hide today's words from the vault until the daily session is done.
    // They re-appear automatically once `isDailySessionCompleted` flips true.
    const excluded = !isDailySessionCompleted
      ? new Set(todaysWords.map((w) => w.id))
      : new Set<string>();

    return entries
      .filter((uw) => !excluded.has(uw.wordId))
      .map((uw) => {
        const word = wordCache[uw.wordId];
        if (!word) return null;
        return { word, userWord: uw };
      })
      .filter(Boolean) as { word: Word; userWord: UserWord }[];
  }, [storeUserWords, wordCache, todaysWords, isDailySessionCompleted]);

  const filtered = useMemo(() => {
    let result = vault;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.word.word.toLowerCase().includes(q) ||
          v.word.definition.toLowerCase().includes(q),
      );
    }
    if (filter === "learning") {
      result = result.filter((v) => v.userWord.status === "learning");
    } else if (filter === "mastered") {
      result = result.filter((v) => v.userWord.status === "mastered");
    } else if (filter === "struggling") {
      result = result.filter((v) => {
        const correct =
          typeof v.userWord.correctAttempts === "string"
            ? parseInt(v.userWord.correctAttempts, 10) || 0
            : v.userWord.correctAttempts;
        return (
          v.userWord.totalAttempts >= 3 &&
          correct / v.userWord.totalAttempts < 0.5
        );
      });
    }
    return result;
  }, [vault, search, filter]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { position: "relative" }]}>
        <AccentBlob placement="top-right" colorTheme="orange" />
        <Text style={styles.title}>Mastery Vault</Text>
        <Text style={styles.subtitle}>
          {vault.length} words in your collection
        </Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.inkLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search your words..."
            placeholderTextColor={colors.inkLight}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.inkLight} />
            </Pressable>
          )}
        </View>

        <FilterChips active={filter} onSelect={setFilter} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.word.id}
        renderItem={({ item }) => (
          <WordRow word={item.word} userWord={item.userWord} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={[styles.emptyInner, { position: "relative" }]}>
            <AccentBlob placement="bottom-left" colorTheme="orange" />
            <Ionicons name="library-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>
              {search.trim()
                ? "No words match your search"
                : "No words in this category yet"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => setAddOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.92 }]}
        accessibilityLabel="Add a word manually"
        accessibilityRole="button"
        hitSlop={8}
      >
        <LinearGradient
          colors={[colors.ink, colors.inkMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>

      <AddWordModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 14,
    paddingTop: 20,
    gap: 10,
    paddingBottom: 14,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  list: { paddingHorizontal: 14, paddingBottom: 100 },
  emptyInner: { alignItems: "center", gap: 16, paddingVertical: 60 },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkLight,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    ...shadows.button,
  },
  fabInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
