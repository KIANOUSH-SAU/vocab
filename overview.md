# Vocab — Project Overview

> **One document, A to Z.** Covers what the app is, why it exists, how every piece fits together, what is shipped vs. stubbed, and how the architecture got to where it is today. Written to supersede `CODEBASE.md` and to read as the standalone project record for the graduation committee. Source files are referenced inline; deeper specs (`pipeline-guide.md`, `swiper-ui.md`, `.claude/DESIGN-SYSTEM.md`, `report.md`) are linked where they go deeper than this overview.

Last reviewed against the repository on **2026-05-19**.

---

## 1. The Project in One Paragraph

**Vocab** is an adaptive English vocabulary learning mobile application for non-native professionals and university learners. Instead of the generic, alphabetised wordlists that dominate the category, it gives each user a daily five-word ration that is **(a) calibrated to their CEFR proficiency (A1–C1)** through a placement test, **(b) curated by an automated AI pipeline** that scores every candidate word for level-fit and real-world usability before it ever reaches the database, and **(c) reinforced through five complementary exercise types**, a spaced-repetition schedule, and **celebrity voice audio feedback** generated on demand by ElevenLabs. Wrong answers trigger a short, encouraging explanation written live by Claude and spoken in the user's chosen voice. The objective is to make a single daily five-minute session feel earned, personal, and worth coming back to — the antithesis of an infinite-drill flashcard app.

---

## 2. Problem & Value Proposition

| Problem in mainstream apps                                                                     | Vocab's response                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-size-fits-all wordlists (Anki, Quizlet, Duolingo's vocabulary) ignore the learner's level. | A 10-question placement test classifies the learner into a CEFR band, and a Claude-scored pipeline filters every word for level-fit (`below` / `perfect` / `above`) so the deck literally cannot show a word that is too easy or too hard.                                                                                 |
| Definitions written for adult native speakers are inaccessible at A1–A2.                       | The enrichment stage of the pipeline forces Claude to rewrite each definition, example sentence, and context paragraph _under explicit per-level rules_ (e.g. "A1: ≤ 8-word sentences, no idioms, no abstract nouns"). The same lemma — `above` — exists as both an A1 row and a C1 row, each with its own targeted prose. |
| Flashcard fatigue: 100-card sessions, no closure, no narrative.                                | The session is **capped at five words a day** (three new + two spaced-repetition reviews; guests get three new only) and ends with an explicit Nibble-style completion screen so the user always feels they finished something.                                                                                            |
| Wrong-answer feedback is silent or generic ("Incorrect").                                      | Each wrong answer fires a Claude-generated two-sentence explanation that is then voiced through the user's chosen celebrity voice (Messi, Ronaldo, Morgan Freeman). The mistake becomes the most memorable moment of the session.                                                                                          |
| Spaced-repetition algorithms are hidden behind opaque numbers.                                 | The schedule is the canonical SuperMemo-lite progression **1 → 3 → 7 → 14 → 30 days**, surfaced visually in the Mastery Vault as a five-segment progress meter so the learner can see their interval climb.                                                                                                                |

The product hypothesis: when the daily dose is small, the words are relevant, and the feedback is personal, **retention compounds more from emotional engagement than from raw repetition volume**.

---

## 3. Tech Stack at a Glance

| Layer          | Choice                                                                             | Why                                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime        | React Native + Expo SDK 52                                                         | Single codebase for iOS, Android, and web; Expo handles native modules without ejecting.                                                                                                        |
| Routing        | Expo Router v4 (file-based, typed routes)                                          | Folder layout maps 1:1 to navigation graph, which keeps onboarding/tabs/modal stacks legible.                                                                                                   |
| State          | Zustand + `persist` middleware + AsyncStorage                                      | Three separate stores (`userStore`, `wordStore`, `progressStore`) so persistence policies can differ per concern.                                                                               |
| Backend        | Appwrite Cloud (Frankfurt region)                                                  | Single SDK for auth, NoSQL collections, file storage, and OAuth — chosen over Firebase for self-hostability and over Supabase for native React Native client support (`react-native-appwrite`). |
| AI             | Anthropic Claude (`claude-sonnet-4-6` in pipeline, `claude-haiku-4-5` live)        | Sonnet for the high-quality, high-cost preprocessing; Haiku for cheap, low-latency wrong-answer explanations.                                                                                   |
| TTS            | ElevenLabs (`eleven_v3` for custom celebrity voices, `eleven_turbo_v2_5` fallback) | Best-in-class voice quality at acceptable mobile latency; voice IDs and model IDs are env-driven.                                                                                               |
| Dictionary     | Free Dictionary API (`dictionaryapi.dev`)                                          | Free, public, no key required; used only at pipeline time for objective phonetic + part-of-speech.                                                                                              |
| Animations     | `react-native-reanimated` v3 + `react-native-gesture-handler` v2                   | Animations run on the UI thread, which keeps swipe gestures at 60 fps even while a Claude call is in flight.                                                                                    |
| Graphics       | `react-native-svg`, `expo-blur`, `expo-linear-gradient`                            | Used for the morphing AccentBlob, frosted tab bar, gradient cards, and Nibble-style stamps.                                                                                                     |
| Audio playback | `expo-av` (primary) + `expo-speech` (fallback)                                     | If ElevenLabs is unreachable, the device's native TTS still pronounces the word.                                                                                                                |
| Typography     | DM Serif Display + Space Grotesk + JetBrains Mono (`@expo-google-fonts/*`)         | Three families, three roles: editorial serif for words, sans for UI, mono for data.                                                                                                             |
| Tooling        | TypeScript strict, `babel-plugin-module-resolver`, `tsx` for Node scripts          | Strict types across app and pipeline; the pipeline scripts run via `node --env-file=.env --import tsx`.                                                                                         |

