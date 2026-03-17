---
name: new-screen
description: >
  Scaffold a new Expo Router screen for the Vocab app. Use when the user says
  "create a new screen", "add a screen for X", "scaffold screen", "new page",
  "new route", or provides a screen name/route to create. Do NOT trigger for
  component creation without routing — use /new-component instead.
---

# New Screen Skill

## Goal
Scaffold a complete, convention-compliant Expo Router screen file — dark-themed,
properly typed, and ready for the user to fill in business logic.

---

## Step-by-Step Process

### Step 1 — Clarify the Screen
Confirm with the user:
- **Screen name** (e.g., `Settings`, `WordDetail`)
- **Route path** (e.g., `(tabs)/settings`, `word/[id]`)
- **Does it need data?** If yes, a matching hook stub will be created

If the user already provided `$ARGUMENTS`, parse the name and route from it.

### Step 2 — Scaffold the File
Create the screen file at the correct path under `app/` (root level, NOT `src/app/`).

Use this template:
```tsx
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'

export default function ScreenName() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Screen Title' }} />
      {/* TODO: main content */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
})
```

Ensure:
- Dark theme background (`#0D0D0D`)
- Default export (Expo Router requirement)
- `SafeAreaView` from `react-native-safe-area-context`
- `Stack.Screen` options with a sensible title
- `StyleSheet.create` at the bottom
- `// TODO` comment for main content

### Step 3 — Create Hook Stub (if needed)
If the screen needs data, create a matching hook in `src/hooks/` following naming convention `use[ScreenName].ts`.

### Step 4 — Follow-Up
After scaffolding, offer:
1. "Want me to add navigation to this screen from another screen?"
2. "Should I create a matching hook for data fetching?"
3. "Want me to add tab bar configuration for this screen?"

---

## Rules
- Screen files go in `app/` (root level), NOT `src/app/`
- Always use default export (Expo Router requirement)
- Always use dark theme background `#0D0D0D`
- Use `SafeAreaView` from `react-native-safe-area-context`
- Use `StyleSheet.create` — no inline styles
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `app/CLAUDE.md` — Expo Router screen rules
- `src/constants/theme.ts` — design system values

---

## Self-Improvement
After each screen creation, note:
- Common screen patterns the user requests
- Any custom layout preferences
- Whether the user typically needs hooks with screens
