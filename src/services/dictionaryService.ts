import type { DictionaryAPIEntry, PartOfSpeech } from '@/types'

const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en'

const POS_WHITELIST: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'adverb']

function normalizePartOfSpeech(raw: string | undefined): PartOfSpeech {
  const v = (raw ?? '').toLowerCase()
  return (POS_WHITELIST as string[]).includes(v) ? (v as PartOfSpeech) : 'other'
}

/** Fetch phonetic and audio data for a word */
export async function fetchWordPhonetics(
  word: string
): Promise<{ phonetic: string; audioUrl: string } | null> {
  try {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(word)}`)
    if (!response.ok) return null

    const data: DictionaryAPIEntry[] = await response.json()
    const entry = data[0]
    if (!entry) return null

    const phonetic = entry.phonetics.find((p) => p.text)?.text ?? ''
    const audioUrl = entry.phonetics.find((p) => p.audio)?.audio ?? ''

    return { phonetic, audioUrl }
  } catch {
    return null
  }
}

export interface DictionaryWordPayload {
  phonetic: string
  partOfSpeech: PartOfSpeech
  definition: string
  exampleSentence: string
  audioUrl: string
}

/**
 * Fetch a complete entry for a manually-added word.
 * Returns whatever the dictionary provides — empty strings for missing fields
 * so the caller can decide what to fall back on.
 */
export async function fetchDictionaryEntry(
  word: string
): Promise<DictionaryWordPayload | null> {
  try {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(word.trim())}`)
    if (!response.ok) return null

    const data: DictionaryAPIEntry[] = await response.json()
    const entry = data[0]
    if (!entry) return null

    const phonetic = entry.phonetics.find((p) => p.text)?.text ?? ''
    const audioUrl = entry.phonetics.find((p) => p.audio)?.audio ?? ''

    const meaning = entry.meanings[0]
    const partOfSpeech = normalizePartOfSpeech(meaning?.partOfSpeech)

    const firstDef = meaning?.definitions?.find((d) => d.definition)
    const definition = firstDef?.definition ?? ''
    const exampleSentence =
      meaning?.definitions?.find((d) => d.example)?.example ?? ''

    return { phonetic, partOfSpeech, definition, exampleSentence, audioUrl }
  } catch {
    return null
  }
}
