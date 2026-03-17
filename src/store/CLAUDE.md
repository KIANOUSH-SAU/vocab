# Rules — src/store/ (Zustand)

## Store Files
| File | Owns |
|---|---|
| `userStore.ts` | auth state, profile, voice style, level, fields |
| `wordStore.ts` | today's words, word cache, audio URI cache |
| `progressStore.ts` | spaced rep queue, streaks, session stats, history |

## Zustand Store Structure
Every store must follow this pattern:

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface StoreState {
  // state fields
}

interface StoreActions {
  // action methods
}

export const useXxxStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      // state + actions
    }),
    {
      name: 'xxx-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

## Rules
- **Separate state from actions** in the interface definition
- **Persist all stores** with `AsyncStorage` — app must work offline
- **No async logic in stores** — stores call services and store the result
- **No business logic** — stores hold and update data, utils/ compute it
- **Selector hooks** — export named selector hooks for commonly used slices:
  ```typescript
  export const useCurrentUser = () => useUserStore(s => s.user)
  export const useTodaysWords = () => useWordStore(s => s.todaysWords)
  ```
- **Reset action** — every store must export a `reset()` action for logout/guest exit

## Guest Mode Handling
When `user.isGuest === true`:
- `wordStore` limits `todaysWords` to 3 items
- `progressStore` does not persist to AsyncStorage beyond session
- `userStore` does not sync with Appwrite
