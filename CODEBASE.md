# Vocab App — Full Codebase Documentation

> Last updated: April 2026  
> Stack: React Native · Expo SDK 52 · Expo Router v4 · TypeScript · Zustand · Appwrite · ElevenLabs · Claude AI

---

## What Is This?

**Vocab** is a field-specific English vocabulary learning app for professionals. You tell it your job field (engineering, law, medicine, etc.) and your CEFR level (A1–C1), and it feeds you the vocabulary that actually matters for your career — not random dictionary words.

The core learning loop is:

1. Take a **placement test** → get assigned a CEFR level
2. Pick your **professional fields** (up to 5)
3. Get **5 personalized words/day** filtered by your level & field
4. Do **exercises** (swipe true/false, multiple choice, fill-in-blank)
5. A **spaced repetition** algorithm schedules word reviews (1 → 3 → 7 → 14 → 30 days)
6. Wrong answers trigger an **AI explanation** via Claude, read aloud via **ElevenLabs TTS**

---

## Project Structure (High Level)

```
Vocab/
├── src/
│   ├── app/                   # Expo Router file-based routes
│   │   ├── _layout.tsx        # Root layout (fonts, splash screen, navigation stack)
│   │   ├── index.tsx          # Entry point — auth gate / redirect
│   │   ├── (onboarding)/      # Onboarding flow screens
│   │   │   ├── index.tsx      # Welcome / landing screen
│   │   │   ├── interests.tsx  # Field selection screen
│   │   │   ├── placement-test.tsx  # 10-question CEFR test
│   │   │   ├── level-result.tsx    # Show classified level + CTA
│   │   │   └── auth/          # Auth screens
│   │   │       ├── login.tsx
│   │   │       ├── signup.tsx
│   │   │       └── callback.tsx   # OAuth redirect handler
│   │   ├── (tabs)/            # Main app (4 bottom tabs)
│   │   │   ├── _layout.tsx    # Tab navigator with custom TabBar
│   │   │   ├── home.tsx       # Dashboard — streak, WOTD, progress
│   │   │   ├── learn.tsx      # Daily card stack + review queue
│   │   │   ├── review.tsx     # Mastery Vault — searchable word library
│   │   │   └── stats.tsx      # Profile + analytics + logout
│   │   ├── learning/
│   │   │   └── session.tsx    # Full exercise session (1415 lines!)
│   │   ├── word/
│   │   │   └── [id].tsx       # Word detail screen (from review tap)
│   │   └── modules/
│   │       ├── pronunciation.tsx  # Stub — "Pronounce like a Pro"
│   │       └── letters.tsx        # Stub — "Letters Overseas"
│   ├── components/
│   │   ├── exercises/         # Empty — exercises live inline in session.tsx
│   │   └── ui/                # Shared UI primitives
│   │       ├── AccentBlob.tsx      # Animated SVG morphing blob (decorative)
│   │       ├── AnimatedFire.tsx    # SVG flame animation (streak widget)
│   │       ├── BackButton.tsx      # Generic back nav button
│   │       ├── Button.tsx          # Multi-variant button (primary, ghost, apple, google)
│   │       ├── Card.tsx            # Generic card container
│   │       ├── CheckIcon.tsx       # Animated check mark
│   │       ├── IconCircle.tsx      # Icon in a circle
│   │       ├── MaxWidthContainer.tsx  # Web-friendly max-width wrapper
│   │       ├── SectionBadge.tsx    # Small colored text badge
│   │       ├── SectionLabel.tsx    # Uppercase section header label
│   │       └── TabBar.tsx          # Custom blurred bottom tab bar
│   ├── constants/
│   │   ├── theme.ts            # Design system (colors, spacing, radii, typography, shadows)
│   │   ├── fields.ts           # 5 professional fields with metadata + icons
│   │   ├── levels.ts           # CEFR levels A1–C1 with score ranges
│   │   ├── placementTest.ts    # 10 hardcoded placement questions
│   │   ├── spacedRepetition.ts # Interval schedule + daily limits
│   │   └── mockWords.ts        # ~100 fallback words when Appwrite is offline
│   ├── hooks/
│   │   ├── useAuthForm.ts      # Email/password + OAuth auth logic
│   │   ├── useDailyWord.ts     # Fetch + cache today's personalized words
│   │   ├── useExerciseSession.ts  # Session state machine (queue, scoring, AI explanations)
│   │   ├── usePlacementTest.ts    # Placement test state
│   │   ├── useSpacedRepetition.ts # Record answers + update SRS schedule
│   │   └── useAudio.ts            # ElevenLabs TTS with expo-speech fallback
│   ├── services/
│   │   ├── appwriteService.ts  # Appwrite SDK wrapper (auth + DB)
│   │   ├── vocabularyService.ts  # Word fetching + UserWord CRUD
│   │   ├── aiService.ts        # Claude API (scoring, context passages, explanations)
│   │   ├── ttsService.ts       # ElevenLabs text-to-speech
│   │   ├── dictionaryService.ts  # Free Dictionary API (phonetics + audio URLs)
│   │   └── notificationService.ts  # Expo push notifications (daily reminder)
│   ├── store/
│   │   ├── userStore.ts        # Zustand — user profile, auth state, onboarding
│   │   ├── wordStore.ts        # Zustand — today's words, word cache, audio cache
│   │   └── progressStore.ts   # Zustand — userWords SRS data, streak, session stats
│   ├── types/
│   │   ├── word.ts             # Word, UserWord, WordScore, Field, Level types
│   │   ├── user.ts             # User, VoiceStyle types
│   │   ├── exercise.ts         # ExerciseType, ExerciseCard, SessionStats types
│   │   ├── api.ts              # Appwrite doc, DictionaryAPI, ElevenLabs types
│   │   ├── navigation.ts       # Route param types
│   │   └── index.ts            # Re-exports everything
│   └── utils/
│       ├── spacedRepetition.ts  # SRS algorithm (interval calc, mastery check)
│       ├── wordSelector.ts      # Pick daily words (new + due-for-review mix)
│       ├── levelClassifier.ts   # Score placement answers → CEFR level
│       ├── dateUtils.ts         # Today string, isToday helpers
│       └── textUtils.ts         # Text truncation helpers
├── data/
│   ├── cefr-words-A1.txt … C1.txt  # Raw CEFR word lists (pipeline input)
│   ├── enriched-A1.json          # Enriched words with definitions (pipeline output)
│   └── scored-A1.json            # AI-scored words (pipeline intermediate)
├── scripts/
│   ├── runPipeline.ts    # Orchestrator: score → enrich → seed
│   ├── scoreWords.ts     # Claude AI scores words 1–10 for field relevance
│   ├── enrichWords.ts    # Fetches definitions + phonetics from Dictionary API
│   └── seedAppwrite.ts   # Pushes enriched words to Appwrite DB
├── assets/images/        # Google icon, app icons, etc.
├── .env                  # API keys (not committed)
├── app.json              # Expo app config (scheme, bundle IDs)
├── babel.config.js       # Path aliases (@constants, @services, @store, etc.)
├── tsconfig.json         # TypeScript config
├── package.json          # Dependencies
└── pending-tasks.md      # Known TODOs and technical debt
```

