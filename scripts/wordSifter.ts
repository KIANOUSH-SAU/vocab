/**
 * Word Sifter — quality gate for the Appwrite words collection.
 * Scans every word document and flags entries that should be purged:
 *
 *   1. Missing phonetics  — phonetic field is empty or missing
 *   2. Nonsensical words   — multi-word entries that aren't real vocabulary
 *   3. Missing content     — definition, exampleSentence, or contextPassage
 *                            are empty / too short to be useful
 *
 * It ALSO verifies the part of speech and content with Claude AI.
 * If a word passes basic checks, Claude determines the most common part of speech,
 * generates a level-appropriate definition, example, and context.
 * The word document is then updated in Appwrite and marked as `aiVerified: true`.
 *
 * Usage:
 *   npx tsx scripts/wordSifter.ts                       # audit all levels
 *   npx tsx scripts/wordSifter.ts --level A1            # audit only A1
 *   npx tsx scripts/wordSifter.ts --dry-run             # preview, no deletes/updates
 *   npx tsx scripts/wordSifter.ts --level A1 --yes      # skip confirmation
 *   npx tsx scripts/wordSifter.ts --keep-log            # save report to data/
 *
 * Required env vars:
 *   APPWRITE_ENDPOINT        (or EXPO_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID      (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_DATABASE_ID     (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *   APPWRITE_API_KEY         (server-side key — NOT EXPO_PUBLIC)
 *   ANTHROPIC_API_KEY        (or EXPO_PUBLIC_CLAUDE_API_KEY)
 */

import { Client, Databases, Query } from "node-appwrite";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const WORDS_COLLECTION = process.env.APPWRITE_WORDS_COLLECTION_ID || "words";
const USER_WORDS_COLLECTION =
  process.env.APPWRITE_USER_WORDS_COLLECTION_ID || "userwords";
const PAGE_SIZE = 100;
const CONTEXT_BATCH_SIZE = 10;
const MAX_CLAUDE_RETRIES = 4;
const MAX_APPWRITE_RETRIES = 4;

const LEVEL_RULES: Record<string, string> = {
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

// ─── Reason codes ────────────────────────────────────────────────────────────

type FlagReason =
  | "missing_phonetic"
  | "nonsensical_word"
  | "missing_definition"
  | "missing_example"
  | "missing_context"
  | "too_short_definition";

interface FlaggedWord {
  id: string;
  word: string;
  level: string;
  phonetic: string;
  reasons: FlagReason[];
}

interface VerifyWord {
  id: string;
  word: string;
  level: string;
  partOfSpeech: string;
}

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level | null = null;
  let dryRun = false;
  let yes = false;
  let keepLog = false;

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
  }
  return { level, dryRun, yes, keepLog };
}

// ─── Appwrite setup ──────────────────────────────────────────────────────────

function createClient() {
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

function createAnthropic() {
  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing required environment variable: ANTHROPIC_API_KEY or EXPO_PUBLIC_CLAUDE_API_KEY",
    );
    process.exit(1);
  }
  return new Anthropic({ apiKey });
}

// ─── Quality checks ──────────────────────────────────────────────────────────

const ALLOWED_MULTI_WORD = new Set([
  "pick up", "give up", "look for", "look up", "come back", "go back", "get up",
  "get on", "get off", "get out", "get in", "turn on", "turn off", "take off",
  "put on", "put down", "put up", "come in", "go out", "sit down", "stand up",
  "wake up", "find out", "work out", "make up", "break down", "set up", "run out",
  "carry on", "hang out", "show up", "bring up", "point out", "give back", "come up",
  "go on", "take on", "take up", "let down", "look after", "look out", "call off",
  "shut down", "throw away", "check in", "check out", "grow up", "pass out",
  "slow down", "speed up", "sign up", "log in", "log out", "sign in", "sign out",
  "ice cream", "living room", "post office", "traffic light", "bus stop", "airport",
  "high school", "credit card", "shopping center", "washing machine", "remote control",
  "cell phone", "coffee shop", "swimming pool", "parking lot", "bus station",
  "train station", "fire station", "police station", "of course", "a lot", "as well",
  "each other", "in fact", "at least", "at first", "so far",
]);

