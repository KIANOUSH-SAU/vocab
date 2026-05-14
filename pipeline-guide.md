# Word Pipeline Guide

End-to-end reference for every script in `scripts/`. Pipeline order is
**score → enrich → seed → (sift / fix / doctor)** with the orchestrator
`runPipeline.ts` wiring the first three plus an automatic repair pass.

All commands are run from the project root. All TypeScript scripts auto-load
environment variables from `.env` via `node --env-file=.env --import tsx ...`
(already wired in `package.json`).

---

## Required environment

For any script that talks to Appwrite or Claude, you need these in `.env`:

```
APPWRITE_ENDPOINT=...                # or EXPO_PUBLIC_APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID=...              # or EXPO_PUBLIC_APPWRITE_PROJECT_ID
APPWRITE_DATABASE_ID=...             # or EXPO_PUBLIC_APPWRITE_DATABASE_ID
APPWRITE_API_KEY=...                 # server-side key — NOT EXPO_PUBLIC
APPWRITE_WORDS_COLLECTION_ID=words   # optional, defaults to "words"
ANTHROPIC_API_KEY=...                # or EXPO_PUBLIC_CLAUDE_API_KEY
```

---

## Pipeline overview

| Step | Script                   | Purpose                                                                      | Reads                         | Writes                       |
| ---- | ------------------------ | ---------------------------------------------------------------------------- | ----------------------------- | ---------------------------- |
| 0    | `cefr-words-{level}.txt` | Source list (one word per line)                                              | —                             | —                            |
| 1    | `scoreWords.ts`          | Score each word for usability + level fit                                    | `data/cefr-words-{level}.txt` | `data/scored-{level}.json`   |
| 2    | `enrichWords.ts`         | Add phonetic, POS, definition, example, context, distractors                 | `data/scored-{level}.json`    | `data/enriched-{level}.json` |
| 3    | `seedAppwrite.ts`        | Upsert into Appwrite `words` collection                                      | `data/enriched-{level}.json`  | Appwrite `words`             |
| —    | `wordFixer.ts`           | Auto-repair pass after seeding (definition/example/context/phonetic)         | Appwrite `words`              | Appwrite `words`             |
| —    | `wordSifter.ts`          | Audit + delete bad word docs, AI-verify content                              | Appwrite `words`              | Appwrite `words`             |
| —    | `wordDoctor.ts`          | Standalone checkup: detect + repair missing fields **including distractors** | Appwrite `words`              | Appwrite `words`             |
| —    | `wipeWords.ts`           | Destructive cleanup of word docs                                             | Appwrite `words`              | Appwrite `words`             |
| —    | `buildPlacementTest.ts`  | Build the placement-test question bank                                       | —                             | placement test docs          |

---

## End-to-end orchestrator

`scripts/runPipeline.ts` runs **score → enrich → seed → fix** for a single
level (or every level with `--all`). Use this for fresh seeding of a level.

```bash
npm run pipeline -- --level A1                       # full pipeline for A1
npm run pipeline -- --level A1 --threshold 5         # only keep usabilityScore ≥ 5 + perfect-fit
npm run pipeline -- --level A1 --skip-seed           # score + enrich only (no DB write)
npm run pipeline -- --level A1 --seed-only           # seed from existing enriched JSON
npm run pipeline -- --level A1 --skip-fix            # skip the post-seed wordFixer pass
npm run pipeline -- --level A1 --resume              # reuse existing scored/enriched files
npm run pipeline -- --all                            # run for A1..C1 in sequence
```

---

## Step 1 — `scoreWords.ts`

Calls Claude in batches to score each word from the source file on
`usabilityScore` (1-10) and `levelFit` ("below" | "perfect" | "above").
Writes after every batch so a crash never costs you 40+ words.

```bash
npm run pipeline:score -- --level A1
npm run pipeline:score -- --level A1 --threshold 5
npm run pipeline:score -- --level A1 --resume        # skip words already scored
```

- Input: `data/cefr-words-{level}.txt` (one word per line; `#` lines are skipped)
- Output: `data/scored-{level}.json`
- Retries: up to 4× on 429/5xx/network with exponential backoff
- Threshold: filter applied downstream — scoring itself keeps everything

---

## Step 2 — `enrichWords.ts`

For each qualifying scored word, looks up phonetic + part-of-speech from the
Free Dictionary API, then asks Claude to produce a **level-appropriate**
definition, example sentence, context passage, and 3 multiple-choice
distractors. Caches dictionary results to disk and re-uses them on `--resume`.

```bash
npm run pipeline:enrich -- --level A1
npm run pipeline:enrich -- --level A1 --threshold 5
npm run pipeline:enrich -- --level A1 --resume       # reuse dictionary cache + enriched JSON
```

- Input: `data/scored-{level}.json`
- Output: `data/enriched-{level}.json`
- Claude is told to obey the level's `LEVEL_RULES` (vocab/grammar caps)
- Missing words in a Claude batch response are retried automatically

---

## Step 3 — `seedAppwrite.ts`

Upserts enriched words into the Appwrite `words` collection, keyed by
`(word, level)`. Skips any record missing a required field. If a doc already
exists, it updates only when the new content is _richer_ (longer definition /
example or higher usabilityScore).

