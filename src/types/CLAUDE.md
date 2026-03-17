# Rules — src/types/

All shared TypeScript types and interfaces live here.

## Type Files
| File | Contains |
|---|---|
| `user.ts` | User, UserProfile, VoiceStyle |
| `word.ts` | Word, UserWord, Field, Level |
| `exercise.ts` | ExerciseCard, ExerciseType, ExerciseProps, SessionStats |
| `api.ts` | API response shapes from Appwrite, ElevenLabs, Claude |
| `navigation.ts` | Route params for typed navigation |

## Rules
- **Interfaces over types** for object shapes (prefer `interface` over `type` for extensibility)
- **Types for unions** — use `type` for union types: `type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'`
- **No `any`** — use `unknown` if the shape is truly unknown, then narrow it
- **Export everything** — all types are named exports
- **No runtime code** — this folder is types only, no logic, no imports from services/utils
- **Re-export from index** — maintain a `src/types/index.ts` that re-exports all types

## Core Types Reference
```typescript
type Field = 'engineering' | 'health' | 'law' | 'sports' | 'education'
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other'
type ExerciseType = 'swipe' | 'fillInBlank' | 'audioQuestion' | 'multipleChoice' | 'partsOfSpeech'
type WordStatus = 'new' | 'learning' | 'mastered'
type IntervalIndex = 0 | 1 | 2 | 3 | 4  // maps to [1, 3, 7, 14, 30] days
```