---

## 4. Repository Layout

```
Vocab/
├── src/
│   ├── app/                     # Expo Router screens — the navigation graph
│   │   ├── _layout.tsx          # Root: font loading, splash, stack with per-screen transitions
│   │   ├── index.tsx            # Auth gate; redirects to onboarding or tabs based on session
│   │   ├── (onboarding)/        # Welcome → placement-test → level-result → auth
│   │   ├── (tabs)/              # Home · Learn · Review · Profile
│   │   ├── learning/session.tsx # The full exercise session (1052 lines, the engine room)
│   │   ├── word/[id].tsx        # Word detail / deep dive screen
│   │   ├── modules/             # Pronunciation + Letters (currently stubs)
│   │   └── celebExplains.tsx    # Standalone celeb-voice "Word of the Day" deep-dive
│   ├── components/              # ui/, profile/, word/ — all reusable views
│   ├── constants/               # theme, levels, placementTest, spacedRepetition, voiceOptions, mockWords
│   ├── hooks/                   # 10 hooks; one hook per logical responsibility
│   ├── services/                # External I/O only — Appwrite, Claude, ElevenLabs, dictionary, notifications
│   ├── store/                   # 3 Zustand stores with carefully scoped persistence
│   ├── types/                   # Shared TypeScript model
│   └── utils/                   # Pure functions — SRS math, word selector, date utilities, level classifier
├── scripts/                     # The vocabulary curation pipeline (Node-only, never bundled)
│   ├── runPipeline.ts           # Orchestrator: score → enrich → seed → fix
│   ├── scoreWords.ts            # Stage 1: Claude scoring
│   ├── enrichWords.ts           # Stage 2: dictionary + Claude rewrite
│   ├── seedAppwrite.ts          # Stage 3: upsert into Appwrite words collection
│   ├── wordFixer.ts             # Post-seed repair pass
│   ├── wordSifter.ts            # Quality gate + AI verification
│   ├── wordDoctor.ts            # Standalone health-check + repair
│   ├── wipeWords.ts             # Destructive cleanup
│   ├── buildPlacementTest.ts    # One-off placement-test bank builder
│   └── diagnose.js / diagnoseAa.js / repairAaState.js  # Ad-hoc operator scripts
├── data/                        # Pipeline inputs and intermediates (cefr-words-*.txt → scored-*.json → enriched-*.json)
├── .claude/                     # Claude Code configuration — agents, commands, skills, snapshots, DESIGN-SYSTEM.md
└── assets/images/               # Icons, celebrity voice photos, splash assets
```

Path aliases (configured in `babel.config.js` and mirrored in `tsconfig.json`):
`@/*` → `src/*`, plus `@components`, `@services`, `@store`, `@hooks`, `@utils`, `@constants`, `@types`.

---

## 5. End-to-End User Journeys

### 5.1 First-time user (authenticated path)

```
Welcome (vocab.) ──► Placement Test (10 questions)
        │                       │
        ▼                       ▼
  "Get Started"            Level Result (e.g. B1)
                                │
                                ▼
                       Signup (email/password or Google/Apple OAuth)
                                │
                                ▼
                    Appwrite session created
                    User document created
                                │
                                ▼
                          Tabs → Home
```

The placement test is **not** an alternating field/level decision tree anymore — that was an earlier design (see §13). Today it is a single mixed pool of vocabulary recognition / definition / usage / reading-comprehension questions distributed across A1 → C1, scored by counting correct answers and mapping the total into a CEFR band via `LEVELS[].scoreRange` in `src/constants/levels.ts`. The result screen previews three guarantees ("3 words daily", "swipe + audio + fill-in", "repeat until mastered") and then routes the user into authentication.

### 5.2 Guest user (offline-tolerant path)

```
Welcome ──► "Try 3 words for free" ──► Placement Test (guest=true)
                                              │
                                              ▼
                                       Level Result
                                              │
                                              ▼
                                    Tabs → Home (id: "guest", isGuest: true)
```

Guests never call Appwrite. Their `userWords` live entirely in AsyncStorage, capped at three words per day (`GUEST_WORDS_LIMIT`). On signup, `migrateProgressToServer()` bulk-creates their guest progress as Appwrite documents under the new account.

### 5.3 Returning user

The welcome screen reads `lastLoggedInEmail` (the only field intentionally preserved across logout) and replaces "Get Started" with **"Go to your account"**, which routes straight into the login form with the email pre-filled. A valid Appwrite session jumps the user directly into `(tabs)/home`.

### 5.4 Daily session (the core loop)

1. `useDailyWord` reads the user's level, fetches all level-matching words from Appwrite (or the bundled `MOCK_WORDS` fallback if Appwrite is unreachable), and asks `selectDailyWords` to compose today's five-word deck.
2. The composition rule: take up to **two** `learning`-status words whose `nextReviewDate` is today or past, then fill remaining slots with up to **three** unseen new words sorted by `usabilityScore` (descending). Guests get three new only.
3. Words promoted into the daily deck have their `UserWord` document upserted to `status: "learning"` immediately, so a partial session still records intent.
4. Tapping **Start today's session** opens `learning/session.tsx` — the full Nibble-style swipe stack (see §6).
5. Each answer goes through `useSpacedRepetition.recordAnswer`, which calls `getWordStatusAfterAnswer` (pure SRS math) and writes the updated `UserWord` both locally and to Appwrite.
6. On completion: `setDailySessionCompleted(true)` flips in `wordStore`, `checkAndUpdateStreak()` increments the streak if yesterday was active (otherwise resets to 1), and `sessionDates` records today's date for the calendar.
7. Home and Learn re-render to show the "All caught up" mint card; the next deck is generated by `useDailyWord` only after `todayString()` changes.

