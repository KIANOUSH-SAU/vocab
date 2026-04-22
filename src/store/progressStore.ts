import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserWord, SessionStats } from "@/types";
import { todayString } from "@utils/dateUtils";

interface ProgressState {
  userWords: Record<string, UserWord>;
  streak: number;
  lastActiveDate: string | null;
  sessionStats: SessionStats | null;
}

interface ProgressActions {
  updateUserWord: (userWord: UserWord) => void;
  checkAndUpdateStreak: () => void;
  setSessionStats: (stats: SessionStats) => void;
  reset: () => void;
}

const initialState: ProgressState = {
  userWords: {},
  streak: 0,
  lastActiveDate: null,
  sessionStats: null,
};

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateUserWord: (userWord) =>
        set((state) => ({
          userWords: { ...state.userWords, [userWord.wordId]: userWord },
        })),

      checkAndUpdateStreak: () => {
        const { lastActiveDate, streak } = get();
        const today = todayString();
        if (lastActiveDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const newStreak = lastActiveDate === yesterdayStr ? streak + 1 : 1;
        set({ streak: newStreak, lastActiveDate: today });
      },

      setSessionStats: (sessionStats) => set({ sessionStats }),

      reset: () => set(initialState),
    }),
    {
      name: "progress-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Selectors
export const useUserWords = () => useProgressStore((s) => s.userWords);
export const useStreak = () => useProgressStore((s) => s.streak);
export const useUserWordById = (wordId: string) =>
  useProgressStore((s) => s.userWords[wordId]);
