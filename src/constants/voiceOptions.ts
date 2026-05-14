/**
 * Available ElevenLabs voice options for TTS.
 *
 * Each voice has a unique ElevenLabs voice ID, a display label,
 * and the model ID to use when generating speech with that voice.
 */

import type { ImageSourcePropType } from 'react-native'

export interface VoiceOption {
  /** ElevenLabs voice ID */
  id: string
  /** Display name shown in the voice picker */
  label: string
  /** Short flavour text shown below the label */
  subtitle: string
  /** The ElevenLabs model to use for this voice */
  modelId: string
  /** Short text used when previewing the voice */
  previewText: string
  /** Celebrity photo for the avatar circle */
  avatar: ImageSourcePropType
  /** Gradient colors for the avatar ring */
  avatarColors: readonly [string, string]
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'xvDBhpk9vGJA4wL3NHHo',
    label: 'Messi',
    subtitle: 'Energetic & Passionate',
    modelId: 'eleven_v3',
    previewText: 'Every word you learn brings you closer to mastery.',
    avatar: require('../../assets/images/messi.png'),
    avatarColors: ['#7C5CFC', '#5B3FD4'] as const,
  },
  {
    id: 'uuSzp041T72H9FdxzAJe',
    label: 'Ronaldo',
    subtitle: 'Bold & Commanding',
    modelId: 'eleven_v3',
    previewText: 'Every word you learn brings you closer to mastery.',
    avatar: require('../../assets/images/ronaldo.png'),
    avatarColors: ['#0EA5E9', '#0284C7'] as const,
  },
  {
    id: 'luhh31qyUxV7zymtyqAP',
    label: 'Morgan Freeman',
    subtitle: 'Warm & Authoritative',
    modelId: 'eleven_v3',
    previewText: 'Every word you learn brings you closer to mastery.',
    avatar: require('../../assets/images/morgan.png'),
    avatarColors: ['#10B981', '#059669'] as const,
  },
]

/** Look up a VoiceOption by its ElevenLabs voice ID */
export function getVoiceOption(voiceId: string): VoiceOption | undefined {
  return VOICE_OPTIONS.find((v) => v.id === voiceId)
}

/** Get the ElevenLabs model ID for a given voice, falling back to turbo */
export function getModelForVoice(voiceId: string): string {
  return getVoiceOption(voiceId)?.modelId ?? 'eleven_turbo_v2_5'
}

/** The default voice option (first in the list) */
export const DEFAULT_VOICE = VOICE_OPTIONS[0]