### 5.5 The Mastery Vault

The Review tab joins `progressStore.userWords` with `wordStore.wordCache` to render a searchable, filterable library (All / Learning / Struggling / Mastered). Each row shows a five-bar mastery meter colored by `intervalIndex`. A floating action button opens the **Add Word Modal**, which orchestrates `manualWordService` to (a) look the word up in Free Dictionary, (b) fall back to Claude's `generateWordEntry` if any field is missing, (c) dedupe against the WORDS collection by lowercased text, and (d) write both a `Word` and a `UserWord` document in `learning` state.

---

## 6. The Five Exercise Types — Designed vs. Implemented

The `ExerciseType` union reserves five values: `swipe`, `multipleChoice`, `fillInBlank`, `audioQuestion`, `partsOfSpeech`. The current state of each:

| Exercise               | Status                                                     | Mechanic                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `swipe` (True / False) | **Shipped — May 2026**                                     | Cards present a definition that is either the true one or a Claude-generated distractor. The user swipes right (Got it) or left (Study), with stamps fading in based on drag magnitude. Tap flips to reveal. Built to the `swiper-ui.md` Nibble spec — see §6.1. |
| `multipleChoice`       | Built earlier, **removed from queue in May 2026 redesign** | Four-option "What does this mean?" with confetti, shake, and shimmer progress. Code paths still exist in `useExerciseSession` but the queue builder hands out only `swipe` cards today.                                                                          |
| `fillInBlank`          | Reserved in type, **not implemented**                      | Roadmap calls for keyboard input with Levenshtein-tolerant scoring (distance ≤ 1).                                                                                                                                                                               |
| `audioQuestion`        | Reserved in type, **not implemented**                      | Roadmap calls for ElevenLabs-played clip with hidden written text.                                                                                                                                                                                               |
| `partsOfSpeech`        | Reserved in type, **not implemented**                      | Roadmap calls for a fast noun/verb/adjective/adverb tap exercise for early levels.                                                                                                                                                                               |

### 6.1 The Swipe Engine — Nibble-style stack

`src/app/learning/session.tsx` implements the swipe screen against the full spec in `swiper-ui.md`. Highlights:

- **Three-card depth illusion**: cards behind the top are translated 8 px down per layer and scaled by `1 − depth × 0.04`. No drop shadows — depth comes from layered borders and translation alone.
- **Physical drag**: the top card follows the finger 1:1 horizontally, 0.3× vertically, with rotation proportional to dx. Past a 110 px threshold the card commits and exits at `translateX ±540 px, rotate ±22°` over 340 ms (`cubic-bezier(.2, .8, .2, 1)`).
- **Stamps**: `Got it` (top-right, +12°, `#0F6E56`) and `Study` (top-left, −12°, `#993C1D`) fade in proportional to drag magnitude, capping at full opacity around 120 px.
- **Tap to flip**: a movement below 5 px is interpreted as a tap and toggles the translation reveal.
- **Top bar**: close button, segmented progress (done/current/pending), streak chip with flame.
- **Completion overlay**: orb, "Session complete", three stat cards (Known / Review / Minutes), restart link. Restart uses `router.replace` rather than in-place state reset, to keep the navigation stack predictable.
- **Wrong-answer flow**: the explanation overlay (Claude Haiku + ElevenLabs voicing) sits above the stack and dismisses to the next card via `dismissExplanation`.

The screen introduces a **local purple palette** (`brand50`, `brand100`, `brand300`, `brand600`, `brand800`, canvas, ink, ink2, ink3) distinct from the global Iris theme. The decision (recorded in the 2026-05-15 snapshot) was to keep the spec coherent rather than thread one screen's palette into the global theme.

---

## 7. Spaced Repetition

The schedule is the canonical exponential progression — six interval slots indexed 0–4 with 0=1d, 1=3d, 2=7d, 3=14d, 4=30d. Index 4 is `MASTERY_INDEX`. The math lives in `src/utils/spacedRepetition.ts` and is pure:

```
getNextIntervalIndex(current, correct) = correct ? min(current+1, 4) : 0
status = intervalIndex === 4 ? "mastered" : "learning"
nextReviewDate = today + INTERVALS[intervalIndex] days
```

`isWordDueToday` compares `nextReviewDate` to end-of-day, so reviews unlock at midnight in the user's local timezone. The Mastery Vault paints each row's five-bar meter by interval index. The Final Exam concept (CLAUDE.md) — a single review wrapping up the SRS cycle before words drift into an "overview" archive — is on the architectural plan but not yet a wired exercise type.

**Streak rules** (`progressStore.checkAndUpdateStreak`): if today is already in `lastActiveDate`, no-op. If yesterday matches, increment. Otherwise reset to 1. `sessionDates` is a chronological string list used by the profile calendar.

---

## 8. The Word Curation Pipeline

This is the part of the project most worth examining as an engineering artifact. Detailed deep-dive lives in `report.md` and operator reference in `pipeline-guide.md`; the architectural arc is summarised here.

### 8.1 Why a pipeline at all

The vocabulary database is **not handcrafted**. Hand-curating five CEFR-quality decks (A1–C1) across five professional fields would have been thousands of editorial hours; relying on Claude to produce the dictionary at runtime would have been prohibitively expensive per session and slow. The pipeline is the project's bet that a one-time, deterministic, resumable AI preprocessing stage can produce learner-grade dictionary content cheaper and more consistently than either alternative.