---

## File-by-File Breakdown

### Entry & Navigation

#### `src/app/_layout.tsx`

The root layout. It:

- Loads 7 custom fonts (DM Serif Display, Space Grotesk, JetBrains Mono) via `useFonts`
- Keeps the splash screen up until fonts load
- Sets up `GestureHandlerRootView` (required for gesture-handler swipes)
- Defines the `Stack` navigator with screen-specific transition animations:
  - Tabs → fade
  - Word detail → slide from bottom
  - Learning session → slide from right
  - Modules → slide from right

#### `src/app/index.tsx`

The auth gate / redirect. On mount it:

1. Checks if a user exists in Zustand store
2. If authenticated (not guest): validates the Appwrite session is still alive (handles token expiry)
3. Redirects → `/(onboarding)/` if no user, `/(tabs)/home` if logged in

---

### Onboarding Flow

#### `src/app/(onboarding)/index.tsx` — Welcome Screen

The landing screen. Shows:

- Animated field color dots (one per field, bouncing)
- "vocab." wordmark in DM Serif + Iris dot
- CTAs that adapt based on `lastLoggedInEmail`:
  - **Returning user**: "Go to your account" + "Start fresh"
  - **New user**: "Get Started" → interests, Google OAuth, Apple OAuth, guest mode ("Try 3 words for free")
- **Dev button**: "Bypass Onboarding (Dev)" — goes straight to home, should be removed before production

#### `src/app/(onboarding)/interests.tsx` — Field Selection

Pick 1–5 professional fields. Each field renders as a large pressable card with its icon and color. Selected fields get an iris border + checkmark. Passes selected fields to placement test as a route param.

#### `src/app/(onboarding)/placement-test.tsx` — Placement Test

10-question adaptive quiz. Uses `usePlacementTest` hook. Questions are of 3 types:

- `recognition` — "Do you know this word?" (Yes / Seen it / No idea)
- `definition` — Multiple choice definition
- `usage` — Is this sentence grammatically/contextually correct?

Progress bar fills as questions advance. On completion → redirects to `/level-result`.

#### `src/app/(onboarding)/level-result.tsx` — Level Result

Shows the classified CEFR level with a big animated reveal. User can confirm the level or manually override it. Then routes to auth signup or directly to home (if guest).

#### `src/app/(onboarding)/auth/signup.tsx` & `login.tsx`

Standard email/password forms using `useAuthForm`. Includes:

- Client-side validation
- Human-readable Appwrite error mapping
- Guest user migration (local progress → Appwrite) on account creation

#### `src/app/(onboarding)/auth/callback.tsx`

OAuth deeplink handler — processes `vocab://auth/callback` redirects from Appwrite OAuth.

---

### Main App (Tabs)

#### `src/app/(tabs)/_layout.tsx`

Bottom tab navigator using the custom `TabBar` component. 4 tabs: Home, Learn, Review, Stats.

#### `src/app/(tabs)/home.tsx` — Home Screen (543 lines)

The dashboard. Contains several self-contained sub-components:

