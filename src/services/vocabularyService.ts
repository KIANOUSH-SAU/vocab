import { Query } from "react-native-appwrite";
import {
  isAppwriteConfigured,
  getDatabases,
  DB_ID,
  COLLECTIONS,
} from "./appwriteService";
import { MOCK_WORDS } from "@constants/mockWords";
import type { Word, UserWord, Field, Level } from "@/types";

// ─── Local helpers ────────────────────────────────────────────────────────────

/** Map Appwrite document (with $id, $collectionId, etc.) to our Word type */
function mapDocToWord(doc: Record<string, any>): Word {
  return {
    id: doc.$id ?? doc.id,
    word: doc.word,
    phonetic: doc.phonetic ?? "",
    partOfSpeech: doc.partOfSpeech ?? "other",
    definition: doc.definition ?? "",
    exampleSentence: doc.exampleSentence ?? "",
    contextPassage: doc.contextPassage ?? "",
    distractors: Array.isArray(doc.distractors) ? doc.distractors : undefined,
    level: doc.level,
    usabilityScore: doc.usabilityScore ?? 0,
    audioUrl: doc.audioUrl,
  };
}

function filterMockWords(level: Level): Word[] {
  return MOCK_WORDS.filter(
    (w) => w.level === level
  ).sort((a, b) => b.usabilityScore - a.usabilityScore);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchWordsByLevel(
  level: Level,
): Promise<Word[]> {
  if (!isAppwriteConfigured) return filterMockWords(level);

  try {
    const db = getDatabases();
    
    const mainQuery = [
      Query.equal("level", level),
      Query.orderDesc("usabilityScore"),
      Query.limit(100)
    ];

    console.log(`[vocabularyService] Fetching from DB for level: ${level}`);
    const response = await db.listDocuments(DB_ID, COLLECTIONS.WORDS, mainQuery);
    console.log(`[vocabularyService] DB returned ${response.documents.length} words`);
    return response.documents.map(mapDocToWord);
  } catch (error) {
    console.warn(
      "[vocabularyService] Appwrite fetch failed, using mock data.",
      error,
    );
    const mocked = filterMockWords(level);
    console.log(`[vocabularyService] Mock data fallback returned ${mocked.length} words`);
    return mocked;
  }
}

/** Fetch a single word by ID. Falls back to mock data when Appwrite is not configured. */
export async function fetchWordById(wordId: string): Promise<Word> {
  if (!isAppwriteConfigured) {
    const word = MOCK_WORDS.find((w) => w.id === wordId);
    if (!word)
      throw new Error(
        `[vocabularyService] Word ${wordId} not found in mock data`,
      );
    return word;
  }

  try {
    const db = getDatabases();
    const doc = await db.getDocument(DB_ID, COLLECTIONS.WORDS, wordId);
    return mapDocToWord(doc);
  } catch (error) {
    throw new Error(`[vocabularyService.fetchWordById] ${error}`);
  }
}

/**
 * Batch-fetch Word documents by their IDs.
 * Returns a Record<wordId, Word> for easy lookup.
 * Appwrite limits Query.equal to 100 values — we chunk accordingly.
 */
export async function fetchWordsByIds(
  wordIds: string[],
): Promise<Record<string, Word>> {
  const result: Record<string, Word> = {};
  if (wordIds.length === 0) return result;

  if (!isAppwriteConfigured) {
    for (const id of wordIds) {
      const w = MOCK_WORDS.find((m) => m.id === id);
      if (w) result[w.id] = w;
    }
    return result;
  }

  try {
    const db = getDatabases();
    const CHUNK = 100;
    for (let i = 0; i < wordIds.length; i += CHUNK) {
      const chunk = wordIds.slice(i, i + CHUNK);
      const response = await db.listDocuments(DB_ID, COLLECTIONS.WORDS, [
        Query.equal("$id", chunk),
        Query.limit(CHUNK),
      ]);
      for (const doc of response.documents) {
        const w = mapDocToWord(doc);
        result[w.id] = w;
      }
    }
    return result;
  } catch (error) {
    console.warn("[vocabularyService.fetchWordsByIds]", error);
    return result;
  }
}

/** Fetch all UserWord records for a user. Returns empty array when Appwrite is not configured. */
export async function fetchUserWords(userId: string): Promise<UserWord[]> {
  if (!isAppwriteConfigured) return [];

  try {
    const db = getDatabases();
    const response = await db.listDocuments(DB_ID, COLLECTIONS.USER_WORDS, [
      Query.equal("userId", userId),
      Query.limit(500),
    ]);
    return response.documents.map((doc) => ({
      id: doc.$id ?? (doc as any).id,
      userId: (doc as any).userId,
      wordId: (doc as any).wordId,
      status: (doc as any).status,
      nextReviewDate: (doc as any).nextReviewDate,
      intervalIndex: (doc as any).intervalIndex,
      totalAttempts: Number((doc as any).totalAttempts) || 0,
      correctAttempts: Number((doc as any).correctAttempts) || 0,
    })) as UserWord[];
  } catch (error) {
    throw new Error(`[vocabularyService.fetchUserWords] ${error}`);
  }
}

/** Create or update a UserWord record. No-op when Appwrite is not configured. */
export async function upsertUserWord(userWord: UserWord): Promise<UserWord> {
  if (!isAppwriteConfigured) return userWord;

  try {
    const db = getDatabases();
    if (userWord.id) {
      const { id, ...data } = userWord;
      const doc = await db.updateDocument(
        DB_ID,
        COLLECTIONS.USER_WORDS,
        id,
        data,
      );
      return { ...userWord, id: doc.$id };
    } else {
      const { id, ...data } = userWord;
      const doc = await db.createDocument(
        DB_ID,
        COLLECTIONS.USER_WORDS,
        "unique()",
        data,
      );
      return { ...userWord, id: doc.$id };
    }
  } catch (error) {
    throw new Error(`[vocabularyService.upsertUserWord] ${error}`);
  }
}