### 8.2 Stages

```
data/cefr-words-{LEVEL}.txt
         │
         ▼  scoreWords.ts                 (Claude Sonnet — batches of 40)
data/scored-{LEVEL}.json
         │
         ▼  enrichWords.ts                (Free Dictionary + Claude Sonnet)
data/enriched-{LEVEL}.json
         │
         ▼  seedAppwrite.ts               (upsert by (word, level) composite)
Appwrite `words` collection
         │
         ▼  wordFixer.ts                  (post-seed repair pass)
Appwrite `words` collection (repaired)
```

The orchestrator `runPipeline.ts` chains 1 → 2 → 3 → fix per level, or every level with `--all`. `--resume` propagates everywhere, so a crash never reprocesses already-completed work or re-incurs API cost. Each stage writes through an atomic `temp-then-rename` pattern, so an abrupt termination leaves a parseable JSON file on disk.

### 8.3 Stage 1 — Scoring (Claude Sonnet)

For each batch of 40 words, Claude returns a `usabilityScore` (1–10) and a categorical `levelFit` (`below` / `perfect` / `above`). Words downstream of the threshold are dropped at the gate. This separates two distinct judgements — _how useful is the word_ and _does it belong at this level_ — that earlier monolithic prompts conflated.

### 8.4 Stage 2 — Enrichment (Dictionary + Claude Sonnet)

Two sources, two purposes:

- **Free Dictionary API** for objective, level-agnostic phonetic transcription and part-of-speech. Requests are sequential with a 120 ms pacing delay and a 10-second abort timeout. An earlier 5-way concurrent design hit the upstream anti-abuse layer at a 12% hit rate; sequential pacing restored near-complete coverage.
- **Claude** rewrites every learner-facing string (definition, example, context passage, 3 distractors) **under explicit per-level rules** stored in `LEVEL_RULES`. The dictionary definition is passed only as a _meaning hint_ — Claude is told never to copy it. That single design choice is what makes the A1 deck genuinely readable to A1 learners.

### 8.5 Stage 3 — Seeding

`seedAppwrite.ts` is strict: a row is only written if every required field (`word`, `phonetic`, `partOfSpeech`, `definition`, `exampleSentence`, `contextPassage`) is present and non-empty. Records upsert on the composite `(word, level)` key, which is what allows the same lemma to coexist as both an A1 and a C1 row with different prose. The `audioUrl` field is seeded as `""` as a placeholder for the planned ElevenLabs voice-cloning pass.

### 8.6 Post-seed repair: a three-tool family