| Sub-component     | What it does                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `StreakWidget`    | Orange gradient card with animated SVG fire, streak count, 7-day dot row                                      |
| `WordOfDayCard`   | Shows first word of today's batch — word, phonetic, definition, field chip, play button                       |
| `ProgressSection` | 2 progress cards (Weekly Goal, Mastery) with linear gradient bars — **currently uses static `MOCK_PROGRESS`** |
| `ModuleCards`     | 2 gradient tappable cards → Pronunciation module, Letters module                                              |

⚠️ `MOCK_PROGRESS` is hardcoded — not wired to real data yet (see `pending-tasks.md`).

#### `src/app/(tabs)/learn.tsx` — Learn Screen (876 lines)

The daily learning hub. Sub-components:

| Sub-component    | What it does                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `DailyStack`     | 3D stacked swipeable flash card deck — top card is draggable with pan gesture                  |
| `DailyStackCard` | Individual card: front (word + definition), back (example sentence), swipe left/right overlays |
| `ActionButtons`  | ✕ Skip, 🔊 Audio, ✓ Know buttons that trigger programmatic swipes via refs                     |
| `ReviewCard`     | Gradient-border card showing count of words due for SRS review                                 |
| `WordOfTheDay`   | Expanded word detail card with pronunciation, example, context passage                         |
| `StartButton`    | Launches the full `/learning/session` screen                                                   |

Cards rotate on drag. Swiping right = "know it", left = "skip". The card stack shows 3 visible layers with staggered scale/opacity.

#### `src/app/(tabs)/review.tsx` — Mastery Vault (342 lines)

Searchable, filterable list of all learned words. Sub-components:

| Sub-component  | What it does                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `WordRow`      | Word name, phonetic, definition, level, mastery status badge, mastery meter bar                      |
| `StatusBadge`  | Color-coded: Mastered (mint), Learning (amber), Struggling (coral)                                   |
| `MasteryMeter` | 48px progress bar colored by SRS interval (coral if struggling, amber if learning, mint if mastered) |
| `FilterChips`  | All / Learning / Struggling / Mastered filter tabs                                                   |

⚠️ Falls back to `MOCK_VAULT` (6 hardcoded words) if no real `userWords` in store. Word lookup from cache requires words to have been loaded in `wordStore`.

#### `src/app/(tabs)/stats.tsx` — Stats Screen (588 lines)

Profile + analytics. If guest → shows `GuestGate` (lock visual, "Create Account" CTA).
For logged-in users:

| Section        | What it shows                                                           |
| -------------- | ----------------------------------------------------------------------- |
| Profile Header | Avatar (initials), name, CEFR level badge, edit button (non-functional) |
| Field Pills    | Colored pills for each selected field                                   |
| Stats Grid     | 4 stat cards: Streak, Accuracy %, Mastered count, Time Spent (mocked)   |
| Activity Chart | 7-bar animated bar chart — **currently hardcoded `MOCK_ACTIVITY`**      |
| Account        | "Change Fields or Level" (non-functional), Logout button                |

Logout calls `logoutSession` (Appwrite), then `logout()` (Zustand), redirects to onboarding.

---

### Learning Session

#### `src/app/learning/session.tsx` (1415 lines — the biggest file)

Full-screen exercise session. Uses `useExerciseSession` to manage a queue of cards. Built-in exercise types:

