/**
 * Word pipeline orchestrator.
 * Runs all 3 steps in sequence: score → enrich → seed
 *
 * Usage:
 *   npx tsx scripts/runPipeline.ts --level B1
 *   npx tsx scripts/runPipeline.ts --level B1 --skip-seed     (score + enrich only)
 *   npx tsx scripts/runPipeline.ts --level B1 --seed-only     (seed only)
 *   npx tsx scripts/runPipeline.ts --level B1 --threshold 6
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function parseArgs() {
  const args = process.argv.slice(2);
  let level = "B1";
  let threshold = 5;
  let skipSeed = false;
  let seedOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) level = args[i + 1];
    if (args[i] === "--threshold" && args[i + 1])
      threshold = parseInt(args[i + 1], 10);
    if (args[i] === "--skip-seed") skipSeed = true;
    if (args[i] === "--seed-only") seedOnly = true;
  }
  return { level, threshold, skipSeed, seedOnly };
}

function run(cmd: string) {
  console.log(`\n$  ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });
}

async function main() {
  const { level, threshold, skipSeed, seedOnly } = parseArgs();

  const wordListPath = path.join(__dirname, `../data/cefr-words-${level}.txt`);

  if (!seedOnly) {
    // Verify word list exists
    if (!fs.existsSync(wordListPath)) {
      console.error(`\n❌ Word list not found: data/cefr-words-${level}.txt`);
      console.error(`\nCreate it first with one word per line.`);
      console.error(`Download from: https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000`);
      process.exit(1);
    }

    const wordCount = fs
      .readFileSync(wordListPath, "utf-8")
      .split("\n")
      .filter((w) => w.trim() && !w.startsWith("#")).length;

    console.log(`\n🚀 Word Pipeline — Level ${level}`);
    console.log(`   Source: ${wordCount} words from cefr-words-${level}.txt`);
    console.log(`   Threshold: ${threshold}`);
    console.log(`   Steps: score → enrich${skipSeed ? "" : " → seed"}\n`);

    // Step 1: Score
    console.log("═══════════════════════════════════════════════════");
    console.log("  STEP 1: Scoring words with Claude API");
    console.log("═══════════════════════════════════════════════════");
    run(`npx tsx scripts/scoreWords.ts --level ${level} --threshold ${threshold}`);

    // Step 2: Enrich
    console.log("═══════════════════════════════════════════════════");
    console.log("  STEP 2: Enriching with dictionary + Claude");
    console.log("═══════════════════════════════════════════════════");
    run(`npx tsx scripts/enrichWords.ts --level ${level} --threshold ${threshold}`);
  }

  // Step 3: Seed
  if (!skipSeed) {
    console.log("═══════════════════════════════════════════════════");
    console.log("  STEP 3: Seeding into Appwrite");
    console.log("═══════════════════════════════════════════════════");
    run(`npx tsx scripts/seedAppwrite.ts --level ${level}`);
  }

  console.log("\n🎉 Pipeline complete!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
