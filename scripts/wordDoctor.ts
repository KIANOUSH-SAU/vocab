/**
 * Word Doctor — checkup + repair pass for the Appwrite words collection.
 *
 * Designed to be run INDEPENDENTLY of the main pipeline as a health check.
 * Where wordFixer focuses on missing definition / example / context / phonetic,
 * wordDoctor goes further and also detects + repairs:
 *   - missing or malformed distractors (must be exactly 3 non-empty strings)
 *   - missing partOfSpeech (defaults to "other" only if Claude can't decide)
 *   - everything wordFixer covers (phonetic, definition, example, context)
 *
 * Words flagged for any single missing field will have ALL their missing
 * fields filled in the same Claude call to keep token usage low.
 *
 * Usage:
 *   npx tsx scripts/wordDoctor.ts                           # full checkup, every level
 *   npx tsx scripts/wordDoctor.ts --level B1                # one level only
 *   npx tsx scripts/wordDoctor.ts --level B1 --dry-run      # audit only, no writes
 *   npx tsx scripts/wordDoctor.ts --level B1 --yes          # skip confirmation
 *   npx tsx scripts/wordDoctor.ts --level B1 --keep-log     # save diff to data/
 *   npx tsx scripts/wordDoctor.ts --only-distractors        # ignore other fields,
 *                                                             only flag/fix distractors
 *   npx tsx scripts/wordDoctor.ts --limit 100               # only scan the first
 *                                                             100 docs (by $id asc)
 *
 * Required env vars (same as wordFixer):
 *   APPWRITE_ENDPOINT        (or EXPO_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID      (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_DATABASE_ID     (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *   APPWRITE_API_KEY         (server-side key — NOT EXPO_PUBLIC)
 *   ANTHROPIC_API_KEY        (or EXPO_PUBLIC_CLAUDE_API_KEY)
 */

import Anthropic from "@anthropic-ai/sdk";
import { Client, Databases, Query } from "node-appwrite";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const VALID_POS = ["noun", "verb", "adjective", "adverb", "other"] as const;
type PartOfSpeech = (typeof VALID_POS)[number];

const WORDS_COLLECTION = process.env.APPWRITE_WORDS_COLLECTION_ID || "words";
const PAGE_SIZE = 100;

const CLAUDE_BATCH_SIZE = 10;
const DICT_PACING_MS = 120;
const DICT_TIMEOUT_MS = 10_000;
const DICT_RETRY_DELAY_MS = 1500;
const MAX_CLAUDE_RETRIES = 4;
const MIN_DEFINITION_LEN = 10;
const REQUIRED_DISTRACTORS = 3;

// ─── Reason codes ────────────────────────────────────────────────────────────

type FixReason =
  | "missing_phonetic"
  | "missing_pos"
  | "missing_definition"
  | "too_short_definition"
  | "missing_example"
  | "missing_context"
  | "missing_distractors";

interface WordDoc {
  $id: string;
  word: string;
  level: Level;
  phonetic: string;
  partOfSpeech: PartOfSpeech | "";
  definition: string;
  exampleSentence: string;
  contextPassage: string;
  distractors: string[];
}

interface FixPlan {
  doc: WordDoc;
  reasons: FixReason[];
  newPhonetic?: string;
  newPartOfSpeech?: PartOfSpeech;
  newDefinition?: string;
  newExample?: string;
  newContext?: string;
  newDistractors?: string[];
}

// ─── Level-specific prompt guidance (mirrors enrichWords/wordFixer) ─────────

