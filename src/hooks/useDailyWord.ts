import { useEffect, useState } from "react";
import { useCurrentUser } from "@store/userStore";
import { useWordStore } from "@store/wordStore";
import { useProgressStore } from "@store/progressStore";
import { fetchWordsByLevelAndField } from "@services/vocabularyService";
import { selectDailyWords } from "@utils/wordSelector";
import { isToday } from "@utils/dateUtils";
import type { Word } from "@/types";
import { GUEST_WORDS_LIMIT } from "@constants/spacedRepetition";

interface UseDailyWordReturn {
  words: Word[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDailyWord(): UseDailyWordReturn {
  const user = useCurrentUser();
  console.log(user);
  const { todaysWords, lastFetchedDate, setTodaysWords } = useWordStore();
  const { userWords } = useProgressStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    if (lastFetchedDate && isToday(lastFetchedDate) && todaysWords.length > 0) {
      console.log("Word cominng from cache");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("----------------------------------");
      const allWords = await fetchWordsByLevelAndField(user.level, user.fields);
      const limit = user.isGuest ? GUEST_WORDS_LIMIT : undefined;
      const selected = selectDailyWords(
        allWords,
        userWords,
        user.level,
        user.fields,
        limit,
      );

      console.log(
        `[useDailyWord] selectDailyWords returned ${selected.length} words to process`,
      );

      // Promote purely 'new' selections to 'learning'
      const { updateUserWord } = useProgressStore.getState();
      const { upsertUserWord } = require("@services/vocabularyService");

      for (const w of selected) {
        console.log("Loop is working for populating userwords");
        const uw = userWords[w.id];
        if (!uw || uw.status === "new") {
          const payload = {
            userId: user.id || "guest",
            wordId: w.id,
            status: "learning" as const,
            nextReviewDate: uw?.nextReviewDate || new Date().toISOString(),
            intervalIndex: (uw?.intervalIndex ?? 0) as any,
            totalAttempts: uw?.totalAttempts || 0,
            correctAttempts: uw?.correctAttempts || "0",
          };

          if (user.id !== "guest") {
            upsertUserWord({ ...payload, id: uw?.id || "" })
              .then((savedWord: any) => updateUserWord(savedWord))
              .catch((err: any) =>
                console.warn("Failed to create/upgrade word to learning:", err),
              );
          } else {
            updateUserWord({
              ...payload,
              id: uw?.id || Math.random().toString().slice(2),
            });
          }
        }
      }

      setTodaysWords(selected);
    } catch (e) {
      setError("Failed to load today's words. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  return {
    words: todaysWords,
    isLoading,
    error,
    refresh: load,
  };
}
