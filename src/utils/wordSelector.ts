import type { Word, UserWord, Field, Level } from '@/types'
import { isWordDueToday } from './spacedRepetition'
import { NEW_WORDS_PER_DAY, REVIEW_WORDS_PER_DAY } from '@constants/spacedRepetition'

export function selectDailyWords(
  allWords: Word[],
  userWords: Record<string, UserWord>,
  userLevel: Level,
  userFields: Field[],
  limit?: number
): Word[] {
  const newLimit = limit ?? NEW_WORDS_PER_DAY
  const reviewLimit = limit ? 0 : REVIEW_WORDS_PER_DAY

  const levelWords = allWords.filter(
    w => w.level === userLevel && w.fields.some(f => userFields.includes(f))
  )

  const masteredIds = new Set(
    Object.values(userWords)
      .filter(uw => uw.status === 'mastered')
      .map(uw => uw.wordId)
  )

  const dueForReview = Object.values(userWords)
    .filter(uw => uw.status === 'learning' && isWordDueToday(uw))
    .map(uw => allWords.find(w => w.id === uw.wordId))
    .filter((w): w is Word => w !== undefined)
    .slice(0, reviewLimit)

  const dueIds = new Set(dueForReview.map(w => w.id))

  const newWords = levelWords
    .filter(w => !masteredIds.has(w.id) && !dueIds.has(w.id) && !userWords[w.id])
    .sort((a, b) => b.usabilityScore - a.usabilityScore)
    .slice(0, newLimit)

  return [...dueForReview, ...newWords]
}
