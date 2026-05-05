# Vocabulary Curation Pipeline — Report

## 1. Overview

The vocabulary database is not handcrafted; it is produced by a deterministic, three-stage automated pipeline that takes a raw CEFR word list and outputs validated, level-appropriate documents in Appwrite. The stages are **score → enrich → seed**, plus a thin orchestrator that ties them together. Each stage writes its output to disk, so failures are isolated and partially-completed work is never lost. The pipeline is invoked from the command line:

```ts
// scripts/runPipeline.ts:88-100
run(
  `npx tsx scripts/scoreWords.ts --level ${level} --threshold ${threshold}${resumeFlag}`,
);
run(
  `npx tsx scripts/enrichWords.ts --level ${level} --threshold ${threshold}${resumeFlag}`,
);
run(`npx tsx scripts/seedAppwrite.ts --level ${level}`);
```

_— `scripts/runPipeline.ts:88-100`_

A `--resume` flag propagates to every step, allowing a crashed pipeline to be restarted without reprocessing already-completed work or re-incurring API cost.

---

## 2. Stage 1 — Word List Curation

The pipeline begins with a plain-text CEFR word list — one entry per line, with optional part-of-speech annotations stripped during ingestion. This format is intentionally human-editable, giving the curriculum designer direct control over the vocabulary scope at each level.

```
a, an     indefinite article
about     prep., adv.
above     prep., adv.
across    prep., adv.
action    n.
```

_— `data/cefr-words-A1.txt:1-5`_

Tokens are lower-cased, parenthetical annotations stripped, blank/comment lines filtered, and duplicates removed before scoring begins:

```ts
// scripts/scoreWords.ts:280-292
const allWords = fs
  .readFileSync(wordListPath, "utf-8")
  .split("\n")
  .map((w) =>
    w
      .replace(/\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|...).*$/i, "")
      .trim()
      .toLowerCase(),
  )
  .map((w) => w.replace(/\s*\(.*?\)\s*/g, "").trim())
  .filter((w) => w.length > 0 && !w.startsWith("#"));

const uniqueWords = [...new Set(allWords)];
```

_— `scripts/scoreWords.ts:280-292`_

---

## 3. Stage 2 — Level-Aware Scoring

The scoring stage (`scoreWords.ts`) sends the cleaned word list to the Claude API in batches of 40. For each word, Claude is asked to assign a 1–10 _usability score_ — reflecting real-world frequency at the target CEFR level — and a categorical _level fit_ (`below`, `perfect`, or `above`). This dual judgement separates two distinct dimensions: how _useful_ a word is and whether it actually _belongs_ at the requested level.

```ts
// scripts/scoreWords.ts:161-179 — the scoring prompt (excerpt)
content: `You are a CEFR vocabulary assessment expert. Evaluate each word below for a CEFR ${level} English learner.

1. **usabilityScore** (1-10): How useful is this word in everyday communication for a ${level} learner?
2. **levelFit**: one of
   - "below"   → too easy for ${level}
   - "perfect" → genuinely belongs at ${level}
   - "above"   → too advanced
3. **notes**: one short sentence on typical use / register.

Return ONLY a valid JSON array... You MUST return exactly ${words.length} items, one for each input word, in the same order.`;
```

_— `scripts/scoreWords.ts:161-179`_

Only words classified as `perfect` _and_ meeting the usability threshold are passed downstream. Words that are too easy, too hard, or too obscure are dropped at this gate, ensuring the next stage spends its more expensive AI calls only on viable candidates:

```ts
// scripts/scoreWords.ts:380-388
const kept = allScored.filter(
  (w) => w.usabilityScore >= threshold && w.levelFit === "perfect",
);
const tooEasy = allScored.filter((w) => w.levelFit === "below").length;
const tooHard = allScored.filter((w) => w.levelFit === "above").length;
```

_— `scripts/scoreWords.ts:380-388`_

---

## 4. Stage 3 — Level-Appropriate Enrichment

