# Rules — src/components/exercises/

All exercise components share a strict interface contract. Never deviate from it.

## Required Props Interface
Every exercise component must accept exactly this base shape:

```typescript
interface ExerciseProps {
  word: Word
  onCorrect: () => void
  onWrong: (word: Word, exerciseContext: string) => void
  onSkip?: () => void
}
```

`exerciseContext` passed to `onWrong` must be a human-readable string describing what was asked.
Example: `"Definition match: user selected 'forceful' but correct answer was 'capable of producing a lot'"`

## The 5 Exercise Types
| File | Type | Mechanic |
|---|---|---|
| `SwipeExercise.tsx` | Tinder swipe | Pan gesture, T/F |
| `FillInBlank.tsx` | Text input | Type the missing word |
| `AudioQuestion.tsx` | Audio → type | Hear the word, type it |
| `MultipleChoice.tsx` | 4 options | Pick correct definition |
| `PartsOfSpeech.tsx` | 4 options | Identify noun/verb/adj/adv |

## Swipe Exercise Specifics
- RIGHT = True/Correct (green overlay, checkmark)
- LEFT = False/Wrong (red overlay, X)
- Threshold to dismiss: ±120px translateX
- Rotation: interpolate from [-15deg, 0, 15deg] mapped to [-150px, 0, 150px]
- Snap back animation if under threshold: `withSpring` to origin

## Answer Validation
- FillInBlank: case-insensitive, trimmed, allow 1-character typo (Levenshtein distance ≤ 1)
- AudioQuestion: same as FillInBlank
- MultipleChoice / PartsOfSpeech: exact match on option index
- SwipeExercise: exact boolean match

## Wrong Answer Flow
On wrong answer:
1. Show visual feedback immediately (red flash, shake animation)
2. Call `onWrong(word, exerciseContext)`
3. Parent triggers AI explanation overlay — the exercise component does NOT manage this

## No External State
Exercise components do not write to Zustand stores.
They only call callbacks. All state management is the parent's responsibility.
