---
name: clean-cache
description: >
  Clears the local application cache. Trigger this ONLY when the user explicitly uses 
  the command "/clean-cache". Useful for wiping ElevenLabs audio caches and Appwrite 
  data locally to resolve weird state issues during development.
---

# Clean Cache Command

## Goal
Safely wipe out local `AsyncStorage` and `expo-file-system` caches to provide a fresh state for development and testing.

## Step-by-Step Process

### Step 1 — Confirm Scope
Ask the user if they want to:
1. Clear *only* the ElevenLabs audio cache (FileSystem)
2. Clear *only* the Appwrite/Zustand local storage cache (AsyncStorage)
3. Clear **everything** (Full wipe)

### Step 2 — Execute
Provide the specific React Native/Expo code to run, or if requested, execute the wipe utility script in the project terminal.

For AsyncStorage (Zustand):
`AsyncStorage.clear()`

For FileSystem (Audio):
`FileSystem.deleteAsync(FileSystem.cacheDirectory, { idempotent: true })`

### Step 3 — Follow-Up
Remind the user to reload the app (`r` in the Expo console) for the cache wipe to take full effect.

## Rules
- **Requires Explicit Trigger**: Only run when the user types `/clean-cache`.
- Match language to the user: if they write in Turkish, respond in Turkish.
