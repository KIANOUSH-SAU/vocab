/**
 * Step 2 of the word pipeline.
 * Takes scored words and enriches them with:
 *   - Real dictionary data (Free Dictionary API) → phonetic, definition, partOfSpeech
 *   - Claude AI → field-specific exampleSentence + contextPassage
 *
 * Input:  data/scored-{level}.json
 * Output: data/enriched-{level}.json
 *
 * Usage:
 *   npx tsx scripts/enrichWords.ts --level B1
 *   npx tsx scripts/enrichWords.ts --level B1 --threshold 5
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

const FIELDS = [
  "engineering",
  "health",
  "law",
  "sports",
  "education",
] as const;
type Field = (typeof FIELDS)[number];

const VALID_POS = ["noun", "verb", "adjective", "adverb", "other"] as const;

interface ScoredWord {
  word: string;
  fieldRelevance: Record<string, number>;
  usabilityScore: number;
  notes: string;
}

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

interface DictionaryResult {
  phonetic: string;
  partOfSpeech: string;
  definition: string;
}

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level = "B1";
  let threshold = 5;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) level = args[i + 1];
    if (args[i] === "--threshold" && args[i + 1])
      threshold = parseInt(args[i + 1], 10);
  }
  return { level, threshold };
}

// ─── Free Dictionary API ─────────────────────────────────────────────────────

async function fetchDictionary(word: string): Promise<DictionaryResult | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const entry = data[0];
    if (!entry) return null;

    // Get phonetic (prefer one with text)
    let phonetic = entry.phonetic || "";
    if (!phonetic && entry.phonetics?.length) {
      const withText = entry.phonetics.find((p: any) => p.text);
      if (withText) phonetic = withText.text;
    }

    // Get first meaning
    const meaning = entry.meanings?.[0];
    const rawPos = (meaning?.partOfSpeech || "other").toLowerCase();
    const partOfSpeech = VALID_POS.includes(rawPos as any) ? rawPos : "other";

    const definition =
      meaning?.definitions?.[0]?.definition || "";

    return { phonetic, partOfSpeech, definition };
  } catch {
    return null;
  }
}

// ─── Claude AI for context ───────────────────────────────────────────────────

const CONTEXT_BATCH_SIZE = 15; // words per Claude call for context generation

interface ContextResult {
  word: string;
  exampleSentence: string;
  contextPassage: string;
}

async function generateContextBatch(
  anthropic: Anthropic,
  words: { word: string; definition: string; fields: string[] }[],
  level: string
): Promise<ContextResult[]> {
  const wordList = words
    .map(
      (w) =>
        `- "${w.word}" (${w.fields.join(", ")}): ${w.definition}`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a vocabulary content writer for an English learning app.

For each word below, generate:
1. **exampleSentence**: A single natural sentence using the word in the context of its primary field(s). Appropriate for a ${level}-level English learner.
2. **contextPassage**: A 2-3 sentence educational passage explaining the word's significance in its field. Should help a learner understand WHY this word matters in professional contexts.

Return ONLY a valid JSON array, no markdown fences:
[{"word": "example", "exampleSentence": "...", "contextPassage": "..."}]

Words:
${wordList}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "[]";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { level, threshold } = parseArgs();

  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: Set ANTHROPIC_API_KEY or EXPO_PUBLIC_CLAUDE_API_KEY in your environment."
    );
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  // Read scored words
  const scoredPath = path.join(__dirname, `../data/scored-${level}.json`);
  if (!fs.existsSync(scoredPath)) {
    console.error(`Scored file not found: ${scoredPath}`);
    console.error(`\nRun step 1 first: npx tsx scripts/scoreWords.ts --level ${level}`);
    process.exit(1);
  }

  const scored: ScoredWord[] = JSON.parse(
    fs.readFileSync(scoredPath, "utf-8")
  );

  // Determine which fields each word qualifies for
  const wordsWithFields = scored
    .map((w) => {
      const fields = FIELDS.filter(
        (f) => (w.fieldRelevance[f] ?? 0) >= threshold
      );
      return { ...w, fields };
    })
    .filter((w) => w.fields.length > 0); // drop words that don't qualify for any field

  console.log(
    `\n📖 Enriching ${wordsWithFields.length} words for level ${level}`
  );
  console.log(
    `   (${scored.length - wordsWithFields.length} words dropped — below threshold ${threshold} for all fields)\n`
  );

  // Step A: Fetch dictionary data for all words
  console.log("  Fetching dictionary data...");
  const dictCache: Record<string, DictionaryResult> = {};
  let dictHits = 0;
  let dictMisses = 0;

  for (let i = 0; i < wordsWithFields.length; i++) {
    const w = wordsWithFields[i];
    const dict = await fetchDictionary(w.word);
    if (dict) {
      dictCache[w.word] = dict;
      dictHits++;
    } else {
      dictMisses++;
    }
    // Light rate limiting for dictionary API
    if (i % 20 === 19) {
      process.stdout.write(
        `  ${i + 1}/${wordsWithFields.length} fetched...\r`
      );
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(
    `  Dictionary: ${dictHits} found, ${dictMisses} not found (will use Claude fallback)`
  );

  // Step B: Generate example sentences + context passages via Claude
  console.log("  Generating context with Claude...");

  const contextMap: Record<string, ContextResult> = {};
  const contextBatches = Math.ceil(
    wordsWithFields.length / CONTEXT_BATCH_SIZE
  );

  for (let i = 0; i < wordsWithFields.length; i += CONTEXT_BATCH_SIZE) {
    const batch = wordsWithFields.slice(i, i + CONTEXT_BATCH_SIZE);
    const batchNum = Math.floor(i / CONTEXT_BATCH_SIZE) + 1;
    console.log(`  Context batch ${batchNum}/${contextBatches}...`);

    const batchInput = batch.map((w) => ({
      word: w.word,
      definition: dictCache[w.word]?.definition || w.notes,
      fields: w.fields,
    }));

    const results = await generateContextBatch(anthropic, batchInput, level);
    for (const r of results) {
      contextMap[r.word.toLowerCase()] = r;
    }

    if (i + CONTEXT_BATCH_SIZE < wordsWithFields.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Step C: Assemble enriched words
  const enriched: EnrichedWord[] = wordsWithFields.map((w) => {
    const dict = dictCache[w.word];
    const ctx = contextMap[w.word.toLowerCase()];

    return {
      word: w.word,
      phonetic: dict?.phonetic || "",
      partOfSpeech: dict?.partOfSpeech || "other",
      definition: dict?.definition || "",
      exampleSentence: ctx?.exampleSentence || "",
      contextPassage: ctx?.contextPassage || "",
      level,
      fields: w.fields,
      usabilityScore: w.usabilityScore,
    };
  });

  // Flag words with missing data
  const incomplete = enriched.filter(
    (w) => !w.definition || !w.exampleSentence
  );
  if (incomplete.length > 0) {
    console.log(
      `\n  ⚠️  ${incomplete.length} words have missing data (definition or example):`
    );
    for (const w of incomplete.slice(0, 10)) {
      console.log(
        `     ${w.word} — def: ${w.definition ? "✓" : "✗"}, example: ${w.exampleSentence ? "✓" : "✗"}`
      );
    }
    if (incomplete.length > 10)
      console.log(`     ... and ${incomplete.length - 10} more`);
  }

  // Write output
  const outPath = path.join(__dirname, `../data/enriched-${level}.json`);
  fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2));

  // Summary
  const fieldCounts: Record<string, number> = {};
  for (const f of FIELDS) {
    fieldCounts[f] = enriched.filter((w) => w.fields.includes(f)).length;
  }

  console.log(`\n✅ Enriched ${enriched.length} words → ${outPath}`);
  console.log(`\n   Words per field:`);
  for (const [field, count] of Object.entries(fieldCounts)) {
    console.log(`   ${field.padEnd(14)} ${count}`);
  }
  console.log(
    `\nNext step: npx tsx scripts/seedAppwrite.ts --level ${level}\n`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
