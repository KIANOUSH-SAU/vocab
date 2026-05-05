import { INTERVALS, MASTERY_INDEX } from '@constants/spacedRepetition'
import type { IntervalIndex, UserWord, WordStatus } from '@/types'

export function getNextIntervalIndex(current: IntervalIndex, correct: boolean): IntervalIndex {
  if (!correct) return 0
  return Math.min(current + 1, MASTERY_INDEX) as IntervalIndex
}

export function getNextReviewDate(intervalIndex: IntervalIndex): string {
  const days = INTERVALS[intervalIndex]
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function isWordDueToday(userWord: UserWord): boolean {
  const reviewDate = new Date(userWord.nextReviewDate)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return reviewDate <= today
}

export function getWordStatusAfterAnswer(
  current: UserWord,
  correct: boolean
): Pick<UserWord, 'status' | 'intervalIndex' | 'nextReviewDate' | 'totalAttempts' | 'correctAttempts'> {
  const intervalIndex = getNextIntervalIndex(current.intervalIndex, correct)
  const status: WordStatus = intervalIndex === MASTERY_INDEX ? 'mastered' : 'learning'

  return {
    status,
    intervalIndex,
    nextReviewDate: getNextReviewDate(intervalIndex),
    totalAttempts: Number(current.totalAttempts) + 1,
    correctAttempts: Number(current.correctAttempts) + (correct ? 1 : 0),
  }
}

export function getAccuracyPercent(userWord: UserWord): number {
  if (userWord.totalAttempts === 0) return 0
  return Math.round((Number(userWord.correctAttempts) / Number(userWord.totalAttempts)) * 100)
}
