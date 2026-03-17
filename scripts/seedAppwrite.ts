/**
 * One-time seed script.
 * Reads scored word JSON and upserts into Appwrite words collection.
 *
 * Usage: npx ts-node scripts/seedAppwrite.ts --input data/scored-engineering-B1.json
 */

import { Client, Databases, ID, Query } from 'node-appwrite'
import * as fs from 'fs'

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!) // Server-side key (not EXPO_PUBLIC)

const databases = new Databases(client)
const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
const COLLECTION_ID = 'words'

interface ScoredWord {
  word: string
  fieldRelevance: number
  usabilityScore: number
  field: string
  level: string
}

async function upsertWord(data: ScoredWord) {
  try {
    const existing = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal('word', data.word),
    ])

    if (existing.total > 0) {
      // Update usabilityScore if this field scores higher
      const doc = existing.documents[0]
      const currentScore = doc.usabilityScore as number
      if (data.usabilityScore > currentScore) {
        await databases.updateDocument(DB_ID, COLLECTION_ID, doc.$id, {
          usabilityScore: data.usabilityScore,
          fields: [...new Set([...(doc.fields as string[]), data.field])],
        })
      }
    } else {
      await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
        word: data.word,
        phonetic: '',
        partOfSpeech: 'noun',
        definition: '',
        exampleSentence: '',
        contextPassage: '',
        level: data.level,
        fields: [data.field],
        usabilityScore: data.usabilityScore,
        audioUrl: '',
      })
    }
  } catch (error) {
    console.error(`Failed to upsert "${data.word}":`, error)
  }
}

async function main() {
  const inputPath = process.argv[3] ?? 'data/scored-engineering-B1.json'
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`)
    process.exit(1)
  }

  const words: ScoredWord[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  console.log(`Seeding ${words.length} words...`)

  for (const word of words) {
    await upsertWord(word)
    process.stdout.write('.')
  }

  console.log('\nDone.')
}

main().catch(console.error)
