import { Query } from 'react-native-appwrite'
import {
  isAppwriteConfigured,
  getDatabases,
  DB_ID,
  COLLECTIONS,
  ID,
} from './appwriteService'
import { fetchDictionaryEntry } from './dictionaryService'
import { generateWordEntry } from './aiService'
import { getNextReviewDate } from '@utils/spacedRepetition'
import type { Word, UserWord, Level } from '@/types'

interface AddManualWordArgs {
  word: string
  userId: string
  userLevel: Level
}

interface AddManualWordResult {
  word: Word
  userWord: UserWord
}

/** Look up a word document by exact (lowercased) text. */
async function findWordByText(text: string): Promise<Word | null> {
  if (!isAppwriteConfigured) return null
  try {
    const db = getDatabases()
    const res = await db.listDocuments(DB_ID, COLLECTIONS.WORDS, [
      Query.equal('word', text),
      Query.limit(1),
    ])
    const doc = res.documents[0]
    if (!doc) return null
    return {
      id: doc.$id,
      word: doc.word,
      phonetic: doc.phonetic ?? '',
      partOfSpeech: doc.partOfSpeech ?? 'other',
      definition: doc.definition ?? '',
      exampleSentence: doc.exampleSentence ?? '',
      contextPassage: doc.contextPassage ?? '',
      level: doc.level,
      usabilityScore: doc.usabilityScore ?? 0,
      audioUrl: doc.audioUrl,
    }
  } catch {
    return null
  }
}

/** Look up an existing UserWord by userId + wordId. */
async function findUserWord(
  userId: string,
  wordId: string
): Promise<UserWord | null> {
  if (!isAppwriteConfigured) return null
  try {
    const db = getDatabases()
    const res = await db.listDocuments(DB_ID, COLLECTIONS.USER_WORDS, [
      Query.equal('userId', userId),
      Query.equal('wordId', wordId),
      Query.limit(1),
    ])
    const doc = res.documents[0]
    if (!doc) return null
    return {
      id: doc.$id,
      userId: doc.userId,
      wordId: doc.wordId,
      status: doc.status,
      nextReviewDate: doc.nextReviewDate,
      intervalIndex: doc.intervalIndex,
      totalAttempts: Number(doc.totalAttempts) || 0,
      correctAttempts: Number(doc.correctAttempts) || 0,
    } as UserWord
  } catch {
    return null
  }
}

/**
 * Add a word manually to the user's collection.
 * - Tries Free Dictionary API first; falls back to Claude for any missing fields.
 * - Reuses an existing Word document if one exists with the same text.
 * - Creates a UserWord with status="learning" and a fresh spaced-repetition slot.
 * - Throws if the user already has this word.
 */
export async function addManualWord({
  word,
  userId,
  userLevel,
}: AddManualWordArgs): Promise<AddManualWordResult> {
  const normalized = word.trim().toLowerCase()
  if (!normalized) throw new Error('Please enter a word.')
  if (!/^[a-zA-Z][a-zA-Z\-' ]*$/.test(normalized)) {
    throw new Error('Use letters only (no numbers or symbols).')
  }
  if (!isAppwriteConfigured) {
    throw new Error('Sign in to save words to your collection.')
  }
  if (!userId || userId === 'guest') {
    throw new Error('Sign in to save words to your collection.')
  }

  // 1) Reuse an existing Word document if present.
  let wordDoc = await findWordByText(normalized)

  // 2) Otherwise, build a new entry via Free Dictionary + Claude fallback.
  if (!wordDoc) {
    const dict = await fetchDictionaryEntry(normalized)

    let phonetic = dict?.phonetic ?? ''
    let partOfSpeech = dict?.partOfSpeech ?? 'other'
    let definition = dict?.definition ?? ''
    let exampleSentence = dict?.exampleSentence ?? ''
    const audioUrl = dict?.audioUrl ?? ''

    const needsFallback =
      !definition || !exampleSentence || !phonetic || partOfSpeech === 'other'

    if (needsFallback) {
      try {
        const ai = await generateWordEntry(normalized)
        if (!phonetic) phonetic = ai.phonetic
        if (!definition) definition = ai.definition
        if (!exampleSentence) exampleSentence = ai.exampleSentence
        if (partOfSpeech === 'other' && ai.partOfSpeech !== 'other') {
          partOfSpeech = ai.partOfSpeech
        }
      } catch (err) {
        if (!definition) {
          throw new Error(
            "Couldn't find that word. Check the spelling and try again.",
          )
        }
      }
    }

    const db = getDatabases()
    const created = await db.createDocument(
      DB_ID,
      COLLECTIONS.WORDS,
      ID.unique(),
      {
        word: normalized,
        phonetic,
        partOfSpeech,
        definition,
        exampleSentence,
        contextPassage: '',
        level: userLevel,
        usabilityScore: 0,
        audioUrl,
      },
    )

    wordDoc = {
      id: created.$id,
      word: normalized,
      phonetic,
      partOfSpeech,
      definition,
      exampleSentence,
      contextPassage: '',
      level: userLevel,
      usabilityScore: 0,
      audioUrl,
    }
  }

  // 3) Reject if the user already has this word in their collection.
  const existingUserWord = await findUserWord(userId, wordDoc.id)
  if (existingUserWord) {
    throw new Error(`"${wordDoc.word}" is already in your collection.`)
  }

  // 4) Create a fresh UserWord record (interval 0 → review tomorrow).
  const db = getDatabases()
  const userWordPayload = {
    userId,
    wordId: wordDoc.id,
    status: 'learning' as const,
    nextReviewDate: getNextReviewDate(0),
    intervalIndex: 0,
    totalAttempts: 0,
    correctAttempts: 0,
  }
  const createdUserWord = await db.createDocument(
    DB_ID,
    COLLECTIONS.USER_WORDS,
    ID.unique(),
    userWordPayload,
  )

  return {
    word: wordDoc,
    userWord: { id: createdUserWord.$id, ...userWordPayload } as UserWord,
  }
}
