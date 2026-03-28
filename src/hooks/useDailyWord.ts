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
  const { todaysWords, lastFetchedDate, setTodaysWords } = useWordStore();
  const { userWords } = useProgressStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    if (lastFetchedDate && isToday(lastFetchedDate) && todaysWords.length > 0)
      return;

    setIsLoading(true);
    setError(null);

    try {
      const allWords = await fetchWordsByLevelAndField(user.level, user.fields);
      const limit = user.isGuest ? GUEST_WORDS_LIMIT : undefined;
      const selected = selectDailyWords(
        allWords,
        userWords,
        user.level,
        user.fields,
        limit,
      );
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
