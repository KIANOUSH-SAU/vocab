/**
 * One-time preprocessing script.
 * Reads a CEFR word list and scores each word for field relevance
 * and usability using Claude API.
 *
 * Usage: npx ts-node scripts/scoreWords.ts --field engineering --level B1
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY })

const BATCH_SIZE = 50

async function scoreWordsForField(
  words: string[],
  field: string,
  level: string
): Promise<object[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Rate each English word for:
1. Relevance to ${field} professionals (1-10)
2. Everyday usability for a ${level} English learner (1-10)

Return a JSON array only (no extra text):
[{ "word": string, "fieldRelevance": number, "usabilityScore": number, "notes": string }]

Words: ${words.join(', ')}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  return JSON.parse(text)
}

async function main() {
  const field = process.argv[3] ?? 'engineering'
  const level = process.argv[5] ?? 'B1'

  // TODO: Replace with actual CEFR word list path
  const wordListPath = path.join(__dirname, `../data/cefr-words-${level}.txt`)
  if (!fs.existsSync(wordListPath)) {
    console.error(`Word list not found: ${wordListPath}`)
    process.exit(1)
  }

  const allWords = fs.readFileSync(wordListPath, 'utf-8').split('\n').filter(Boolean)
  const results: object[] = []

  for (let i = 0; i < allWords.length; i += BATCH_SIZE) {
    const batch = allWords.slice(i, i + BATCH_SIZE)
    console.log(`Scoring batch ${i / BATCH_SIZE + 1}/${Math.ceil(allWords.length / BATCH_SIZE)}...`)
    const scored = await scoreWordsForField(batch, field, level)
    results.push(...scored)
  }

  const outPath = path.join(__dirname, `../data/scored-${field}-${level}.json`)
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`Done. Written to ${outPath}`)
}

main().catch(console.error)
