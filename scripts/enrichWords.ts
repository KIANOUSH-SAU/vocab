/**
 * Step 2 of the word pipeline — level-focused.
 * Takes scored words and enriches them with:
 *   - Free Dictionary API → phonetic + partOfSpeech (definition used as a hint)
 *   - Claude AI → a LEVEL-APPROPRIATE definition, exampleSentence, and contextPassage
 *
 * The Claude step rewrites definitions from scratch, constrained to the target
 * CEFR level's vocabulary and grammar. The dictionary definition is only passed
 * as a reference; it is NOT used verbatim.
 *
 * Robustness:
 *   - Dictionary fetch: sequential, 120ms pacing, 10s AbortController timeout,
 *     one retry after 1.5s backoff on 429/5xx/network. Dictionary cache is
 *     flushed to disk after every lookup.
 *   - Claude calls retry up to 4 times on 429/5xx/network with exponential
 *     backoff (2s → 4s → 8s → 16s).
 *   - Context map is flushed to disk after every batch; enriched output is
 *     rewritten after every batch.
 *   - --resume reuses any existing dictionary cache / enriched JSON so a crash
 *     doesn't force you to restart from word 1.
 *   - If Claude drops words from a batch response, missing words are retried.
 *
 * Input:  data/scored-{level}.json
 * Output: data/enriched-{level}.json
 *
 * Usage:
 *   npm run pipeline:enrich -- --level A1
 *   npm run pipeline:enrich -- --level A1 --threshold 5
 *   npm run pipeline:enrich -- --level A1 --resume
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// ─── Types & config ──────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const VALID_POS = ["noun", "verb", "adjective", "adverb", "other"] as const;
type PartOfSpeech = (typeof VALID_POS)[number];

const CONTEXT_BATCH_SIZE = 12;
const DICT_PACING_MS = 120;
const DICT_RETRY_DELAY_MS = 1500;
const DICT_TIMEOUT_MS = 10_000;
const MAX_CLAUDE_RETRIES = 4;
const MAX_MISSING_WORD_RETRIES = 1;

interface ScoredWord {
  word: string;
  usabilityScore: number;
  levelFit: "below" | "perfect" | "above";
  notes: string;
}

interface DictionaryResult {
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  rawDefinition: string;
}

interface EnrichedWord {
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  definition: string;
  exampleSentence: string;
  contextPassage: string;
  distractors: string[];
  level: Level;
  usabilityScore: number;
}

interface ContextResult {
  word: string;
  definition: string;
  exampleSentence: string;
  contextPassage: string;
  distractors: string[];
}

// ─── Level-specific prompt guidance ──────────────────────────────────────────

const LEVEL_RULES: Record<Level, string> = {
  A1: `A1 learners know ~500 of the most common English words. Rules:
- Use ONLY the simplest everyday words (is, has, go, see, eat, big, small, good, bad, me, you, it, this, that).
- Sentences should be 5-8 words, mostly present simple. Avoid relative clauses.
- No idioms, no phrasal verbs, no abstract nouns.
- Definitions should read like they were written for a 6-year-old.`,
  A2: `A2 learners know ~1000 common words. Rules:
- Everyday vocabulary only. Simple past and future ("will", "going to") are fine.
- Sentences 8-12 words. One clause per sentence, no nested clauses.
- Avoid idioms and academic language.`,
  B1: `B1 learners know ~2000 words. Rules:
- Use normal conversational vocabulary. Compound sentences are fine.
- Modals (can, should, might) and common phrasal verbs are OK.
- Avoid rare or technical vocabulary. Keep sentences ≤ 20 words.`,
  B2: `B2 learners know ~4000 words. Rules:
- Full range of everyday vocabulary + some abstract/academic words.
- Complex sentences, subordinate clauses, passive voice are fine.
- Avoid highly formal legal / scientific jargon unless the word itself is specialized.`,
  C1: `C1 learners are advanced. Rules:
- Use a wide vocabulary including less common synonyms and nuanced terms.
- Complex sentence structures, collocations, and register variation are expected.
- Definitions can explain connotation and typical contexts. Avoid dumbing things down.`,
};

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level = "B1";
  let threshold = 5;
  let resume = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) {
      const l = args[i + 1].toUpperCase();
      if (LEVELS.includes(l as Level)) level = l as Level;
      else {
        console.error(
          `Invalid level "${l}". Must be one of: ${LEVELS.join(", ")}`,
        );
        process.exit(1);
      }
    }
    if (args[i] === "--threshold" && args[i + 1])
      threshold = parseInt(args[i + 1], 10);
    if (args[i] === "--resume") resume = true;
  }
  return { level, threshold, resume };
}

// ─── IO helpers ──────────────────────────────────────────────────────────────

function writeAtomic(filePath: string, data: string): void {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}

// ─── Free Dictionary API ─────────────────────────────────────────────────────

type FetchOutcome =
  | { kind: "hit"; data: DictionaryResult }
  | { kind: "not_found" }
  | { kind: "rate_limited" }
  | { kind: "error" };

function parseDictEntry(entry: any): DictionaryResult {
  let phonetic = entry.phonetic || "";
  if (!phonetic && entry.phonetics?.length) {
    const withText = entry.phonetics.find((p: any) => p.text);
    if (withText) phonetic = withText.text;
  }

  const meaning = entry.meanings?.[0];
  const rawPos = (meaning?.partOfSpeech || "other").toLowerCase();
  const partOfSpeech: PartOfSpeech = (
    VALID_POS.includes(rawPos as any) ? rawPos : "other"
  ) as PartOfSpeech;

  const rawDefinition = meaning?.definitions?.[0]?.definition || "";
  return { phonetic, partOfSpeech, rawDefinition };
}

async function fetchDictionaryOnce(word: string): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DICT_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: controller.signal },
    );
    if (res.status === 404) return { kind: "not_found" };
    if (res.status === 429) return { kind: "rate_limited" };
    if (!res.ok) return { kind: "error" };

    const data = await res.json();
    const entry = data?.[0];
    if (!entry) return { kind: "not_found" };
    return { kind: "hit", data: parseDictEntry(entry) };
  } catch {
    return { kind: "error" };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDictionariesSequential(
  words: string[],
  existingCache: Record<string, DictionaryResult>,
  cachePath: string,
  onProgress?: (
    done: number,
    total: number,
    stats: { hits: number; notFound: number; errors: number },
  ) => void,
): Promise<{
  cache: Record<string, DictionaryResult>;
  stats: { hits: number; notFound: number; errors: number };
}> {
  const cache: Record<string, DictionaryResult> = { ...existingCache };
  const stats = { hits: Object.keys(cache).length, notFound: 0, errors: 0 };
  let flushCounter = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (cache[w]) {
      onProgress?.(i + 1, words.length, stats);
      continue;
    }

    let outcome = await fetchDictionaryOnce(w);
    if (outcome.kind === "rate_limited" || outcome.kind === "error") {
      await new Promise((r) => setTimeout(r, DICT_RETRY_DELAY_MS));
      outcome = await fetchDictionaryOnce(w);
    }

    if (outcome.kind === "hit") {
      cache[w] = outcome.data;
      stats.hits++;
    } else if (outcome.kind === "not_found") {
      stats.notFound++;
    } else {
      stats.errors++;
    }

    onProgress?.(i + 1, words.length, stats);

    // Flush cache every 20 lookups so a crash preserves progress
    flushCounter++;
    if (flushCounter >= 20) {
      writeAtomic(cachePath, JSON.stringify(cache, null, 2));
      flushCounter = 0;
    }

    if (i < words.length - 1) {
      await new Promise((r) => setTimeout(r, DICT_PACING_MS));
    }
  }

  // Final flush
  writeAtomic(cachePath, JSON.stringify(cache, null, 2));
  return { cache, stats };
}

// ─── Claude API retry helper ─────────────────────────────────────────────────

function isRetryableStatus(status: number | undefined): boolean {
  return (
    status === undefined ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 529
  );
}

async function callClaudeWithRetry(
  anthropic: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  label: string,
): Promise<string> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= MAX_CLAUDE_RETRIES; attempt++) {
    try {
      const message = await anthropic.messages.create(params);
      const block = message.content[0];
      return block && block.type === "text" ? block.text : "";
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      if (!isRetryableStatus(status) || attempt >= MAX_CLAUDE_RETRIES) {
        console.error(
          `  ${label} failed after ${attempt} attempt(s): ${err?.message ?? err}`,
        );
        throw err;
      }
      const delay = 2000 * Math.pow(2, attempt - 1);
      console.warn(
        `  ${label} attempt ${attempt}/${MAX_CLAUDE_RETRIES} failed (${status ?? "network"}). Retrying in ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("unreachable");
}

// ─── Claude: level-appropriate content ───────────────────────────────────────

function extractJsonArray(text: string): any[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeContext(p: any): ContextResult | null {
  const word = String(p?.word ?? "")
    .toLowerCase()
    .trim();
  if (!word) return null;
  return {
    word,
    definition: String(p?.definition ?? ""),
    exampleSentence: String(p?.exampleSentence ?? ""),
    contextPassage: String(p?.contextPassage ?? ""),
    distractors: Array.isArray(p?.distractors) ? p.distractors.map((d: any) => String(d)) : [],
  };
}

async function generateContextBatchOnce(
  anthropic: Anthropic,
  words: { word: string; partOfSpeech: PartOfSpeech; rawDefinition: string }[],
  level: Level,
  label: string,
): Promise<ContextResult[]> {
  const wordList = words
    .map(
      (w) =>
        `- "${w.word}" (${w.partOfSpeech})${w.rawDefinition ? ` — dictionary hint: "${w.rawDefinition}"` : ""}`,
    )
    .join("\n");

  const text = await callClaudeWithRetry(
    anthropic,
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a vocabulary content writer for an English learning app. Your output is for CEFR ${level} learners.

${LEVEL_RULES[level]}

For each word below, produce a rewrite that STRICTLY respects the ${level} rules above. Do NOT copy the dictionary hint verbatim — it is only there for meaning reference. Rewrite everything in your own ${level}-appropriate words.

Return for each word:
1. **definition** — the meaning, written at ${level}. Every word inside the definition must itself be at or below ${level}.
2. **exampleSentence** — one natural sentence using the word in a typical situation. Obey ${level} sentence rules above.
3. **contextPassage** — 2 short sentences giving extra context: when or how the word is used, or a common partner word. Still at ${level}.
4. **distractors** — an array of 3 false definitions for semantically related concepts. For example, if the word is "car", the distractors could be definitions for "train", "plane", and "bicycle". These must be plausible wrong answers for a multiple-choice question and must be written at ${level}.

Output ONLY a JSON array, no markdown fences, no commentary. You MUST return exactly ${words.length} items, one per input word, in the same order:
[{"word":"...","definition":"...","exampleSentence":"...","contextPassage":"...","distractors":["...","...","..."]}]

Words:
${wordList}`,
        },
      ],
    },
    label,
  );

  const raw = extractJsonArray(text);
  if (!raw) {
    console.error(`  ${label}: could not parse JSON array in response.`);
    return [];
  }

  const normalized: ContextResult[] = [];
  for (const item of raw) {
    const n = normalizeContext(item);
    if (n) normalized.push(n);
  }
  return normalized;
}

async function generateContextBatch(
  anthropic: Anthropic,
  words: { word: string; partOfSpeech: PartOfSpeech; rawDefinition: string }[],
  level: Level,
  batchLabel: string,
): Promise<ContextResult[]> {
  const first = await generateContextBatchOnce(
    anthropic,
    words,
    level,
    `${batchLabel} (context)`,
  );

  const covered = new Set(first.map((r) => r.word));
  const missingWords = words.filter((w) => !covered.has(w.word));

  if (missingWords.length === 0) return first;

  console.warn(
    `  ${batchLabel}: Claude returned ${first.length}/${words.length} items. Retrying ${missingWords.length} missing...`,
  );

  for (let retry = 1; retry <= MAX_MISSING_WORD_RETRIES; retry++) {
    const retryPass = await generateContextBatchOnce(
      anthropic,
      missingWords,
      level,
      `${batchLabel} (retry ${retry})`,
    );
    for (const r of retryPass) {
      if (!covered.has(r.word)) {
        first.push(r);
        covered.add(r.word);
      }
    }
    const stillMissing = missingWords.filter((w) => !covered.has(w.word));
    if (stillMissing.length === 0) break;
    if (retry === MAX_MISSING_WORD_RETRIES && stillMissing.length > 0) {
      console.warn(
        `  ${batchLabel}: giving up on ${stillMissing.length} words: ${stillMissing
          .slice(0, 5)
          .map((w) => w.word)
          .join(", ")}${stillMissing.length > 5 ? "..." : ""}`,
      );
    }
    missingWords.length = 0;
    missingWords.push(...stillMissing);
  }

  return first;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, threshold, resume } = parseArgs();

  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: Set ANTHROPIC_API_KEY or EXPO_PUBLIC_CLAUDE_API_KEY in your environment.",
    );
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  const scoredPath = path.join(__dirname, `../data/scored-${level}.json`);
  if (!fs.existsSync(scoredPath)) {
    console.error(`Scored file not found: ${scoredPath}`);
    console.error(
      `\nRun step 1 first: npm run pipeline:score -- --level ${level}`,
    );
    process.exit(1);
  }

  const scored: ScoredWord[] = JSON.parse(fs.readFileSync(scoredPath, "utf-8"));

  // Guard: old pipeline output had `fieldRelevance` and no `levelFit`
  if (scored.length > 0 && scored[0].levelFit === undefined) {
    console.error(
      `\n❌ ${scoredPath} is from an older (field-based) pipeline.\n   Re-run step 1 first:  npm run pipeline:score -- --level ${level}\n`,
    );
    process.exit(1);
  }

  const qualified = scored.filter(
    (w) => w.levelFit === "perfect" && w.usabilityScore >= threshold,
  );

  console.log(`\n📖 Enriching ${qualified.length} words for level ${level}`);
  console.log(
    `   (${scored.length - qualified.length} dropped — not level-fit or below usability ${threshold})\n`,
  );

  if (qualified.length === 0) {
    console.error(
      "No words passed the filter. Try a lower --threshold or review scored data.",
    );
    process.exit(1);
  }

  const dataDir = path.join(__dirname, "../data");
  const outPath = path.join(dataDir, `enriched-${level}.json`);
  const dictCachePath = path.join(dataDir, `.dict-cache-${level}.json`);
  const contextCachePath = path.join(dataDir, `.context-cache-${level}.json`);

  // Resume: load existing caches
  let existingDict: Record<string, DictionaryResult> = {};
  let existingContext: Record<string, ContextResult> = {};
  if (resume) {
    if (fs.existsSync(dictCachePath)) {
      try {
        existingDict = JSON.parse(fs.readFileSync(dictCachePath, "utf-8"));
        console.log(
          `↻  Resume: loaded ${Object.keys(existingDict).length} cached dictionary entries`,
        );
      } catch {
        console.warn(`  Could not parse ${dictCachePath}, ignoring.`);
      }
    }
    if (fs.existsSync(contextCachePath)) {
      try {
        existingContext = JSON.parse(
          fs.readFileSync(contextCachePath, "utf-8"),
        );
        console.log(
          `↻  Resume: loaded ${Object.keys(existingContext).length} cached Claude results`,
        );
      } catch {
        console.warn(`  Could not parse ${contextCachePath}, ignoring.`);
      }
    }
  } else {
    // Fresh run: clear any stale caches
    if (fs.existsSync(dictCachePath)) fs.unlinkSync(dictCachePath);
    if (fs.existsSync(contextCachePath)) fs.unlinkSync(contextCachePath);
  }

  // Step A: Dictionary lookups (sequential, paced, retrying)
  console.log("  Fetching dictionary data (sequential, paced)...");
  const { cache: dictCache, stats: dictStats } =
    await fetchDictionariesSequential(
      qualified.map((w) => w.word),
      existingDict,
      dictCachePath,
      (done, total, s) => {
        if (done === total || done % 20 === 0) {
          process.stdout.write(
            `  ${done}/${total} (hits: ${s.hits}, 404: ${s.notFound}, err: ${s.errors})...\r`,
          );
        }
      },
    );
  console.log(
    `\n  Dictionary: ${dictStats.hits} hits, ${dictStats.notFound} genuinely not in dictionary, ${dictStats.errors} failed after retry`,
  );

  // Step B: Claude rewrite at level
  console.log("  Generating level-appropriate content with Claude...");
  const contextMap: Record<string, ContextResult> = { ...existingContext };
  const toGenerate = qualified.filter((w) => !contextMap[w.word] || !Array.isArray(contextMap[w.word].distractors) || contextMap[w.word].distractors.length < 3);

  if (toGenerate.length === 0) {
    console.log("  All words already have cached Claude content.");
  }

  const contextBatches = Math.ceil(toGenerate.length / CONTEXT_BATCH_SIZE);

  for (let i = 0; i < toGenerate.length; i += CONTEXT_BATCH_SIZE) {
    const batch = toGenerate.slice(i, i + CONTEXT_BATCH_SIZE);
    const batchNum = Math.floor(i / CONTEXT_BATCH_SIZE) + 1;
    const batchLabel = `Context batch ${batchNum}/${contextBatches}`;
    console.log(`  ${batchLabel}...`);

    const batchInput = batch.map((w) => {
      const dict = dictCache[w.word];
      return {
        word: w.word,
        partOfSpeech: (dict?.partOfSpeech ?? "other") as PartOfSpeech,
        rawDefinition: dict?.rawDefinition ?? "",
      };
    });

    let results: ContextResult[] = [];
    try {
      results = await generateContextBatch(
        anthropic,
        batchInput,
        level,
        batchLabel,
      );
    } catch (err: any) {
      console.error(
        `  ${batchLabel}: unrecoverable error — ${err?.message ?? err}. Skipping batch.`,
      );
    }

    for (const r of results) {
      contextMap[r.word] = r;
    }

    // Flush context + assembled output after every batch
    writeAtomic(contextCachePath, JSON.stringify(contextMap, null, 2));
    flushEnriched(outPath, qualified, dictCache, contextMap, level);

    if (i + CONTEXT_BATCH_SIZE < toGenerate.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Final assemble (in case there were no new batches)
  flushEnriched(outPath, qualified, dictCache, contextMap, level);
  const enriched = assemble(qualified, dictCache, contextMap, level);

  // Completeness audit — must match seedAppwrite.ts REQUIRED_FIELDS exactly.
  // Any word missing even one field will NOT be seeded.
  const required: (keyof EnrichedWord)[] = [
    "word",
    "phonetic",
    "partOfSpeech",
    "definition",
    "exampleSentence",
    "contextPassage",
    "distractors",
  ];
  const fieldMisses: Record<string, number> = {};
  const incomplete: { word: string; missing: string[] }[] = [];
  for (const w of enriched) {
    const missing = required.filter((k) => {
      const v = w[k];
      if (k === "distractors") {
        return !Array.isArray(v) || v.length !== 3 || v.some((d) => typeof d !== "string" || d.trim().length === 0);
      }
      return typeof v !== "string" || v.trim().length === 0;
    }) as string[];
    if (missing.length > 0) {
      incomplete.push({ word: w.word, missing });
      for (const f of missing) fieldMisses[f] = (fieldMisses[f] ?? 0) + 1;
    }
  }
  const complete = enriched.length - incomplete.length;

  console.log(`\n✅ Enriched ${enriched.length} words → ${outPath}`);
  console.log(
    `   ${complete} are seedable; ${incomplete.length} are incomplete and will be skipped by the seeder.`,
  );

  if (incomplete.length > 0) {
    console.log(`\n  Missing-field breakdown:`);
    for (const [f, c] of Object.entries(fieldMisses).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`     ${f.padEnd(16)} ${c}`);
    }
    const sample = incomplete
      .slice(0, 8)
      .map((i) => `${i.word} [${i.missing.join(", ")}]`);
    console.log(
      `     examples: ${sample.join("; ")}${incomplete.length > 8 ? "; ..." : ""}`,
    );
    console.log(
      `\n  Tip: re-run with --resume to retry dictionary misses and re-ask Claude for any dropped entries:`,
    );
    console.log(`     npm run pipeline:enrich -- --level ${level} --resume`);
  }

  console.log(`\nNext step: npm run pipeline:seed -- --level ${level}\n`);
}

function assemble(
  qualified: ScoredWord[],
  dictCache: Record<string, DictionaryResult>,
  contextMap: Record<string, ContextResult>,
  level: Level,
): EnrichedWord[] {
  return qualified.map((w) => {
    const dict = dictCache[w.word];
    const ctx = contextMap[w.word];
    return {
      word: w.word,
      phonetic: dict?.phonetic ?? "",
      partOfSpeech: dict?.partOfSpeech ?? "other",
      definition: ctx?.definition ?? dict?.rawDefinition ?? "",
      exampleSentence: ctx?.exampleSentence ?? "",
      contextPassage: ctx?.contextPassage ?? "",
      distractors: ctx?.distractors ?? [],
      level,
      usabilityScore: w.usabilityScore,
    };
  });
}

function flushEnriched(
  outPath: string,
  qualified: ScoredWord[],
  dictCache: Record<string, DictionaryResult>,
  contextMap: Record<string, ContextResult>,
  level: Level,
): void {
  const enriched = assemble(qualified, dictCache, contextMap, level);
  writeAtomic(outPath, JSON.stringify(enriched, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
