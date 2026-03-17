---
name: new-component
description: >
  Scaffold a new reusable UI component for the Vocab app. Use when the user says
  "create a component", "new component", "build a component for X", "scaffold
  component", or provides a component name with a location. Do NOT trigger for
  screens (use /new-screen) or exercise components (use /new-exercise).
---

# New Component Skill

## Goal
Scaffold a reusable, properly typed UI component following the Vocab app's dark
theme design system and coding standards.

---

## Step-by-Step Process

### Step 1 — Clarify the Component
Confirm with the user:
- **Component name** (PascalCase, e.g., `Badge`, `WordCard`)
- **Location** under `src/components/` (e.g., `ui/`, `cards/`)
- **Purpose** — what does it render?

If the user already provided `$ARGUMENTS`, parse name and location from it.

### Step 2 — Scaffold the File
Create the component file at the correct path under `src/components/`.

Use this template:
```tsx
import { View, StyleSheet } from 'react-native'

interface Props {
  // define props here
}

/** Brief description of what this component does */
export function ComponentName({ }: Props) {
  return (
    <View style={styles.container}>
      {/* content */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // styles here
  },
})
```

Ensure:
- `Props` interface at the top
- Named export (NOT default)
- `StyleSheet.create` at the bottom — no inline styles except dynamic values
- No business logic inside — leave `// TODO: extract to hook` if needed
- Dark theme, 4pt spacing grid, minimum 44pt touch targets
- JSDoc comment above the component

### Step 3 — Follow-Up
After scaffolding, offer:
1. "Want me to add this component to an existing screen?"
2. "Should I create a matching hook for any logic?"
3. "Want me to add animation with reanimated?"

---

## Rules
- Named export only — no default export
- No business logic inside components — extract to hooks
- Follow design system: dark theme, 4pt spacing, 44pt touch targets
- `StyleSheet.create` at the bottom — no inline styles except dynamic values
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `src/components/CLAUDE.md` — component rules
- `src/constants/theme.ts` — design system values

---

## Self-Improvement
After each component creation, note:
- Common component patterns requested
- Whether the user prefers certain prop patterns
- Reuse opportunities across components