const LEVEL_RULES: Record<Level, string> = {
  A1: `A1 learners know ~500 of the most common English words. Rules:
- Use ONLY the simplest everyday words.
- Sentences should be 5-8 words, mostly present simple. Avoid relative clauses.
- No idioms, no phrasal verbs, no abstract nouns.
- Definitions should read like they were written for a 6-year-old.`,
  A2: `A2 learners know ~1000 common words. Rules:
- Everyday vocabulary only. Simple past and future are fine.
- Sentences 8-12 words. One clause per sentence.
- Avoid idioms and academic language.`,
  B1: `B1 learners know ~2000 words. Rules:
- Use normal conversational vocabulary. Compound sentences are fine.
- Modals (can, should, might) and common phrasal verbs are OK.
- Avoid rare or technical vocabulary. Sentences ≤ 20 words.`,
  B2: `B2 learners know ~4000 words. Rules:
- Full range of everyday vocabulary + some abstract/academic words.
- Complex sentences, subordinate clauses, passive voice are fine.
- Avoid highly formal jargon unless the word itself is specialized.`,
  C1: `C1 learners are advanced. Rules:
- Use a wide vocabulary including less common synonyms and nuanced terms.
- Complex sentence structures, collocations, and register variation are expected.
- Definitions can explain connotation and typical contexts.`,
};

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level | null = null;
  let dryRun = false;
  let yes = false;
  let keepLog = false;
  let onlyDistractors = false;
  let limit: number | null = null;

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
    if (args[i] === "--dry-run") dryRun = true;
    if (args[i] === "--yes" || args[i] === "-y") yes = true;
    if (args[i] === "--keep-log") keepLog = true;
    if (args[i] === "--only-distractors") onlyDistractors = true;
    if (args[i] === "--limit" && args[i + 1]) {
      const n = parseInt(args[i + 1], 10);
      if (!Number.isFinite(n) || n <= 0) {
        console.error(`Invalid --limit "${args[i + 1]}". Must be a positive integer.`);
        process.exit(1);
      }
      limit = n;
    }
  }
  return { level, dryRun, yes, keepLog, onlyDistractors, limit };
}

// ─── Appwrite + Anthropic setup ──────────────────────────────────────────────

function createAppwrite() {
  const endpoint =
    process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_PROJECT_ID ||
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.error("Missing required environment variables:");
    if (!endpoint) console.error("  - APPWRITE_ENDPOINT");
    if (!projectId) console.error("  - APPWRITE_PROJECT_ID");
    if (!apiKey)
      console.error("  - APPWRITE_API_KEY (server-side key, not EXPO_PUBLIC)");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const dbId =
    process.env.APPWRITE_DATABASE_ID ||
    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  if (!dbId) {
    console.error("  - APPWRITE_DATABASE_ID");
    process.exit(1);
  }
  return { databases: new Databases(client), dbId };
}

function createAnthropic(): Anthropic {
  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing ANTHROPIC_API_KEY (or EXPO_PUBLIC_CLAUDE_API_KEY).",
    );
    process.exit(1);
  }
  return new Anthropic({ apiKey });
}

// ─── Free Dictionary lookups (phonetic only) ────────────────────────────────

async function fetchPhonetic(word: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DICT_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: controller.signal },
    );
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, DICT_RETRY_DELAY_MS));
      return fetchPhonetic(word);
    }
    if (!res.ok) return null;
    const data = (await res.json()) as any[];
    const entry = data?.[0];
    if (!entry) return null;
    if (entry.phonetic) return entry.phonetic as string;
    const withText = entry.phonetics?.find((p: any) => p.text);
    return withText?.text ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Claude helpers ─────────────────────────────────────────────────────────

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

interface ClaudeFix {
  word: string;
  phonetic?: string;
  partOfSpeech?: PartOfSpeech;
  definition?: string;
  exampleSentence?: string;
  contextPassage?: string;
  distractors?: string[];
}

function fieldsForPlan(p: FixPlan): string[] {
  const fields: string[] = [];
  if (p.reasons.includes("missing_phonetic")) fields.push("phonetic");
  if (p.reasons.includes("missing_pos")) fields.push("partOfSpeech");
  if (
    p.reasons.includes("missing_definition") ||
    p.reasons.includes("too_short_definition")
  )
    fields.push("definition");
  if (p.reasons.includes("missing_example")) fields.push("exampleSentence");
  if (p.reasons.includes("missing_context")) fields.push("contextPassage");
  if (p.reasons.includes("missing_distractors")) fields.push("distractors");
  return fields;
}