| Exercise                 | Mechanic                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SwipeExercise`          | Cards shows word + a definition (true or false, randomly). Swipe right = True, left = False. Pan gesture controlled; shows TRUE/FALSE overlay.                           |
| `MultipleChoiceExercise` | "What does X mean?" — 4 options (1 correct + 3 distractors from other words). Shake animation on wrong answer, confetti on correct. Auto-advances after 1.2s on correct. |

Additional features:

- **`ShimmerProgressBar`**: Animated shimmer effect on the session progress bar
- **`ExplanationOverlay`**: Shows AI-generated wrong answer explanation (Claude Haiku), optionally spoken via `useAudio`
- **`ConfettiBurst`**: 28 animated confetti particles on correct answer
- **`SessionComplete`**: End-of-session summary card (correct, wrong, skipped counts + accuracy ring)
- **`AnswerOption`**: Animates correct (slides right) and wrong (shakes) states

The session queue is built as: each word gets 2 exercise types (swipe + multipleChoice), so 5 words = 10 cards total.

---

### Word Detail

#### `src/app/word/[id].tsx`

Simple detail view for a single word. Shows definition, example sentence, and context passage with a "Hear it" button that plays via `useAudio`. Accessed by tapping a word row in the Review screen.

---

### Module Stubs

#### `src/app/modules/pronunciation.tsx` & `letters.tsx`

Placeholder screens. The routes exist (shown on Home screen as module cards) but the content is not built yet. Tracked in `pending-tasks.md`.

---

## Services

### `appwriteService.ts`

The single Appwrite SDK wrapper. Uses lazy singleton pattern — the `Client`, `Account`, and `Databases` objects are created on first use (not at import time), so the app doesn't crash when env vars are missing.

Key exported collections:

- `COLLECTIONS.WORDS` — global word dictionary
- `COLLECTIONS.USER_WORDS` — per-user SRS progress records
- `COLLECTIONS.USERS` — user profile documents

Key functions:

- `signUp(email, password, name)` — creates Appwrite account + session
- `login(email, password)` — creates email/password session
- `getCurrentSession()` — gets current logged-in user (null-safe)
- `logoutSession()` — deletes current session
- `oauthLogin(provider)` — initiates OAuth flow (legacy; newer flow uses `createOAuth2Token`)
- `createUserDocument(userId, data)` — creates profile doc in `users` collection
- `getUserDocument(userId)` — fetches profile doc
- `updateUserDocument(userId, updates)` — partial update of profile
- `migrateProgressToServer(userId, userWords)` — bulk-creates guest progress in Appwrite on account creation

### `vocabularyService.ts`

Handles all word data fetching. Falls back to `MOCK_WORDS` when Appwrite isn't configured.

| Function                                   | What it does                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `fetchWordsByLevelAndField(level, fields)` | Queries `words` collection filtered by level + fields, sorted by `usabilityScore desc` |
| `fetchWordById(wordId)`                    | Gets a single word by ID                                                               |
| `fetchUserWords(userId)`                   | Gets all SRS records for a user                                                        |
| `upsertUserWord(userWord)`                 | Creates or updates an SRS record                                                       |

⚠️ Known bug: `correctAttempts` is stored as `text` in Appwrite DB (see `word.ts` type comment). `review.tsx` and `stats.tsx` both do defensive `parseInt()` conversions.

### `aiService.ts`

Anthropic Claude wrapper — **only used in preprocessing scripts and during wrong-answer explanations**.

| Function                                                                   | Model             | Purpose                                                          |
| -------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `scoreWordsForField(words, field, level)`                                  | claude-sonnet-4-6 | Script only — scores batches of words 1–10 for field relevance   |
| `generateContextPassage(word, field)`                                      | claude-sonnet-4-6 | Script only — writes a 3-sentence professional context paragraph |
| `generateWrongAnswerExplanation(word, context, userAnswer, correctAnswer)` | claude-haiku-4-5  | Live — triggered during exercise sessions for wrong answers      |

### `ttsService.ts`

ElevenLabs API wrapper. Calls the `eleven_turbo_v2_5` model with `stability: 0.5`, `similarity_boost: 0.75`. Audio is returned as an ArrayBuffer, converted to base64, saved to `FileSystem.cacheDirectory` as an `.mp3`, and the file URI is returned.

`getVoiceStyles()` fetches all available ElevenLabs voices for the voice picker (not wired to UI yet).

### `dictionaryService.ts`

Calls the free [dictionaryapi.dev](https://dictionaryapi.dev) API to fetch phonetic transcriptions and audio URLs. Used in the preprocessing pipeline's `enrichWords.ts` script, not in the runtime app.

### `notificationService.ts`

Wraps `expo-notifications`. Three functions:

- `requestPermissions()` — requests OS-level notification permission
- `scheduleDailyReminder(hour, minute)` — cancels all, then schedules a daily repeating notification at the given time (default 9:00am)
- `showWordNotification(word)` — fires an immediate notification for a word

⚠️ These functions exist but are never called anywhere in the current app code.

---

## State Management (Zustand Stores)

All stores use `persist` middleware with AsyncStorage. Each store is split into "state" and "actions" interfaces.

### `userStore.ts`

```
user: User | null
voiceStyles: VoiceStyle[]
isAuthenticated: boolean
isLoading: boolean
isSessionChecked: boolean           ← NOT persisted (reset on app launch)
pendingOnboardingData: { level, fields } | null  ← NOT persisted
lastLoggedInEmail: string | null    ← persisted (for returning user detection)
```

Key behaviors:

- `logout()` preserves `lastLoggedInEmail` (intentionally — used to show "Go to your account" CTA on welcome screen)
- `reset()` wipes everything including `lastLoggedInEmail`
- `isSessionChecked` is the gate that prevents rendering until Appwrite session validation completes

### `wordStore.ts`

```
todaysWords: Word[]
wordCache: Record<string, Word>    ← persisted
audioCache: Record<string, string> ← persisted (local file URIs)
lastFetchedDate: string | null
```

`lastFetchedDate` + `todaysWords` are NOT persisted — they reset each app launch so that words are re-fetched fresh each day. Only the caches persist.

### `progressStore.ts`

```
userWords: Record<string, UserWord>  ← persisted (keyed by wordId)
streak: number                       ← persisted
lastActiveDate: string | null        ← persisted
sessionStats: SessionStats | null    ← NOT persisted
```

`checkAndUpdateStreak()` compares today's date vs `lastActiveDate`. If yesterday → streak++. If anything else → streak resets to 1.

---

## Hooks

### `useAuthForm.ts`

Provides email/password/name/confirmPassword form state + handlers for:

- `handleSignup` — validates, calls `signUp`, creates user doc, calls `completeAuth`
- `handleLogin` — validates, calls `login`, calls `completeAuth`
- `handleOAuth(provider)` — opens browser for OAuth, extracts `userId` + `secret` from redirect URL, creates session, calls `completeAuth`

`completeAuth` is the shared post-auth flow:

1. Fetch Appwrite session
2. Fetch user document from DB
3. Migrate any guest progress to server
4. Apply `pendingOnboardingData` if no DB profile found
5. Call `setUser` on store
6. Navigate → interests page (if no fields) or home

### `useDailyWord.ts`

Fetches today's words for the current user. Uses `lastFetchedDate` to avoid re-fetching on the same calendar day. Calls `fetchWordsByLevelAndField` → `selectDailyWords` to produce the final ordered list. Caches result in `wordStore.todaysWords`.

### `useExerciseSession.ts`

Manages a session's card queue:

- Builds queue: each word × EXERCISE_TYPES (currently swipe + multipleChoice) = N × 2 cards
- Tracks `index`, `stats` (correct/wrong/skipped)
- On wrong answer: calls `generateWrongAnswerExplanation` → `play(text)` (voiced)
- `recordAnswer` (from `useSpacedRepetition`) updates SRS data on each answer

### `useSpacedRepetition.ts`

Wraps spaced repetition logic:

- On answer: computes new `intervalIndex`, `status`, `nextReviewDate`, `totalAttempts`, `correctAttempts`
- Updates `progressStore` locally
- If not guest: also calls `upsertUserWord` on Appwrite (async, fire-and-forget)

### `useAudio.ts`

Manages audio playback with two layers:

1. **ElevenLabs TTS** (if user has `voiceStyleId`): generates MP3, saves to cache, plays via `expo-av`
2. **Fallback**: `expo-speech` device TTS

Configures iOS to play audio even when the device is on silent mode (`playsInSilentModeIOS: true`).

Cached audio is keyed by a provided `cacheKey` and stored in `wordStore.audioCache` as local file URIs.

### `usePlacementTest.ts`

Simple state machine for the placement test: tracks `currentIndex` and `answers[]`. When `currentIndex >= PLACEMENT_QUESTIONS.length`, `classifiedLevel` is computed via `classifyFromAnswers`.

---

## Core Algorithm: Spaced Repetition

Located across `src/utils/spacedRepetition.ts` and `src/constants/spacedRepetition.ts`.

**Intervals**: 1 → 3 → 7 → 14 → 30 days (indexed 0–4)

**Status progression**:

- `new` → word has never been attempted
- `learning` → intervalIndex < 4
- `mastered` → intervalIndex === 4 (MASTERY_INDEX)

**On correct answer**: `intervalIndex++` (capped at 4)  
**On wrong answer**: `intervalIndex` resets to 0

**Daily word selection** (`wordSelector.ts`):

- Picks up to `REVIEW_WORDS_PER_DAY` (2) words whose `nextReviewDate` is today or past
- Fills remaining slots with `NEW_WORDS_PER_DAY` (3) new unseen words, sorted by `usabilityScore` desc
- Guests get a max of `GUEST_WORDS_LIMIT` (3) total words, no reviews

---

## Data Pipeline (Preprocessing Scripts)

The word database is populated via a 3-stage Node.js pipeline (not part of the app runtime):

```
data/cefr-words-A1.txt  ←  raw CEFR word list (one word per line)
        ↓
