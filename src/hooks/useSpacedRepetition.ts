import { useCallback } from "react";
import { useProgressStore } from "@store/progressStore";
import { upsertUserWord } from "@services/vocabularyService";
import { getWordStatusAfterAnswer } from "@utils/spacedRepetition";
import { useCurrentUser } from "@store/userStore";
import type { Word, UserWord } from "@/types";

interface UseSpacedRepetitionReturn {
  recordAnswer: (word: Word, correct: boolean) => Promise<void>;
  getUserWord: (wordId: string) => UserWord | undefined;
}

export function useSpacedRepetition(): UseSpacedRepetitionReturn {
  const user = useCurrentUser();
  const { userWords, updateUserWord } = useProgressStore();

  const recordAnswer = useCallback(
    async (word: Word, correct: boolean) => {
      if (!user) return;

      const existing = userWords[word.id];
      const base: UserWord = existing ?? {
        id: "",
        userId: user.id,
        wordId: word.id,
        status: "new",
        nextReviewDate: new Date().toISOString(),
        intervalIndex: 0,
        totalAttempts: 0,
        correctAttempts: 0,
      };

      const updates = getWordStatusAfterAnswer(base, correct);
      const updated: UserWord = { ...base, ...updates };

      updateUserWord(updated);

      if (!user.isGuest) {
        await upsertUserWord(updated);
      }
    },
    [user, userWords, updateUserWord],
  );

  const getUserWord = useCallback(
    (wordId: string) => userWords[wordId],
    [userWords],
  );

  return { recordAnswer, getUserWord };
}
