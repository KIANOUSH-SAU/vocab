---
name: smoothness-check
description: >
  Validates the operational stability of the app across iOS, Android, and Web, 
  checks GitHub Actions CI status, and reviews recent session snapshots to ensure 
  previous successes aren't broken. Trigger ONLY when the user uses "/smoothness-check".
---

# Smoothness Check Command

## Goal
Rapidly verify the health of the project by checking CI workflows, cross-platform build stability, and historical context from `.claude/snapshots/`, ensuring that working features haven't degraded.

## Step-by-Step Process

### Step 1 — Review Historical Context (Snapshots)
Read the most recent `.claude/snapshots/` files.
- Identify what features were most recently marked as "working" or "completed".
- Determine if the current state of those files has drifted.

### Step 2 — Verify CI / GitHub Actions
Instruct the user on the status of their GitHub Actions.
1. Run `gh run list` (if GitHub CLI is available) or instruct the user to check the repo's Actions tab.
2. Ensure the `.github/workflows/ci.yml` passes the Type generation, linting, and basic tests.

### Step 3 — Platform Verification (Local)
Prompt the explicit testing of all 3 target platforms.
- **Web**: Run `npm run web` and verify no Metro bundling errors.
- **iOS**: Run `npm run ios` and ensure successful pod installation & build.
- **Android**: Run `npm run android` and ensure Gradle builds successfully.

### Step 4 — Report Summary
Report back to the user with a structured status board:
- Snapshot Context Retained: [Yes/No]
- CI Status: [Passing/Failing]
- iOS Build: [Smooth/Errors]
- Android Build: [Smooth/Errors]
- Web Build: [Smooth/Errors]

## Rules
- **Requires Explicit Trigger**: Only run when the user types `/smoothness-check`.
- Never guess the build status — actual terminal execution or CI output must be consumed.
- Match language to the user: if they write in Turkish, respond in Turkish.