Enrichment combines two complementary sources. The **Free Dictionary API** supplies an objective, level-agnostic phonetic transcription and part-of-speech, while the **Claude API** rewrites every learner-facing string (definition, example sentence, contextual passage) under strict per-level constraints. The dictionary's own definition is passed to Claude only as a meaning _hint_ — it is never copied verbatim, because dictionary prose is calibrated for adult native speakers, not A1 learners.

The level-specific writing rules are encoded explicitly in the prompt so that the same word produces a genuinely different output at A1 vs. C1:

```ts
// scripts/enrichWords.ts:84-105 — level rules (excerpt)
const LEVEL_RULES: Record<Level, string> = {
  A1: `A1 learners know ~500 of the most common English words. Rules:
- Use ONLY the simplest everyday words (is, has, go, see, eat, big, small, ...).
- Sentences should be 5-8 words, mostly present simple. Avoid relative clauses.
- No idioms, no phrasal verbs, no abstract nouns.
- Definitions should read like they were written for a 6-year-old.`,
  // ... A2, B1, B2 ...
  C1: `C1 learners are advanced. Rules:
- Use a wide vocabulary including less common synonyms and nuanced terms.
- Complex sentence structures, collocations, and register variation are expected.
- Definitions can explain connotation and typical contexts.`,
};
```

_— `scripts/enrichWords.ts:84-105`_

Those rules are injected directly into each Claude call:

```ts
// scripts/enrichWords.ts:336-355 — the enrichment prompt (excerpt)
content: `You are a vocabulary content writer for an English learning app. Your output is for CEFR ${level} learners.

${LEVEL_RULES[level]}

For each word below, produce a rewrite that STRICTLY respects the ${level} rules above. Do NOT copy the dictionary hint verbatim — it is only there for meaning reference.

1. **definition** — written at ${level}. Every word inside the definition must itself be at or below ${level}.
2. **exampleSentence** — one natural sentence using the word.
3. **contextPassage** — 2 short sentences giving extra context...`;
```

_— `scripts/enrichWords.ts:336-355`_

Dictionary requests are issued sequentially with a 120 ms delay, a 10 s abort timeout, and a single retry after a 1.5 s back-off. Earlier experiments with five concurrent workers triggered Free Dictionary's anti-abuse layer and produced only ~12% hit rates; the sequential paced approach restored near-complete coverage:

```ts
// scripts/enrichWords.ts:167-188 — dictionary fetcher classifies each outcome
async function fetchDictionaryOnce(word: string): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DICT_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${...}`,
                            { signal: controller.signal });
    if (res.status === 404) return { kind: "not_found" };
    if (res.status === 429) return { kind: "rate_limited" };
    if (!res.ok)            return { kind: "error" };
    // ...
  } finally { clearTimeout(timer); }
}
```

_— `scripts/enrichWords.ts:167-188`_

---

## 5. Stage 4 — Strict Seeding into Appwrite

The seeder applies a hard quality gate: a word is only written to the database if **every** content field is present and non-empty. Partial entries — typically those whose phonetic could not be retrieved — are dropped rather than producing visibly incomplete cards in the app.

```ts
// scripts/seedAppwrite.ts:161-175
const REQUIRED_FIELDS: (keyof EnrichedWord)[] = [
  "word",
  "phonetic",
  "partOfSpeech",
  "definition",
  "exampleSentence",
  "contextPassage",
];

function missingFields(word: EnrichedWord): string[] {
  return REQUIRED_FIELDS.filter((k) => {
    const v = word[k];
    return typeof v !== "string" || v.trim().length === 0;
  }) as string[];
}
```

_— `scripts/seedAppwrite.ts:161-175`_

Records are upserted on a composite **(word, level)** key, allowing the same lemma — for example "above" — to coexist as both a simple A1 entry and a more nuanced C1 entry, each with its own learner-targeted definition:

```ts
// scripts/seedAppwrite.ts:184-198 — upsert key
if (missingFields(word).length > 0) return "skipped";