```bash
npm run pipeline:seed -- --level A1
npm run pipeline:seed -- --level A1 --dry-run        # preview only, no writes
```

- Input: `data/enriched-{level}.json`
- Required fields: `word, phonetic, partOfSpeech, definition, exampleSentence, contextPassage, distractors[3]`

---

## `wordFixer.ts` — post-seed repair pass

Walks every word doc in Appwrite and fills in missing **phonetic, definition,
example, contextPassage**. Used as the automatic step 4 of `runPipeline.ts`.
**Does not handle distractors or partOfSpeech** — use `wordDoctor` for those.

```bash
npm run pipeline:fix                                 # fix every level
npm run pipeline:fix -- --level B1
npm run pipeline:fix -- --level B1 --dry-run         # audit only
npm run pipeline:fix -- --level B1 --yes             # skip confirmation
npm run pipeline:fix -- --level B1 --keep-log        # save diff to data/
npm run pipeline:fix -- --level B1 --revise          # ALSO regenerate definition+example for every word
```

- Phonetic comes from Free Dictionary first, Claude only as fallback
- Multi-word nonsense (e.g. "five number") is skipped — use `wordSifter` to delete
- Saves a diff JSON to `data/fix-report-{level}-{timestamp}.json` with `--keep-log`

---

## `wordSifter.ts` — quality gate + AI verification

Audits every word doc and flags entries to **purge** (missing phonetic,
nonsensical multi-word entries, missing/short content). For survivors, asks
Claude to verify part of speech and regenerate level-appropriate content,
then marks the doc `aiVerified: true`.

```bash
npx tsx scripts/wordSifter.ts                        # audit all levels
npx tsx scripts/wordSifter.ts --level A1
npx tsx scripts/wordSifter.ts --level A1 --dry-run   # preview only
npx tsx scripts/wordSifter.ts --level A1 --yes       # skip confirmation
npx tsx scripts/wordSifter.ts --keep-log             # save report to data/
```

(No `npm` shortcut — invoke via `npx tsx` directly.)

---

## `wordDoctor.ts` — standalone checkup

Independent health check designed to be run any time. Detects + repairs:

- missing or malformed **distractors** (must be exactly 3 non-empty strings)
- missing **partOfSpeech**
- missing **phonetic**, **definition**, **example**, **contextPassage**

For any flagged doc, all of its missing fields get filled in the same
Claude batch — generated content respects the **doc's own stored level**, not
the run's `--level` flag. Not auto-wired into `runPipeline.ts`.

```bash
npm run pipeline:doctor                              # checkup, every level
npm run pipeline:doctor -- --level B1                # one level only
npm run pipeline:doctor -- --dry-run                 # audit only, no writes
npm run pipeline:doctor -- --yes                     # skip confirmation
npm run pipeline:doctor -- --keep-log                # save diff to data/doctor-report-*.json
npm run pipeline:doctor -- --only-distractors        # ignore other fields
npm run pipeline:doctor -- --limit 100               # only scan the first 100 docs ($id asc)
```

Flags compose freely, e.g.:

```bash
npm run pipeline:doctor -- --level B1 --only-distractors --dry-run --keep-log
npm run pipeline:doctor -- --limit 100 --dry-run --keep-log
```

---

## `wipeWords.ts` — destructive cleanup

Deletes word documents. Requires explicit confirmation (or `--yes`). Does
NOT touch `userwords`, `users`, or any other collection.

```bash
npm run pipeline:wipe -- --level A1                  # wipe only A1 words
npm run pipeline:wipe -- --all-levels                # wipe every word
npm run pipeline:wipe -- --level A1 --yes            # skip confirmation
npm run pipeline:wipe -- --all-levels --dry-run      # preview only
```

⚠️ Pair with `pipeline:seed` to rebuild a level from scratch.

---

## `buildPlacementTest.ts`

Interactive script that generates the placement-test question bank via
Claude. Run when you need to rebuild the test or expand its coverage.

```bash
npm run pipeline:build-test
```

---

## Diagnostic scripts (`.js`, ad-hoc)

These are debugging utilities, not part of the pipeline proper. Run with
`node scripts/<file>.js` after loading `.env` via `dotenv`.

| Script             | Purpose                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| `diagnose.js`      | Print Appwrite env + per-level word counts                                     |
| `diagnoseAa.js`    | Inspect a specific user's `userwords` and validate referenced words exist      |
| `repairAaState.js` | Clear stuck daily-completion state for users whose `lastActiveDate` is "today" |

---

## Recommended recipes

**Fresh-seed a level from a `.txt` file:**

```bash
npm run pipeline -- --level B1
```

**Re-check the DB after manual edits:**

```bash
npm run pipeline:doctor -- --dry-run --keep-log
npm run pipeline:doctor -- --yes
```

**Just fix words missing distractors:**

```bash
npm run pipeline:doctor -- --only-distractors --yes
```

**Burn it all down and start over for one level:**

```bash
npm run pipeline:wipe -- --level B1 --yes
npm run pipeline -- --level B1
```

**Spot-check on a small slice:**

```bash
npm run pipeline:doctor -- --limit 100 --dry-run --keep-log
```
