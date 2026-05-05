/**
 * Word Sifter — quality gate for the Appwrite words collection.
 * Scans every word document and flags entries that should be purged:
 *
 *   1. Missing phonetics  — phonetic field is empty or missing
 *   2. Nonsensical words   — multi-word entries that aren't real vocabulary
 *                            (e.g. "five number", "go bus")
 *   3. Missing content     — definition, exampleSentence, or contextPassage
 *                            are empty / too short to be useful
 *
 * Flagged words are deleted from BOTH the `words` and `userwords` collections
 * so they're fully purged from the app.
 *
 * Usage:
 *   npx tsx scripts/wordSifter.ts                       # audit all levels
 *   npx tsx scripts/wordSifter.ts --level A1            # audit only A1
 *   npx tsx scripts/wordSifter.ts --dry-run             # preview, no deletes
 *   npx tsx scripts/wordSifter.ts --level A1 --yes      # skip confirmation
 *   npx tsx scripts/wordSifter.ts --keep-log            # save report to data/
 *
 * Required env vars:
 *   APPWRITE_ENDPOINT        (or EXPO_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID      (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_DATABASE_ID     (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *   APPWRITE_API_KEY         (server-side key — NOT EXPO_PUBLIC)
 */

import { Client, Databases, Query } from "node-appwrite";
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

// ─── Quality checks ──────────────────────────────────────────────────────────

/**
 * Well-known multi-word vocabulary that should NOT be flagged:
 * phrasal verbs, compound nouns, fixed expressions.
 */
const ALLOWED_MULTI_WORD = new Set([
  // Common phrasal verbs
  "pick up",
  "give up",
  "look for",
  "look up",
  "come back",
  "go back",
  "get up",
  "get on",
  "get off",
  "get out",
  "get in",
  "turn on",
  "turn off",
  "take off",
  "put on",
  "put down",
  "put up",
  "come in",
  "go out",
  "sit down",
  "stand up",
  "wake up",
  "find out",
  "work out",
  "make up",
  "break down",
  "set up",
  "run out",
  "carry on",
  "hang out",
  "show up",
  "bring up",
  "point out",
  "give back",
  "come up",
  "go on",
  "take on",
  "take up",
  "let down",
  "look after",
  "look out",
  "call off",
  "shut down",
  "throw away",
  "check in",
  "check out",
  "grow up",
  "pass out",
  "slow down",
  "speed up",
  "sign up",
  "log in",
  "log out",
  "sign in",
  "sign out",
  // Common compound nouns / fixed phrases
  "ice cream",
  "living room",
  "post office",
  "traffic light",
  "bus stop",
  "airport",
  "high school",
  "credit card",
  "shopping center",
  "washing machine",
  "remote control",
  "cell phone",
  "coffee shop",
  "swimming pool",
  "parking lot",
  "bus station",
  "train station",
  "fire station",
  "police station",
  "of course",
  "a lot",
  "as well",
  "each other",
  "in fact",
  "at least",
  "at first",
  "so far",
]);

/**
 * Check if a word entry is a nonsensical multi-word expression.
 * Returns true if the word contains spaces and is NOT in our allowlist.
 */
function isNonsensicalMultiWord(word: string): boolean {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed.includes(" ")) return false; // single word — fine
  if (ALLOWED_MULTI_WORD.has(trimmed)) return false; // known phrase — fine
  return true; // multi-word and not recognized — flag it
}

/**
 * Run all quality checks against a word document.
 * Returns an array of reasons it should be flagged, or empty if it passes.
 */
