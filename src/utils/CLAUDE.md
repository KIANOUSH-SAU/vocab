# Rules — src/utils/

Pure utility functions. No side effects. No React. No async.

## Utility Files
| File | Purpose |
|---|---|
| `spacedRepetition.ts` | Interval calculation, next review date |
| `levelClassifier.ts` | Score → Level classification from placement test |
| `wordSelector.ts` | Filter + sort words for a user's daily set |
| `textUtils.ts` | Levenshtein distance, fuzzy match, string helpers |
| `dateUtils.ts` | Date arithmetic for spaced repetition |

## Rules
- **Pure functions only** — same input always produces same output
- **No imports from services, stores, or hooks**
- **No async** — all functions are synchronous
- **Fully typed** — explicit parameter and return types on every function
- **Tested** — every util function should have unit tests (if test suite exists)

## Spaced Repetition Utils
```typescript
const INTERVALS = [1, 3, 7, 14, 30] // days

getNextInterval(intervalIndex: IntervalIndex, correct: boolean): IntervalIndex
getNextReviewDate(intervalIndex: IntervalIndex): Date
isWordDueToday(userWord: UserWord): boolean
```

## Level Classifier
```typescript
// Score = number of correct answers out of 10
classifyLevel(score: number): Level
// 0-3 → A1, 4-5 → A2, 6-7 → B1, 8 → B2, 9-10 → C1
```

## Text Utils
```typescript
levenshteinDistance(a: string, b: string): number
isFuzzyMatch(input: string, target: string, maxDistance?: number): boolean
normalizeAnswer(input: string): string  // lowercase + trim
```
