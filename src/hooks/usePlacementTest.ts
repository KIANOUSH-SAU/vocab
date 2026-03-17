import { useState, useCallback } from 'react'
import { PLACEMENT_QUESTIONS } from '@constants/placementTest'
import { classifyFromAnswers } from '@utils/levelClassifier'
import type { Level } from '@/types'

interface Answer {
  questionId: string
  selectedIndex: number
}

interface UsePlacementTestReturn {
  currentQuestion: typeof PLACEMENT_QUESTIONS[number] | null
  currentIndex: number
  totalQuestions: number
  progress: number
  answers: Answer[]
  isComplete: boolean
  classifiedLevel: Level | null
  answer: (selectedIndex: number) => void
  reset: () => void
}

export function usePlacementTest(): UsePlacementTestReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])

  const isComplete = currentIndex >= PLACEMENT_QUESTIONS.length
  const currentQuestion = isComplete ? null : PLACEMENT_QUESTIONS[currentIndex]
  const classifiedLevel = isComplete ? classifyFromAnswers(answers) : null

  const answer = useCallback(
    (selectedIndex: number) => {
      const question = PLACEMENT_QUESTIONS[currentIndex]
      if (!question) return
      setAnswers((prev) => [...prev, { questionId: question.id, selectedIndex }])
      setCurrentIndex((prev) => prev + 1)
    },
    [currentIndex]
  )

  const reset = useCallback(() => {
    setCurrentIndex(0)
    setAnswers([])
  }, [])

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: PLACEMENT_QUESTIONS.length,
    progress: currentIndex / PLACEMENT_QUESTIONS.length,
    answers,
    isComplete,
    classifiedLevel,
    answer,
    reset,
  }
}
