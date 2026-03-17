import type { Field, Level } from './word'

export interface User {
  id: string
  name: string
  email?: string
  level: Level
  fields: Field[]
  voiceStyleId: string
  isGuest: boolean
}

export interface VoiceStyle {
  id: string
  name: string
  previewUrl?: string
  category: string
}
