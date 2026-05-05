import { useCallback } from 'react'
import {
  updateAccountEmail,
  updateAccountName,
  updateUserDocument,
  isAppwriteConfigured,
} from '@services/appwriteService'
import { useCurrentUser, useUserStore } from '@store/userStore'

interface UseEditProfileReturn {
  /** Returns null on success, an error message on failure. */
  editName: (name: string) => Promise<string | null>
  /** Returns null on success, an error message on failure. */
  editEmail: (email: string, password: string) => Promise<string | null>
}

/**
 * Persists editable profile fields. Updates BOTH the Appwrite auth account
 * and the user-document mirror so the rest of the app sees the new values
 * after a sync.
 */
export function useEditProfile(): UseEditProfileReturn {
  const user = useCurrentUser()
  const setUser = useUserStore((s) => s.setUser)

  const editName = useCallback(
    async (rawName: string): Promise<string | null> => {
      const name = rawName.trim()
      if (!user || user.isGuest) return 'Sign in to edit your profile.'
      if (!isAppwriteConfigured) return 'Appwrite is not configured.'
      if (!name) return 'Name cannot be empty.'
      if (name.length > 128) return 'Name is too long.'

      try {
        await updateAccountName(name)
        try {
          await updateUserDocument(user.id, { name })
        } catch {
          // Doc update is best-effort — auth name is the primary source.
        }
        setUser({ ...user, name })
        return null
      } catch (e: any) {
        return (
          e?.message ?? 'Could not update your name. Please try again.'
        )
      }
    },
    [user, setUser],
  )

  const editEmail = useCallback(
    async (rawEmail: string, password: string): Promise<string | null> => {
      const email = rawEmail.trim().toLowerCase()
      if (!user || user.isGuest) return 'Sign in to edit your profile.'
      if (!isAppwriteConfigured) return 'Appwrite is not configured.'
      if (!email) return 'Email cannot be empty.'
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email.'
      if (!password) return 'Enter your current password.'

      try {
        await updateAccountEmail(email, password)
        try {
          await updateUserDocument(user.id, { email })
        } catch {
          // Doc mirror lag is fine — auth account is authoritative.
        }
        setUser({ ...user, email })
        return null
      } catch (e: any) {
        const status = e?.code ?? e?.response?.code
        if (status === 401) return 'Wrong password. Try again.'
        return (
          e?.message ?? 'Could not update your email. Please try again.'
        )
      }
    },
    [user, setUser],
  )

  return { editName, editEmail }
}
