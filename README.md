# Vocab

**Adaptive Vocabulary Learning Mobile Application with Audio Assisted Memorization**

_"Every word you learn today is a word you'll actually use."_

Vocab is a personalized English vocabulary learning application tailored to your field of interest and CEFR level. Unlike standard spaced-repetition apps, Vocab curates a daily selection of words directly relevant to your professional or academic domain. We combine field-aware curation with AI-driven context and celebrity voice audio feedback to make memorization engaging and effective.

## Core Concept

- **Domain-Specific:** Users select one or more fields (e.g., Engineering, Health, Law, Sports, Education) during onboarding.
- **Micro-Learning:** Receive 5 new, carefully selected words daily matching your English proficiency (A1 to C1).
- **Interactive Feedback:** Incorrect answers trigger AI-generated explanations, read aloud in your preferred ElevenLabs voice style.

## Key Features

- **Guest Mode:** Start immediately with a limited daily vocabulary (3 words), stored locally without needing an account.
- **Onboarding Placement:** Seamless placement test to immediately gauge your English level.
- **5 Exercise Types:** Swipe Cards, Fill in the Blank, Audio Questions, Multiple Choice, and Parts of Speech.
- **Smart Spaced Repetition:** Intervals of 1 → 3 → 7 → 14 → 30 days to ensure long-term mastery.
- **Progress Tracking:** Interactive stats screen and daily streak tracking to keep you motivated.

## Tech Stack

- **Mobile Environment:** React Native + Expo (SDK 52+)
- **Navigation:** Expo Router (file-based routing)
- **Backend / Database / Auth:** Appwrite
- **State Management:** Zustand + AsyncStorage
- **Animations / Gestures:** react-native-reanimated + react-native-gesture-handler
- **TTS / Voice:** ElevenLabs API for realistic voice styles
- **AI Integration:** Claude API (Anthropic) for word scoring and contextual explanations
- **Dictionary Data:** Free Dictionary API
- **Engagement:** expo-notifications & lock screen widgets (react-native-widget-extension for iOS / react-native-android-widget)

## Data Models

1. **words:** Contains word data, definitions, levels, fields, and AI usability scores.
2. **users:** Stores user profiles, levels, fields, and voice preferences.
3. **userWords:** Tracks individual spaced repetition progress for each user and word.
