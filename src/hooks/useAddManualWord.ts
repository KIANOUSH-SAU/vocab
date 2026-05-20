import { useCallback, useState } from 'react'
import { addManualWord } from '@services/manualWordService'
import { useCurrentUser } from '@store/userStore'
import { useProgressStore } from '@store/progressStore'
import { useWordStore } from '@store/wordStore'
import type { Word, UserWord } from '@/types'

export interface AddManualWordSubmitResult {
  word: Word
  userWord: UserWord
  alreadyExisted: boolean
}

interface UseAddManualWordReturn {
  isSubmitting: boolean
  error: string | null
  submit: (word: string) => Promise<AddManualWordSubmitResult | null>
  reset: () => void
}

/**
 * Orchestrates adding a manually-typed word to the user's collection.
 * Looks the word up via Free Dictionary, falls back to Claude for any
 * missing fields, persists Word + UserWord docs in Appwrite, and updates
 * the local Zustand stores so the new entry shows up immediately.
 *
 * After a successful write, force-refreshes from Appwrite so the local
 * mirror is reconciled against the canonical server state — without this
 * the optimistic local write could be silently overwritten by a refresh
 * that was already in flight when Add was tapped.
 */
export function useAddManualWord(): UseAddManualWordReturn {
  const user = useCurrentUser()
  const updateUserWord = useProgressStore((s) => s.updateUserWord)
  const refreshFromAppwrite = useProgressStore((s) => s.refreshFromAppwrite)
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
        // Force a reconcile against the server now that the write is
        // committed. The merge in refreshFromAppwrite preserves our optimistic
        // write, and any other stale state (e.g. an older snapshot stuck from
        // a race that started before the Add) gets corrected at the same time.
        refreshFromAppwrite(user.id, { force: true }).catch((err) => {
          console.warn('[useAddManualWord] post-add refresh failed:', err)
        })
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
    [isSubmitting, user, cacheWord, updateUserWord, refreshFromAppwrite],
  )

  const reset = useCallback(() => setError(null), [])

  return { isSubmitting, error, submit, reset }
}
