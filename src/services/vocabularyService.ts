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
    level: doc.level,
    fields: doc.fields ?? [],
    usabilityScore: doc.usabilityScore ?? 0,
    audioUrl: doc.audioUrl,
  };
}

function filterMockWords(level: Level, fields: Field[]): Word[] {
  return MOCK_WORDS.filter(
    (w) => w.level === level && w.fields.some((f) => fields.includes(f)),
  ).sort((a, b) => b.usabilityScore - a.usabilityScore);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch words filtered by level and fields. Falls back to mock data when Appwrite is not configured. */
export async function fetchWordsByLevelAndField(
  level: Level,
  fields: Field[],
): Promise<Word[]> {
  // If no fields selected, fall back to mock data
  if (!fields || fields.length === 0) return filterMockWords(level, fields);
  if (!isAppwriteConfigured) return filterMockWords(level, fields);

  try {
    const db = getDatabases();
    
    // Use an OR query if multiple fields are selected so Appwrite matches ANY field
    const fieldQueries = fields.map(f => Query.contains("fields", [f]));
    const mainQuery = [
      Query.equal("level", level),
      Query.orderDesc("usabilityScore"),
      Query.limit(100)
    ];
    
    if (fieldQueries.length > 1) {
      mainQuery.push(Query.or(fieldQueries));
    } else if (fieldQueries.length === 1) {
      mainQuery.push(fieldQueries[0]);
    }

    console.log(`[vocabularyService] Fetching from DB for level: ${level}, fields: ${fields}`);
    const response = await db.listDocuments(DB_ID, COLLECTIONS.WORDS, mainQuery);
    console.log(`[vocabularyService] DB returned ${response.documents.length} words`);
    return response.documents.map(mapDocToWord);
  } catch (error) {
    console.warn(
      "[vocabularyService] Appwrite fetch failed, using mock data.",
      error,
    );
    const mocked = filterMockWords(level, fields);
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
      totalAttempts: (doc as any).totalAttempts,
      correctAttempts: (doc as any).correctAttempts,
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
