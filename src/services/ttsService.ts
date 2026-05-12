import * as FileSystem from 'expo-file-system'
import type { VoiceStyle } from '@/types'
import { Platform } from 'react-native'
import { getModelForVoice, DEFAULT_VOICE } from '@constants/voiceOptions'

const BASE_URL = 'https://api.elevenlabs.io/v1'
const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY!
const CUSTOM_VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_CUSTOM_VOICE_ID
const CUSTOM_MODEL_ID = process.env.EXPO_PUBLIC_ELEVENLABS_CUSTOM_MODEL_ID

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
export async function generateSpeech(
  text: string,
  voiceId: string,
  options?: { modelId?: string }
): Promise<string> {
  try {
    // Resolve the model: check the voice options registry first, then fall
    // back to the legacy single-env-var check for backward compatibility.
    const registeredModel = getModelForVoice(voiceId)
    const isCustomVoice = CUSTOM_VOICE_ID && voiceId === CUSTOM_VOICE_ID
    const legacyModel = isCustomVoice && CUSTOM_MODEL_ID ? CUSTOM_MODEL_ID : 'eleven_turbo_v2_5'
    const modelId = registeredModel !== 'eleven_turbo_v2_5' ? registeredModel : legacyModel

    // DEBUG LOGGING
    console.log('[TTS] ====== GENERATION START ======')
    console.log('[TTS] Text:', text.substring(0, 50))
    console.log('[TTS] Voice ID (user):', voiceId)
    console.log('[TTS] Custom Voice ID (env):', CUSTOM_VOICE_ID)
    console.log('[TTS] Is Custom Voice:', isCustomVoice)
    console.log('[TTS] Custom Model ID (env):', CUSTOM_MODEL_ID)
    console.log('[TTS] Selected Model:', modelId)
    console.log('[TTS] API Key Set:', !!API_KEY)
    console.log('[TTS] Request body:', {
      text: text.slice(0, 300),
      model_id: options?.modelId || modelId,
      voice_settings: { stability: 0.85, similarity_boost: 0.75 },
    })

    const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 300),
        model_id: options?.modelId || modelId,
        voice_settings: { stability: 0.85, similarity_boost: 0.75 },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('[TTS] HTTP Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    const cacheKey = `${voiceId}-${Date.now()}`

    // Web support: return data URI instead of file URI
    if (Platform.OS === 'web') {
      const dataUri = `data:audio/mpeg;base64,${base64}`
      console.log('[TTS] ✅ Success (web) - Data URI created')
      return dataUri
    }

    // Mobile: save to file system
    const uri = `${FileSystem.cacheDirectory}audio-${cacheKey}.mp3`

    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    })

    console.log('[TTS] ✅ Success (mobile) - URI:', uri)
    return uri
  } catch (error) {
    console.log('[TTS] ❌ Error:', error)
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

/** Check if custom TTS model is configured */
export function isCustomModelConfigured(): boolean {
  return Boolean(CUSTOM_VOICE_ID && CUSTOM_MODEL_ID && API_KEY)
}

/** Get custom voice ID if configured */
export function getCustomVoiceId(): string | undefined {
  return CUSTOM_VOICE_ID
}