const existing = await withRetry(
  () =>
    databases.listDocuments(dbId, collectionId, [
      Query.equal("word", word.word),
      Query.equal("level", word.level), // (word, level) is the identity
      Query.limit(1),
    ]),
  `list "${word.word}"`,
);
```

_— `scripts/seedAppwrite.ts:184-198`_

---

## 6. Cross-Cutting Concern — Reliability & Resumability

Because the pipeline performs hundreds of network calls per level — to Anthropic, Free Dictionary, and Appwrite — every external interaction is wrapped in an exponential-backoff retry guarded by a status-classification helper. Transient HTTP 429 / 5xx / network errors are retried up to four times; permanent errors fail fast.

```ts
// scripts/scoreWords.ts:89-117 — reusable retry shell
async function callClaudeWithRetry(
  anthropic: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  label: string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_CLAUDE_RETRIES; attempt++) {
    try {
      const message = await anthropic.messages.create(params);
      return message.content[0]?.type === "text" ? message.content[0].text : "";
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      if (!isRetryableStatus(status) || attempt >= MAX_CLAUDE_RETRIES)
        throw err;
      const delay = 2000 * Math.pow(2, attempt - 1); // 2s → 4s → 8s → 16s
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

_— `scripts/scoreWords.ts:89-117`_

Equivalent helpers protect Appwrite (`scripts/seedAppwrite.ts:122-141`) and the dictionary API (`scripts/enrichWords.ts:213-220`).

Output files are written through an atomic temp-then-rename pattern, so even an abrupt termination during writing leaves a parseable JSON file on disk:

```ts
// scripts/enrichWords.ts:136-140
function writeAtomic(filePath: string, data: string): void {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}
```

_— `scripts/enrichWords.ts:136-140`_

Combined with on-disk caches for both dictionary results (`.dict-cache-{level}.json`) and Claude responses (`.context-cache-{level}.json`), the pipeline is fully **resumable**: re-running with `--resume` reads back any already-completed work and only the unfinished words consume new API calls. This was the design decision that made the entire pipeline viable as a coursework artefact, where the cost of an unrecoverable mid-run failure on a 700-word level would otherwise have been prohibitive.

---

## 7. Future Work — Celebrity Voice Cloning

A planned extension to the pipeline introduces **celebrity-voice audio** for every seeded word, layered on top of the existing text content. The intended provider is **ElevenLabs**, whose voice-cloning API supports producing high-fidelity speech from a small voice sample, which would let the app pronounce each word — and, optionally, the example sentence — in the voice the learner has chosen during onboarding.

The integration would extend the seeding stage rather than replace any existing step. After a word is upserted, an additional pass would:

1. For each enabled celebrity voice, request a short audio rendering of the word (and optionally the example sentence) from ElevenLabs.
2. Persist the resulting MP3 / OGG asset to a stable storage location.
3. Write the asset's URL back to the existing `audioUrl` field on the word document (currently seeded as an empty string — see `scripts/seedAppwrite.ts:155`).

The surrounding technology choices for this layer — specifically the audio storage backend (Appwrite Storage, an external object store, or a CDN), the on-device caching strategy, and the licensing / consent handling for the cloned voice samples — are **not yet specified**. They will be evaluated separately once the ElevenLabs integration prototype is in place. The decision was deferred deliberately: locking those choices in before measuring real audio request volume and latency from a mobile client would be premature.

The placeholder for the eventual audio reference already exists in the data model:

```ts
// scripts/seedAppwrite.ts:145-157 — payload includes audioUrl placeholder
function payloadFor(word: EnrichedWord) {
  return {
    word: word.word,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    definition: word.definition,
    exampleSentence: word.exampleSentence,
    contextPassage: word.contextPassage,
    level: word.level,
    usabilityScore: word.usabilityScore,
    audioUrl: "", // populated by the future ElevenLabs voice pass
  };
}
```

_— `scripts/seedAppwrite.ts:145-157`_

This keeps the schema forward-compatible: words seeded today will require no migration once the voice generation step is added, only an in-place update of their `audioUrl` field.
