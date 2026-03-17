# Rules — src/services/

Services are the only layer that communicates with the outside world.

## Service Files
| File | Responsibility |
|---|---|
| `appwriteService.ts` | Appwrite client init, auth, generic CRUD |
| `vocabularyService.ts` | Word queries, daily word selection |
| `aiService.ts` | Claude API — word scoring, explanation generation |
| `ttsService.ts` | ElevenLabs — speech generation, voice list |
| `notificationService.ts` | expo-notifications — schedule, permissions |

## Rules for All Services
- **Pure TypeScript** — no React imports, no hooks
- **Named exports only** — no default exports
- **All functions async** — return typed Promises
- **All functions throw on failure** — never return `null` silently
- **Error format**: `throw new Error('[ServiceName.functionName] message: ${error}')`
- **No Zustand imports** — services receive data as parameters, never read stores

## Environment Variables
All API keys come from environment variables only:
```typescript
process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT
process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID
process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY
process.env.EXPO_PUBLIC_CLAUDE_API_KEY
```
Never hardcode API keys. Never log API keys.

## Rate Limiting Awareness
- Claude API: batch word scoring requests (50 words per call max)
- ElevenLabs: cache generated audio — never generate the same text+voice twice
- Appwrite: use pagination (limit 25) for all list queries

## Caching Strategy
- Word data: cache in Appwrite, never re-fetch on every render
- Generated audio: cache URI in `wordStore` after first generation
- Voice list: cache in `userStore` on app init, refetch weekly
