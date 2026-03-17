export interface AppwriteDocument {
  $id: string
  $createdAt: string
  $updatedAt: string
}

export interface DictionaryAPIPhonetic {
  text?: string
  audio?: string
}

export interface DictionaryAPIDefinition {
  definition: string
  example?: string
  synonyms: string[]
}

export interface DictionaryAPIMeaning {
  partOfSpeech: string
  definitions: DictionaryAPIDefinition[]
}

export interface DictionaryAPIEntry {
  word: string
  phonetics: DictionaryAPIPhonetic[]
  meanings: DictionaryAPIMeaning[]
}

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  preview_url: string
  category: string
}