scripts/scoreWords.ts     → Claude AI rates each word for field relevance (1–10)
        ↓
data/scored-A1.json
        ↓
scripts/enrichWords.ts    → Dictionary API fetches phonetics, definitions, examples
                          → Claude generates context passages for each word
        ↓
data/enriched-A1.json
        ↓
scripts/seedAppwrite.ts   → Pushes all words to Appwrite `words` collection
```

Run via `npm run pipeline` (or individual steps: `pipeline:score`, `pipeline:enrich`, `pipeline:seed`).

---

## Design System

Defined in `src/constants/theme.ts`. The entire app uses this — no arbitrary style values.

### Color Palette

| Token                   | Value               | Role                             |
| ----------------------- | ------------------- | -------------------------------- |
| `iris`                  | `#7C5CFC`           | Primary brand color (violet)     |
| `irisDark / irisDeeper` | `#6340E8 / #5B3FD4` | Iris gradients                   |
| `irisSoft / irisWash`   | `#F0ECFF / #E8E0FF` | Iris tints                       |
| `mint`                  | `#2DD4A8`           | Success, mastered state          |
| `coral`                 | `#FB7185`           | Error, wrong answers, struggling |
| `amber`                 | `#FBBF24`           | Warning, streak, learning state  |
| `ink`                   | `#18181B`           | Primary text                     |
| `ink2`                  | `#71717A`           | Secondary text                   |
| `inkLight`              | `#A1A1AA`           | Muted text                       |
| `bg`                    | `#FAFAF8`           | App background (warm white)      |
| `card`                  | `#FFFFFF`           | Card surfaces                    |

### Typography

3 font families:

- **DM Serif Display** — `fonts.serif` — Used for words, headings, numbers
- **Space Grotesk** — `fonts.sans/sansMedium/sansSemiBold/sansBold` — Body text, labels, buttons
- **JetBrains Mono** — `fonts.mono/monoMedium` — Phonetics, code, level badges

### Shadows

