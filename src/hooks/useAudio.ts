import { useState, useCallback, useRef } from 'react'
import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import { generateSpeech } from '@services/ttsService'
import { useCurrentUser } from '@store/userStore'
import { useWordStore } from '@store/wordStore'

type AudioState = 'idle' | 'loading' | 'playing' | 'error'

interface UseAudioReturn {
  state: AudioState
  play: (text: string, cacheKey?: string) => Promise<void>
  stop: () => void
  replay: () => void
}

export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>('idle')
  const soundRef = useRef<Audio.Sound | null>(null)
  const lastTextRef = useRef<string>('')
  const user = useCurrentUser()
  const { audioCache, cacheAudio } = useWordStore()

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
    }
    setAudioState('idle')
  }, [])

  const play = useCallback(
    async (text: string, cacheKey?: string) => {
      await stop()
      lastTextRef.current = text
      setAudioState('loading')

      try {
        const voiceId = user?.voiceStyleId
        const key = cacheKey ?? `tts-${text.slice(0, 20)}`
        let uri = cacheKey ? audioCache[key] : undefined

        if (!uri && voiceId) {
          uri = await generateSpeech(text, voiceId)
          if (cacheKey) cacheAudio(key, uri)
        }

        if (uri) {
          const { sound } = await Audio.Sound.createAsync({ uri })
          soundRef.current = sound
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) setAudioState('idle')
          })
          setAudioState('playing')
          await sound.playAsync()
        } else {
          // Fallback to device TTS
          setAudioState('playing')
          Speech.speak(text, { onDone: () => setAudioState('idle') })
        }
      } catch {
        setAudioState('error')
      }
    },
    [user, audioCache, cacheAudio, stop]
  )

  const replay = useCallback(() => {
    if (lastTextRef.current) play(lastTextRef.current)
  }, [play])

  return { state: audioState, play, stop, replay }
}
