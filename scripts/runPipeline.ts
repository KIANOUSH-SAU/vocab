/**
 * Word pipeline orchestrator — level-focused.
 * Runs all 3 steps in sequence for a given CEFR level: score → enrich → seed.
 *
 * Usage:
 *   npm run pipeline -- --level A1
 *   npm run pipeline -- --level A1 --threshold 5
 *   npm run pipeline -- --level A1 --skip-seed       (score + enrich only)
 *   npm run pipeline -- --level A1 --seed-only       (seed from existing enriched JSON)
 *   npm run pipeline -- --level A1 --skip-fix        (skip the post-seed repair pass)
 *   npm run pipeline -- --all                        (run every level A1..C1)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

function parseArgs() {
  const args = process.argv.slice(2);
  let level: Level = "B1";
  let threshold = 5;
  let skipSeed = false;
  let seedOnly = false;
  let allLevels = false;
  let resume = false;
  let skipFix = false;

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
    if (args[i] === "--skip-seed") skipSeed = true;
    if (args[i] === "--seed-only") seedOnly = true;
    if (args[i] === "--all") allLevels = true;
    if (args[i] === "--resume") resume = true;
    if (args[i] === "--skip-fix") skipFix = true;
  }
  return { level, threshold, skipSeed, seedOnly, allLevels, resume, skipFix };
}

function run(cmd: string) {
  console.log(`\n$  ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });
}

function runForLevel(
  level: Level,
  threshold: number,
  skipSeed: boolean,
  seedOnly: boolean,
  resume: boolean,
  skipFix: boolean,
) {
  const resumeFlag = resume ? " --resume" : "";
  const wordListPath = path.join(__dirname, `../data/cefr-words-${level}.txt`);

  if (!seedOnly) {
    if (!fs.existsSync(wordListPath)) {
      console.error(`\n❌ Word list not found: data/cefr-words-${level}.txt`);
      console.error(
        `\nCreate it first with one word per line (skip blank lines and lines starting with #).`,
      );
      console.error(
        `Reference: https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000`,
      );
      process.exit(1);
    }

    const wordCount = fs
      .readFileSync(wordListPath, "utf-8")
      .split("\n")
      .filter((w) => w.trim() && !w.startsWith("#")).length;

    console.log(`\n🚀 Word Pipeline — Level ${level}`);
    console.log(`   Source: ${wordCount} words from cefr-words-${level}.txt`);
    console.log(`   Threshold: usabilityScore ≥ ${threshold} and levelFit = "perfect"`);
    console.log(`   Steps: score → enrich${skipSeed ? "" : " → seed"}\n`);

    console.log("═══════════════════════════════════════════════════");
    console.log(`  STEP 1: Scoring ${level} words`);
    console.log("═══════════════════════════════════════════════════");
    run(
      `npx tsx scripts/scoreWords.ts --level ${level} --threshold ${threshold}${resumeFlag}`,
    );

    console.log("═══════════════════════════════════════════════════");
    console.log(`  STEP 2: Rewriting ${level} content`);
    console.log("═══════════════════════════════════════════════════");
    run(
      `npx tsx scripts/enrichWords.ts --level ${level} --threshold ${threshold}${resumeFlag}`,
    );
  }

  if (!skipSeed) {
    console.log("═══════════════════════════════════════════════════");
    console.log(`  STEP 3: Seeding ${level} into Appwrite`);
    console.log("═══════════════════════════════════════════════════");
    run(`npx tsx scripts/seedAppwrite.ts --level ${level}`);

    if (!skipFix) {
      console.log("═══════════════════════════════════════════════════");
      console.log(`  STEP 4: Repairing missing fields for ${level}`);
      console.log("═══════════════════════════════════════════════════");
      run(`npx tsx scripts/wordFixer.ts --level ${level} --yes`);
    }
  }

  console.log(`\n🎉 Pipeline complete for ${level}!\n`);
}

async function main() {
  const { level, threshold, skipSeed, seedOnly, allLevels, resume, skipFix } =
    parseArgs();

  if (allLevels) {
    for (const l of LEVELS) {
      runForLevel(l, threshold, skipSeed, seedOnly, resume, skipFix);
    }
    console.log("\n✨ All levels complete!\n");
    return;
  }

  runForLevel(level, threshold, skipSeed, seedOnly, resume, skipFix);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
