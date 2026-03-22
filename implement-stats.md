# Implementation Plan: Stats (Profile) Screen

This document provides a structured sequence of prompts and context for Claude to execute the implementation of the combined Stats and Profile screen (`src/app/(tabs)/stats.tsx` or `profile.tsx`).

## Overview
The goal is to create a dynamic screen that acts as an authentication gate for guest users, and a rich, personalized analytics dashboard for registered users. It serves a dual purpose as both the "Stats" tab and the user's "Account Settings / Profile".

---

## 1. The Guest View (Authentication Gate)
**Concept:** If a user is not logged in (`userStore.isGuest === true`), the screen absolutely must not show any stats. Instead, it should act as an upsell for creating an account.

**UI Elements:**
- **Visuals:** A beautiful, slightly dimmed "locked" graphic or icon (e.g., a padlock layered over a blurred bar chart).
- **Messaging:** *"Track your mastery over time. Create a free account to unlock your career analytics and never lose your progress."*
- **CTAs:** Two prominent buttons pushing them to the auth flow:
  - `<Button label="Create Account" onPress={() => router.push('/(onboarding)/auth/signup')} variant="primary" />`
  - `<Button label="Log In" onPress={() => router.push('/(onboarding)/auth/login')} variant="ghost" />`

---

## 2. The Authenticated View: The Profile Header
**Concept:** The top section validates the user's identity and their chosen fields.
**UI Elements:**
- Their `name` and their primary `level` (e.g., B2).
- The `fields` they chose, rendered as small colored pills or badges (e.g., `Engineering`, `Business`).

---

## 3. The Authenticated View: The Stats Dashboard
**Concept:** Visual dopamine. Proving to the user that they are making tangible progress.
**UI Elements (MOCK THESE FOR NOW):**
- **The "High Score" Row:** 2x2 grid of simple metric cards:
  - *Current Streak* (e.g., 14 Days 🔥)
  - *Accuracy Rate* (e.g., 87% 🎯)
  - *Total Words Embedded* (e.g., 342 🧠)
  - *Time Spent Learning* (e.g., 2h 15m ⏳)
- **The Activity Heatmap:** Instead of importing a heavy chart library, use flexbox to build a simple "GitHub-style" contribution grid or a simple bar chart out of native `<View>` components showing their activity for the last 7 days.

---

## 4. Account Settings (The Footer)
**Concept:** Standard profile management.
**UI Elements:**
- A clear, red `<Button variant="danger">` or ghost button for **"Log Out"** mapped to `logoutSession()` in `appwriteService.ts`.
- (Optional placeholder) "Change Fields or Difficulty Level".

---

## Instructions for Claude:
1. Merge the concepts of "Stats" and "Profile".
2. Read the `userStore`'s `isGuest` boolean (or `user` object presence) to conditionally render the *Guest View* vs the *Authenticated View*.
3. Use strict native components to build the stats layout. Scaffold a hardcoded `MOCK_STATS` object to build the UI grid beautifully before wiring it up to Appwrite tracking data.
4. Ensure the layout relies strictly on your `@constants/theme` parameters.
