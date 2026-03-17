import * as FileSystem from 'expo-file-system'
import type { VoiceStyle } from '@/types'

const BASE_URL = 'https://api.elevenlabs.io/v1'
const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY!

/** Fetch all available voice styles from ElevenLabs */
export async function getVoiceStyles(): Promise<VoiceStyle[]> {
  try {
    const response = await fetch(`${BASE_URL}/voices`, {
      headers: { 'xi-api-key': API_KEY },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.voices.map((v: { voice_id: string; name: string; preview_url: string; category: string }) => ({
      id: v.voice_id,
      name: v.name,
      previewUrl: v.preview_url,
      category: v.category,
    }))
  } catch (error) {
    throw new Error(`[ttsService.getVoiceStyles] ${error}`)
  }
}

/** Generate speech and save to cache, returns local file URI */
export async function generateSpeech(text: string, voiceId: string): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 300),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    const cacheKey = `${voiceId}-${Date.now()}`
    const uri = `${FileSystem.cacheDirectory}audio-${cacheKey}.mp3`

    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    })

    return uri
  } catch (error) {
    throw new Error(`[ttsService.generateSpeech] ${error}`)
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