| Tool            | Trigger                                                       | Repairs                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wordFixer.ts`  | Automatic step 4 of `runPipeline` (or `npm run pipeline:fix`) | Missing phonetic, definition, example, contextPassage. **Does not touch distractors or POS** — that is by design.                                                             |
| `wordSifter.ts` | Manual (`npx tsx scripts/wordSifter.ts`)                      | Audits and **deletes** bad documents (no phonetic, nonsensical multi-word entries, missing content) and AI-verifies POS on survivors. Marks `aiVerified: true`.               |
| `wordDoctor.ts` | Manual (`npm run pipeline:doctor`), **never auto-wired**      | Independent checkup. Detects + repairs missing distractors, POS, phonetic, definition, example, context. Supports `--only-distractors`, `--limit`, `--dry-run`, `--keep-log`. |

The split is intentional: the orchestrator should never silently delete data (`wordSifter`), and the doctor exists precisely so the operator can run a non-mutating audit (`--dry-run --keep-log`) before any write. `wipeWords.ts` is the explicit destructive option, requiring either `--level X` or `--all-levels` and a typed-`yes` confirmation unless `--yes` is passed.

### 8.7 Reliability scaffolding

Every external call sits behind a status-classifying retry shell: Claude calls retry up to 4× on 429 / 5xx / network with exponential 2s → 4s → 8s → 16s backoff; Appwrite and Free Dictionary use the same pattern. On-disk caches for both dictionary responses (`.dict-cache-{level}.json`) and Claude responses (`.context-cache-{level}.json`) make the entire pipeline fully resumable — a crash mid-700-word level only costs the unfinished words.

---

## 9. State Management

Three Zustand stores, all wrapped in `persist` middleware backed by AsyncStorage, with **carefully scoped persistence policies** so the right things survive a relaunch and the wrong things do not.

### 9.1 `userStore`

```
user, voiceStyles, isAuthenticated, isLoading
isSessionChecked            (NOT persisted — gate for splash dismissal)
pendingOnboardingData       (NOT persisted — temp between level-result and auth)
lastLoggedInEmail           (persisted — survives logout, drives the "returning user" CTA)
```

`logout()` deliberately preserves `lastLoggedInEmail` and tears down the word + progress stores. `reset()` wipes everything, including the email. The gate `isSessionChecked` prevents the rest of the app from rendering until the Appwrite session has been validated at launch.

### 9.2 `wordStore`

```
todaysWords, wordCache (persisted), audioCache (persisted, file URIs)
lastFetchedDate, isDailySessionCompleted (persisted)
```

`todaysWords` and `isDailySessionCompleted` are _intentionally_ persisted so an app restart mid-session resumes correctly. `onRehydrateStorage` runs a one-time backfill: if `todaysWords` is populated but `wordCache` is empty (legacy data from before caching), it copies them in.

### 9.3 `progressStore`

```
userWords (persisted, keyed by wordId)
streak, lastActiveDate, sessionDates (persisted)
sessionStats, isSyncing, lastSyncedAt (NOT persisted)
```

`refreshFromAppwrite` is the canonical sync: it fetches `userDoc` + `userWords` in parallel, batch-fetches the missing `Word` documents into the `wordStore.wordCache`, and writes back. It is **throttled to once per 30 seconds** unless called with `{ force: true }`, and protected by an in-flight `isSyncing` guard. The hook `useRemoteSync` triggers it on tab mount and on every foreground.

The 30-second throttle and in-flight guard are the project's response to an earlier bug (snapshot 2026-05-06) where `useExerciseSession` mounted with empty `words`, immediately reported `isComplete = true`, and wrote `lastActiveDate = today` to Appwrite without a single answer. Fixes added: `useMemo`-wired queue rebuild, an `isComplete` guard requiring a non-empty queue, and a `todaysWords.length > 0` guard before the completion effect fires. A repair script `scripts/repairAaState.js` was written to back-fill the inconsistent state for the affected test user.

---

## 10. AI Integration (Claude)

Two distinct usages, two different models, two different budgets:

| Call site                                                   | Model                       | Triggered by                                                                           | Purpose                                                                            |
| ----------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `scripts/scoreWords.ts`                                     | `claude-sonnet-4-6`         | Pipeline operator                                                                      | Score each word for level-fit + usability.                                         |
| `scripts/enrichWords.ts`                                    | `claude-sonnet-4-6`         | Pipeline operator                                                                      | Generate level-appropriate definition + example + context passage + 3 distractors. |
| `src/services/aiService.ts::generateWordEntry`              | `claude-haiku-4-5-20251001` | `manualWordService` when a user manually adds a word and Free Dictionary misses fields | Cheap fallback dictionary entry.                                                   |
| `src/services/aiService.ts::generateWrongAnswerExplanation` | `claude-haiku-4-5-20251001` | Live, during the swipe session on a wrong answer                                       | Two-sentence encouraging explanation that gets voiced.                             |

The split is intentional: Sonnet is reserved for high-quality, batched, retried, _preprocessing_ work where cost-per-call is amortised over thousands of users. Haiku handles everything that runs while the learner is waiting, where p95 latency matters more than ceiling quality.

The client uses `@anthropic-ai/sdk` directly with `dangerouslyAllowBrowser: true` (the API key is `EXPO_PUBLIC_CLAUDE_API_KEY`, which means the key is in the client bundle — acceptable for a graduation project but a tradeoff to flag for any production deployment).

---

## 11. Audio (ElevenLabs + Fallbacks)

`src/services/ttsService.ts` is a thin wrapper around the ElevenLabs HTTP API. The model resolution is layered:

1. If the voice is registered in `src/constants/voiceOptions.ts` (Messi / Ronaldo / Morgan Freeman), use that voice's declared `modelId` (currently `eleven_v3` for all three).
2. Else, if the voice matches the legacy single-env `EXPO_PUBLIC_ELEVENLABS_CUSTOM_VOICE_ID`, use `EXPO_PUBLIC_ELEVENLABS_CUSTOM_MODEL_ID`.
3. Else fall back to `eleven_turbo_v2_5`.

On mobile, audio bytes are written to `FileSystem.cacheDirectory` as `.mp3` and the URI is returned for playback through `expo-av`. On web, the bytes are returned as a `data:audio/mpeg;base64,...` URI to avoid touching the file system.

The `useAudio` hook layers two playback paths: it calls `generateSpeech` first; if that throws (network, 401, API quota), it falls back to `expo-speech` (the device's native TTS) so the word still gets spoken. It also sets `playsInSilentModeIOS: true` so an iPhone on silent does not block playback during a learning session.

Audio is cached by a caller-provided `cacheKey` and survives relaunch via `wordStore.audioCache`. Setup details and per-call model overrides are documented in `ElevenLabs-Custom-TTS-Setup.md`.

---

## 12. Backend (Appwrite)

### 12.1 Collections

| Collection  | Purpose                                                | Notable fields                                                                                                                                              |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `words`     | Global, immutable dictionary populated by the pipeline | `word`, `phonetic`, `partOfSpeech`, `definition`, `exampleSentence`, `contextPassage`, `distractors[]`, `level`, `usabilityScore`, `audioUrl` (placeholder) |
| `userwords` | Per-user SRS records                                   | `userId`, `wordId`, `status` (`new`/`learning`/`mastered`), `nextReviewDate`, `intervalIndex` (0–4), `totalAttempts`, `correctAttempts`                     |
| `users`     | User profile                                           | `name`, `email`, `level`, `voiceStyleId`, `streak`, `lastActiveDate`, `avatarFileId`, `sessionDates[]`                                                      |

Composite identity rules: the words collection upserts on `(word, level)`. `userwords` use Appwrite's `unique()` ID generation, keyed at lookup time by `userId`.

A long-standing legacy quirk: `correctAttempts` was provisioned as a **text** column rather than integer. The frontend defends with `Number(...)` conversions everywhere. The roadmap item is to migrate the column type and drop the defenses, but for now this asymmetry is explicit and documented.

### 12.2 Storage

A single bucket `avatars` (read=any, write=users) holds profile pictures uploaded through `expo-image-picker`. Bucket ID is env-driven (`EXPO_PUBLIC_APPWRITE_BUCKET_ID`) so dev/staging/prod can use different buckets without code changes. `uploadAvatarFile` computes the blob size when `expo-image-picker` omits it.

### 12.3 Auth flows

The full set of supported flows:

```
Email + password    →  signUp() → createEmailPasswordSession() → createUserDocument()
                       login()  → createEmailPasswordSession()
OAuth (Google/Apple) → createOAuth2Token(redirectUri) → WebBrowser.openAuthSessionAsync()
                       → extract userId+secret from redirect URL → createSession()
                       → if no userDoc, createUserDocument() with level="A1"