Named shadow presets: `sm`, `soft`, `card`, `float`, `iris` (purple glow), `button`, `sheet`, `tabBar`

### Spring Configs

4 spring animation presets: `snappy`, `bouncy`, `gentle`, `quick`

---

## Environment Variables

All variables prefixed `EXPO_PUBLIC_` (accessible in client bundle):

| Variable                           | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `EXPO_PUBLIC_APPWRITE_ENDPOINT`    | Appwrite API URL                                        |
| `EXPO_PUBLIC_APPWRITE_PROJECT_ID`  | Appwrite project ID                                     |
| `EXPO_PUBLIC_APPWRITE_DATABASE_ID` | Appwrite DB ID                                          |
| `EXPO_PUBLIC_CLAUDE_API_KEY`       | Anthropic API key (scripts + wrong answer explanations) |
| `EXPO_PUBLIC_ELEVENLABS_API_KEY`   | ElevenLabs TTS API key                                  |

The `isAppwriteConfigured` flag gates all Appwrite calls — the app fully works without backend in "mock mode" using local fallback data.

---

## Auth Flow (Complete Picture)

```
App Launch
    │
    ▼
index.tsx ── no user ──────────────────► /(onboarding)/
    │
    ├── guest user detected
    │       └── setSessionChecked(true) → /(tabs)/home (limited)
    │
    └── authenticated user
            ├── Appwrite session valid ──► /(tabs)/home
            └── Session expired ─────────► logout() → /(onboarding)/
```

**Onboarding path (new user)**:

```
Welcome → Interests → Placement Test → Level Result → Signup/Login → Home
                                                     ↗ (if already authed)
```

**Returning user path**:

```
Welcome → "Go to your account" → Login → Home  (skips test if DB has level+fields)
```

**Guest path**:

```
Welcome → "Try 3 words for free" → Interests → Home (3 words/day, no SRS cloud sync)
│
└── On signup: guest progress migrated to Appwrite via migrateProgressToServer()
```

---

## Known Issues & Tech Debt (from `pending-tasks.md`)

| Area                   | Issue                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Home → Progress cards  | `MOCK_PROGRESS` hardcoded — not reading from real `userWords`                          |
| Stats → Activity chart | `MOCK_ACTIVITY` hardcoded — not from real session history                              |
| Stats → Time spent     | Static string `"2h 15m"` — no tracking exists                                          |
| Review screen          | Falls back to `MOCK_VAULT` (6 words) — word lookup requires word cache to be populated |
| Pronunciation module   | Entire feature is a stub — screen exists but no content                                |
| Letters module         | Same as above — stub only                                                              |
| Notifications          | Service implemented but never called                                                   |
| Voice picker UI        | `getVoiceStyles()` implemented but no UI to select a voice                             |
| Stats → Change Fields  | Button renders but does nothing                                                        |
| `correctAttempts` type | Stored as `text` in Appwrite DB, requires `parseInt` everywhere                        |
| Dev bypass button      | "Bypass Onboarding (Dev)" button on welcome screen — should be removed for production  |

---

## Path Aliases

Configured in `babel.config.js` (via `babel-plugin-module-resolver`) and `tsconfig.json`:

| Alias           | Resolves to          |
| --------------- | -------------------- |
| `@constants/*`  | `src/constants/*`    |
| `@services/*`   | `src/services/*`     |
| `@store/*`      | `src/store/*`        |
| `@hooks/*`      | `src/hooks/*`        |
| `@components/*` | `src/components/*`   |
| `@utils/*`      | `src/utils/*`        |
| `@/types`       | `src/types/index.ts` |

---

## Running the App

```bash
# Install dependencies
npm install

# Start development server (Expo Go / dev build)
npm start

# Run on iOS/Android
npm run ios
npm run android

# Data pipeline (populate Appwrite DB)
npm run pipeline:score    # AI-score words
npm run pipeline:enrich   # Fetch definitions + generate passages
npm run pipeline:seed     # Push to Appwrite
npm run pipeline          # Run all 3 steps
```

**Note**: Expo SDK 52 requires a development build to run on device (not compatible with Expo Go). Use `npm run ios` or `npm run android` to build locally.

---

## Todos

This section maps the full vision for evolving Vocab from a vocabulary drill app into a complete, skill-based English learning platform. The priority is **assessing and training all five core language skills** — vocabulary, reading, listening, speaking, and writing — rather than grammar. Every item starts from a planning/design perspective before touching code.

---

### 1. Rethink the Placement Test

**Current state**: 10 questions that test only word recognition and definition knowledge. The result is a single CEFR level used to filter words. Grammar questions are present implicitly in the "usage" question type.

**What needs to change**:

- [ ] **Replace grammar-leaning "usage" questions with vocabulary-in-context questions.** Instead of "Is this sentence grammatically correct?", ask things like "Which word best completes this sentence?" — testing whether the user understands how a word is actually used, not whether the syntax is right.
- [ ] **Expand the placement test to cover all 5 skills**, each getting 2–3 short questions:
  - **Vocabulary**: Word recognition + definition — already exists, keep and improve
  - **Reading**: Short 3-sentence passage → comprehension question (What does this paragraph say about X?)
  - **Listening**: Play an audio clip (ElevenLabs) → choose what word was used / what the sentence means
  - **Speaking**: Not testable on first open without mic permission. Skip for now, or prompt user to self-assess ("How comfortable are you speaking English professionally?")
  - **Writing**: Show a definition → user types the word (or a sentence using it). Light keyboard exercise — tests active recall not just recognition.
