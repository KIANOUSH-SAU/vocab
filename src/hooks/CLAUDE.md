# Rules — src/hooks/

Hooks are the bridge between components and the rest of the app.
They contain all component-level business logic.

## Hook Files
| File | Purpose |
|---|---|
| `useDailyWord.ts` | Fetch and manage today's 5 words |
| `useSpacedRepetition.ts` | Compute due words, update intervals |
| `useAudio.ts` | ElevenLabs playback state machine |
| `usePlacementTest.ts` | Test state, scoring, level classification |
| `useExerciseSession.ts` | Session queue, progress, completion |
| `useWordDetail.ts` | Single word data + audio for detail screen |

## Rules for All Hooks
- Prefix with `use` — always
- Return a typed object `{ data, actions, state }` — not an array (except simple pairs)
- Handle loading, error, and empty states explicitly
- Clean up side effects in `useEffect` return functions
- Never import from other hooks — compose at the component level

## useAudio Pattern (state machine)
```typescript
type AudioState = 'idle' | 'loading' | 'playing' | 'error'

return {
  state: AudioState
  play: (text: string) => void
  stop: () => void
  replay: () => void
}
```

## useExerciseSession Pattern
```typescript
return {
  currentCard: ExerciseCard | null
  progress: { completed: number; total: number }
  onCorrect: () => void
  onWrong: (word: Word, context: string) => void
  onSkip: () => void
  isComplete: boolean
  sessionStats: SessionStats
}
```
