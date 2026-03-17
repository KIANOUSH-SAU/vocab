---
name: review-code
description: >
  Review the specified file or component for code quality, correctness, and
  adherence to Vocab app standards. Use when the user says "review this code",
  "check this file", "review X", "is this code correct", "audit this", or
  provides a file path asking for quality feedback. Do NOT trigger for general
  questions about code — only for explicit review requests.
---

# Review Code Skill

## Goal
Perform a thorough code review against the Vocab app's coding standards,
architecture rules, and design system — reporting specific issues with line
numbers and suggested fixes.

---

## Step-by-Step Process

### Step 1 — Identify the Target
Determine what to review:
- If the user provided `$ARGUMENTS`, read that file/component
- If not, ask: "Which file or component should I review?"

### Step 2 — Run the Checklist
Review against all 5 categories:

**TypeScript**
- [ ] No `any` types used
- [ ] All props have defined interfaces
- [ ] Return types declared on all functions
- [ ] Types imported from `src/types/` not redefined inline

**Architecture**
- [ ] No business logic inside components (should be in hooks)
- [ ] No direct Appwrite/API calls inside components (should be in services)
- [ ] No Zustand store writes inside services (services return data, stores consume it)
- [ ] No prop drilling beyond 2 levels

**Design System**
- [ ] Background colors match design system (`#0D0D0D`, `#1A1A1A`, `#242424`)
- [ ] Spacing uses 4pt grid
- [ ] Animations use `react-native-reanimated`, not RN core `Animated`
- [ ] Touch targets at least 44x44pt

**Performance**
- [ ] No unnecessary re-renders (memo/useCallback where needed)
- [ ] No large computations in render
- [ ] Audio/subscriptions cleaned up on unmount

**Exercise-specific** (only if reviewing an exercise)
- [ ] Accepts standard `ExerciseProps` interface
- [ ] Calls `onWrong` with correct parameters for AI explanation trigger
- [ ] No scoring logic inside — delegates to callbacks

### Step 3 — Report Findings
For each failing check, provide:
- The specific line number
- What's wrong
- A suggested fix

### Step 4 — Follow-Up
After the review, offer:
1. "Want me to fix the issues I found?"
2. "Should I review any related files?"
3. "Want me to add tests for this component?"

---

## Rules
- Always read the file before reviewing — never guess
- Report issues with specific line numbers
- Provide actionable fix suggestions, not just complaints
- Check all 5 categories for every review
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `CLAUDE.md` — project coding standards
- `src/constants/theme.ts` — design system values
- `src/components/exercises/CLAUDE.md` — exercise interface contract

---

## Self-Improvement
After each review, note:
- Most common issues found across reviews
- Which standards the codebase struggles with most
- Patterns that could be automated with linting rules
