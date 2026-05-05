import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Word } from "@/types";
import { todayString } from "@utils/dateUtils";

interface WordState {
  todaysWords: Word[];
  wordCache: Record<string, Word>;
  audioCache: Record<string, string>;
  lastFetchedDate: string | null;
  isDailySessionCompleted: boolean;
}

interface WordActions {
  setTodaysWords: (words: Word[]) => void;
  cacheWord: (word: Word) => void;
  cacheAudio: (key: string, uri: string) => void;
  clearDailyCache: () => void;
  setDailySessionCompleted: (status: boolean) => void;
  reset: () => void;
}

const initialState: WordState = {
  todaysWords: [],
  wordCache: {},
  audioCache: {},
  lastFetchedDate: null,
  isDailySessionCompleted: false,
};

export const useWordStore = create<WordState & WordActions>()(
  persist(
    (set) => ({
      ...initialState,

      setTodaysWords: (words) =>
        set((state) => {
          const newCache = { ...state.wordCache };
          for (const w of words) {
            newCache[w.id] = w;
          }
          return {
            todaysWords: words,
            lastFetchedDate: todayString(),
            isDailySessionCompleted: false,
            wordCache: newCache,
          };
        }),

      cacheWord: (word) =>
        set((state) => ({
          wordCache: { ...state.wordCache, [word.id]: word },
        })),

      cacheAudio: (key, uri) =>
        set((state) => ({ audioCache: { ...state.audioCache, [key]: uri } })),

      clearDailyCache: () => set({ todaysWords: [], lastFetchedDate: null, isDailySessionCompleted: false }),

      setDailySessionCompleted: (status) => set({ isDailySessionCompleted: status }),

      reset: () => set(initialState),
    }),
    {
      name: "word-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wordCache: state.wordCache,
        audioCache: state.audioCache,
        // Persist daily session state too so an app restart on the same day
        // keeps the "All done" UI and the in-progress 5-word set intact.
        todaysWords: state.todaysWords,
        lastFetchedDate: state.lastFetchedDate,
        isDailySessionCompleted: state.isDailySessionCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        // One-time migration: backfill wordCache from todaysWords for
        // users who had words persisted before we started caching them.
        if (!state) return;
        const { todaysWords, wordCache } = state;
        if (todaysWords.length > 0 && Object.keys(wordCache).length === 0) {
          const patched: Record<string, Word> = {};
          for (const w of todaysWords) {
            patched[w.id] = w;
          }
          useWordStore.setState({ wordCache: patched });
        }
      },
    },
  ),
);

// Selectors
export const useTodaysWords = () => useWordStore((s) => s.todaysWords);
export const useWordById = (id: string) => useWordStore((s) => s.wordCache[id]);
export const useAudioUri = (key: string) =>
  useWordStore((s) => s.audioCache[key]);
