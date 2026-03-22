import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User, VoiceStyle } from '@/types'
import type { Level, Field } from '@/types'

interface PendingOnboardingData {
  level: Level
  fields: Field[]
}

interface UserState {
  user: User | null
  voiceStyles: VoiceStyle[]
  isAuthenticated: boolean
  isLoading: boolean
  // Non-persisted: session check gate
  isSessionChecked: boolean
  // Non-persisted: temp storage between level-result and auth screens
  pendingOnboardingData: PendingOnboardingData | null
  // Persisted: survives logout for returning user detection
  lastLoggedInEmail: string | null
}

interface UserActions {
  setUser: (user: User) => void
  updateVoiceStyle: (voiceStyleId: string) => void
  setVoiceStyles: (styles: VoiceStyle[]) => void
  setLoading: (loading: boolean) => void
  setSessionChecked: (checked: boolean) => void
  setPendingOnboardingData: (data: PendingOnboardingData) => void
  clearPendingOnboardingData: () => void
  logout: () => void
  reset: () => void
}

const initialState: UserState = {
  user: null,
  voiceStyles: [],
  isAuthenticated: false,
  isLoading: false,
  isSessionChecked: false,
  pendingOnboardingData: null,
  lastLoggedInEmail: null,
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !user.isGuest,
          lastLoggedInEmail: user.email ?? null,
        }),

      updateVoiceStyle: (voiceStyleId) =>
        set((state) => ({
          user: state.user ? { ...state.user, voiceStyleId } : null,
        })),

      setVoiceStyles: (voiceStyles) => set({ voiceStyles }),

      setLoading: (isLoading) => set({ isLoading }),

      setSessionChecked: (isSessionChecked) => set({ isSessionChecked }),

      setPendingOnboardingData: (pendingOnboardingData) => set({ pendingOnboardingData }),

      clearPendingOnboardingData: () => set({ pendingOnboardingData: null }),

      logout: () =>
        set((state) => ({
          user: null,
          isAuthenticated: false,
          // Preserve lastLoggedInEmail for returning user detection
          lastLoggedInEmail: state.lastLoggedInEmail,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        voiceStyles: state.voiceStyles,
        lastLoggedInEmail: state.lastLoggedInEmail,
      }),
    }
  )
)

// Selectors
export const useCurrentUser = () => useUserStore((s) => s.user)
export const useIsGuest = () => useUserStore((s) => s.user?.isGuest ?? false)
export const useIsAuthenticated = () => useUserStore((s) => s.isAuthenticated)
