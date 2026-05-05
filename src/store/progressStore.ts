import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserWord, SessionStats } from "@/types";
import { todayString, yesterdayString } from "@utils/dateUtils";
import {
  getUserDocument,
  updateUserDocument,
} from "@services/appwriteService";
import { fetchUserWords, fetchWordsByIds } from "@services/vocabularyService";
import { useWordStore } from "@store/wordStore";

// Cross-hook throttle for refreshFromAppwrite. Lives in the store so every
// caller (mount sync, foreground sync, tab focus sync) shares one limiter.
const MIN_SYNC_INTERVAL_MS = 30_000;

interface ProgressState {
  userWords: Record<string, UserWord>;
  streak: number;
  lastActiveDate: string | null;
  sessionDates: string[];
  sessionStats: SessionStats | null;
  // Telemetry + race protection
  isSyncing: boolean;
  lastSyncedAt: number | null;
}

interface ProgressActions {
  updateUserWord: (userWord: UserWord) => void;
  hydrateFromRemote: (streak: number, lastActiveDate: string | null) => void;
  // Pulls authoritative state (streak, lastActiveDate, userWords) from
  // Appwrite and overwrites the local mirror. AsyncStorage is treated as a
  // cold-start cache only — this action is the source of truth.
  // Self-throttled to once per MIN_SYNC_INTERVAL_MS unless { force: true }.
  refreshFromAppwrite: (
    userId: string,
    opts?: { force?: boolean },
  ) => Promise<void>;
  checkAndUpdateStreak: (userId?: string) => void;
  setSessionStats: (stats: SessionStats) => void;
  reset: () => void;
}

const initialState: ProgressState = {
  userWords: {},
  streak: 0,
  lastActiveDate: null,
  sessionDates: [],
  sessionStats: null,
  isSyncing: false,
  lastSyncedAt: null,
};

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateUserWord: (userWord) =>
        set((state) => ({
          userWords: { ...state.userWords, [userWord.wordId]: userWord },
        })),

      hydrateFromRemote: (streak, lastActiveDate) =>
        set({ streak, lastActiveDate }),

      refreshFromAppwrite: async (userId, opts) => {
        if (!userId || userId === "guest") return;
        const { isSyncing, lastSyncedAt } = get();
        if (isSyncing) return; // in-flight guard
        if (
          !opts?.force &&
          lastSyncedAt &&
          Date.now() - lastSyncedAt < MIN_SYNC_INTERVAL_MS
        ) {
          return; // throttled — let the previous result stand
        }

        set({ isSyncing: true });
        try {
          const [userDoc, userWordsArr] = await Promise.all([
            getUserDocument(userId),
            fetchUserWords(userId).catch((err) => {
              console.warn(
                "[progressStore.refreshFromAppwrite] fetchUserWords:",
                err,
              );
              return [] as UserWord[];
            }),
          ]);

          const remoteStreak =
            (userDoc as any)?.streak != null
              ? Number((userDoc as any).streak)
              : null;
          const remoteLastActive =
            (userDoc as any)?.lastActiveDate ?? null;
          const remoteSessionDates: string[] = Array.isArray(
            (userDoc as any)?.sessionDates,
          )
            ? ((userDoc as any).sessionDates as string[])
            : [];

          const userWordsMap: Record<string, UserWord> = {};
          for (const uw of userWordsArr) {
            if (uw?.wordId) userWordsMap[uw.wordId] = uw;
          }

          // Batch-fetch the Word details for every UserWord we just pulled,
          // so the Review page (and any other consumer) can look them up.
          const wordIds = Object.keys(userWordsMap);
          if (wordIds.length > 0) {
            try {
              const wordMap = await fetchWordsByIds(wordIds);
              // Merge into wordStore — existing entries are kept, new ones added.
              const { wordCache } = useWordStore.getState();
              useWordStore.setState({
                wordCache: { ...wordCache, ...wordMap },
              });
            } catch (err) {
              console.warn(
                "[progressStore.refreshFromAppwrite] fetchWordsByIds:",
                err,
              );
            }
          }

          set({
            // Only overwrite streak fields when we actually got a doc back.
            // Avoids wiping local optimistic state on transient fetch failure.
            ...(userDoc
              ? {
                  streak: remoteStreak ?? 0,
                  lastActiveDate: remoteLastActive,
                  sessionDates: remoteSessionDates,
                }
              : {}),
            userWords: userWordsMap,
            isSyncing: false,
            lastSyncedAt: Date.now(),
          });
        } catch (err) {
          console.warn("[progressStore.refreshFromAppwrite]", err);
          set({ isSyncing: false });
        }
      },

      checkAndUpdateStreak: async (userId?: string) => {
        const { lastActiveDate, streak, sessionDates } = get();
        const today = todayString();

        // If already active today, no streak increment needed.
        if (lastActiveDate === today) return;

        const newStreak =
          lastActiveDate === yesterdayString() ? streak + 1 : 1;
        const newSessionDates = sessionDates.includes(today)
          ? sessionDates
          : [...sessionDates, today];

        // Optimistic local update so the UI reflects new state instantly.
        set({
          streak: newStreak,
          lastActiveDate: today,
          sessionDates: newSessionDates,
        });

        // Persist to Appwrite — server is the source of truth, so on failure
        // we'll let the next refreshFromAppwrite reconcile.
        if (userId && userId !== "guest") {
          try {
            await updateUserDocument(userId, {
              streak: newStreak,
              lastActiveDate: today,
              sessionDates: newSessionDates,
            });
          } catch (err) {
            console.warn("Failed to sync streak to Appwrite:", err);
          }
        }
      },

      setSessionStats: (sessionStats) => set({ sessionStats }),

      reset: () => set(initialState),
    }),
    {
      name: "progress-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the fields we want as a cold-start fallback. Sync flags
      // are session-only — they should never come back as `true` on launch.
      partialize: (state) => ({
        userWords: state.userWords,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        sessionDates: state.sessionDates,
        sessionStats: state.sessionStats,
      }),
    },
  ),
);

// Selectors
export const useUserWords = () => useProgressStore((s) => s.userWords);
export const useStreak = () => useProgressStore((s) => s.streak);
export const useSessionDates = () =>
  useProgressStore((s) => s.sessionDates);
export const useIsSyncing = () => useProgressStore((s) => s.isSyncing);
export const useLastSyncedAt = () => useProgressStore((s) => s.lastSyncedAt);
export const useUserWordById = (wordId: string) =>
  useProgressStore((s) => s.userWords[wordId]);
