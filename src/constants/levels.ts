import type { Level } from '@/types'

export interface LevelMeta {
  id: Level
  label: string
  description: string
  scoreRange: [number, number]
}

export const LEVELS: LevelMeta[] = [
  {
    id: 'A1',
    label: 'Beginner',
    description: 'You know basic everyday words and simple phrases.',
    scoreRange: [0, 3],
  },
  {
    id: 'A2',
    label: 'Elementary',
    description: 'You can understand frequently used expressions and common topics.',
    scoreRange: [4, 5],
  },
  {
    id: 'B1',
    label: 'Intermediate',
    description: 'You can deal with most situations and describe experiences clearly.',
    scoreRange: [6, 7],
  },
  {
    id: 'B2',
    label: 'Upper Intermediate',
    description: 'You can understand complex texts and express yourself fluently.',
    scoreRange: [8, 8],
  },
  {
    id: 'C1',
    label: 'Advanced',
    description: 'You use language flexibly and effectively for all purposes.',
    scoreRange: [9, 10],
  },
] as const

export function classifyLevel(score: number): Level {
  for (const level of LEVELS) {
    const [min, max] = level.scoreRange
    if (score >= min && score <= max) return level.id
  }
  return 'A1'
}
