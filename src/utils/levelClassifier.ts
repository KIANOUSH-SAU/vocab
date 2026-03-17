import { classifyLevel } from '@constants/levels'
import type { Level, PlacementQuestionType } from '@/types'
import { PLACEMENT_QUESTIONS } from '@constants/placementTest'

export type { Level }

interface Answer {
  questionId: string
  selectedIndex: number
}

export function scoreAnswers(answers: Answer[]): number {
  let score = 0
  for (const answer of answers) {
    const question = PLACEMENT_QUESTIONS.find(q => q.id === answer.questionId)
    if (!question) continue

    if (question.type === 'recognition') {
      // "Yes, I know it" = 1 point, "I've seen it" = 0.5 (round down), "No idea" = 0
      if (answer.selectedIndex === 0) score += 1
    } else {
      if (answer.selectedIndex === question.correctIndex) score += 1
    }
  }
  return score
}

export function classifyFromAnswers(answers: Answer[]): Level {
  const score = scoreAnswers(answers)
  return classifyLevel(score)
}
