import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Word } from '@/types'

interface WordState {
  todaysWords: Word[]
  wordCache: Record<string, Word>
  audioCache: Record<string, string>
  lastFetchedDate: string | null
}

interface WordActions {
  setTodaysWords: (words: Word[]) => void
  cacheWord: (word: Word) => void
  cacheAudio: (key: string, uri: string) => void
  clearDailyCache: () => void
  reset: () => void
}

const initialState: WordState = {
  todaysWords: [],
  wordCache: {},
  audioCache: {},
  lastFetchedDate: null,
}

export const useWordStore = create<WordState & WordActions>()(
  persist(
    (set) => ({
      ...initialState,

      setTodaysWords: (words) =>
        set({
          todaysWords: words,
          lastFetchedDate: new Date().toISOString().split('T')[0],
        }),

      cacheWord: (word) =>
        set((state) => ({ wordCache: { ...state.wordCache, [word.id]: word } })),

      cacheAudio: (key, uri) =>
        set((state) => ({ audioCache: { ...state.audioCache, [key]: uri } })),

      clearDailyCache: () => set({ todaysWords: [], lastFetchedDate: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'word-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wordCache: state.wordCache,
        audioCache: state.audioCache,
      }),
    }
  )
)

// Selectors
export const useTodaysWords = () => useWordStore((s) => s.todaysWords)
export const useWordById = (id: string) => useWordStore((s) => s.wordCache[id])
export const useAudioUri = (key: string) => useWordStore((s) => s.audioCache[key])
