---
name: generate-dummy-data
description: >
  Populates the Appwrite project with mock vocabulary words and test users. 
  Trigger this ONLY when the user explicitly uses the command "/generate-dummy-data".
---

# Generate Dummy Data Command

## Goal
Flood the Appwrite endpoints with mock words and testing users to battle-test the UI and queries without manually entering data.

## Step-by-Step Process

### Step 1 — REQUIRE APPROVAL (MANDATORY)
Ask the user: "Are you sure you want to generate dummy data? This will write to your Appwrite database. (Respond with Yes to proceed)."
**DO NOT proceed without explicit approval.**

### Step 2 — Gather Specs
Once approved, ask:
- How many words do you need?
- Which field/level should they be tagged with?

### Step 3 — Execute Script
Write or run a Node script (e.g., `scripts/generate-dummy-data.ts`) utilizing the `node-appwrite` Server SDK to rapidly insert the requested mock documents.

### Step 4 — Follow-Up
Confirm insertion success and suggest checking the Appwrite dashboard or refreshing the app to view the newly hydrated UI.

## Rules
- **Requires Explicit Trigger**: Only run when the user types `/generate-dummy-data`.
- **CRITICAL**: Never execute database writes without explicit user approval.
- Match language to the user: if they write in Turkish, respond in Turkish.
