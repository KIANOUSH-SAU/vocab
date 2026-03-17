import type { Word } from './word'

export type ExerciseType =
  | 'swipe'
  | 'fillInBlank'
  | 'audioQuestion'
  | 'multipleChoice'
  | 'partsOfSpeech'

export interface ExerciseProps {
  word: Word
  onCorrect: () => void
  onWrong: (word: Word, exerciseContext: string) => void
  onSkip?: () => void
}

export interface ExerciseCard {
  id: string
  type: ExerciseType
  word: Word
}

export interface MultipleChoiceOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface SwipeCard {
  premise: string
  isTrue: boolean
  hint?: string
}

export interface SessionStats {
  correct: number
  wrong: number
  skipped: number
  totalCards: number
  durationMs: number
}
