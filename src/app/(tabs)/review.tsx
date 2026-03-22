import { useState, useMemo } from 'react'
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUserWords } from '@store/progressStore'
import { useWordStore } from '@store/wordStore'
import { colors, spacing, radii, shadows, fonts } from '@constants/theme'
import type { UserWord, Word, IntervalIndex } from '@/types'

// ─── Mock Vault ───────────────────────────────────────────────

const MOCK_VAULT: { word: Word; userWord: UserWord }[] = [
  {
    word: { id: 'w1', word: 'Leverage', phonetic: '/ˈlev.ər.ɪdʒ/', partOfSpeech: 'verb', definition: 'To use something to maximum advantage', exampleSentence: '', contextPassage: '', level: 'B2', fields: ['engineering'], usabilityScore: 9.2 },
    userWord: { id: 'uw1', userId: 'u1', wordId: 'w1', status: 'mastered', nextReviewDate: '', intervalIndex: 4, totalAttempts: 8, correctAttempts: 7 },
  },
  {
    word: { id: 'w2', word: 'Mitigate', phonetic: '/ˈmɪt.ɪ.ɡeɪt/', partOfSpeech: 'verb', definition: 'To make something less severe or serious', exampleSentence: '', contextPassage: '', level: 'B2', fields: ['law'], usabilityScore: 8.5 },
    userWord: { id: 'uw2', userId: 'u1', wordId: 'w2', status: 'learning', nextReviewDate: '', intervalIndex: 2, totalAttempts: 5, correctAttempts: 3 },
  },
  {
    word: { id: 'w3', word: 'Benign', phonetic: '/bɪˈnaɪn/', partOfSpeech: 'adjective', definition: 'Not harmful in effect; gentle and kind', exampleSentence: '', contextPassage: '', level: 'B1', fields: ['health'], usabilityScore: 7.8 },
    userWord: { id: 'uw3', userId: 'u1', wordId: 'w3', status: 'learning', nextReviewDate: '', intervalIndex: 3, totalAttempts: 6, correctAttempts: 5 },
  },
  {
    word: { id: 'w4', word: 'Volatile', phonetic: '/ˈvɒl.ə.taɪl/', partOfSpeech: 'adjective', definition: 'Liable to change rapidly and unpredictably', exampleSentence: '', contextPassage: '', level: 'C1', fields: ['engineering'], usabilityScore: 8.9 },
    userWord: { id: 'uw4', userId: 'u1', wordId: 'w4', status: 'learning', nextReviewDate: '', intervalIndex: 0, totalAttempts: 3, correctAttempts: 1 },
  },
  {
    word: { id: 'w5', word: 'Eloquent', phonetic: '/ˈel.ə.kwənt/', partOfSpeech: 'adjective', definition: 'Fluent or persuasive in speaking or writing', exampleSentence: '', contextPassage: '', level: 'B2', fields: ['education'], usabilityScore: 8.0 },
    userWord: { id: 'uw5', userId: 'u1', wordId: 'w5', status: 'mastered', nextReviewDate: '', intervalIndex: 4, totalAttempts: 10, correctAttempts: 9 },
  },
  {
    word: { id: 'w6', word: 'Precedent', phonetic: '/ˈpres.ɪ.dənt/', partOfSpeech: 'noun', definition: 'An earlier event or action regarded as an example', exampleSentence: '', contextPassage: '', level: 'B2', fields: ['law'], usabilityScore: 9.0 },
    userWord: { id: 'uw6', userId: 'u1', wordId: 'w6', status: 'learning', nextReviewDate: '', intervalIndex: 1, totalAttempts: 4, correctAttempts: 2 },
  },
]

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status, isStruggling }: { status: string; isStruggling: boolean }) {
  if (isStruggling) {
    return (
      <View style={[badgeStyles.badge, { backgroundColor: colors.coralSoft }]}>
        <Text style={[badgeStyles.text, { color: colors.coralText }]}>Struggling</Text>
      </View>
    )
  }
  if (status === 'mastered') {
    return (
      <View style={[badgeStyles.badge, { backgroundColor: colors.mintSoft }]}>
        <Text style={[badgeStyles.text, { color: colors.mintText }]}>Mastered</Text>
      </View>
    )
  }
  return (
    <View style={[badgeStyles.badge, { backgroundColor: colors.amberSoft }]}>
      <Text style={[badgeStyles.text, { color: colors.amberText }]}>Learning</Text>
    </View>
  )
}

const badgeStyles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
})