- [ ] **Produce separate skill profiles** — instead of one `level: Level`, the user profile should have per-skill levels: `{ vocabulary: 'B2', reading: 'B1', listening: 'A2', speaking: 'B1', writing: 'B2' }`. Store this in the `users` Appwrite collection and `userStore`.
- [ ] **Redesign the Level Result screen** to show a skill radar/breakdown rather than a single letter grade. Each skill shows its own level pill.

---

### 2. Vocabulary (Existing — Fix & Extend)

The vocabulary pipeline and SRS engine are the most complete part of the app, but have gaps.

- [ ] **Wire `MOCK_PROGRESS` to real data** in `home.tsx` — compute `wordsMastered` from `progressStore.userWords` where `status === 'mastered'`, and `sessionsCompleted` from a new session history log.
- [ ] **Wire `MOCK_VAULT` away** in `review.tsx` — the list should always come from `progressStore.userWords` joined with `wordStore.wordCache`. Fix the cache population order so words are always in cache by the time the Review tab is opened.
- [ ] **Fix `correctAttempts` type bug** — change the Appwrite `userWords` collection schema to store `correctAttempts` as integer, not text. Update `seedAppwrite.ts` and add a migration script.
- [ ] **Add fill-in-the-blank as a third exercise type** — the `ExerciseType` union already reserves `fillInBlank` but it's never used. Build a `FillInBlankExercise` component in `session.tsx`: show the example sentence with the target word blanked out, user types it in. Award partial credit for close spellings (Levenshtein distance ≤ 1).
- [ ] **Add a "parts of speech" exercise** — `partsOfSpeech` is also in the `ExerciseType` union but unused. Show a word, user picks noun/verb/adjective/adverb. Fast, lightweight, good for early levels.
- [ ] **Voice picker UI** — add a screen (accessible from Stats → Account) where users can browse and preview ElevenLabs voices. Uses the existing `getVoiceStyles()` service call. Saves `voiceStyleId` to Appwrite user document.
- [ ] **Activate daily notifications** — call `requestPermissions()` + `scheduleDailyReminder()` at the end of onboarding after the user confirms their level. Store the preferred reminder time in user settings.

---

### 3. Reading Skill

**Goal**: Train the user to read professional texts in their field and extract meaning efficiently. Focus is comprehension speed and inference — not grammar rules.

- [ ] **Design a Reading exercise type** (`readingComprehension` — add to `ExerciseType`). Structure:
  - Fetch a `contextPassage` from the word being learned (already stored on the `Word` object — generated by Claude during the pipeline)
  - Display the passage in a scrollable card
  - Ask 1–2 comprehension questions: "What does the author suggest about X?", "Which word in the passage is closest in meaning to Y?"
  - Multiple choice answers — no typing required at this stage
- [ ] **Build a dedicated Reading module screen** — replace the "Letters Overseas" stub (`modules/letters.tsx`) with a real reading module. Each session presents 2–3 professional passages at the user's reading level, each followed by 2–3 questions.
- [ ] **Passage generation pipeline** — extend `scripts/enrichWords.ts` to generate a longer passage (5–6 sentences, not 3) specifically designed for reading comprehension, separate from the TTS context passage. Store as `readingPassage` field on the `Word` document.
- [ ] **Reading speed tracking** — record how long the user spends on each passage. Show average reading speed (words per minute) on the Stats screen as a new metric.

---

### 4. Listening Skill

**Goal**: Train the user to understand spoken English in professional contexts — especially field-specific vocabulary spoken at natural pace.

- [ ] **Design a Listening exercise type** (`audioQuestion` — already in `ExerciseType` union, never implemented). Structure:
  - Play an ElevenLabs-generated audio clip of a word used in a sentence (use the `contextPassage` or `exampleSentence`)
  - Ask: "Which word did you hear?", or "What does the speaker mean when they say X?" — multiple choice
  - User must answer without seeing the text — the card hides all written content until answered
- [ ] **Pre-generate audio clips** during the pipeline (`enrichWords.ts`) rather than calling ElevenLabs live in the exercise. Store the audio file URL in the `words` Appwrite collection as `exampleAudioUrl`. This eliminates live API latency during sessions.
- [ ] **Build the "Pronounce like a Pro" module** (currently a stub in `modules/pronunciation.tsx`). This should be a dedicated listening + shadow-speaking module:
  - Play a word or phrase
  - Show phonetic transcription
  - User taps "I got it" or "Play again"
  - After 3 correct self-assessments → promotes the word in the listening SRS queue
- [ ] **Separate SRS tracks per skill** — add `listeningStatus`, `listeningIntervalIndex`, `listeningNextReviewDate` fields to `UserWord`. Currently all SRS data is aggregated into a single track. Listening should have its own progression curve separate from vocabulary recognition.