Guest               →  Local-only User{ id: "guest", isGuest: true }; migrated on signup
                       via migrateProgressToServer()
```

Deep link scheme: `vocab://auth/callback` for OAuth. `expo-auth-session` provides `makeRedirectUri`. `WebBrowser.maybeCompleteAuthSession()` is called at module top to handle iOS warm-start redirects.

Email change requires the user's current password (Appwrite security requirement); `EditFieldModal` supports password-gated edits. Name and email changes flow through `useEditProfile`, which writes to both the Appwrite Account _and_ the user-document mirror so the two stay in sync.

### 12.4 Environment variables

Client-bundle (`EXPO_PUBLIC_*`):
`APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_DATABASE_ID`, `APPWRITE_BUCKET_ID`, `CLAUDE_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_CUSTOM_VOICE_ID`, `ELEVENLABS_CUSTOM_MODEL_ID`.

Server-only (pipeline scripts, never bundled):
`APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY` (admin key), `APPWRITE_DATABASE_ID`, `APPWRITE_WORDS_COLLECTION_ID`, `ANTHROPIC_API_KEY`.

The `isAppwriteConfigured` flag at the top of `appwriteService.ts` gates _every_ Appwrite call. When false, the app runs in a "mock mode" against `src/constants/mockWords.ts` — useful for offline development and a graceful first-launch experience when env vars haven't been set.

---

## 13. Design System

Fully specified in `.claude/DESIGN-SYSTEM.md` and codified in `src/constants/theme.ts`. The essentials worth knowing in this overview:

- **Background**: warm cream `#FAFAF8`, deliberately _not_ pure white. The warmth is the personality.
- **Primary brand**: Iris Violet `#7C5CFC` for selected states, accents, and the wordmark dot — but **never** for CTAs. Primary buttons use a dark ink → zinc gradient (`#18181B` → `#27272A`) so the button reads as premium against the cream.
- **Per-tab accent**: Home iris, Learn mint, Review amber, Profile sky. The AccentBlob behind each section adopts that tab's color and morphs through four organic SVG keyframes on an 8–11 s ping-pong cycle.
- **Semantic colors**: mint `#2DD4A8` = success/mastered, coral `#FB7185` = error/struggling, amber `#FBBF24` = warning/learning, sky `#38BDF8` = info.
- **Three font families, three roles**: DM Serif Display (display text only — word cards, screen titles, the `V` wordmark), Space Grotesk (everything UI: buttons, labels, body), JetBrains Mono (data: phonetics, timers, level badges). This contrast is explicitly named as a non-negotiable design principle.
- **Spacing on a 4 pt grid**, radii from 6 (chips) through 24 (sheets) and 100 (pills).
- **Animations**: four `springConfigs` named `snappy`, `bouncy`, `gentle`, `quick`; named shadow presets including a purple `iris` glow. The rule is `withSpring` for interactive elements, `withTiming` only for determinate/progress animations.
- **Field accent colors** exist in the design system (engineering = blue, health = emerald, law = purple, sports = amber, education = red) but are no longer surfaced in the UI after the field-based onboarding was removed (see §14).

---

## 14. Architectural Evolution — Major Pivots

This section documents the arc of the project rather than the snapshot at any one moment. Each pivot was an explicit decision recorded in the snapshot log (`.claude/snapshots/`).

### 14.1 Field-based curation → Level-only curation (2026-04-23)

**Was**: every word was scored against both a CEFR level _and_ a professional field (engineering / health / law / sports / education), with a field-selection step in onboarding driving the daily-word filter.

**Is**: every word is scored only against its CEFR level. The pipeline produces a single level-targeted definition per (word, level) pair. The `Field` type still exists in `types/index.ts` for backward compatibility, and the field accent colors are still in the design system, but the field-selection screen has been removed and `selectDailyWords` no longer filters by field.

**Why**: the field-targeted definitions added a multiplicative factor (5 fields × 5 levels = 25 prose variants per word) without commensurate learner benefit — vocabulary is fundamentally about meaning, not workplace context. Collapsing the dimension freed the pipeline to spend its Claude budget on writing _better_ level-appropriate prose rather than _more_ contextual variants.

### 14.2 Stats tab → Profile tab (2026-04-28)

The fourth tab was renamed from Stats to Profile, with avatar upload (via `expo-image-picker` + an Appwrite Storage bucket), editable name + email fields, and a horizontal session calendar that paints green for active days and yellow for missed days. The mocked 7-bar bar chart was replaced by the calendar driven by real `sessionDates` data.

### 14.3 Quiz screen → Nibble swipe stack (2026-05-15)

The exercise session was a multiple-choice quiz with a quiz prompt card, four lettered options, confetti on correct, shake on wrong, and a shimmer progress bar. It was replaced wholesale with the Nibble-style swipe stack defined in `swiper-ui.md` — True/False mechanic, tap-to-flip reveal, drag stamps, segmented progress, completion overlay. The previous components are still in `session.tsx` history but the queue builder hands out only `swipe` cards. This was a redesign-from-spec decision: the user opted to replace the whole screen rather than patch.

### 14.4 Wordlist pipeline becomes a family of tools (2026-04-29 → 2026-05-12)

Started as a single `runPipeline` (score → enrich → seed). Grew over the spring as the database actually populated and quality issues became visible:

- **2026-04-23**: `wipeWords.ts` — explicit destructive option.
- **2026-04-29**: `wordFixer.ts` — auto-repair missing fields, wired as step 4 of `runPipeline`.
- (Earlier): `wordSifter.ts` — manual destructive audit + AI verification.
- **2026-05-12**: `wordDoctor.ts` — non-destructive standalone audit + repair, intentionally not wired into `runPipeline` to keep it as a manual checkup.