async function fixBatchWithClaude(
  anthropic: Anthropic,
  level: Level,
  plans: FixPlan[],
  label: string,
): Promise<Map<string, ClaudeFix>> {
  const wordList = plans
    .map((p) => {
      const fields = fieldsForPlan(p);
      return `- "${p.doc.word}" (${p.doc.partOfSpeech || "?"}) → produce: [${fields.join(", ")}]
    current definition: "${p.doc.definition || "(empty)"}"
    current example: "${p.doc.exampleSentence || "(empty)"}"`;
    })
    .join("\n");

  const text = await callClaudeWithRetry(
    anthropic,
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a vocabulary content writer for an English learning app. Output is for CEFR ${level} learners.

${LEVEL_RULES[level]}

For each word below, produce ONLY the listed fields. Each new field must:
- match the part of speech given (or pick the most common one if marked "?")
- be coherent with the meaning the current definition (if any) suggests
- strictly respect the ${level} rules above (every word inside the definition must itself be at or below ${level})

Field semantics:
- "phonetic" — IPA pronunciation in slashes, e.g. "/ɪɡˈzæmpəl/"
- "partOfSpeech" — one of: "noun", "verb", "adjective", "adverb", "other"
- "definition" — one short sentence explaining the meaning at ${level}
- "exampleSentence" — one natural sentence using the word
- "contextPassage" — 2 short sentences giving extra context (when/how it's used, common partner words)
- "distractors" — an array of EXACTLY 3 plausible-but-WRONG definitions. They should describe semantically related concepts (e.g. for "car", definitions for "train", "plane", "bicycle"). All 3 must be written at ${level} and must be different from the real definition.

Output ONLY a JSON array, no markdown fences, no commentary. Return EXACTLY ${plans.length} items in the same order.
Each item: {"word":"...", <only-the-requested-fields>}.

Words:
${wordList}`,
        },
      ],
    },
    label,
  );

  const raw = extractJsonArray(text);
  const map = new Map<string, ClaudeFix>();
  if (!raw) {
    console.error(`  ${label}: could not parse JSON array.`);
    return map;
  }
  for (const item of raw) {
    const w = String(item?.word ?? "").toLowerCase().trim();
    if (!w) continue;
    const fix: ClaudeFix = { word: w };
    if (typeof item.phonetic === "string") fix.phonetic = item.phonetic;
    if (
      typeof item.partOfSpeech === "string" &&
      (VALID_POS as readonly string[]).includes(item.partOfSpeech)
    ) {
      fix.partOfSpeech = item.partOfSpeech as PartOfSpeech;
    }
    if (typeof item.definition === "string") fix.definition = item.definition;
    if (typeof item.exampleSentence === "string")
      fix.exampleSentence = item.exampleSentence;
    if (typeof item.contextPassage === "string")
      fix.contextPassage = item.contextPassage;
    if (Array.isArray(item.distractors)) {
      const cleaned = item.distractors
        .map((d: any) => (typeof d === "string" ? d.trim() : ""))
        .filter((d: string) => d.length > 0);
      if (cleaned.length === REQUIRED_DISTRACTORS) fix.distractors = cleaned;
    }
    map.set(w, fix);
  }
  return map;
}

// ─── Audit ──────────────────────────────────────────────────────────────────

const ALLOWED_MULTI_WORD = new Set([
  "pick up", "give up", "look for", "look up", "come back", "go back",
  "get up", "get on", "get off", "get out", "get in", "turn on", "turn off",
  "take off", "put on", "put down", "put up", "come in", "go out",
  "sit down", "stand up", "wake up", "find out", "work out", "make up",
  "break down", "set up", "run out", "carry on", "hang out", "show up",
  "bring up", "point out", "give back", "come up", "go on", "take on",
  "take up", "let down", "look after", "look out", "call off", "shut down",
  "throw away", "check in", "check out", "grow up", "pass out",
  "slow down", "speed up", "sign up", "log in", "log out", "sign in", "sign out",
  "ice cream", "living room", "post office", "traffic light", "bus stop",
  "high school", "credit card", "shopping center", "washing machine",
  "remote control", "cell phone", "coffee shop", "swimming pool", "parking lot",
  "bus station", "train station", "fire station", "police station",
  "of course", "a lot", "as well", "each other", "in fact", "at least",
  "at first", "so far",
]);

function isNonsensicalMultiWord(word: string): boolean {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed.includes(" ")) return false;
  if (ALLOWED_MULTI_WORD.has(trimmed)) return false;
  return true;
}

function distractorsAreValid(d: unknown): boolean {
  return (
    Array.isArray(d) &&
    d.length === REQUIRED_DISTRACTORS &&
    d.every((x) => typeof x === "string" && x.trim().length > 0)
  );
}

function audit(doc: WordDoc, onlyDistractors: boolean): FixReason[] {
  const reasons: FixReason[] = [];

  if (!distractorsAreValid(doc.distractors)) {
    reasons.push("missing_distractors");
  }

  if (onlyDistractors) return reasons;

  if (!doc.phonetic.trim() || doc.phonetic.trim() === "/.../") {
    reasons.push("missing_phonetic");
  }
  if (
    !doc.partOfSpeech ||
    !(VALID_POS as readonly string[]).includes(doc.partOfSpeech)
  ) {
    reasons.push("missing_pos");
  }
  if (!doc.definition.trim()) {
    reasons.push("missing_definition");
  } else if (doc.definition.trim().length < MIN_DEFINITION_LEN) {
    reasons.push("too_short_definition");
  }
  if (!doc.exampleSentence.trim()) reasons.push("missing_example");
  if (!doc.contextPassage.trim()) reasons.push("missing_context");

  return reasons;
}

// ─── Confirmation prompt ─────────────────────────────────────────────────────

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

// ─── Retry helper for Appwrite ──────────────────────────────────────────────

const MAX_DB_RETRIES = 4;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const code = err?.code ?? err?.response?.code;
      const isTransient =
        code === undefined ||
        code === 429 ||
        code === 500 ||
        code === 502 ||
        code === 503 ||
        code === 504;
      if (!isTransient || attempt >= MAX_DB_RETRIES) throw err;
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.warn(
        `  ${label} attempt ${attempt}/${MAX_DB_RETRIES} failed (code ${code ?? "network"}). Retrying in ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("unreachable");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, dryRun, yes, keepLog, onlyDistractors, limit } = parseArgs();
  const { databases, dbId } = createAppwrite();
  const anthropic = createAnthropic();

  const scopeLabel = level ? `level ${level}` : "ALL LEVELS";
  console.log(`\n🩺 Word Doctor — checkup on ${scopeLabel}`);
  console.log(`   Collection: ${WORDS_COLLECTION}`);
  if (dryRun) console.log("   MODE: dry run (no writes)");
  if (onlyDistractors)
    console.log("   MODE: --only-distractors (other fields ignored)");
  if (limit) console.log(`   LIMIT: first ${limit} doc(s) by $id ascending`);
  console.log("");

  // Step 1: Fetch word documents in scope
  console.log("  Fetching words from Appwrite...");
  const allDocs: WordDoc[] = [];
  let cursor: string | undefined;
  outer: while (true) {
    const remaining = limit ? Math.max(0, limit - allDocs.length) : PAGE_SIZE;
    if (limit && remaining === 0) break;
    const pageLimit = limit ? Math.min(PAGE_SIZE, remaining) : PAGE_SIZE;

    const queries: any[] = [];
    if (level) queries.push(Query.equal("level", level));
    queries.push(Query.limit(pageLimit));
    queries.push(Query.orderAsc("$id"));
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await withRetry(
      () => databases.listDocuments(dbId, WORDS_COLLECTION, queries),
      "fetch words",
    );
    for (const d of page.documents) {
      const rawDistractors = (d as any).distractors;
      allDocs.push({
        $id: d.$id,
        word: ((d as any).word ?? "").trim(),
        level: (d as any).level,
        phonetic: ((d as any).phonetic ?? "").trim(),
        partOfSpeech: ((d as any).partOfSpeech ?? "") as PartOfSpeech | "",
        definition: ((d as any).definition ?? "").trim(),
        exampleSentence: ((d as any).exampleSentence ?? "").trim(),
        contextPassage: ((d as any).contextPassage ?? "").trim(),
        distractors: Array.isArray(rawDistractors) ? rawDistractors : [],
      });
      if (limit && allDocs.length >= limit) break outer;
    }
    if (page.documents.length < pageLimit) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }
  console.log(`  Found ${allDocs.length} word(s) in scope.\n`);

  // Step 2: Build fix plans
  const plans: FixPlan[] = [];
  const skippedNonsensical: WordDoc[] = [];
  for (const doc of allDocs) {
    if (isNonsensicalMultiWord(doc.word)) {
      skippedNonsensical.push(doc);
      continue;
    }
    const reasons = audit(doc, onlyDistractors);
    if (reasons.length > 0) plans.push({ doc, reasons });
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("  CHECKUP RESULTS");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(`  Total words scanned:   ${allDocs.length}`);
  console.log(
    `  Healthy:               ${allDocs.length - plans.length - skippedNonsensical.length}`,
  );
  console.log(`  To repair:             ${plans.length}`);
  console.log(`  Skipped (multi-word):  ${skippedNonsensical.length}\n`);

  if (skippedNonsensical.length > 0) {
    console.log(
      `  ⚠️  ${skippedNonsensical.length} multi-word entries cannot be fixed in place.`,
    );
    console.log(`     Run wordSifter to delete them:`);
    console.log(
      `        npx tsx scripts/wordSifter.ts${level ? ` --level ${level}` : ""}\n`,
    );
  }

  if (plans.length === 0) {
    console.log("  ✅ All clear — nothing to repair.\n");
    return;
  }

  // Reason breakdown
  const reasonCounts: Record<FixReason, number> = {
    missing_phonetic: 0,
    missing_pos: 0,
    missing_definition: 0,
    too_short_definition: 0,
    missing_example: 0,
    missing_context: 0,
    missing_distractors: 0,
  };
  for (const p of plans) for (const r of p.reasons) reasonCounts[r]++;

  console.log("  Reason breakdown:");
  const labels: Record<FixReason, string> = {
    missing_phonetic: "Missing phonetic",
    missing_pos: "Missing part of speech",
    missing_definition: "Missing definition",
    too_short_definition: "Too-short definition",
    missing_example: "Missing example",
    missing_context: "Missing context passage",
    missing_distractors: "Missing/invalid distractors",
  };
  for (const [r, c] of Object.entries(reasonCounts)) {
    if (c > 0) console.log(`    ${labels[r as FixReason].padEnd(30)} ${c}`);
  }
  console.log("");

  if (!yes && !dryRun) {
    const ok = await confirm(
      `⚠️   This will UPDATE ${plans.length} word document(s) in Appwrite.\n    Type "yes" to proceed: `,
    );
    if (!ok) {
      console.log("    Aborted.\n");
      return;
    }
  }

  // Step 3a: Phonetic via Free Dictionary (cheap, no Claude tokens spent)
  const phoneticPlans = plans.filter((p) =>
    p.reasons.includes("missing_phonetic"),
  );
  if (phoneticPlans.length > 0) {
    console.log(
      `  Looking up phonetics from Free Dictionary (${phoneticPlans.length} words)...`,
    );
    let resolved = 0;
    for (let i = 0; i < phoneticPlans.length; i++) {
      const p = phoneticPlans[i];
      const phonetic = await fetchPhonetic(p.doc.word);
      if (phonetic) {
        p.newPhonetic = phonetic;
        resolved++;
      }
      if ((i + 1) % 10 === 0 || i === phoneticPlans.length - 1) {
        process.stdout.write(
          `    ${i + 1}/${phoneticPlans.length} (resolved: ${resolved})\r`,
        );
      }
      if (i < phoneticPlans.length - 1) {
        await new Promise((r) => setTimeout(r, DICT_PACING_MS));
      }
    }
    console.log(
      `\n  Dictionary phonetics: ${resolved}/${phoneticPlans.length} resolved.\n`,
    );
  }

  // Step 3b: Claude — fill remaining fields, batched per level
  const plansByLevel: Record<Level, FixPlan[]> = {
    A1: [],
    A2: [],
    B1: [],
    B2: [],
    C1: [],
  };
  for (const p of plans) {
    const stillNeedsPhonetic =
      p.reasons.includes("missing_phonetic") && !p.newPhonetic;
    const needsClaude =
      p.reasons.some(
        (r) =>
          r === "missing_pos" ||
          r === "missing_definition" ||
          r === "too_short_definition" ||
          r === "missing_example" ||
          r === "missing_context" ||
          r === "missing_distractors",
      ) || stillNeedsPhonetic;
    if (needsClaude) plansByLevel[p.doc.level].push(p);
  }

  for (const lvl of LEVELS) {
    const list = plansByLevel[lvl];
    if (list.length === 0) continue;

    const batches = Math.ceil(list.length / CLAUDE_BATCH_SIZE);
    console.log(
      `  Generating Claude content for ${lvl} (${list.length} word${list.length === 1 ? "" : "s"} / ${batches} batch${batches === 1 ? "" : "es"})...`,
    );

    for (let i = 0; i < list.length; i += CLAUDE_BATCH_SIZE) {
      const batch = list.slice(i, i + CLAUDE_BATCH_SIZE);
      const batchNum = Math.floor(i / CLAUDE_BATCH_SIZE) + 1;
      const label = `${lvl} batch ${batchNum}/${batches}`;
      console.log(`    ${label}...`);

      let fixes: Map<string, ClaudeFix>;
      try {
        fixes = await fixBatchWithClaude(anthropic, lvl, batch, label);
      } catch (err: any) {
        console.error(
          `    ${label}: unrecoverable error — ${err?.message ?? err}. Skipping batch.`,
        );
        continue;
      }

      for (const p of batch) {
        const fix = fixes.get(p.doc.word.toLowerCase());
        if (!fix) continue;
        if (fix.phonetic && !p.newPhonetic) p.newPhonetic = fix.phonetic;
        if (fix.partOfSpeech) p.newPartOfSpeech = fix.partOfSpeech;
        if (fix.definition) p.newDefinition = fix.definition;
        if (fix.exampleSentence) p.newExample = fix.exampleSentence;
        if (fix.contextPassage) p.newContext = fix.contextPassage;
        if (fix.distractors) p.newDistractors = fix.distractors;
      }

      if (i + CLAUDE_BATCH_SIZE < list.length) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  // Step 4: Build write list
  let writeList = plans.map((p) => {
    const updates: Record<string, string | string[]> = {};
    if (p.reasons.includes("missing_phonetic") && p.newPhonetic) {
      updates.phonetic = p.newPhonetic;
    }
    if (p.reasons.includes("missing_pos") && p.newPartOfSpeech) {
      updates.partOfSpeech = p.newPartOfSpeech;
    }
    if (
      (p.reasons.includes("missing_definition") ||
        p.reasons.includes("too_short_definition")) &&
      p.newDefinition
    ) {
      updates.definition = p.newDefinition;
    }
    if (p.reasons.includes("missing_example") && p.newExample) {
      updates.exampleSentence = p.newExample;
    }
    if (p.reasons.includes("missing_context") && p.newContext) {
      updates.contextPassage = p.newContext;
    }
    if (p.reasons.includes("missing_distractors") && p.newDistractors) {
      updates.distractors = p.newDistractors;
    }
    return { plan: p, updates };
  });

  // Drop plans where nothing was actually filled
  writeList = writeList.filter((w) => Object.keys(w.updates).length > 0);

  console.log(
    `\n  ${writeList.length}/${plans.length} word(s) have repairs ready to write.\n`,
  );

  if (writeList.length === 0) {
    console.log("  Nothing to write — all repair attempts came back empty.\n");
  }

  // Save log if requested
  if (keepLog) {
    const logPath = path.join(
      __dirname,
      `../data/doctor-report-${level ?? "all"}-${Date.now()}.json`,
    );
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(
      logPath,
      JSON.stringify(
        writeList.map((w) => ({
          id: w.plan.doc.$id,
          word: w.plan.doc.word,
          level: w.plan.doc.level,
          reasons: w.plan.reasons,
          before: {
            phonetic: w.plan.doc.phonetic,
            partOfSpeech: w.plan.doc.partOfSpeech,
            definition: w.plan.doc.definition,
            exampleSentence: w.plan.doc.exampleSentence,
            contextPassage: w.plan.doc.contextPassage,
            distractors: w.plan.doc.distractors,
          },
          after: w.updates,
        })),
        null,
        2,
      ),
    );
    console.log(`  📄 Diff report saved: ${logPath}\n`);
  }

  if (dryRun) {
    console.log(
      `  DRY RUN — ${writeList.length} word(s) would be updated. No changes made.\n`,
    );
    return;
  }

  // Step 5: Apply
  let updated = 0;
  let failed = 0;
  for (let i = 0; i < writeList.length; i++) {
    const { plan, updates } = writeList[i];
    try {
      await withRetry(
        () =>
          databases.updateDocument(
            dbId,
            WORDS_COLLECTION,
            plan.doc.$id,
            updates,
          ),
        `update "${plan.doc.word}"`,
      );
      updated++;
    } catch (err: any) {
      failed++;
      console.error(
        `\n  Failed to update "${plan.doc.word}": ${err?.message ?? err}`,
      );
    }
    if ((i + 1) % 5 === 0 || i === writeList.length - 1) {
      process.stdout.write(`  ${i + 1}/${writeList.length} processed...\r`);
    }
  }

  console.log(`\n\n✅ Checkup complete!`);
  console.log(`   Updated:               ${updated}`);
  console.log(`   Failed:                ${failed}`);
  console.log(`   Skipped (unrepaired):  ${plans.length - writeList.length}`);
  console.log(`   Multi-word skipped:    ${skippedNonsensical.length}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
