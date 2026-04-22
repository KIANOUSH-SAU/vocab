/**
 * Step 1 of the word pipeline.
 * Reads a CEFR word list and scores each word for field relevance
 * across ALL 5 fields + overall usability using Claude API.
 *
 * Input:  data/cefr-words-{level}.txt  (one word per line)
 * Output: data/scored-{level}.json
 *
 * Usage:
 *   npx tsx scripts/scoreWords.ts --level B1
 *   npx tsx scripts/scoreWords.ts --level B1 --threshold 5
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const FIELDS = ["engineering", "health", "law", "sports", "education"] as const;
const BATCH_SIZE = 40; // words per API call (keep under token limits)
const DEFAULT_THRESHOLD = 5; // minimum fieldRelevance to keep a word for a field

interface ScoredWord {
  word: string;
  fieldRelevance: Record<string, number>;
  usabilityScore: number;
  notes: string;
}

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level = "B1";
  let threshold = DEFAULT_THRESHOLD;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) level = args[i + 1];
    if (args[i] === "--threshold" && args[i + 1])
      threshold = parseInt(args[i + 1], 10);
  }
  return { level, threshold };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

async function scoreBatch(
  anthropic: Anthropic,
  words: string[],
  level: string,
): Promise<ScoredWord[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a vocabulary assessment expert. For each English word below, provide:

1. **fieldRelevance**: How relevant the word is to professionals in EACH of these 5 fields (1-10 scale):
   - engineering, health, law, sports, education
   A score of 1 means "no special relevance", 10 means "core domain vocabulary".

2. **usabilityScore**: How useful this word is for a ${level}-level English learner in everyday professional communication (1-10).

3. **notes**: One short sentence explaining the word's primary domain(s).

Return ONLY a valid JSON array, no markdown fences, no extra text:
[{"word": "example", "fieldRelevance": {"engineering": 3, "health": 2, "law": 4, "sports": 1, "education": 7}, "usabilityScore": 8, "notes": "Common in academic and educational contexts."}]

Words to score:
${words.join("\n")}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "[]";

  // Extract JSON array from response (handle potential markdown fences)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("  Failed to parse batch response, skipping...");
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("  JSON parse error, skipping batch...");
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, threshold } = parseArgs();

  // Validate API key
  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: Set ANTHROPIC_API_KEY or EXPO_PUBLIC_CLAUDE_API_KEY in your environment.",
    );
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  // Read word list
  const wordListPath = path.join(__dirname, `../data/cefr-words-${level}.txt`);
  if (!fs.existsSync(wordListPath)) {
    console.error(`Word list not found: ${wordListPath}`);
    console.error(
      `\nCreate it first with one word per line:\n  data/cefr-words-${level}.txt`,
    );
    process.exit(1);
  }

  const allWords = fs
    .readFileSync(wordListPath, "utf-8")
    .split("\n")
    .map((w) =>
      w
        .replace(
          /\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|modal v\.|det\.|excl\.).*$/i,
          "",
        )
        .trim()
        .toLowerCase(),
    )
    .map((w) => w.replace(/\s*\(.*?\)\s*/g, "").trim()) // remove parenthetical notes like "(river)"
    .filter((w) => w.length > 0 && !w.startsWith("#")); // skip empty lines and comments

  const uniqueWords = [...new Set(allWords)];
  console.log(`\n📋 Scoring ${uniqueWords.length} words for level ${level}`);
  console.log(`   Fields: ${FIELDS.join(", ")}`);
  console.log(`   Threshold: ${threshold}+ to include in a field\n`);

  // Score in batches
  const allScored: ScoredWord[] = [];
  const totalBatches = Math.ceil(uniqueWords.length / BATCH_SIZE);

  for (let i = 0; i < uniqueWords.length; i += BATCH_SIZE) {
    const batch = uniqueWords.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(
      `  Batch ${batchNum}/${totalBatches} (${batch.length} words)...`,
    );

    const scored = await scoreBatch(anthropic, batch, level);
    allScored.push(...scored);

    // Rate limit: wait 1s between batches
    if (i + BATCH_SIZE < uniqueWords.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Write full scored output
  const outDir = path.join(__dirname, "../data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `scored-${level}.json`);
  fs.writeFileSync(outPath, JSON.stringify(allScored, null, 2));

  // Summary
  const fieldCounts: Record<string, number> = {};
  for (const field of FIELDS) {
    fieldCounts[field] = allScored.filter(
      (w) => (w.fieldRelevance[field] ?? 0) >= threshold,
    ).length;
  }

  console.log(`\n✅ Scored ${allScored.length} words → ${outPath}`);
  console.log(`\n   Words per field (threshold >= ${threshold}):`);
  for (const [field, count] of Object.entries(fieldCounts)) {
    console.log(`   ${field.padEnd(14)} ${count}`);
  }
  console.log(`\nNext step: npm run pipeline:enrich -- --level ${level}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
