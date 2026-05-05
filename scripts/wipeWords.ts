/**
 * Destructive utility — deletes word documents from the Appwrite
 * `words` collection. Requires explicit confirmation.
 *
 * Does NOT touch user-words, users, or any other collection.
 *
 * Usage:
 *   npm run pipeline:wipe -- --level A1              # wipe only A1 words
 *   npm run pipeline:wipe -- --all-levels            # wipe every word
 *   npm run pipeline:wipe -- --level A1 --yes        # skip confirmation prompt
 *   npm run pipeline:wipe -- --all-levels --dry-run  # preview only
 *
 * Required env vars:
 *   APPWRITE_ENDPOINT        (or EXPO_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID      (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_DATABASE_ID     (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *   APPWRITE_API_KEY         (server-side key — NOT EXPO_PUBLIC)
 *   APPWRITE_WORDS_COLLECTION_ID  (optional, defaults to "words")
 */

import { Client, Databases, Query } from "node-appwrite";
import * as readline from "readline";

// ─── Config ──────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const PAGE_SIZE = 100;

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level | null = null;
  let allLevels = false;
  let yes = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) {
      const l = args[i + 1].toUpperCase();
      if (LEVELS.includes(l as Level)) level = l as Level;
      else {
        console.error(`Invalid level "${l}". Must be one of: ${LEVELS.join(", ")}`);
        process.exit(1);
      }
    }
    if (args[i] === "--all-levels") allLevels = true;
    if (args[i] === "--yes" || args[i] === "-y") yes = true;
    if (args[i] === "--dry-run") dryRun = true;
  }

  if (!level && !allLevels) {
    console.error(
      "Must specify either --level <A1|A2|B1|B2|C1> or --all-levels.",
    );
    process.exit(1);
  }

  return { level, allLevels, yes, dryRun };
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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, allLevels, yes, dryRun } = parseArgs();

  const { databases, dbId, collectionId } = createClient();

  const scopeLabel = allLevels ? "ALL LEVELS" : `level ${level}`;
  const queries = allLevels
    ? [Query.limit(PAGE_SIZE)]
    : [Query.equal("level", level!), Query.limit(PAGE_SIZE)];

  // Count first
  const firstPage = await databases.listDocuments(dbId, collectionId, queries);
  const total = firstPage.total;

  console.log(`\n🗑   Target: words collection (${scopeLabel}) in database ${dbId}`);
  console.log(`    ${total} document(s) will be deleted`);

  if (total === 0) {
    console.log("\n    Nothing to delete. Exiting.\n");
    return;
  }

  if (dryRun) {
    console.log("\n    DRY RUN — nothing will be deleted.\n");
    return;
  }

  if (!yes) {
    const ok = await confirm(
      `\n⚠️   Type "yes" to permanently delete ${total} document(s): `,
    );
    if (!ok) {
      console.log("    Aborted.\n");
      return;
    }
  }

  // Delete in pages. Appwrite doesn't expose a bulk delete, so we page + delete.
  let deleted = 0;
  let failed = 0;
  let page = firstPage;

  // Process the first page we already fetched, then keep fetching while there
  // are still documents. We always re-query because deletes shift the list.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const doc of page.documents) {
      try {
        await databases.deleteDocument(dbId, collectionId, doc.$id);
        deleted++;
      } catch (err: any) {
        failed++;
        console.error(`\n  Failed "${doc.$id}": ${err.message}`);
      }

      if (deleted % 10 === 0 || deleted === total) {
        process.stdout.write(`  ${deleted}/${total} deleted...\r`);
      }
    }

    // Re-query: page indices shift as we delete, so always fetch from the top.
    page = await databases.listDocuments(dbId, collectionId, queries);
    if (page.documents.length === 0) break;
  }

  console.log(`\n\n✅ Wipe complete.`);
  console.log(`   Deleted: ${deleted}`);
  if (failed) console.log(`   Failed:  ${failed}`);
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
