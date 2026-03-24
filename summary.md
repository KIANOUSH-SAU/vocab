# Vocab App Architecture Summary

This document provides a high-level overview of the application's routing map, explaining the purpose of each screen in the `(onboarding)` flow, the core `(tabs)`, and specialized sub-pages.

---

## 1. Onboarding Flow (`src/app/(onboarding)`)

These screens are designed entirely to capture the user's career context and assess their existing vocabulary level before throwing them into the app.

- **`index.tsx` (Welcome):** The visually rich landing page. Introduces the app's value proposition with the dynamic wave animation. Contains the "Get Started" and "I already have an account" CTAs.
- **`interests.tsx`:** The user selects their specific career field(s) — e.g., Engineering, Health & Medicine, Law. This is crucial as it filters the entire database to only show vocabulary relevant to their profession.
- **`placement-test.tsx`:** A short, interactive multi-choice quiz designed to calibrate their starting difficulty.
- **`level-result.tsx`:** The "Reveal" screen. It analyzes their test answers and assigns them a CEFR-style proficiency level (e.g., B2 Upper Intermediate).
- **`auth/signup.tsx`:** The account creation gate. Captures Name, Email, and Password or handles OAuth (Google/Apple) to create their Appwrite document.
- **`auth/login.tsx`:** The returning user gate. Logs them in to their existing Appwrite session.

---

## 2. Main Navigation (`src/app/(tabs)`)

The core interface of the app once the user is authenticated (or exploring as a guest).

- **`home.tsx` (The Dashboard):** The landing zone. Designed for instant motivation and momentum. Contains the "Daily Stack" to jumpstart learning, a summary of their Mastery Rings (sessions & words learned), and premium "Mini-Course" horizontal banners (e.g., _Pronounce like a Pro_).
- **`learn.tsx` (The Action Engine):** Dedicated purely to acquisition. Hosts the actual 3D flashcard stack for today's 5 new words, a distinct glowing "Spaced Repetition Review" queue, and the beautifully editorial "Word of the Day" deep dive.
- **`review.tsx` (The Mastery Vault):** A searchable, highly practical library of every word they've ever unlocked. Each word features a 5-bar visual "signal strength" mastery meter to instantly show their cognitive retention. They can filter by `Learning`, `Struggling`, or `Mastered`.
- **`stats.tsx` (Profile & Analytics):** A dual-purpose screen. If they are a guest, this screen acts as a locked Upsell/Auth gate. If logged in, it acts as their Profile Settings (Log Out, Name/Fields) combined with a high-dopamine metric 2x2 grid (Current Streak, Accuracy Rate, etc) and a 7-day activity heatmap.

---

## 3. Specialized Sub-Pages

These are dynamic, detail-oriented screens that overlay the main tabs, activated when a user clicks a specific item.

- **`word/[id].tsx` (Deep Dive Dictionary):** This opens whenever the user taps a word anywhere in the app (like hitting a word in the Mastery Vault). It renders a dedicated, full-screen breakdown of that specific word including:
  - Phonetic spelling & part of speech.
  - Interactive audio button to hear the exact pronunciation.
  - Detailed etymology (history).
  - Career-specific, real-world scenario examples (e.g., "How an Engineer would use this in a standup").
- **`modules/pronunciation.tsx`:** An interactive sub-screen triggered from the Home Dashboard aimed at training oral skills.
- **`modules/letters.tsx`:** An interactive sub-screen triggered from the Home Dashboard aimed at training written email etiquette overseas.
- **`learning/session.tsx`:** The actual spaced-repetition flashcard engine that executes when they press "Start Daily Session".