---

### 5. Speaking Skill

**Goal**: Build active production confidence — not pronunciation grading (no ML needed at this stage), but deliberate practice and self-assessment.

- [ ] **Design a Speaking exercise type** (`speakingPrompt`). Structure:
  - Show a word + its definition
  - Ask the user to say a sentence using the word out loud
  - After speaking, show an example sentence using the word (not before — prevents copying)
  - User self-assesses: "I used it correctly", "Close but not quite", "I couldn't do it" → maps to correct / partial / wrong for SRS purposes
- [ ] **Add microphone permission request** to onboarding (after field selection, before placement test). Gracefully skip speaking features if permission is denied.
- [ ] **Shadow reading feature** — in the word detail screen (`word/[id].tsx`), add a mode where the app plays the context passage via ElevenLabs and the user reads along. After playback, the user rates how well they kept up. No audio recording or grading — purely self-paced.
- [ ] **"Read it back" prompt** — in the Learn tab's word card, add a mic button after the word is flipped. User speaks the example sentence. App shows the written sentence after they finish. Self-graded. This is the lightest possible speaking implementation.

---

### 6. Writing Skill

**Goal**: Build active recall and accurate usage — not formal essay writing. Focus on word production in context.

- [ ] **Fill-in-the-blank with keyboard input** — extend the `fillInBlank` exercise (see Vocabulary section). Accept the word if spelling distance ≤ 1. Show the correct spelling and highlight the difference character in coral if wrong.
- [ ] **"Use it in a sentence" prompt** — after a word is reviewed 3+ times and reaches `intervalIndex >= 2`, occasionally present a writing prompt: "Use [word] in a sentence related to [field]." The user types freely. Claude Haiku evaluates the sentence (is the word used correctly in context? Yes/No/Partially) and gives brief feedback. This is the one place where live Claude is called during a session for writing, not just wrong-answer explanations.
- [ ] **Build the "Letters Overseas" module** (`modules/letters.tsx`) — a professional email writing simulator. Present a scenario: "You need to email a client about a project delay. Use the word 'mitigate' naturally." User writes a short response (50–150 words). Claude evaluates: did they use the vocabulary correctly? Did the email make sense? Shows a score + model response.
- [ ] **Writing history** — store writing attempts (prompt + user response + Claude score) in a new Appwrite collection `user_writing`. Accessible from the Stats screen. Not in the SRS flow — purely a history/portfolio view.

---

### 7. Data Model Changes Needed

All of the above skill expansions require extending the data model. Here's a consolidated view of what needs to change:

**`Word` type / Appwrite `words` collection** — add fields:

```ts
readingPassage?: string       // longer passage for reading comprehension
exampleAudioUrl?: string      // pre-generated ElevenLabs audio URL
comprehensionQuestions?: { question: string; options: string[]; correctIndex: number }[]
```

**`UserWord` type / Appwrite `userWords` collection** — add per-skill SRS tracks:

```ts
// Vocabulary (existing)
status: WordStatus
intervalIndex: IntervalIndex
nextReviewDate: string
totalAttempts: number
correctAttempts: number   // fix type to number

// Per-skill tracks (new)
listeningStatus?: WordStatus
listeningIntervalIndex?: IntervalIndex
listeningNextReviewDate?: string

speakingStatus?: WordStatus
speakingIntervalIndex?: IntervalIndex
speakingNextReviewDate?: string

writingStatus?: WordStatus
writingIntervalIndex?: IntervalIndex
writingNextReviewDate?: string
```

**`User` type / Appwrite `users` collection** — replace single `level` with per-skill levels:

```ts
// Replace:
level: Level;

// With:
levels: {
  vocabulary: Level;
  reading: Level;
  listening: Level;
  speaking: Level;
  writing: Level;
}
```

**New Appwrite collection: `user_writing`**:

```ts
{
  id: string;
  userId: string;
  wordId: string;
  prompt: string;
  userResponse: string;
  claudeScore: "correct" | "partial" | "incorrect";
  claudeFeedback: string;
  createdAt: string;
}
```

---

### 8. Stats Screen Expansion

Once skills are being tracked, the Stats screen needs a proper overhaul:

- [ ] Replace the fake `MOCK_ACTIVITY` bar chart with real session data. Add a `sessions` Appwrite collection that logs each completed session: `{ userId, date, skill, wordsCorrect, wordsWrong, durationMs }`.
- [ ] Show a **skill breakdown radar chart** (use `react-native-svg`): 5 axes (Vocabulary, Reading, Listening, Speaking, Writing), each plotted as a polygon based on the user's per-skill level. This replaces the 4-stat grid cards.
- [ ] Track and display **real time spent**: sum `durationMs` from the `sessions` collection. Show total this week alongside an all-time total.
- [ ] Add a **"Skill Focus"** selector to the Stats → Account section — let users mark which skills they want to prioritize. `useDailyWord` then weights the session queue accordingly (more listening exercises if listening is the focus skill).
- [ ] Wire the non-functional **"Change Fields or Level"** button to an actual screen where users can re-run the placement test for a specific skill, or manually adjust their level per-skill.
