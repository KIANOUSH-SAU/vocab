---
name: scaffold-word-pipeline
description: >
  Run the word curation pipeline for a specific field and level combination.
  Use when the user says "scaffold word pipeline", "run word pipeline", "score
  words for X", "seed words", "populate word database", "set up vocabulary data",
  or mentions setting up CEFR word lists for a specific field/level. This is a
  one-time setup script, not runtime code.
---

# Scaffold Word Pipeline Skill

## Goal
Set up or refresh the vocabulary database by scoring words via Claude API for
field relevance and usability, then seeding them into Appwrite.

---

## Step-by-Step Process

### Step 1 — Clarify Field and Level
Confirm with the user:
- **Field** (engineering, health, law, sports, education)
- **Level** (A1, A2, B1, B2, C1)

If the user already provided `$ARGUMENTS`, parse field and level from it.

### Step 2 — Review Current Implementation
Read these files to understand the current state:
- `src/services/aiService.ts` — Claude API integration
- `src/services/vocabularyService.ts` — word data operations

### Step 3 — Show Pipeline Preview
Present to the user:
1. The Claude API prompt that will score words for the given field
2. Expected output format (JSON array of scored words)
3. The Appwrite query for storing/updating words

### Step 4 — Scaffold Scripts (if needed)
If pipeline scripts don't exist, create:
- `scripts/scoreWords.ts` — takes field + level, scores words via Claude API, outputs JSON
- `scripts/seedAppwrite.ts` — takes scored JSON, upserts into Appwrite `words` collection

Pipeline flow:
```
raw CEFR word list (CSV or JSON)
  -> scoreWords.ts (Claude API rates field relevance + usability)
  -> scored-words-[field]-[level].json
  -> seedAppwrite.ts (upsert into Appwrite words collection)
```

### Step 5 — Follow-Up
After scaffolding, remind the user:
- This is a one-time setup script, not runtime code
- Claude API costs are incurred — batch efficiently (50 words per request)
- Appwrite upsert uses word text as unique identifier to avoid duplicates

Offer:
1. "Want me to run the pipeline now for a specific field/level?"
2. "Should I add a dry-run mode to preview scoring without API calls?"
3. "Want me to set up all 25 field/level combinations?"

---

## Rules
- Always batch 50 words per Claude API request to minimize costs
- Use word text as unique identifier for Appwrite upserts
- Scripts go in `scripts/` directory, not `src/`
- Never run the pipeline without user confirmation (costs money)
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `src/services/aiService.ts` — Claude API integration
- `src/services/vocabularyService.ts` — word data operations
- `src/types/word.ts` — Word type definition

---

## Self-Improvement
After each pipeline run, note:
- Which fields/levels have been populated
- Any quality issues with word scoring
- Optimal batch sizes for API efficiency
