/**
 * TTS Debugging Utilities
 * Use these to verify custom voice setup is working correctly
 */

import { getCustomVoiceId, isCustomModelConfigured } from '@services/ttsService'

export function logTTSStatus() {
  const customVoiceId = getCustomVoiceId()
  const isConfigured = isCustomModelConfigured()
  
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY
  const customModelId = process.env.EXPO_PUBLIC_ELEVENLABS_CUSTOM_MODEL_ID
  
  console.log('=== TTS Configuration Status ===')
  console.log('Custom Voice ID:', customVoiceId)
  console.log('Custom Model ID:', customModelId)
  console.log('API Key Set:', !!apiKey)
  console.log('Is Configured:', isConfigured)
  console.log('=================================')
  
  return {
    customVoiceId,
    customModelId,
    hasApiKey: !!apiKey,
    isConfigured,
  }
}

export function logUserVoiceState(user: any) {
  const customVoiceId = getCustomVoiceId()
  const userVoiceId = user?.voiceStyleId
  
  console.log('=== User Voice State ===')
  console.log('User Voice ID:', userVoiceId)
  console.log('Custom Voice ID:', customVoiceId)
  console.log('Voice Matches:', userVoiceId === customVoiceId)
  console.log('=======================')
  
  return {
    userVoiceId,
    customVoiceId,
    matches: userVoiceId === customVoiceId,
  }
}
