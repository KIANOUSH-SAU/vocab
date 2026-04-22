---
name: debug
description: >
  Diagnoses and tests UI and logic issues across Android, iOS, and Web. 
  Trigger this ONLY when the user explicitly uses the command "/debug".
---

# Debug Command

## Goal
Systematically test and debug logic and UI components to ensure they work seamlessly across Android, iOS, and Web platforms.

## Step-by-Step Process

### Step 1 — Identify the Issue
Ask the user:
- What exactly is failing or looking incorrect?
- Is it isolated to a specific platform (Android/iOS/Web) or happening on all of them?

### Step 2 — Logic vs UI Verification
**If UI Issue:**
- Check standard React Native pain points: `SafeAreaView` usage, flexbox constraints, platform-specific shadows/elevation, and `react-native-reanimated` worklets.

**If Logic Issue:**
- Check Zustand store states, Appwrite network promises, and component-level hook lifecycles.

### Step 3 — Provide Fix and Test Plan
Provide the corrected code and explicitly mention how to test it on the affected platform (e.g., "Press 'i' in Expo to open iOS simulator and verify the gesture handler").

## Rules
- **Requires Explicit Trigger**: Only run when the user types `/debug`.
- Always consider platform differences (Web lacks some native modules, Android/iOS have different SafeArea behaviors).
- Match language to the user: if they write in Turkish, respond in Turkish.
