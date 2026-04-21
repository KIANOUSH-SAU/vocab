import { useState, useCallback, useEffect, useRef } from "react";
import { PLACEMENT_QUESTIONS } from "@constants/placementTest";
import {
  scoreAnswers,
  evaluateVocabPhase1,
  evaluateVocabPhase2,
  evaluateReadingPhase,
} from "@utils/levelClassifier";
import type { Level } from "@/types";

interface Answer {
  questionId: string;
  selectedIndex: number;
}

interface UsePlacementTestReturn {
  currentQuestion: (typeof PLACEMENT_QUESTIONS)[number] | null;
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  answers: Answer[];
  isComplete: boolean;
  classifiedLevel: Level | null;
  answer: (selectedIndex: number) => void;
  reset: () => void;
}

const TOTAL_QUESTIONS = 10;

function getVocabQuestions(
  level: Level,
  count: number,
  excludeIds: Set<string>,
) {
  const pool = PLACEMENT_QUESTIONS.filter(
    (q) =>
      q.skill === "vocabulary" && q.level === level && !excludeIds.has(q.id),
  );

  const recognition = pool.find((q) => q.type === "recognition");
  const definition = pool.find((q) => q.type === "definition");
  const usage = pool.find((q) => q.type === "usage");

  const selected = [];
  if (recognition) selected.push(recognition);
  if (definition) selected.push(definition);
  if (usage) selected.push(usage);

  const usedIds = new Set(selected.map((q) => q.id));
  for (const q of pool) {
    if (selected.length >= count) break;
    if (!usedIds.has(q.id)) {
      selected.push(q);
      usedIds.add(q.id);
    }
  }
  return selected;
}

function getReadingQuestions(
  level: Level,
  count: number,
  excludeIds: Set<string>,
) {
  return PLACEMENT_QUESTIONS.filter(
    (q) => q.skill === "reading" && q.level === level && !excludeIds.has(q.id),
  ).slice(0, count);
}

export function usePlacementTest(): UsePlacementTestReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<(typeof PLACEMENT_QUESTIONS)[number][]>(
    [],
  );
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [classifiedLevel, setClassifiedLevel] = useState<Level | null>(null);

  const provisionalVocabRef = useRef<Level>("B1");
  const finalVocabRef = useRef<Level>("B1");

  useEffect(() => {
    // Initial Load - Phase 1
    const phase1Q = getVocabQuestions("B1", 3, new Set());
    setQueue(phase1Q);
  }, []);

  const isComplete = currentIndex >= TOTAL_QUESTIONS;
  const currentQuestion =
    isComplete || !queue[currentIndex] ? null : queue[currentIndex];

  const answer = useCallback(
    (selectedIndex: number) => {
      const question = queue[currentIndex];
      if (!question) return;

      const newAnswers = [
        ...answers,
        { questionId: question.id, selectedIndex },
      ];
      setAnswers(newAnswers);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex === 3) {
        // Evaluate Phase 1
        const score = scoreAnswers(newAnswers.slice(0, 3));
        const newLevel = evaluateVocabPhase1(score);
        provisionalVocabRef.current = newLevel;

        // Start Phase 2
        const excludeMap = new Set(newAnswers.map((a) => a.questionId));
        setQueue((prev) => [
          ...prev,
          ...getVocabQuestions(newLevel, 3, excludeMap),
        ]);
      } else if (nextIndex === 6) {
        // Evaluate Phase 2
        const score = scoreAnswers(newAnswers.slice(3, 6));
        const newLevel = evaluateVocabPhase2(
          provisionalVocabRef.current,
          score,
        );
        finalVocabRef.current = newLevel;

        // Start Reading Phase
        const excludeMap = new Set(newAnswers.map((a) => a.questionId));
        setQueue((prev) => [
          ...prev,
          ...getReadingQuestions(newLevel, 4, excludeMap),
        ]);
      } else if (nextIndex === 10) {
        // Finish
        const score = scoreAnswers(newAnswers.slice(6, 10));
        const finalReading = evaluateReadingPhase(finalVocabRef.current, score);
        setClassifiedLevel(finalReading);
      }
    },
    [currentIndex, queue, answers],
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setClassifiedLevel(null);
    setQueue(getVocabQuestions("B1", 3, new Set()));
  }, []);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: TOTAL_QUESTIONS,
    progress: Math.min(currentIndex / TOTAL_QUESTIONS, 1),
    answers,
    isComplete,
    classifiedLevel,
    answer,
    reset,
  };
}
