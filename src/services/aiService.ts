import Anthropic from '@anthropic-ai/sdk'
import type { Word, Field, Level, WordScore, PartOfSpeech } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY,
   dangerouslyAllowBrowser: true,
})

/** Score a batch of words for field relevance and usability (preprocessing script use only) */
export async function scoreWordsForField(
  words: string[],
  field: Field,
  level: Level
): Promise<WordScore[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Rate each word for relevance to ${field} professionals (1-10) and everyday usability for an English learner at ${level} level (1-10).
Return a JSON array only: [{ "word": string, "fieldRelevance": number, "usabilityScore": number, "notes": string }]
Words: ${words.join(', ')}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text) as WordScore[]
  } catch (error) {
    throw new Error(`[aiService.scoreWordsForField] ${error}`)
  }
}

/** Generate a context passage for celebrity voice reading */
export async function generateContextPassage(word: Word, field: Field): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `Write a 3-sentence paragraph for a ${field} professional that naturally uses the word "${word.word}" (${word.partOfSpeech}: ${word.definition}). Keep it at ${word.level} reading level. Return only the paragraph.`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (error) {
    throw new Error(`[aiService.generateContextPassage] ${error}`)
  }
}

export interface GeneratedWordEntry {
  phonetic: string
  partOfSpeech: PartOfSpeech
  definition: string
  exampleSentence: string
}

/**
 * Generate a complete word entry via Claude. Used as a fallback when the
 * dictionary API misses fields for a manually-added word.
 */
export async function generateWordEntry(
  word: string
): Promise<GeneratedWordEntry> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Generate a learner-friendly dictionary entry for the English word "${word}".
Return ONLY a JSON object with this exact shape — no prose, no markdown:
{
  "phonetic": "/IPA pronunciation/",
  "partOfSpeech": "noun" | "verb" | "adjective" | "adverb" | "other",
  "definition": "one short sentence",
  "exampleSentence": "one natural example sentence using the word"
}`,
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart < 0 || jsonEnd < 0) {
      throw new Error('No JSON in Claude response')
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))

    const allowed: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'adverb', 'other']
    const partOfSpeech: PartOfSpeech = (allowed as string[]).includes(parsed.partOfSpeech)
      ? parsed.partOfSpeech
      : 'other'

    return {
      phonetic: String(parsed.phonetic ?? ''),
      partOfSpeech,
      definition: String(parsed.definition ?? ''),
      exampleSentence: String(parsed.exampleSentence ?? ''),
    }
  } catch (error) {
    throw new Error(`[aiService.generateWordEntry] ${error}`)
  }
}

/**
 * Generate 3 plausible-but-wrong definitions for use as distractors in the
 * swipe session's True/False mechanic. Returns [] on failure so callers can
 * proceed without distractors (the swipe code has its own fallback).
 */
export async function generateDistractors(
  word: string,
  correctDefinition: string,
  level: Level,
): Promise<string[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      messages: [
        {
          role: 'user',
          content: `Write 3 SHORT plausible-but-WRONG one-sentence definitions for the English word "${word}" (CEFR ${level}).
The correct definition is: "${correctDefinition}"
Each wrong definition must:
- Be the same length and tone as the correct one (one short sentence).
- Be at or below CEFR ${level} vocabulary — don't use words harder than the target.
- Sound believable to a learner but be unambiguously incorrect.
- NOT include the word "${word}" itself.

Return ONLY a JSON array of 3 strings, no prose or markdown:
["...", "...", "..."]`,
        },
      ],
    })

    const text =
      message.content[0]?.type === 'text' ? message.content[0].text : ''
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start < 0 || end < 0) return []
    const parsed = JSON.parse(text.slice(start, end + 1)) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
      .slice(0, 3)
  } catch (err) {
    console.warn('[aiService.generateDistractors]', err)
    return []
  }
}

/** Generate a wrong-answer explanation (voiced by celebrity voice) */
export async function generateWrongAnswerExplanation(
  word: Word,
  exerciseContext: string,
  userAnswer: string,
  correctAnswer: string
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `A student learning English was asked: ${exerciseContext}
They answered "${userAnswer}" but the correct answer is "${correctAnswer}".
Explain in 2 short, encouraging sentences why their answer was wrong and what's correct. Return only the explanation.`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (error) {
    throw new Error(`[aiService.generateWrongAnswerExplanation] ${error}`)
  }
}