The end-state is a **disciplined separation of operator intent**: the orchestrator only does the safe thing; deletion requires the operator to invoke `wordSifter` or `wipeWords` knowingly.

### 14.5 Authentication added late (2026-03-22)

The app shipped first without accounts; auth was layered on later when the data model demanded it. The placement-test-before-signup ordering was a deliberate friction-reduction choice — by the time the user is asked to create an account, they have already invested ten questions, so the signup completion rate is materially higher than asking for credentials first.

### 14.6 Streak/state-sync bug arc (2026-05-06)

The bug that surfaced "All done for today" on the Learn tab when no session had ever happened was traced to `useExerciseSession` building its queue once at mount with an empty `words` array, which made `isComplete` instantly true and caused the completion effect to write `lastActiveDate = today` to Appwrite. The fix introduced two defensive layers: `useMemo`-wired queue rebuild, and a `todaysWords.length > 0` guard before any "session complete" side effect. `useDailyWord.load()` was also patched to self-heal an `isDailySessionCompleted=true` flag when `todaysWords=[]`. A one-off `scripts/repairAaState.js` was written and shipped to back-fill the broken state on the affected test account.

This bug is documented at length because it illustrates the project's general defensive pattern: **AsyncStorage is treated as a cold-start cache only; Appwrite is the source of truth**. The 30-second throttled `refreshFromAppwrite` in `progressStore` and the in-flight `isSyncing` guard are direct descendants of this incident.

---

## 15. Claude Code Orchestration (`.claude/`)