// ─── Mastery Meter ────────────────────────────────────────────

function MasteryMeter({ intervalIndex, isStruggling }: { intervalIndex: IntervalIndex; isStruggling: boolean }) {
  const lit = intervalIndex + 1
  const barColor = isStruggling
    ? colors.coral
    : intervalIndex === 4
      ? colors.mint
      : colors.iris

  return (
    <View style={meterStyles.row}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            meterStyles.bar,
            { height: 8 + i * 4 },
            i < lit ? { backgroundColor: barColor } : { backgroundColor: colors.border },
          ]}
        />
      ))}
    </View>
  )
}

const meterStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 5, borderRadius: 2 },
})

// ─── Filter Chips ─────────────────────────────────────────────

type FilterKey = 'all' | 'learning' | 'struggling' | 'mastered'

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: colors.ink },
  { key: 'learning', label: 'Learning', color: colors.amber },
  { key: 'struggling', label: 'Struggling', color: colors.coral },
  { key: 'mastered', label: 'Mastered', color: colors.mint },
]

function FilterChips({ active, onSelect }: { active: FilterKey; onSelect: (k: FilterKey) => void }) {
  return (
    <View style={chipStyles.row}>
      {FILTERS.map((f) => {
        const isActive = f.key === active
        return (
          <Pressable
            key={f.key}
            onPress={() => onSelect(f.key)}
            style={[
              chipStyles.chip,
              isActive && { backgroundColor: f.color, borderColor: f.color },
            ]}
          >
            <Text style={[chipStyles.chipText, isActive && chipStyles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
})

// ─── Word Row ─────────────────────────────────────────────────

function WordRow({ word, userWord }: { word: Word; userWord: UserWord }) {
  const correctNum = typeof userWord.correctAttempts === 'string'
    ? parseInt(userWord.correctAttempts, 10) || 0
    : userWord.correctAttempts
  const isStruggling =
    userWord.totalAttempts >= 3 && correctNum / userWord.totalAttempts < 0.5

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
        <Text style={rowStyles.definition} numberOfLines={1}>{word.definition}</Text>
      </View>
      <MasteryMeter intervalIndex={userWord.intervalIndex} isStruggling={isStruggling} />
    </Pressable>
  )
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    ...shadows.sm,
  },
  main: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  word: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  midRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phonetic: { fontFamily: fonts.mono, fontSize: 12, color: colors.iris },
  level: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.inkLight },
  definition: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2 },
})

// ─── Main Review Screen ───────────────────────────────────────

export default function ReviewScreen() {
  const storeUserWords = useUserWords()
  const wordCache = useWordStore((s) => s.wordCache)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const vault = useMemo(() => {
    const entries = Object.values(storeUserWords)
    if (entries.length === 0) return MOCK_VAULT
    return entries
      .map((uw) => {
        const word = wordCache[uw.wordId]
        if (!word) return null
        return { word, userWord: uw }
      })
      .filter(Boolean) as { word: Word; userWord: UserWord }[]
  }, [storeUserWords, wordCache])

  const filtered = useMemo(() => {
    let result = vault
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) => v.word.word.toLowerCase().includes(q) || v.word.definition.toLowerCase().includes(q)
      )
    }
    if (filter === 'learning') {
      result = result.filter((v) => v.userWord.status === 'learning')
    } else if (filter === 'mastered') {
      result = result.filter((v) => v.userWord.status === 'mastered')
    } else if (filter === 'struggling') {
      result = result.filter((v) => {
        const correct = typeof v.userWord.correctAttempts === 'string'
          ? parseInt(v.userWord.correctAttempts, 10) || 0
          : v.userWord.correctAttempts
        return v.userWord.totalAttempts >= 3 && correct / v.userWord.totalAttempts < 0.5
      })
    }
    return result
  }, [vault, search, filter])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mastery Vault</Text>
        <Text style={styles.subtitle}>{vault.length} words in your collection</Text>

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
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.inkLight} />
            </Pressable>
          )}
        </View>

        <FilterChips active={filter} onSelect={setFilter} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.word.id}
        renderItem={({ item }) => <WordRow word={item.word} userWord={item.userWord} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <Ionicons name="library-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>
              {search.trim() ? 'No words match your search' : 'No words in this category yet'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 14,
    paddingTop: 20,
    gap: 10,
    paddingBottom: 14,
  },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyInner: { alignItems: 'center', gap: 16, paddingVertical: 60 },
  emptyText: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkLight, textAlign: 'center' },
})
