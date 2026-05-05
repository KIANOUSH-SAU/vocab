import { useCallback, useState } from 'react'
import { addManualWord } from '@services/manualWordService'
import { useCurrentUser } from '@store/userStore'
import { useProgressStore } from '@store/progressStore'
import { useWordStore } from '@store/wordStore'
import type { Word, UserWord } from '@/types'

interface UseAddManualWordReturn {
  isSubmitting: boolean
  error: string | null
  submit: (word: string) => Promise<{ word: Word; userWord: UserWord } | null>
  reset: () => void
}

/**
 * Orchestrates adding a manually-typed word to the user's collection.
 * Looks the word up via Free Dictionary, falls back to Claude for any
 * missing fields, persists Word + UserWord docs in Appwrite, and updates
 * the local Zustand stores so the new entry shows up immediately.
 */
export function useAddManualWord(): UseAddManualWordReturn {
  const user = useCurrentUser()
  const updateUserWord = useProgressStore((s) => s.updateUserWord)
  const cacheWord = useWordStore((s) => s.cacheWord)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async (raw: string) => {
      if (isSubmitting) return null
      setError(null)

      if (!user || user.isGuest) {
        setError('Sign in to save words to your collection.')
        return null
      }

      setIsSubmitting(true)
      try {
        const result = await addManualWord({
          word: raw,
          userId: user.id,
          userLevel: user.level,
        })
        cacheWord(result.word)
        updateUserWord(result.userWord)
        return result
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Something went wrong. Try again.'
        setError(message)
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, user, cacheWord, updateUserWord],
  )

  const reset = useCallback(() => setError(null), [])

  return { isSubmitting, error, submit, reset }
}
