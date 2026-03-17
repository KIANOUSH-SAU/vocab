# Vocab App — Project Rules

## What This App Is
An adaptive English vocabulary learning app. Every word served to the user is chosen based on their **field of interest** (Engineering, Health, Law, Sports, Education) and their current **English level** (A1–C1). The core differentiator is field-aware curation + celebrity voice AI feedback.

---

## Tech Stack
| Layer | Tool |
|---|---|
| Mobile | React Native + Expo (SDK 52+) |
| Navigation | Expo Router (file-based) |
| Backend / DB / Auth | Appwrite |
| State | Zustand |
| TTS / Voice | ElevenLabs API |
| AI (word filtration + explanations) | Claude API (claude-sonnet-4-6) |
| Animations | react-native-reanimated + react-native-gesture-handler |
| Notifications | expo-notifications |

---

## Folder Structure
```
src/
├── app/            Expo Router screens
├── components/     UI — ui/, cards/, exercises/
├── services/       External calls — appwrite, vocabulary, ai, tts, notifications
├── store/          Zustand stores — user, word, progress
├── hooks/          Custom hooks — useSpacedRepetition, useDailyWord, useAudio
├── utils/          Pure functions — spacedRepetition, levelClassifier, wordSelector
├── constants/      levels, fields, placementTest, theme
└── types/          TypeScript interfaces — user, word, exercise
```

---

## Coding Standards
- **TypeScript everywhere** — no `any`, define all types in `src/types/`
- **Functional components only** — no class components
- **No logic in components** — extract to custom hooks
- **Services handle all I/O** — Appwrite, ElevenLabs, Claude API calls live in `src/services/`
- **Zustand for all shared state** — no prop drilling beyond 2 levels
- **Named exports only** — no default exports except Expo Router screens

## Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `camelCase`, prefix `use` (e.g. `useAudio.ts`)
- Services: `camelCase`, suffix `Service` (e.g. `wordService.ts`)
- Stores: `camelCase`, suffix `Store` (e.g. `userStore.ts`)
- Types/Interfaces: `PascalCase` (e.g. `Word`, `UserProfile`)
- Constants: `SCREAMING_SNAKE_CASE` for values, `camelCase` for objects

---

## Design System
- **Theme**: Dark-first. Deep background (`#0D0D0D`), card surfaces (`#1A1A1A`)
- **Accent**: One primary accent color per field (define in `constants/theme.ts`)
- **Typography**: Clear hierarchy — word title large, definition medium, metadata small
- **Animations**: All transitions use `react-native-reanimated`. No `Animated` from RN core
- **Swipe cards**: Tinder-style using `react-native-gesture-handler` PanGesture
- **Touch targets**: Minimum 44×44pt for all interactive elements
- **Spacing**: 4pt grid system (4, 8, 12, 16, 24, 32, 48)

---

## Core Data Models

### Word
```typescript
{
  id: string
  word: string
  phonetic: string
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other'
  definition: string
  exampleSentence: string
  contextPassage: string       // AI-generated passage for celebrity reading
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  fields: Field[]
  usabilityScore: number       // 1–10, AI-rated
  audioUrl?: string
}
```

### UserWord (spaced repetition tracking)
```typescript
{
  userId: string
  wordId: string
  status: 'new' | 'learning' | 'mastered'
  nextReviewDate: Date
  intervalIndex: number        // 0=Day1, 1=Day3, 2=Day7, 3=Day14, 4=Day30
  totalAttempts: number
  correctAttempts: number
}
```

### User
```typescript
{
  id: string
  name: string
  email?: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  fields: Field[]
  voiceStyleId: string         // ElevenLabs voice ID
  isGuest: boolean
}
```

---

## Feature Phases
- **Phase 1 (core)**: Onboarding, placement test, daily 5 words, swipe exercises, spaced repetition, stats
- **Phase 2**: Celebrity voice integration (ElevenLabs), wrong-answer AI explanations
- **Phase 3**: Lock screen widget, push notifications

---

## Fields
`engineering` | `health` | `law` | `sports` | `education`

## Spaced Repetition Intervals
`[1, 3, 7, 14, 30]` days. Wrong answer resets `intervalIndex` to 0.

## Guest Mode
Limited to 3 words. No account, no sync, data in local storage only.

---

## Auto-Trigger Skills

When the user's message matches any of these patterns, automatically invoke the corresponding slash command **before** responding:

### /new-screen
Trigger when the user: says "create a new screen", "add a screen for X", "scaffold screen", "new page", "new route", or provides a screen name/route to create.

### /new-component
Trigger when the user: says "create a component", "new component", "build a component for X", "scaffold component", or provides a component name with a location. Do NOT trigger for screens or exercises.

### /new-exercise
Trigger when the user: says "create an exercise", "new exercise type", "build exercise for X", "scaffold exercise", or mentions any of the 5 exercise types (swipe, fill-in-blank, audio-question, multiple-choice, parts-of-speech).

### /new-service
Trigger when the user: says "create a service", "new service", "build a service for X", "scaffold service", or needs a new external API integration.

### /scaffold-word-pipeline
Trigger when the user: says "scaffold word pipeline", "run word pipeline", "score words for X", "seed words", "populate word database", or mentions setting up CEFR word lists for a field/level.

### /review-code
Trigger when the user: says "review this code", "check this file", "review X", "is this code correct", "audit this", or provides a file path asking for quality feedback.

### /skill-builder
Trigger when the user: wants to create a new skill, edit an existing skill, improve a skill's structure, or asks about the skill convention.

### /skill-creator
Trigger when the user: says "create a skill", "new skill", "edit skill", "improve this skill", "test this skill", or anything about skill authoring and management.

---

## Conversation Snapshots — MANDATORY

**THIS IS A NON-NEGOTIABLE REQUIREMENT. After EVERY single response — no exceptions — append a snapshot entry to the session file. This applies to ALL interactions: questions, tasks, edits, errors, clarifications, casual chat, everything. Never skip this step. It is the LAST thing you do before finishing your response.**

- **File location**: `.claude/snapshots/YYYY-MM-DD_session-N.md` (increment N if multiple sessions in one day)
- **If the file doesn't exist yet**, create it with a `# Session — YYYY-MM-DD` header first
- **Each entry format**:
  ```
  ### HH:MM
  **User**: [1-2 sentence summary of what they asked/said]
  **Claude**: [1-2 sentence summary of what was done/answered]
  **Preferences noted**: [any preferences, patterns, or corrections observed — or "none"]
  ```
- Keep summaries concise — capture intent and outcome, not full details
- Always append, never overwrite previous entries
- Track preferences like: tone, language, workflow habits, tools preferred, things they dislike
- **If you forget to do this, you are violating a core project rule**
