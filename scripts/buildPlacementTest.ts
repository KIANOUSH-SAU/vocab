import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// Initialize Anthropic with the explicit environment variable
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY,
});

export type PlacementQuestionType =
  | "recognition"
  | "definition"
  | "usage"
  | "readingComprehension";

export interface PlacementQuestion {
  id: string;
  type: PlacementQuestionType;
  skill: "vocabulary" | "reading";
  level: string;
  question: string;
  passage?: string;
  options: string[];
  correctIndex: number;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function generateCandidates(
  skill: "vocabulary" | "reading",
  level: string,
  count: number,
): Promise<PlacementQuestion[]> {
  const prompt = `You are a professional English curriculum designer. Generate ${count} CEFR ${level} placement questions for the ${skill} skill.

If skill is "vocabulary": 
- type should be "recognition", "definition", or "usage".
- do not include a 'passage'.
- make sure questions are high quality and unambiguous.

If skill is "reading":
- type must be "readingComprehension".
- you MUST include a short 'passage' (2-3 sentences at ${level} level).
- questions should test comprehension, tone, or inference from the passage.

Return the result strictly as a JSON array of objects matching this TypeScript interface exactly:
interface PlacementQuestion {
  id: string; // generate a unique string like "q_vocab_B1_{random}"
  type: "recognition" | "definition" | "usage" | "readingComprehension";
  skill: "${skill}";
  level: "${level}";
  question: string;
  passage?: string; // only for readingComprehension
  options: string[]; // exactly 4 or 5 options
  correctIndex: number; // 0-based index of the correct answer
}

Output ONLY the JSON array. Do not include markdown formatting like \`\`\`json.`;

  console.log(`\n⏳ Asking Claude for ${count} ${level} ${skill} questions...`);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6", // Model name used across the project
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Clean up any potential markdown wrapper just in case
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText) as PlacementQuestion[];
  } catch (error) {
    console.error(
      `❌ Failed to generate questions for ${level} ${skill}:`,
      error,
    );
    return [];
  }
}

async function run() {
  console.log("==================================================");
  console.log("🧠 Vocab AI Placement Test Builder");
  console.log("==================================================\n");

  const levels = ["A1", "A2", "B1", "B2", "C1"];
  const skills: ("vocabulary" | "reading")[] = ["vocabulary", "reading"];
  const questionsPerBucket = 7; // 5 levels * 2 skills * 7 questions = 70 questions

  const approvedQuestions: PlacementQuestion[] = [];

  for (const skill of skills) {
    for (const level of levels) {
      const candidates = await generateCandidates(
        skill,
        level,
        questionsPerBucket,
      );

      if (candidates.length === 0) continue;

      for (const [index, q] of candidates.entries()) {
        console.log(`\n──────────────────────────────────────────────────`);
        console.log(
          `[${skill.toUpperCase()} | ${level}] Candidate ${index + 1}/${candidates.length}`,
        );

        if (q.passage) {
          console.log(`\nPassage:\n"${q.passage}"`);
        }

        console.log(`\nQuestion: ${q.question}`);
        q.options.forEach((opt, idx) => {
          const isCorrect = idx === q.correctIndex ? "✅" : "  ";
          console.log(`${isCorrect} ${String.fromCharCode(65 + idx)}) ${opt}`);
        });

        console.log(`──────────────────────────────────────────────────`);
        let validChoice = false;

        while (!validChoice) {
          const choice = (
            await askQuestion(`(a)ccept, (e)dit, (r)eject, (s)kip: `)
          )
            .toLowerCase()
            .trim();

          if (choice === "a") {
            approvedQuestions.push(q);
            console.log(`✨ Approved`);
            validChoice = true;
          } else if (choice === "e") {
            console.log(
              "\nIf you need heavy edits, maybe just reject and adjust manually later.",
            );
            console.log(
              "For now, this CLI only supports accept/reject. (Edit coming v2!)",
            );
            validChoice = false; // loops back
          } else if (choice === "r") {
            console.log(`🗑️ Rejected`);
            validChoice = true;
          } else if (choice === "s") {
            console.log(`⏭️ Skipped`);
            validChoice = true;
          }
        }
      }
    }
  }

  rl.close();

  console.log("\n==================================================");
  console.log(
    `🎉 Review Complete! You approved ${approvedQuestions.length} questions.`,
  );
  console.log("==================================================\n");

  if (approvedQuestions.length > 0) {
    const outDir = path.join(__dirname, "output");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, "approvedQuestions.ts");

    // Create the typescript file content
    const fileContent = `export type PlacementQuestionType =
  | "recognition"
  | "definition"
  | "usage"
  | "readingComprehension";

export interface PlacementQuestion {
  id: string;
  type: PlacementQuestionType;
  skill: "vocabulary" | "reading";
  level: string;
  question: string;
  passage?: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = ${JSON.stringify(approvedQuestions, null, 2)};\n`;

    fs.writeFileSync(outPath, fileContent, "utf-8");
    console.log(
      `✅ Saved approved questions to: scripts/output/approvedQuestions.ts`,
    );
    console.log(
      `You can now replace your src/constants/placementTest.ts content with this file!`,
    );
  }
}

run();
