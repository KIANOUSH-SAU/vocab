export type Field = 'engineering' | 'health' | 'law' | 'sports' | 'education'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other'

export type WordStatus = 'new' | 'learning' | 'mastered'

export type IntervalIndex = 0 | 1 | 2 | 3 | 4

export interface Word {
  id: string
  word: string
  phonetic: string
  partOfSpeech: PartOfSpeech
  definition: string
  exampleSentence: string
  contextPassage: string
  level: Level
  fields: Field[]
  usabilityScore: number
  audioUrl?: string
}

export interface UserWord {
  id: string
  userId: string
  wordId: string
  status: WordStatus
  nextReviewDate: string
  intervalIndex: IntervalIndex
  totalAttempts: number
  correctAttempts: number | string // WARNING: Stored as 'text' in Appwrite DB
}

export interface WordScore {
  word: string
  fieldRelevance: number
  usabilityScore: number
  notes: string
}
