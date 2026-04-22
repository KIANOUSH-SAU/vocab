# Vocab App

## Project Overview

An adaptive English vocabulary learning app tailored to the user's field of interest (Engineering, Health, Law, Sports, Education) and English level (A1–C1). It features field-aware word curation, celebrity voice AI feedback, spaced repetition, and swipe-based exercises.

## Tech Stack

- **Mobile:** React Native + Expo (SDK 52+)
- **Navigation:** Expo Router
- **Backend/DB/Auth:** Appwrite
- **State Mgmt:** Zustand
- **TTS/Audio:** ElevenLabs API
- **AI Integration:** Claude API (claude-sonnet-4-6)
- **Animations:** react-native-reanimated + react-native-gesture-handler

## Folder Structure

- `app/`: Expo Router screens (file-based routing)
- `src/components/`: Reusable UI components, word cards, and interactive exercises
- `src/services/`: External API calls and clients (Appwrite, Claude, ElevenLabs)
- `src/store/`: Zustand stores for global state (User, Word, Progress)
- `src/hooks/`: Custom React hooks containing component-level business logic
- `src/utils/`: Pure utility functions (spaced repetition logic, text matchers)
- `src/constants/`: App-wide constants (theme, level mappings, placeholder data)
- `src/types/`: TypeScript interfaces and definitions
- `.claude/`: Claude configuration, context, and operational instructions
  - `agents/`: Role-specific personas and logic guides
  - `commands/`: Actionable commands for scaffolding and utilities
  - `skills/`: Auto-triggered structural skills
  - `snapshots/`: Mandatory conversation logs per session

---

## Architecture Rules & Decisions

- **Commands vs. Skills**: Everything in `.claude/commands/` requires an explicit `/[command-name]` trigger by the user. Everything in `.claude/skills/` is auto-triggered dynamically based on the conversation context.
- **Spaced Repetition Final Stage**: When a word reaches the end of the spaced repetition cycle, it receives a **Final Exam** wrapping up the learned vocab. Passed words are moved to a separate "overview" section and are no longer actively asked.
- **Offline Capabilities**: If Appwrite endpoints fail, the app gracefully degrades into a "read-only offline mode" leveraging `AsyncStorage`.
- **Complex Sequential Logic**: Any complex sequential flow (such as Audio questions with ElevenLabs TTS delays) must be managed by an isolated **component-level hook**.

---

## Conversation Snapshots (CRITICAL MANDATE)

**After EVERY response**, you must append a snapshot to `.claude/snapshots/YYYY-MM-DD_session-N.md`.
Never skip this step. This ensures context is retained across sessions.

_Format:_

### HH:MM

**User**: [1-2 sentence summary of what they asked]
**Claude**: [1-2 sentence summary of action taken]
**Preferences noted**: [Any new context or habits to remember]
