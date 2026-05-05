/**
 * Step 3 of the word pipeline — level-focused.
 * Reads enriched word JSON and upserts into the Appwrite words collection.
 * No field categorization — only CEFR level + content.
 *
 * Input:  data/enriched-{level}.json
 * Output: Documents in Appwrite "words" collection
 *
 * Usage:
 *   npm run pipeline:seed -- --level A1
 *   npm run pipeline:seed -- --level A1 --dry-run
 *
 * Note on schema:
 *   If the Appwrite `words` collection still has a `fields` attribute marked
 *   REQUIRED, either make it optional or drop it — this script no longer
 *   writes to it.
 *
 * Required env vars:
 *   APPWRITE_ENDPOINT        (or EXPO_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID      (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_DATABASE_ID     (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *   APPWRITE_API_KEY         (server-side key — NOT EXPO_PUBLIC)
 *   APPWRITE_WORDS_COLLECTION_ID  (optional, defaults to "words")
 */

import { Client, Databases, ID, Query } from "node-appwrite";
import * as fs from "fs";
import * as path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

interface EnrichedWord {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  contextPassage: string;
  distractors: string[];
  level: Level;
  usabilityScore: number;
}

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level = "B1";
  let dryRun = false;

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
  }
  return { level, dryRun };
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

  const collectionId = process.env.APPWRITE_WORDS_COLLECTION_ID || "words";

  return { databases: new Databases(client), dbId, collectionId };
}

// ─── Retry helper for Appwrite transient errors ──────────────────────────────

const MAX_APPWRITE_RETRIES = 4;