function auditWord(doc: Record<string, any>): FlagReason[] {
  const reasons: FlagReason[] = [];

  const word = (doc.word ?? "").trim();
  const phonetic = (doc.phonetic ?? "").trim();
  const definition = (doc.definition ?? "").trim();
  const example = (doc.exampleSentence ?? "").trim();
  const context = (doc.contextPassage ?? "").trim();

  // 1. Missing phonetics
  if (!phonetic || phonetic === "/.../") {
    reasons.push("missing_phonetic");
  }

  // 2. Nonsensical multi-word entry
  if (isNonsensicalMultiWord(word)) {
    reasons.push("nonsensical_word");
  }

  // 3. Missing core content
  if (!definition) {
    reasons.push("missing_definition");
  } else if (definition.length < 10) {
    reasons.push("too_short_definition");
  }

  if (!example) {
    reasons.push("missing_example");
  }

  if (!context) {
    reasons.push("missing_context");
  }

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

// ─── Retry helper ────────────────────────────────────────────────────────────

const MAX_RETRIES = 4;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
      if (!isTransient || attempt >= MAX_RETRIES) throw err;
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.warn(
        `  ${label} attempt ${attempt}/${MAX_RETRIES} failed (code ${code ?? "network"}). Retrying in ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("unreachable");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, dryRun, yes, keepLog } = parseArgs();
  const { databases, dbId } = createClient();

  const scopeLabel = level ? `level ${level}` : "ALL LEVELS";

  console.log(`\n🔍 Word Sifter — auditing ${scopeLabel}`);
  console.log(`   Collections: ${WORDS_COLLECTION}, ${USER_WORDS_COLLECTION}`);
  if (dryRun) console.log("   MODE: dry run (no deletes)\n");
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

  // ── Step 2: Audit each word ───────────────────────────────────────────────

  const flagged: FlaggedWord[] = [];

  for (const doc of allDocs) {
    const reasons = auditWord(doc);
    if (reasons.length > 0) {
      flagged.push({
        id: doc.$id,
        word: doc.word ?? "(unknown)",
        level: doc.level ?? "?",
        phonetic: doc.phonetic ?? "",
        reasons,
      });
    }
  }

  // ── Step 3: Report ────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════");
  console.log("  AUDIT RESULTS");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(`  Total words scanned: ${allDocs.length}`);
  console.log(`  Clean:               ${allDocs.length - flagged.length}`);
  console.log(`  Flagged for removal: ${flagged.length}\n`);

  if (flagged.length === 0) {
    console.log("  ✅ All words passed quality checks. Nothing to purge.\n");
    return;
  }

  // Breakdown by reason
  const reasonCounts: Record<FlagReason, number> = {
    missing_phonetic: 0,
    nonsensical_word: 0,
    missing_definition: 0,
    missing_example: 0,
    missing_context: 0,
    too_short_definition: 0,
  };
  for (const f of flagged) {
    for (const r of f.reasons) reasonCounts[r]++;
  }

  console.log("  Reason breakdown:");
  const reasonLabels: Record<FlagReason, string> = {
    missing_phonetic: "Missing phonetic",
    nonsensical_word: "Nonsensical / multi-word",
    missing_definition: "Missing definition",
    missing_example: "Missing example sentence",
    missing_context: "Missing context passage",
    too_short_definition: "Too-short definition",
  };
  for (const [reason, count] of Object.entries(reasonCounts)) {
    if (count > 0) {
      const label = reasonLabels[reason as FlagReason];
      console.log(`    ${label.padEnd(28)} ${count}`);
    }
  }

  // Print flagged words grouped by reason
  console.log("\n  ── Flagged words ──\n");

  // Group by primary reason for cleaner output
  const byLevel: Record<string, FlaggedWord[]> = {};
  for (const f of flagged) {
    (byLevel[f.level] ??= []).push(f);
  }

  for (const [lvl, words] of Object.entries(byLevel).sort()) {
    console.log(`  [${lvl}] ${words.length} word(s):`);
    for (const w of words) {
      const reasonStr = w.reasons.map((r) => reasonLabels[r]).join(", ");
      const phoneticStr = w.phonetic ? ` ${w.phonetic}` : "";
      console.log(`    • ${w.word}${phoneticStr}  →  ${reasonStr}`);
    }
    console.log("");
  }

  // ── Save log if requested ─────────────────────────────────────────────────

  if (keepLog) {
    const logPath = path.join(
      __dirname,
      `../data/sift-report-${level ?? "all"}-${Date.now()}.json`,
    );
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(flagged, null, 2));
    console.log(`  📄 Report saved: ${logPath}\n`);
  }

  // ── Step 4: Purge (unless dry run) ────────────────────────────────────────

  if (dryRun) {
    console.log(
      `  DRY RUN — ${flagged.length} word(s) would be purged. No changes made.\n`,
    );
    return;
  }

  if (!yes) {
    const ok = await confirm(
      `\n⚠️   This will permanently delete ${flagged.length} word(s) and their ` +
        `associated userword records.\n    Type "yes" to proceed: `,
    );
    if (!ok) {
      console.log("    Aborted.\n");
      return;
    }
  }

  const stats = {
    wordsDeleted: 0,
    wordsFailed: 0,
    userWordsDeleted: 0,
    userWordsFailed: 0,
  };

  for (let i = 0; i < flagged.length; i++) {
    const f = flagged[i];

    // Delete associated userword records first
    try {
      let uwCursor: string | undefined;
      while (true) {
        const uwQueries: any[] = [
          Query.equal("wordId", f.id),
          Query.limit(PAGE_SIZE),
        ];
        if (uwCursor) uwQueries.push(Query.cursorAfter(uwCursor));

        const uwPage = await withRetry(
          () => databases.listDocuments(dbId, USER_WORDS_COLLECTION, uwQueries),
          `list userwords for "${f.word}"`,
        );

        for (const uw of uwPage.documents) {
          try {
            await withRetry(
              () =>
                databases.deleteDocument(dbId, USER_WORDS_COLLECTION, uw.$id),
              `delete userword ${uw.$id}`,
            );
            stats.userWordsDeleted++;
          } catch (err: any) {
            stats.userWordsFailed++;
            console.error(
              `\n  Failed to delete userword ${uw.$id}: ${err.message}`,
            );
          }
        }

        if (uwPage.documents.length < PAGE_SIZE) break;
        // Re-query from the top since we deleted documents
        uwCursor = undefined;
      }
    } catch (err: any) {
      // If the userwords query itself fails, log but continue to word deletion
      console.warn(
        `\n  ⚠️ Could not query userwords for "${f.word}": ${err.message}`,
      );
    }

    // Delete the word document
    try {
      await withRetry(
        () => databases.deleteDocument(dbId, WORDS_COLLECTION, f.id),
        `delete "${f.word}"`,
      );
      stats.wordsDeleted++;
    } catch (err: any) {
      stats.wordsFailed++;
      console.error(`\n  Failed to delete word "${f.word}": ${err.message}`);
    }

    if ((i + 1) % 5 === 0 || i === flagged.length - 1) {
      process.stdout.write(`  ${i + 1}/${flagged.length} processed...\r`);
    }
  }

  console.log(`\n\n✅ Sift complete!`);
  console.log(`   Words deleted:      ${stats.wordsDeleted}`);
  console.log(`   Words failed:       ${stats.wordsFailed}`);
  console.log(`   UserWords deleted:  ${stats.userWordsDeleted}`);
  console.log(`   UserWords failed:   ${stats.userWordsFailed}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
