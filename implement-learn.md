# Implementation Plan: Learn Screen

This document provides a structured sequence of prompts and context for Claude to execute the implementation of the `src/app/(tabs)/learn.tsx` page.

## Overview
The goal is to transform the Learn tab into the core "Action Hub" for vocabulary acquisition, heavily utilizing spaced repetition and psychological momentum (reducing cognitive load to zero).

---

## 1. The "Immediate Action" Zone (Right under "Today's Words")
**Concept:** Give the user the exact 5 words they need to learn today, immediately visible and actionable.

**UI Elements:**
- **The Daily Stack:** Build a **literal overlapping 3D stack** utilizing `react-native-reanimated`. The cards should sit behind each other (scaled down and translated up/down) to give a tangible feeling of depth. 
  - The top card should elegantly blur out the definition to spark curiosity.
- **The Main CTA:** A vibrant, large `<Button variant="primary" size="lg" />` reading: *"Start Daily Session (5 words)"*.
- **Interaction:** When tapped, push the router to `/learning/session`.

**Scaffolding Setup:**
- You will need to create a placeholder screen file at `src/app/learning/session.tsx` using a `<SafeAreaView>` and `<BackButton />` so the navigation physically works.

---

## 2. The "Spaced Repetition" Queue
**Concept:** Separate the "New Words" from the "Review Words". Vocabulary only sticks if it's repeatedly reviewed over time.

**UI Elements:**
- **Review Block:** A sleek horizontal card dedicated to pending reviews.
- **Styling Details:** Use `expo-linear-gradient` to create a beautiful, glowing gradient border that wraps the card, ensuring it stands out from standard `<Card variant="elevated">` components. It should prominently display something like *"12 words need review"*.

---

## 3. "Word of the Day" Deep Dive
**Concept:** A highly engaging, premium editorial piece on a single fascinating word from their chosen field.

**UI Elements:**
- An edge-to-edge premium card layout.
- Sections: Etymology (history of the word), an interactive pronunciation audio button, and crucially, a real-world scenario (e.g. how a CEO/expert practically used that word).
- **Styling Details:** Hardcode a stunning, highly realistic mockup (e.g., for a sophisticated word like "Leverage", "Synergy", or "Ameliorate"). Focus purely on making the typography, spacing, and layout look like a premium subscription app. (Dynamic data wiring is deferred to `pending-tasks.md`).

---

## Instructions for Claude:
1. Thoroughly read `src/app/(tabs)/learn.tsx` to understand the current layout context.
2. Ensure you have `expo-linear-gradient` imported and set up.
3. Scaffold `src/app/learning/session.tsx`.
4. Build out the three sections natively inside `learn.tsx` using the custom mockups exactly as defined above.
