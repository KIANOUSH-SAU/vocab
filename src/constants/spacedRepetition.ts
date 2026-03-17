import type { IntervalIndex } from '@/types'

export const INTERVALS: Record<IntervalIndex, number> = {
  0: 1,
  1: 3,
  2: 7,
  3: 14,
  4: 30,
} as const

export const MASTERY_INDEX: IntervalIndex = 4

export const WORDS_PER_DAY = 5
export const NEW_WORDS_PER_DAY = 3
export const REVIEW_WORDS_PER_DAY = 2
export const GUEST_WORDS_LIMIT = 3
