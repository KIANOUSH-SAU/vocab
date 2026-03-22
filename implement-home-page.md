# Home Page Implementation Plan

**Objective:** Transform the blank `home.tsx` screen into an engaging, minimal dashboard featuring horizontal progress bars and premium-style mini-course modules.

## Context & Rules

- Do NOT use third-party charting libraries. Use native `react-native` Views to build pure CSS horizontal progress bars.
- Mock all user progress/stats data for now. (We will wire them to Appwrite/ Zustand later, tracked in `pending-tasks.md`).
- Ensure all styling strictly relies on the design system (`colors`, `spacing`, `radii` from `@constants/theme`).

---

## 1. The Dopamine Zone (Progress & Mastery)

**Concept:** Give the user an immediate sense of scale and momentum involving their sessions and learned words.

1. **Location:** Right below the "Today's Words" and "Hey, User" top section on the `home.tsx` `ScrollView`.
2. **Data (MOCK THIS):**
   ```ts
   const MOCK_PROGRESS = {
     sessionsCompleted: 2,
     weeklyGoal: 3,
     wordsMastered: 14,
     totalWords: 50,
   };
   ```
3. **UI Elements:**
   - A bold heading like **"Your Progress"**.
   - **Weekly Goal:** "Complete Sessions (2/3)". Provide a sleek horizontal progress bar that fills up (e.g. `width: '66%'`, `backgroundColor: colors.primaryGreen`).
   - **Vocabulary Mastery:** "Words Mastered (14/50)". Another horizontal progress bar, perhaps in a different theme color (e.g. `colors.blue` or `colors.purple`).

---

## 2. Career-Focused Mini-Modules

**Concept:** Quick, actionable tasks that let the user practice career-specific vocabulary in diverse contexts without committing to a massive main-path session.

1. **Location:** Below the Dopamine Zone.
2. **UI Elements:**
   - Stacked, full-width horizontal premium course banners. They should look rich (elevated cards, or maybe dark-themed gradients depending on the design system).
   - A title and subtext on the left, an icon on the right.
3. **The Modules:**
   - **"Pronounce like a Pro"**: Focuses on Audio & Phonics. (`router.push('/modules/pronunciation')`)
   - **"Letters Overseas"**: Focuses on Professional Emails/Writing. (`router.push('/modules/letters')`)
4. **Scaffolding Requirements:**
   - Create a new directory: `src/app/modules/`
   - Create `src/app/modules/pronunciation.tsx` and `src/app/modules/letters.tsx`.
   - These screens should just be basic `SafeAreaView` shells that include a `<BackButton onPress={() => router.back()} />` and placeholder header text representing the module.

---

## Instructions for Claude:

1. Thoroughly read `src/app/(tabs)/home.tsx` to understand the current layout context.
2. Scaffold the two empty module files securely.
3. Execute the UI updates inside `home.tsx` as written above, ensuring `router.push()` binds to the modules on tap.
