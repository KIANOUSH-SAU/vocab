---
name: new-exercise
description: >
  Scaffold a new exercise component for the Vocab app. Use when the user says
  "create an exercise", "new exercise type", "build exercise for X", "scaffold
  exercise", or mentions any of the 5 exercise types (swipe, fill-in-blank,
  audio-question, multiple-choice, parts-of-speech). Do NOT trigger for regular
  components — use /new-component instead.
---

# New Exercise Skill

## Goal
Scaffold a convention-compliant exercise component that follows the standard
`ExerciseProps` interface, delegates scoring to parent callbacks, and uses
reanimated for all animations.

---

## Step-by-Step Process

### Step 1 — Clarify the Exercise
Confirm with the user:
- **Exercise type** (swipe, fill-in-blank, audio-question, multiple-choice, parts-of-speech, or custom)
- **Any special interaction** (e.g., drag-and-drop, timer)

If the user already provided `$ARGUMENTS`, parse the exercise type from it.

### Step 2 — Scaffold the File
Create the file under `src/components/exercises/`.

Base props interface (MANDATORY for all exercises):
```typescript
interface ExerciseProps {
  word: Word
  onCorrect: () => void
  onWrong: (word: Word, context: string) => void
  onSkip?: () => void
}
```

Ensure:
- File goes in `src/components/exercises/`
- Named export
- Imports `Word` type from `src/types/word`
- No scoring logic inside — calls `onCorrect` / `onWrong` and parent handles state
- Uses `react-native-reanimated` for all animations
- Follows dark theme design system
- `// TODO` comments for answer validation logic

### Step 3 — Wire Up (Optional)
If the user wants, connect the exercise to `learn.tsx` or `review.tsx` via the `useExerciseSession` hook.

### Step 4 — Follow-Up
After scaffolding, offer:
1. "Want me to wire this into the learn/review screen?"
2. "Should I add animation transitions between exercises?"
3. "Want me to add the wrong-answer AI explanation trigger?"

---

## Rules
- All exercises MUST accept the standard `ExerciseProps` interface
- No scoring logic inside — delegate to `onCorrect` / `onWrong` callbacks
- `onWrong` must pass the word and context string for AI explanation
- Use `react-native-reanimated` — never RN core `Animated`
- Named export only
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `src/components/exercises/CLAUDE.md` — exercise interface contract
- `src/types/word.ts` — Word type definition
- `src/hooks/useExerciseSession.ts` — session management hook

---

## Self-Improvement
After each exercise creation, note:
- Which exercise types the user builds most
- Animation patterns that work well
- Any custom interaction patterns
