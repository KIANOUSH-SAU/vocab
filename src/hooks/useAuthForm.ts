import { useState, useCallback } from 'react'
import { router } from 'expo-router'
import { useUserStore } from '@store/userStore'
import { useProgressStore } from '@store/progressStore'
import {
  signUp,
  login,
  getCurrentSession,
  oauthLogin,
  createUserDocument,
  migrateProgressToServer,
  isAppwriteConfigured,
} from '@services/appwriteService'

function mapAppwriteError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.'
  const e = error as { code?: number; type?: string; message?: string }
  switch (e.code) {
    case 401:
      return 'Incorrect email or password.'
    case 409:
      return 'An account with this email already exists.'
    case 429:
      return 'Too many attempts. Please wait a moment.'
    default:
      break
  }
  if (e.type === 'general_argument_invalid' || e.message?.includes('password')) {
    return 'Password must be at least 8 characters.'
  }
  if (e.message?.includes('network') || e.message?.includes('fetch')) {
    return 'Connection failed. Check your internet and try again.'
  }
  return e.message || 'Something went wrong. Please try again.'
}

export function useAuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { setUser, pendingOnboardingData, clearPendingOnboardingData } = useUserStore()

  const clearError = useCallback(() => setError(null), [])

  const migrateGuestData = async (userId: string) => {
    const { userWords } = useProgressStore.getState()
    const { user } = useUserStore.getState()

    if (!user?.isGuest || Object.keys(userWords).length === 0) return

    try {
      await migrateProgressToServer(userId, userWords as Record<string, Record<string, unknown>>)
    } catch (e) {
      console.warn('[Auth] Guest migration partial failure:', e)
    }
  }

  const completeAuth = async () => {
    const appwriteUser = await getCurrentSession()
    if (!appwriteUser) throw new Error('Failed to get user after authentication.')

    const wasGuest = useUserStore.getState().user?.isGuest ?? false
    if (wasGuest) {
      await migrateGuestData(appwriteUser.$id)
    }

    const onboardingData = pendingOnboardingData
    const level = onboardingData?.level ?? useUserStore.getState().user?.level ?? 'A1'
    const fields = onboardingData?.fields ?? useUserStore.getState().user?.fields ?? []

    setUser({
      id: appwriteUser.$id,
      name: appwriteUser.name || name,
      email: appwriteUser.email,
      level,
      fields,
      voiceStyleId: useUserStore.getState().user?.voiceStyleId ?? '',
      isGuest: false,
    })

    clearPendingOnboardingData()
    router.replace('/(tabs)/home')
  }

  const handleSignup = useCallback(async () => {
    setError(null)

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!isAppwriteConfigured) {
      setError('Backend is not configured. Please try guest mode.')
      return
    }

    setIsLoading(true)
    try {
      await signUp(email.trim(), password, name.trim())
      // Create user document in DB
      const session = await getCurrentSession()
      if (session) {
        const onboardingData = useUserStore.getState().pendingOnboardingData
        try {
          await createUserDocument(session.$id, {
            name: name.trim(),
            email: email.trim(),
            level: onboardingData?.level ?? 'A1',
            fields: onboardingData?.fields ?? [],
            voiceStyleId: '',
          })
        } catch {
          // Non-blocking — user doc creation can be retried later
        }
      }
      await completeAuth()
    } catch (e) {
      setError(mapAppwriteError(e))
    } finally {
      setIsLoading(false)
    }
  }, [email, password, name, confirmPassword])

  const handleLogin = useCallback(async (emailOverride?: string) => {
    setError(null)

    const loginEmail = (emailOverride ?? email).trim()

    if (!loginEmail) {
      setError('Please enter your email.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (!isAppwriteConfigured) {
      setError('Backend is not configured. Please try guest mode.')
      return
    }

    setIsLoading(true)
    try {
      await login(loginEmail, password)
      await completeAuth()
    } catch (e) {
      setError(mapAppwriteError(e))
    } finally {
      setIsLoading(false)
    }
  }, [email, password])

  const handleOAuth = useCallback(
    async (provider: 'google' | 'apple') => {
      if (!isAppwriteConfigured) {
        setError('Backend is not configured.')
        return
      }
      setError(null)
      try {
        await oauthLogin(provider)
        // OAuth returns after redirect — completeAuth runs on callback
        await completeAuth()
      } catch {
        // User cancelled or OAuth not configured — silent return
      }
    },
    []
  )

  return {
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    confirmPassword,
    setConfirmPassword,
    error,
    clearError,
    isLoading,
    handleLogin,
    handleSignup,
    handleOAuth,
  }
}
