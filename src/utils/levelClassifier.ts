import type { Level } from "@/types";
import { PLACEMENT_QUESTIONS } from "@constants/placementTest";

export type { Level };

interface Answer {
  questionId: string;
  selectedIndex: number;
}

export function scoreAnswers(answers: Answer[]): number {
  let score = 0;
  for (const answer of answers) {
    const question = PLACEMENT_QUESTIONS.find(
      (q) => q.id === answer.questionId,
    );
    if (!question) continue;

    if (answer.selectedIndex === question.correctIndex) score += 1;
  }
  return score;
}

const LEVELS_ORDER: Level[] = ["A1", "A2", "B1", "B2", "C1"];

export function adjustLevel(currentLevel: Level, shift: -1 | 0 | 1): Level {
  const index = LEVELS_ORDER.indexOf(currentLevel);
  const newIndex = Math.max(
    0,
    Math.min(LEVELS_ORDER.length - 1, index + shift),
  );
  return LEVELS_ORDER[newIndex];
}

export function evaluateVocabPhase1(score: number): Level {
  if (score >= 3) return "B2";
  if (score === 2) return "B1";
  return "A2";
}

export function evaluateVocabPhase2(
  provisionalLevel: Level,
  score: number,
): Level {
  if (score >= 3) return adjustLevel(provisionalLevel, 1);
  if (score === 2) return provisionalLevel;
  return adjustLevel(provisionalLevel, -1);
}

