import { Query } from 'react-native-appwrite'
import { isAppwriteConfigured, getDatabases, DB_ID, COLLECTIONS } from './appwriteService'
import { MOCK_WORDS } from '@constants/mockWords'
import type { Word, UserWord, Field, Level } from '@/types'

// ─── Local helpers ────────────────────────────────────────────────────────────

function filterMockWords(level: Level, fields: Field[]): Word[] {
  return MOCK_WORDS.filter(
    (w) => w.level === level && w.fields.some((f) => fields.includes(f))
  ).sort((a, b) => b.usabilityScore - a.usabilityScore)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch words filtered by level and fields. Falls back to mock data when Appwrite is not configured. */
export async function fetchWordsByLevelAndField(level: Level, fields: Field[]): Promise<Word[]> {
  if (!isAppwriteConfigured) return filterMockWords(level, fields)

  try {
    const db = getDatabases()
    const response = await db.listDocuments(DB_ID, COLLECTIONS.WORDS, [
      Query.equal('level', level),
      Query.contains('fields', fields),
      Query.orderDesc('usabilityScore'),
      Query.limit(100),
    ])
    return response.documents as unknown as Word[]
  } catch (error) {
    console.warn('[vocabularyService] Appwrite fetch failed, using mock data.', error)
    return filterMockWords(level, fields)
  }
}

/** Fetch a single word by ID. Falls back to mock data when Appwrite is not configured. */
export async function fetchWordById(wordId: string): Promise<Word> {
  if (!isAppwriteConfigured) {
    const word = MOCK_WORDS.find((w) => w.id === wordId)
    if (!word) throw new Error(`[vocabularyService] Word ${wordId} not found in mock data`)
    return word
  }

  try {
    const db = getDatabases()
    const doc = await db.getDocument(DB_ID, COLLECTIONS.WORDS, wordId)
    return doc as unknown as Word
  } catch (error) {
    throw new Error(`[vocabularyService.fetchWordById] ${error}`)
  }
}

/** Fetch all UserWord records for a user. Returns empty array when Appwrite is not configured. */
export async function fetchUserWords(userId: string): Promise<UserWord[]> {
  if (!isAppwriteConfigured) return []

  try {
    const db = getDatabases()
    const response = await db.listDocuments(DB_ID, COLLECTIONS.USER_WORDS, [
      Query.equal('userId', userId),
      Query.limit(500),
    ])
    return response.documents as unknown as UserWord[]
  } catch (error) {
    throw new Error(`[vocabularyService.fetchUserWords] ${error}`)
  }
}

/** Create or update a UserWord record. No-op when Appwrite is not configured. */
export async function upsertUserWord(userWord: UserWord): Promise<UserWord> {
  if (!isAppwriteConfigured) return userWord

  try {
    const db = getDatabases()
    if (userWord.id) {
      const doc = await db.updateDocument(DB_ID, COLLECTIONS.USER_WORDS, userWord.id, userWord)
      return doc as unknown as UserWord
    } else {
      const doc = await db.createDocument(DB_ID, COLLECTIONS.USER_WORDS, 'unique()', userWord)
      return doc as unknown as UserWord
    }
  } catch (error) {
    throw new Error(`[vocabularyService.upsertUserWord] ${error}`)
  }
}
