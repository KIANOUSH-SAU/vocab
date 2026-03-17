import type { DictionaryAPIEntry } from '@/types'

const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en'

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