function isNonsensicalMultiWord(word: string): boolean {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed.includes(" ")) return false;
  if (ALLOWED_MULTI_WORD.has(trimmed)) return false;
  return true;
}

function auditWord(doc: Record<string, any>): FlagReason[] {
  const reasons: FlagReason[] = [];

  const word = (doc.word ?? "").trim();
  const phonetic = (doc.phonetic ?? "").trim();
  const definition = (doc.definition ?? "").trim();
  const example = (doc.exampleSentence ?? "").trim();
  const context = (doc.contextPassage ?? "").trim();

  if (!phonetic || phonetic === "/.../") reasons.push("missing_phonetic");
  if (isNonsensicalMultiWord(word)) reasons.push("nonsensical_word");
  if (!definition) reasons.push("missing_definition");
  else if (definition.length < 10) reasons.push("too_short_definition");
  if (!example) reasons.push("missing_example");
  if (!context) reasons.push("missing_context");

  return reasons;
}

// ─── Confirmation & Retry ────────────────────────────────────────────────────

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

async function withRetry<T>(fn: () => Promise<T>, label: string, isAppwrite = true): Promise<T> {
  let lastErr: any = null;
  const max = isAppwrite ? MAX_APPWRITE_RETRIES : MAX_CLAUDE_RETRIES;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const code = isAppwrite ? (err?.code ?? err?.response?.code) : (err?.status ?? err?.response?.status);
      const isTransient =
        code === undefined ||
        code === 429 ||
        code === 500 ||
        code === 502 ||
        code === 503 ||
        code === 504 ||
        code === 529;
      if (!isTransient || attempt >= max) throw err;
      const delay = (isAppwrite ? 1000 : 2000) * Math.pow(2, attempt - 1);
      console.warn(`  ${label} attempt ${attempt}/${max} failed (code ${code ?? "network"}). Retrying in ${delay / 1000}s...`);
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

// ─── AI Verification ─────────────────────────────────────────────────────────

async function verifyWithClaude(anthropic: Anthropic, words: VerifyWord[], level: string): Promise<any[]> {
  const wordList = words
    .map((w) => `- "${w.word}" (current part of speech: ${w.partOfSpeech})`)
    .join("\n");

  const prompt = `You are a vocabulary content writer for an English learning app. Your output is for CEFR ${level} learners.

${LEVEL_RULES[level]}

For each word below, do the following:
1. Determine the MOST COMMON part of speech for the word (e.g., "get" is mostly used as a "verb").
2. Use the most common part of speech. If the current part of speech is already a common/valid part of speech for the word, you can keep it, but if it is usually used as a different part of speech (like "get" is mostly a verb, not a noun), change it to the most common one.
3. Generate a level-appropriate definition, exampleSentence, contextPassage, and 3 distractors using the MOST COMMON part of speech.

Output ONLY a JSON array, no markdown fences, no commentary. You MUST return exactly ${words.length} items, one per input word, in the SAME order.
Return format:
[{"word":"...","partOfSpeech":"...","definition":"...","exampleSentence":"...","contextPassage":"...","distractors":["...","...","..."]}]

Words:
${wordList}`;

  const text = await withRetry(async () => {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    return block && block.type === "text" ? block.text : "";
  }, `Claude batch for ${level}`, false);

  const parsed = extractJsonArray(text);
  return parsed || [];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, dryRun, yes, keepLog } = parseArgs();
  const { databases, dbId } = createClient();
  const anthropic = createAnthropic();

  const scopeLabel = level ? `level ${level}` : "ALL LEVELS";

  console.log(`\n🔍 Word Sifter — auditing and verifying ${scopeLabel}`);
  console.log(`   Collections: ${WORDS_COLLECTION}, ${USER_WORDS_COLLECTION}`);
  if (dryRun) console.log("   MODE: dry run (no deletes or updates)\n");
  else console.log("");

  // ── Step 1: Fetch all word documents ──────────────────────────────────────

  console.log("  Fetching words from Appwrite...");

  const allDocs: Record<string, any>[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries: any[] = [];
    if (level) queries.push(Query.equal("level", level));
    queries.push(Query.limit(PAGE_SIZE));
    queries.push(Query.orderAsc("$id"));
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await withRetry(
      () => databases.listDocuments(dbId, WORDS_COLLECTION, queries),
      "fetch words",
    );

    allDocs.push(...page.documents);
    if (page.documents.length < PAGE_SIZE) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }

  console.log(`  Found ${allDocs.length} word(s) in scope.\n`);

  // ── Step 2: Basic Audit & Separate for AI Verification ────────────────────

  const flaggedForDelete: FlaggedWord[] = [];
  const queuedForAI: Record<string, VerifyWord[]> = {};

  for (const doc of allDocs) {
    const reasons = auditWord(doc);
    if (reasons.length > 0) {
      flaggedForDelete.push({
        id: doc.$id,
        word: doc.word ?? "(unknown)",
        level: doc.level ?? "?",
        phonetic: doc.phonetic ?? "",
        reasons,
      });
    } else if (doc.aiVerified !== true) { // Needs verification
      const lvl = doc.level ?? "B1";
      if (!queuedForAI[lvl]) queuedForAI[lvl] = [];
      queuedForAI[lvl].push({
        id: doc.$id,
        word: doc.word ?? "",
        level: lvl,
        partOfSpeech: doc.partOfSpeech ?? "other",
      });
    }
  }

  const aiTotalCount = Object.values(queuedForAI).reduce((sum, arr) => sum + arr.length, 0);

  // ── Step 3: Delete Report ─────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════");
  console.log("  BASIC AUDIT RESULTS (For Deletion)");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(`  Total words scanned: ${allDocs.length}`);
  console.log(`  Flagged for removal: ${flaggedForDelete.length}`);
  console.log(`  Queued for AI check: ${aiTotalCount}\n`);

  if (flaggedForDelete.length > 0) {
    console.log("  ── Words flagged for deletion ──\n");
    const byLevel: Record<string, FlaggedWord[]> = {};
    for (const f of flaggedForDelete) {
      (byLevel[f.level] ??= []).push(f);
    }
    for (const [lvl, words] of Object.entries(byLevel).sort()) {
      console.log(`  [${lvl}] ${words.length} word(s):`);
      for (const w of words) {
        const reasonStr = w.reasons.join(", ");
        console.log(`    • ${w.word}  →  ${reasonStr}`);
      }
      console.log("");
    }
  }

  if (keepLog && flaggedForDelete.length > 0) {
    const logPath = path.join(__dirname, `../data/sift-report-${level ?? "all"}-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(flaggedForDelete, null, 2));
    console.log(`  📄 Report saved: ${logPath}\n`);
  }

  // Confirm execution
  if (!dryRun && !yes && (flaggedForDelete.length > 0 || aiTotalCount > 0)) {
    const msg = `\n⚠️   This will permanently delete ${flaggedForDelete.length} word(s) and update ${aiTotalCount} word(s) via Claude AI.\n    Type "yes" to proceed: `;
    const ok = await confirm(msg);
    if (!ok) {
      console.log("    Aborted.\n");
      return;
    }
  }

  // ── Step 4: Purge Flagged Words ───────────────────────────────────────────

  const deleteStats = { wordsDeleted: 0, wordsFailed: 0, userWordsDeleted: 0, userWordsFailed: 0 };

  if (flaggedForDelete.length > 0 && !dryRun) {
    console.log(`  Deleting ${flaggedForDelete.length} words...`);
    for (let i = 0; i < flaggedForDelete.length; i++) {
      const f = flaggedForDelete[i];
      // Delete userwords
      try {
        let uwCursor: string | undefined;
        while (true) {
          const uwQueries: any[] = [Query.equal("wordId", f.id), Query.limit(PAGE_SIZE)];
          if (uwCursor) uwQueries.push(Query.cursorAfter(uwCursor));
          const uwPage = await withRetry(() => databases.listDocuments(dbId, USER_WORDS_COLLECTION, uwQueries), `list userwords for "${f.word}"`);
          for (const uw of uwPage.documents) {
            try {
              await withRetry(() => databases.deleteDocument(dbId, USER_WORDS_COLLECTION, uw.$id), `delete userword ${uw.$id}`);
              deleteStats.userWordsDeleted++;
            } catch (err: any) {
              deleteStats.userWordsFailed++;
              console.error(`\n  Failed to delete userword ${uw.$id}: ${err.message}`);
            }
          }
          if (uwPage.documents.length < PAGE_SIZE) break;
          uwCursor = undefined;
        }
      } catch (err: any) {
        console.warn(`\n  ⚠️ Could not query userwords for "${f.word}": ${err.message}`);
      }
      // Delete word
      try {
        await withRetry(() => databases.deleteDocument(dbId, WORDS_COLLECTION, f.id), `delete "${f.word}"`);
        deleteStats.wordsDeleted++;
      } catch (err: any) {
        deleteStats.wordsFailed++;
        console.error(`\n  Failed to delete word "${f.word}": ${err.message}`);
      }
      if ((i + 1) % 5 === 0 || i === flaggedForDelete.length - 1) process.stdout.write(`  ${i + 1}/${flaggedForDelete.length} deleted...\r`);
    }
    console.log("\n");
  } else if (dryRun && flaggedForDelete.length > 0) {
    console.log(`  [DRY RUN] Would delete ${flaggedForDelete.length} words.\n`);
  }

  // ── Step 5: AI Verification & Update ──────────────────────────────────────

  const updateStats = { updated: 0, failed: 0 };

  if (aiTotalCount > 0) {
    console.log("═══════════════════════════════════════════════════");
    console.log("  AI VERIFICATION & UPDATES");
    console.log("═══════════════════════════════════════════════════\n");

    for (const [lvl, words] of Object.entries(queuedForAI)) {
      console.log(`  Processing ${words.length} words for level ${lvl}...`);
      
      for (let i = 0; i < words.length; i += CONTEXT_BATCH_SIZE) {
        const batch = words.slice(i, i + CONTEXT_BATCH_SIZE);
        const batchNum = Math.floor(i / CONTEXT_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(words.length / CONTEXT_BATCH_SIZE);
        console.log(`    Batch ${batchNum}/${totalBatches}...`);

        if (dryRun) {
          console.log(`    [DRY RUN] Would verify: ${batch.map(w => w.word).join(", ")}`);
          continue;
        }

        try {
          const aiResults = await verifyWithClaude(anthropic, batch, lvl);
          
          for (let j = 0; j < aiResults.length; j++) {
            const result = aiResults[j];
            const original = batch.find(w => w.word.toLowerCase() === (result.word ?? "").toLowerCase());
            if (!original) {
              console.warn(`      ⚠️  Claude returned a word not in the batch: ${result.word}`);
              continue;
            }

            // Verify all fields are present
            const isComplete = result.definition && result.exampleSentence && result.contextPassage && Array.isArray(result.distractors) && result.distractors.length === 3;
            if (!isComplete) {
              console.warn(`      ⚠️  Claude returned incomplete data for "${original.word}". Skipping update.`);
              continue;
            }

            try {
              await withRetry(() => databases.updateDocument(dbId, WORDS_COLLECTION, original.id, {
                partOfSpeech: result.partOfSpeech || original.partOfSpeech,
                definition: result.definition,
                exampleSentence: result.exampleSentence,
                contextPassage: result.contextPassage,
                distractors: result.distractors,
                aiVerified: true,
              }), `update word "${original.word}"`);
              updateStats.updated++;
            } catch (err: any) {
              updateStats.failed++;
              console.error(`      ❌ Failed to update "${original.word}": ${err.message}`);
            }
          }
        } catch (err: any) {
          console.error(`    ❌ AI Batch failed entirely: ${err.message}`);
        }

        if (i + CONTEXT_BATCH_SIZE < words.length) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  // ── Step 6: Summary ───────────────────────────────────────────────────────

  console.log(`\n✅ Sift & Verify complete!`);
  if (!dryRun) {
    console.log(`   Words deleted:      ${deleteStats.wordsDeleted} (${deleteStats.wordsFailed} failed)`);
    console.log(`   UserWords deleted:  ${deleteStats.userWordsDeleted} (${deleteStats.userWordsFailed} failed)`);
    console.log(`   Words AI Updated:   ${updateStats.updated} (${updateStats.failed} failed)\n`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
