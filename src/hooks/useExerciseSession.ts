import { useState, useCallback, useMemo } from 'react'
import type { Word, ExerciseCard, ExerciseType, SessionStats } from '@/types'
import { useSpacedRepetition } from './useSpacedRepetition'
import { generateWrongAnswerExplanation } from '@services/aiService'
import { useAudio } from './useAudio'
import { useCurrentUser } from '@store/userStore'

const EXERCISE_TYPES: ExerciseType[] = [
  'swipe',
  'multipleChoice',
  'fillInBlank',
]

function buildQueue(words: Word[]): ExerciseCard[] {
  return words.flatMap((word, i) =>
    ['swipe' as ExerciseType].map((type, j) => ({
      id: `${word.id}-${j}`,
      type,
      word,
    }))
  )
}

interface UseExerciseSessionReturn {
  currentCard: ExerciseCard | null
  progress: { completed: number; total: number }
  isComplete: boolean
  sessionStats: SessionStats
  explanation: string | null
  isExplaining: boolean
  onCorrect: () => void
  onWrong: (word: Word, context: string) => Promise<void>
  onSkip: () => void
  dismissExplanation: () => void
}

export function useExerciseSession(words: Word[]): UseExerciseSessionReturn {
  // Rebuild the queue whenever the source words actually change (e.g. when
  // the screen mounts before useDailyWord has populated todaysWords). Without
  // this, an empty initial queue would lock the session into a permanent
  // "complete" state and prematurely flip isDailySessionCompleted.
  const queue = useMemo(() => buildQueue(words), [words])
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState<SessionStats>({
    correct: 0, wrong: 0, skipped: 0,
    totalCards: queue.length,
  })
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const { recordAnswer } = useSpacedRepetition()
  const { play } = useAudio()
  const user = useCurrentUser()

  const currentCard = index < queue.length ? queue[index] : null
  // An empty queue must NOT count as "complete" — that path would mark the
  // daily session done without the user ever answering a card.
  const isComplete = queue.length > 0 && index >= queue.length

  const advance = useCallback(() => setIndex((i) => i + 1), [])

  const onCorrect = useCallback(() => {
    const card = queue[index]
    if (card) recordAnswer(card.word, true)
    setStats((s) => ({ ...s, correct: s.correct + 1 }))
    advance()
  }, [index, queue, recordAnswer, advance])

  const onWrong = useCallback(
    async (word: Word, context: string) => {
      recordAnswer(word, false)
      setStats((s) => ({ ...s, wrong: s.wrong + 1 }))
      setIsExplaining(true)

      try {
        const text = await generateWrongAnswerExplanation(
          word, context, '', word.definition
        )
        setExplanation(text)
        if (user?.voiceStyleId) await play(text)
      } catch {
        setExplanation(`"${word.word}" means: ${word.definition}`)
      } finally {
        setIsExplaining(false)
      }
    },
    [recordAnswer, play, user]
  )

  const onSkip = useCallback(() => {
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }))
    advance()
  }, [advance])

  const dismissExplanation = useCallback(() => {
    setExplanation(null)
    advance()
  }, [advance])

  return {
    currentCard,
    progress: { completed: index, total: queue.length },
    isComplete,
    sessionStats: stats,
    explanation,
    isExplaining,
    onCorrect,
    onWrong,
    onSkip,
    dismissExplanation,
  }
}
