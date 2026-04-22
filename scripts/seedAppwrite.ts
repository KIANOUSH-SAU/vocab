/**
 * Step 3 of the word pipeline.
 * Reads enriched word JSON and upserts into Appwrite words collection.
 *
 * Input:  data/enriched-{level}.json
 * Output: Documents in Appwrite "words" collection
 *
 * Usage:
 *   npx tsx scripts/seedAppwrite.ts --level B1
 *   npx tsx scripts/seedAppwrite.ts --level B1 --dry-run
 *
 * Required env vars:
 *   APPWRITE_ENDPOINT        (or EXPO_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID      (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_DATABASE_ID     (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *   APPWRITE_API_KEY         (server-side key — NOT the EXPO_PUBLIC one)
 */

import { Client, Databases, ID, Query } from "node-appwrite";
import * as fs from "fs";
import * as path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrichedWord {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  contextPassage: string;
  level: string;
  fields: string[];
  usabilityScore: number;
}

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level = "B1";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) level = args[i + 1];
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
    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
  const collectionId =
    process.env.APPWRITE_WORDS_COLLECTION_ID || "words";

  return { databases: new Databases(client), dbId, collectionId };
}

// ─── Upsert logic ────────────────────────────────────────────────────────────

async function upsertWord(
  databases: Databases,
  dbId: string,
  collectionId: string,
  word: EnrichedWord
): Promise<"created" | "updated" | "skipped"> {
  const existing = await databases.listDocuments(dbId, collectionId, [
    Query.equal("word", word.word),
    Query.limit(1),
  ]);

  if (existing.total > 0) {
    const doc = existing.documents[0];
    const existingFields = (doc.fields as string[]) || [];
    const mergedFields = [...new Set([...existingFields, ...word.fields])];
    const shouldUpdate =
      word.usabilityScore > (doc.usabilityScore as number) ||
      mergedFields.length > existingFields.length ||
      !(doc.definition as string); // update if definition was missing

    if (!shouldUpdate) return "skipped";

    await databases.updateDocument(dbId, collectionId, doc.$id, {
      phonetic: word.phonetic || doc.phonetic,
      partOfSpeech: word.partOfSpeech || doc.partOfSpeech,
      definition: word.definition || doc.definition,
      exampleSentence: word.exampleSentence || doc.exampleSentence,
      contextPassage: word.contextPassage || doc.contextPassage,
      fields: mergedFields,
      usabilityScore: Math.max(word.usabilityScore, doc.usabilityScore as number),
    });
    return "updated";
  }

  // Skip words with no definition (incomplete enrichment)
  if (!word.definition) return "skipped";

  await databases.createDocument(dbId, collectionId, ID.unique(), {
    word: word.word,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    definition: word.definition,
    exampleSentence: word.exampleSentence,
    contextPassage: word.contextPassage,
    level: word.level,
    fields: word.fields,
    usabilityScore: word.usabilityScore,
    audioUrl: "",
  });
  return "created";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, dryRun } = parseArgs();

  const enrichedPath = path.join(
    __dirname,
    `../data/enriched-${level}.json`
  );
  if (!fs.existsSync(enrichedPath)) {
    console.error(`Enriched file not found: ${enrichedPath}`);
    console.error(
      `\nRun step 2 first: npx tsx scripts/enrichWords.ts --level ${level}`
    );
    process.exit(1);
  }

  const words: EnrichedWord[] = JSON.parse(
    fs.readFileSync(enrichedPath, "utf-8")
  );

  console.log(`\n🌱 Seeding ${words.length} words (level ${level}) into Appwrite`);

  if (dryRun) {
    console.log("   DRY RUN — no changes will be made\n");
    const fieldCounts: Record<string, number> = {};
    for (const w of words) {
      for (const f of w.fields) {
        fieldCounts[f] = (fieldCounts[f] || 0) + 1;
      }
    }
    console.log("   Words per field:");
    for (const [f, c] of Object.entries(fieldCounts)) {
      console.log(`   ${f.padEnd(14)} ${c}`);
    }
    console.log(`\n   Total documents to create: ${words.filter((w) => w.definition).length}`);
    console.log(`   Skipped (no definition): ${words.filter((w) => !w.definition).length}`);
    return;
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

    // Progress indicator
    if ((i + 1) % 10 === 0 || i === words.length - 1) {
      process.stdout.write(
        `  ${i + 1}/${words.length} processed...\r`
      );
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