The project uses [Claude Code](https://claude.com/claude-code) as the primary development environment, and `.claude/` codifies the rules under which Claude is allowed to operate on the codebase.

### 15.1 Agents (6)

Each agent is a specialist persona that the main Claude delegates to:

| Agent              | Domain                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| `ui-designer`      | Screens, components, animations, design-system enforcement              |
| `exercise-builder` | The five exercise types, scoring logic, session flow                    |
| `word-curator`     | Vocabulary data model, AI scoring, placement test, level classification |
| `audio-engineer`   | ElevenLabs, voice styles, audio playback, wrong-answer voicing          |
| `appwrite-dba`     | Schema design, indexes, permissions, queries, auth flows                |
| `api-integrator`   | Claude API, ElevenLabs, dictionary sources, rate limits, env config     |

### 15.2 Commands (9)

Commands require an explicit `/command-name` trigger from the user:
`/debug`, `/clean-cache`, `/generate-dummy-data`, `/smoothness-check`, `/new-component`, `/new-exercise`, `/new-screen`, `/new-service`, `/scaffold-word-pipeline`.

### 15.3 Skills (4)

Skills auto-trigger based on conversation context:

- `skill-design-system.md` — activated whenever any UI code is touched.
- `skill-animation-patterns.md` — activated on animation work.
- `skill-component-builder.md` — activated on new components.
- `skill-builder.md` — meta-skill for adding new skills.

### 15.4 Snapshots (mandatory)

The CLAUDE.md mandate: after every assistant response, append a snapshot to `.claude/snapshots/YYYY-MM-DD_session-N.md` in a strict `### HH:MM / **User**: / **Claude**: / **Preferences noted**:` format. The snapshot log is the project's continuity memory across Claude sessions; the major architectural pivots in §14 are all dated and explained from the snapshot record.

### 15.5 DESIGN-SYSTEM.md

The single design source of truth, kept under `.claude/` so it travels with the orchestration config. `theme.ts` is the implementation of this spec; any drift between the two should be reconciled to the MD.

---

## 16. Stubs, Known Issues, and Roadmap

Tracked across `pending-tasks.md` and the Todos section of `CODEBASE.md`.

### 16.1 Stubbed UI

- `src/app/modules/pronunciation.tsx` — entry exists, content is "coming soon".
- `src/app/modules/letters.tsx` — same.
- Voice picker UI exists in `VoiceSelector.tsx` and is reachable from the Profile screen, but the underlying `getVoiceStyles()` call to ElevenLabs is not yet bound to it.
- Home → Progress cards render against `MOCK_PROGRESS` — not yet computed from `userWords`.
- Stats grid → "Time spent" is a hardcoded `"2h 15m"`; no session-duration tracking yet exists.

### 16.2 Tech debt

- `correctAttempts` is a `text` column in Appwrite (legacy); the frontend defends with `Number(...)` everywhere. Migration deferred.
- `aiService.scoreWordsForField` and `generateContextPassage` still take `Field` as a parameter, despite the pipeline no longer using fields. Vestigial; safe to remove.
- The "Bypass Onboarding (Dev)" button on the welcome screen ships in the production-ready build. Must be removed before any non-evaluation deployment.
- `notificationService.ts` is fully implemented (`requestPermissions`, `scheduleDailyReminder`, `showWordNotification`) but is **never called anywhere in the app**. Daily reminders are the lowest-hanging engagement lever pending wire-up.
- `EXPO_PUBLIC_CLAUDE_API_KEY` exposes the Anthropic key in the client bundle. Acceptable for graduation; for production, the wrong-answer-explanation call should be moved server-side.

### 16.3 Roadmap (CODEBASE.md §Todos)

The Todos section of `CODEBASE.md` lays out the vision for evolving Vocab from a vocabulary-only drill into a five-skill platform — adding **reading**, **listening**, **speaking**, and **writing** as first-class exercise types, with per-skill SRS tracks (`listeningStatus`, `speakingStatus`, `writingStatus`), per-skill levels in the user profile (replacing the single `level: Level`), a `user_writing` Appwrite collection, and a skill-radar chart on the Stats screen. Microphone permission, audio pre-generation during the pipeline, and a "Read it back" self-graded speaking mechanic are the next implementation steps.

---

## 17. Running the Project

```bash
# Install
npm install

# Dev server (Expo Go works for early screens; learning/session needs dev build)
npm start
npm run ios       # builds and launches iOS
npm run android   # builds and launches Android
npm run web       # web build

# Vocabulary pipeline (all require .env populated with server-side keys)
npm run pipeline                          # full pipeline for the level passed via --level
npm run pipeline -- --level A1            # score → enrich → seed → fix for A1
npm run pipeline -- --all                 # A1 through C1 in sequence
npm run pipeline -- --level A1 --resume   # re-use any already-completed work
npm run pipeline -- --level A1 --skip-fix # skip the post-seed wordFixer pass

npm run pipeline:score   -- --level A1    # stage 1 only
npm run pipeline:enrich  -- --level A1    # stage 2 only
npm run pipeline:seed    -- --level A1    # stage 3 only
npm run pipeline:fix     -- --level A1    # post-seed repair pass
npm run pipeline:doctor  -- --dry-run     # standalone non-destructive audit
npm run pipeline:doctor  -- --yes         # apply repairs
npm run pipeline:wipe    -- --level A1 --yes   # destructive cleanup of one level
npm run pipeline:build-test               # rebuild the placement-test bank

# Ad-hoc operator scripts (run with `node`, not `tsx`)
node scripts/diagnose.js                  # print env + per-level word counts
node scripts/diagnoseAa.js                # inspect user "Aa" userwords + referenced words
node scripts/repairAaState.js             # clear stuck daily-completion state for user "Aa"
```

Expo SDK 52 requires a development build to run on device (Expo Go is fine for non-native-module screens).

---

## 18. Quick-Reference Appendix

### 18.1 The 10 hooks

| Hook                  | Responsibility                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `useAuthForm`         | Email/password + OAuth flows; post-auth completion pipeline (fetch session → fetch doc → migrate guest → set user). |
| `useDailyWord`        | Fetch + cache today's deck; promote `new` selections to `learning`; self-heal stuck flags.                          |
| `useExerciseSession`  | Session queue, scoring, wrong-answer explanation orchestration.                                                     |
| `useSpacedRepetition` | Translate an answer into an SRS update; persist to local + Appwrite.                                                |
| `useAudio`            | ElevenLabs primary, `expo-speech` fallback; iOS silent-mode override.                                               |
| `usePlacementTest`    | Placement test state machine + level classification on completion.                                                  |
| `useAddManualWord`    | Orchestrate the manual Add-Word flow (dictionary → Claude → Appwrite).                                              |
| `useAvatarUpload`     | `expo-image-picker` → blob → Appwrite Storage.                                                                      |
| `useEditProfile`      | Persist name/email edits to both Appwrite Account + user document.                                                  |
| `useRemoteSync`       | Trigger `progressStore.refreshFromAppwrite` on tab mount + foreground.                                              |

### 18.2 The 6 services

| Service               | External system                                                                     |
| --------------------- | ----------------------------------------------------------------------------------- |
| `appwriteService`     | Auth, DB collections, Storage (avatars), OAuth helpers.                             |
| `vocabularyService`   | `words` and `userwords` CRUD; mock fallback.                                        |
| `aiService`           | Claude (scoring, context passages, dictionary fallback, wrong-answer explanations). |
| `ttsService`          | ElevenLabs TTS; voice/model resolution; cache file URIs.                            |
| `dictionaryService`   | Free Dictionary API (phonetics + POS), used at pipeline time and during manual-add. |
| `notificationService` | `expo-notifications` (implemented; not yet invoked).                                |
| `manualWordService`   | Orchestrator for manual word addition; dedup + dictionary + Claude + double-write.  |

### 18.3 Pipeline scripts

`scoreWords` · `enrichWords` · `seedAppwrite` · `wordFixer` · `wordSifter` · `wordDoctor` · `wipeWords` · `runPipeline` · `buildPlacementTest`

Plus ad-hoc `.js` operator scripts: `diagnose`, `diagnoseAa`, `repairAaState`.

### 18.4 Type vocabulary

`Level` = `"A1" | "A2" | "B1" | "B2" | "C1"` ·
`WordStatus` = `"new" | "learning" | "mastered"` ·
`IntervalIndex` = `0 | 1 | 2 | 3 | 4` ·
`PartOfSpeech` = `"noun" | "verb" | "adjective" | "adverb" | "other"` ·
`ExerciseType` = `"swipe" | "fillInBlank" | "audioQuestion" | "multipleChoice" | "partsOfSpeech"`

### 18.5 Where to read further

| For                                                         | Read                             |
| ----------------------------------------------------------- | -------------------------------- |
| The pipeline as an engineering artifact                     | `report.md`                      |
| Operator reference for every script                         | `pipeline-guide.md`              |
| The exact spec the swipe screen was built against           | `swiper-ui.md`                   |
| Full design tokens, components, animations                  | `.claude/DESIGN-SYSTEM.md`       |
| ElevenLabs custom voice/model integration                   | `ElevenLabs-Custom-TTS-Setup.md` |
| The project's continuity memory (decisions, dates, reasons) | `.claude/snapshots/`             |
| Architectural conventions Claude must obey                  | `CLAUDE.md`                      |
| Per-file reference (legacy; superseded by this document)    | `CODEBASE.md`                    |

---

_End of overview._