function isTransientAppwriteError(err: any): boolean {
  const code = err?.code ?? err?.response?.code;
  // 429 rate limited, 5xx server errors, undefined = network
  return (
    code === undefined ||
    code === 429 ||
    code === 500 ||
    code === 502 ||
    code === 503 ||
    code === 504
  );
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= MAX_APPWRITE_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (!isTransientAppwriteError(err) || attempt >= MAX_APPWRITE_RETRIES) {
        throw err;
      }
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s
      console.warn(
        `\n  ${label} attempt ${attempt}/${MAX_APPWRITE_RETRIES} failed (code ${err?.code ?? "network"}). Retrying in ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("unreachable");
}

// ─── Upsert logic ────────────────────────────────────────────────────────────

function payloadFor(word: EnrichedWord) {
  return {
    word: word.word,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    definition: word.definition,
    exampleSentence: word.exampleSentence,
    contextPassage: word.contextPassage,
    distractors: word.distractors,
    level: word.level,
    usabilityScore: word.usabilityScore,
    audioUrl: "",
  };
}

// A word is only seeded if EVERY content field is non-empty.
// Missing any single field (phonetic, POS, definition, example, context) means
// the entry is partial and will be skipped rather than polluting the DB.
const REQUIRED_FIELDS: (keyof EnrichedWord)[] = [
  "word",
  "phonetic",
  "partOfSpeech",
  "definition",
  "exampleSentence",
  "contextPassage",
  "distractors",
];

function missingFields(word: EnrichedWord): string[] {
  return REQUIRED_FIELDS.filter((k) => {
    const v = word[k];
    if (k === "distractors") {
      return !Array.isArray(v) || v.length !== 3 || v.some((d) => typeof d !== "string" || d.trim().length === 0);
    }
    return typeof v !== "string" || v.trim().length === 0;
  }) as string[];
}

async function upsertWord(
  databases: Databases,
  dbId: string,
  collectionId: string,
  word: EnrichedWord,
): Promise<"created" | "updated" | "skipped"> {
  // Skip words that are missing any required content field
  if (missingFields(word).length > 0) return "skipped";

  // Match by word + level: same lemma at different CEFR levels gets different
  // docs so we can keep A1-simple vs C1-nuanced definitions side by side.
  const existing = await withRetry(
    () =>
      databases.listDocuments(dbId, collectionId, [
        Query.equal("word", word.word),
        Query.equal("level", word.level),
        Query.limit(1),
      ]),
    `list "${word.word}"`,
  );

  if (existing.total > 0) {
    const doc = existing.documents[0];
    const hasRicherContent =
      word.definition.length > (doc.definition?.length ?? 0) ||
      word.exampleSentence.length > (doc.exampleSentence?.length ?? 0) ||
      word.usabilityScore > (doc.usabilityScore as number);

    if (!hasRicherContent) return "skipped";

    await withRetry(
      () =>
        databases.updateDocument(dbId, collectionId, doc.$id, {
          phonetic: word.phonetic || doc.phonetic,
          partOfSpeech: word.partOfSpeech || doc.partOfSpeech,
          definition: word.definition || doc.definition,
          exampleSentence: word.exampleSentence || doc.exampleSentence,
          contextPassage: word.contextPassage || doc.contextPassage,
          distractors: word.distractors || doc.distractors,
          usabilityScore: Math.max(
            word.usabilityScore,
            (doc.usabilityScore as number) ?? 0,
          ),
        }),
      `update "${word.word}"`,
    );
    return "updated";
  }

  await withRetry(
    () =>
      databases.createDocument(
        dbId,
        collectionId,
        ID.unique(),
        payloadFor(word),
      ),
    `create "${word.word}"`,
  );
  return "created";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, dryRun } = parseArgs();

  const enrichedPath = path.join(__dirname, `../data/enriched-${level}.json`);
  if (!fs.existsSync(enrichedPath)) {
    console.error(`Enriched file not found: ${enrichedPath}`);
    console.error(
      `\nRun step 2 first: npm run pipeline:enrich -- --level ${level}`,
    );
    process.exit(1);
  }

  const words: EnrichedWord[] = JSON.parse(
    fs.readFileSync(enrichedPath, "utf-8"),
  );

  // Safety: ensure all entries have the expected level
  const wrongLevel = words.filter((w) => w.level !== level);
  if (wrongLevel.length > 0) {
    console.warn(
      `  ⚠️  ${wrongLevel.length} words in the file have a different level field. They'll still be seeded using their own level.`,
    );
  }

  console.log(
    `\n🌱 Seeding ${words.length} words (level ${level}) into Appwrite`,
  );

  // Audit: count incomplete entries and per-field missingness before touching Appwrite
  const incomplete = words.filter((w) => missingFields(w).length > 0);
  const complete = words.length - incomplete.length;
  if (incomplete.length > 0) {
    const fieldCounts: Record<string, number> = {};
    for (const w of incomplete) {
      for (const f of missingFields(w)) {
        fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
      }
    }
    console.log(
      `   ⚠️  ${incomplete.length} words are incomplete and will be skipped entirely.`,
    );
    for (const [f, c] of Object.entries(fieldCounts).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`       missing ${f.padEnd(16)} ${c}`);
    }
    const sample = incomplete
      .slice(0, 5)
      .map((w) => `${w.word} [${missingFields(w).join(", ")}]`);
    console.log(
      `       examples: ${sample.join("; ")}${incomplete.length > 5 ? "; ..." : ""}`,
    );
  }
  console.log(`   ${complete} words are complete and eligible for seeding.\n`);

  if (dryRun) {
    console.log("   DRY RUN — no changes will be made\n");
    console.log(`   Would upsert: ${complete}`);
    console.log(`   Would skip (incomplete): ${incomplete.length}`);
    return;
  }

  if (complete === 0) {
    console.error("Nothing complete to seed. Aborting.");
    process.exit(1);
  }

  const { databases, dbId, collectionId } = createClient();

  const stats = { created: 0, updated: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < words.length; i++) {
    try {
      const result = await upsertWord(databases, dbId, collectionId, words[i]);
      stats[result]++;
    } catch (err: any) {
      stats.failed++;
      console.error(`\n  Failed "${words[i].word}": ${err.message}`);
    }

    if ((i + 1) % 10 === 0 || i === words.length - 1) {
      process.stdout.write(`  ${i + 1}/${words.length} processed...\r`);
    }
  }

  console.log(`\n\n✅ Seeding complete!`);
  console.log(`   Created:  ${stats.created}`);
  console.log(`   Updated:  ${stats.updated}`);
  console.log(`   Skipped:  ${stats.skipped}`);
  console.log(`   Failed:   ${stats.failed}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
