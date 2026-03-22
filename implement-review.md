# Implementation Plan: Review Screen

This document provides a structured sequence of prompts and context for Claude to execute the implementation of the `src/app/(tabs)/review.tsx` page.

## Overview

The goal is to transform the Review tab into the **"Mastery Vault"** — a highly functional, searchable library of every single word the user has unlocked, heavily focusing on data visibility and rapid access.

---

## 1. Top Bar: Search & Filter

**Concept:** Allow users to instantly look up a word they learned so they can use it at work today.
**UI Elements:**

- **Search Bar:** A clean `<TextInput>` at the top allowing real-time filtering of the vocabulary list. Use a magnifying glass icon.
- **Filter Chips:** A scrollable horizontal list of pills below the search bar:
  - `All` (default selected)
  - `Learning` (words actively in the spaced repetition cycle)
  - `Struggling` (words with high failure rates)
  - `Mastered` (words completed the cycle)

---

## 2. The Vocabulary List

**Concept:** A master database list of their progress.
**UI Elements:**

- **List Layout:** Use a `FlatList` (or `FlashList` if configured) to render all words the user has initiated.
- **Card Design:** Each row/card should show the physical word, its phonetic spelling, and a solid clean presentation of its core definition.
- **Visual Mastery Meter:** On the right side of the card, implement a 5-bar "signal strength" style indicator.
  - If `intervalIndex === 0`, 1 bar is lit.
  - If `intervalIndex === 4` (or `status === 'mastered'`), all 5 bars are lit in a bright success color (like `colors.primaryGreen`).
  - If the user is struggling (e.g., `totalAttempts` is much higher than `correctAttempts`), color the bars distinctly (like orange/red) to indicate friction.

---

## 3. Interaction & Navigation

**Concept:** Deep-diving into the context.
**UI Elements:**

- **Tap Behavior:** Clicking any word row instantly routes the user to `src/app/word/[id].tsx` (the dedicated deep dive dictionary page) so they can reference alternative examples, hear the audio pronunciation, or review its etymology.

---

## Instructions for Claude:

1. Thoroughly read `src/app/(tabs)/review.tsx` to understand the current layout shell.
2. Build the `MasteryMeter` component (a small row of 5 rounded rectangle bars).
3. Connect the list to `useUserStore` / `userWords` array. (If the backend store is empty during development, map out a visually rich `MOCK_VAULT` array containing 5-6 sample words to ensure the filtering logic and meter coloring works perfectly before live-wiring it).
4. Ensure the UI feels sleek, dark, and perfectly native.
