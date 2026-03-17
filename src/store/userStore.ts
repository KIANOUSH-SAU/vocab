import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User, VoiceStyle } from '@/types'

interface UserState {
  user: User | null
  voiceStyles: VoiceStyle[]
  isAuthenticated: boolean
  isLoading: boolean
}

interface UserActions {
  setUser: (user: User) => void
  updateVoiceStyle: (voiceStyleId: string) => void
  setVoiceStyles: (styles: VoiceStyle[]) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  reset: () => void
}

const initialState: UserState = {
  user: null,
  voiceStyles: [],
  isAuthenticated: false,
  isLoading: false,
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: !user.isGuest }),

      updateVoiceStyle: (voiceStyleId) =>
        set((state) => ({
          user: state.user ? { ...state.user, voiceStyleId } : null,
        })),

      setVoiceStyles: (voiceStyles) => set({ voiceStyles }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({ user: null, isAuthenticated: false }),

      reset: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, voiceStyles: state.voiceStyles }),
    }
  )
)

// Selectors
export const useCurrentUser = () => useUserStore((s) => s.user)
export const useIsGuest = () => useUserStore((s) => s.user?.isGuest ?? false)
export const useIsAuthenticated = () => useUserStore((s) => s.isAuthenticated)
