/**
 * Step 1 of the word pipeline — level-focused.
 * Reads a CEFR word list and scores each word on:
 *   - usabilityScore (1-10): how useful the word is in everyday communication
 *     for a learner at the target CEFR level
 *   - levelFit ("below" | "perfect" | "above"): is the word actually right for
 *     this level, or too easy / too advanced
 *
 * Robustness:
 *   - Claude API calls retry up to 4 times on 429/5xx/network errors
 *     (2s → 4s → 8s → 16s backoff).
 *   - Partial output is flushed to data/scored-{level}.json after every batch,
 *     so a crash at batch 45/60 doesn't cost you 44 batches of work.
 *   - --resume picks up from the existing scored JSON, only scoring words not
 *     already in it.
 *   - If Claude drops words from a batch response, the missing words are
 *     retried in a follow-up call.
 *
 * Input:  data/cefr-words-{level}.txt  (one word per line)
 * Output: data/scored-{level}.json
 *
 * Usage:
 *   npm run pipeline:score -- --level A1
 *   npm run pipeline:score -- --level A1 --threshold 5
 *   npm run pipeline:score -- --level A1 --resume
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const BATCH_SIZE = 40;
const DEFAULT_THRESHOLD = 5;
const MAX_CLAUDE_RETRIES = 4;
const MAX_MISSING_WORD_RETRIES = 1;

type Level = (typeof LEVELS)[number];

interface ScoredWord {
  word: string;
  usabilityScore: number;
  levelFit: "below" | "perfect" | "above";
  notes: string;
}

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level = "B1";
  let threshold = DEFAULT_THRESHOLD;
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

// ─── Claude API retry helper ─────────────────────────────────────────────────

function isRetryableStatus(status: number | undefined): boolean {
  // Undefined = network / abort / DNS. 429 = rate limit. 5xx = server errors.
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
      const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
      console.warn(
        `  ${label} attempt ${attempt}/${MAX_CLAUDE_RETRIES} failed (${status ?? "network"}). Retrying in ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("unreachable");
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function normalizeScoredWord(p: any): ScoredWord | null {
  const word = String(p?.word ?? "")
    .toLowerCase()
    .trim();
  if (!word) return null;
  const fit: ScoredWord["levelFit"] =
    p?.levelFit === "below" || p?.levelFit === "above" ? p.levelFit : "perfect";
  return {
    word,
    usabilityScore: Math.max(1, Math.min(10, Number(p?.usabilityScore) || 0)),
    levelFit: fit,
    notes: String(p?.notes ?? ""),
  };
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

async function scoreBatchOnce(
  anthropic: Anthropic,
  words: string[],
  level: Level,
  label: string,
): Promise<ScoredWord[]> {
  const text = await callClaudeWithRetry(
    anthropic,
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a CEFR vocabulary assessment expert. Evaluate each word below for a CEFR ${level} English learner.

For each word return:

1. **usabilityScore** (1-10): How useful is this word in everyday communication for a ${level} learner? 10 = core/common everyday word they will meet constantly. 1 = rarely encountered in daily life. Judge real-world frequency, not academic worth.

2. **levelFit**: one of
   - "below"   → too easy for ${level} (would already be mastered at a lower level)
   - "perfect" → genuinely belongs at ${level}
   - "above"   → too advanced / better suited for a higher level
   Be conservative: if a word commonly appears in learner materials at ${level}, mark it "perfect".

3. **notes**: one short sentence on typical use / register.

Return ONLY a valid JSON array, no markdown fences, no prose. You MUST return exactly ${words.length} items, one for each input word, in the same order:
[{"word":"example","usabilityScore":8,"levelFit":"perfect","notes":"Common noun used to give an instance."}]

Words:
${words.join("\n")}`,
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

  const normalized: ScoredWord[] = [];
  for (const item of raw) {
    const n = normalizeScoredWord(item);
    if (n) normalized.push(n);
  }
  return normalized;
}

async function scoreBatch(
  anthropic: Anthropic,
  words: string[],
  level: Level,
  batchLabel: string,
): Promise<ScoredWord[]> {
  const firstPass = await scoreBatchOnce(
    anthropic,
    words,
    level,
    `${batchLabel} (scoring)`,
  );

  // Detect missing words and retry once
  const covered = new Set(firstPass.map((s) => s.word));
  const inputSet = new Set(words);
  const missing = [...inputSet].filter((w) => !covered.has(w));

  if (missing.length === 0) return firstPass;

  console.warn(
    `  ${batchLabel}: Claude returned ${firstPass.length}/${words.length} words. Retrying ${missing.length} missing...`,
  );

  for (let retry = 1; retry <= MAX_MISSING_WORD_RETRIES; retry++) {
    const retryPass = await scoreBatchOnce(
      anthropic,
      missing,
      level,
      `${batchLabel} (retry ${retry})`,
    );
    for (const s of retryPass) {
      if (!covered.has(s.word)) {
        firstPass.push(s);
        covered.add(s.word);
      }
    }
    const stillMissing = missing.filter((w) => !covered.has(w));
    if (stillMissing.length === 0) break;
    if (retry === MAX_MISSING_WORD_RETRIES && stillMissing.length > 0) {
      console.warn(
        `  ${batchLabel}: giving up on ${stillMissing.length} words after ${retry} retries: ${stillMissing.slice(0, 5).join(", ")}${stillMissing.length > 5 ? "..." : ""}`,
      );
    }
    missing.length = 0;
    missing.push(...stillMissing);
  }

  return firstPass;
}

// ─── IO helpers ──────────────────────────────────────────────────────────────

function loadExistingScored(outPath: string): ScoredWord[] {
  if (!fs.existsSync(outPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    if (!Array.isArray(raw)) return [];
    const out: ScoredWord[] = [];
    for (const item of raw) {
      const n = normalizeScoredWord(item);
      if (n && item?.levelFit !== undefined) out.push(n);
    }
    return out;
  } catch {
    return [];
  }
}

function writeAtomic(filePath: string, data: string): void {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
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
    .map((w) => w.replace(/\s*\(.*?\)\s*/g, "").trim())
    .filter((w) => w.length > 0 && !w.startsWith("#"));

  const uniqueWords = [...new Set(allWords)];

  const outDir = path.join(__dirname, "../data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `scored-${level}.json`);

  // Load existing on resume (or warn otherwise)
  const allScored: ScoredWord[] = [];
  if (resume) {
    const existing = loadExistingScored(outPath);
    if (existing.length > 0) {
      allScored.push(...existing);
      console.log(
        `\n↻  Resume: loaded ${existing.length} already-scored words from ${outPath}`,
      );
    }
  } else if (fs.existsSync(outPath)) {
    console.warn(
      `\n⚠️  ${outPath} exists and will be overwritten. Pass --resume to continue from it instead.`,
    );
  }

  const alreadyDone = new Set(allScored.map((s) => s.word));
  const toProcess = uniqueWords.filter((w) => !alreadyDone.has(w));

  console.log(`\n📋 Level ${level}`);
  console.log(`   Source: ${uniqueWords.length} unique words`);
  console.log(`   To score: ${toProcess.length}${resume ? " (resuming)" : ""}`);
  console.log(
    `   Threshold: keep words with usabilityScore ≥ ${threshold} and levelFit = "perfect"\n`,
  );

  if (toProcess.length === 0) {
    console.log("Nothing to do. Exiting.");
    return;
  }

  const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batchLabel = `Batch ${batchNum}/${totalBatches}`;
    console.log(`  ${batchLabel} (${batch.length} words)...`);

    let scored: ScoredWord[] = [];
    try {
      scored = await scoreBatch(anthropic, batch, level, batchLabel);
    } catch (err: any) {
      console.error(
        `  ${batchLabel}: unrecoverable error — ${err?.message ?? err}. Skipping batch.`,
      );
    }

    allScored.push(...scored);

    // Flush partial output so a crash doesn't lose prior batches
    writeAtomic(outPath, JSON.stringify(allScored, null, 2));

    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Summary
  const kept = allScored.filter(
    (w) => w.usabilityScore >= threshold && w.levelFit === "perfect",
  );
  const tooEasy = allScored.filter((w) => w.levelFit === "below").length;
  const tooHard = allScored.filter((w) => w.levelFit === "above").length;
  const lowUse = allScored.filter(
    (w) => w.levelFit === "perfect" && w.usabilityScore < threshold,
  ).length;

  console.log(`\n✅ Scored ${allScored.length} words → ${outPath}`);
  console.log(`\n   Distribution for level ${level}:`);
  console.log(`   keep (perfect + ≥ ${threshold})  ${kept.length}`);
  console.log(`   too easy (below)                ${tooEasy}`);
  console.log(`   too advanced (above)            ${tooHard}`);
  console.log(`   perfect but low usability       ${lowUse}`);
  console.log(`\nNext step: npm run pipeline:enrich -- --level ${level}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
