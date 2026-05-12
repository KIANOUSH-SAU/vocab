import { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path } from 'react-native-svg'
import { Audio } from 'expo-av'
import { generateSpeech } from '@services/ttsService'
import { colors, radii, shadows, fonts, spacing } from '@constants/theme'
import { VOICE_OPTIONS, type VoiceOption } from '@constants/voiceOptions'

// ─── SVG Icons ────────────────────────────────────────────────

function WaveformIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <Path
        d="M2 12h2m4-4v8m4-10v12m4-8v4m4-6v8"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function CheckBadge({ size = 20 }: { size?: number }) {
  return (
    <View style={checkStyles.badge}>
      <Ionicons name="checkmark" size={size * 0.6} color="#fff" />
    </View>
  )
}

const checkStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.iris,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
})

// ─── Voice Card ──────────────────────────────────────────────

interface VoiceCardProps {
  option: VoiceOption
  isSelected: boolean
  isPreviewPlaying: boolean
  isPreviewLoading: boolean
  onSelect: () => void
  onPreview: () => void
}

function VoiceCard({
  option,
  isSelected,
  isPreviewPlaying,
  isPreviewLoading,
  onSelect,
  onPreview,
}: VoiceCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        cardStyles.container,
        isSelected && cardStyles.selected,
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Avatar */}
      <View style={cardStyles.avatarWrap}>
        <LinearGradient
          colors={isSelected ? [colors.iris, colors.irisDeeper] : option.avatarColors as unknown as [string, string]}
          style={cardStyles.avatarRing}
        >
          <Image source={option.avatar} style={cardStyles.avatarImg} />
        </LinearGradient>
        {isSelected && <CheckBadge />}
      </View>

      {/* Text */}
      <Text style={[cardStyles.label, isSelected && { color: colors.iris }]} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={cardStyles.subtitle} numberOfLines={1}>
        {option.subtitle}
      </Text>

      {/* Preview Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.()
          onPreview()
        }}
        hitSlop={8}
        style={({ pressed }) => [
          cardStyles.previewBtn,
          isPreviewPlaying && cardStyles.previewBtnActive,
          pressed && { opacity: 0.8 },
        ]}
      >
        {isPreviewLoading ? (
          <ActivityIndicator size="small" color={isPreviewPlaying ? '#fff' : colors.iris} />
        ) : (
          <>
            {isPreviewPlaying ? (
              <WaveformIcon size={13} color="#fff" />
            ) : (
              <Ionicons name="play" size={13} color={colors.iris} />
            )}
            <Text
              style={[
                cardStyles.previewText,
                isPreviewPlaying && { color: '#fff' },
              ]}
            >
              {isPreviewPlaying ? 'Playing' : 'Preview'}
            </Text>
          </>
        )}
      </Pressable>
    </Pressable>
  )
}

const CARD_WIDTH = 140

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
    ...shadows.sm,
  },
  selected: {
    borderColor: colors.iris,
    backgroundColor: colors.irisSoft,
    ...shadows.iris,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing[1],
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderSoft,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 15,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.irisSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: spacing[1],
    minWidth: 80,
    height: 28,
  },
  previewBtnActive: {
    backgroundColor: colors.iris,
  },
  previewText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.iris,
    letterSpacing: 0.3,
  },
})

// ─── Voice Selector ──────────────────────────────────────────

interface VoiceSelectorProps {
  selectedVoiceId: string
  onSelectVoice: (voiceId: string) => void
}

export function VoiceSelector({ selectedVoiceId, onSelectVoice }: VoiceSelectorProps) {
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null)

  const stopPreview = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
      } catch {
        // ignore — sound may already be unloaded
      }
      soundRef.current = null
    }
    setPreviewingId(null)
    setLoadingId(null)
  }, [])

  const handlePreview = useCallback(
    async (option: VoiceOption) => {
      // If already previewing this voice, stop it
      if (previewingId === option.id) {
        await stopPreview()
        return
      }

      // Stop any currently playing preview
      await stopPreview()

      setLoadingId(option.id)

      try {
        const uri = await generateSpeech(option.previewText, option.id, {
          modelId: option.modelId,
        })

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
        )
        soundRef.current = sound
        setPreviewingId(option.id)
        setLoadingId(null)

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setPreviewingId(null)
            soundRef.current = null
          }
        })
      } catch (err) {
        console.warn('[VoiceSelector] Preview failed:', err)
        setLoadingId(null)
        setPreviewingId(null)
      }
    },
    [previewingId, stopPreview],
  )

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {VOICE_OPTIONS.map((option) => (
        <VoiceCard
          key={option.id}
          option={option}
          isSelected={selectedVoiceId === option.id}
          isPreviewPlaying={previewingId === option.id}
          isPreviewLoading={loadingId === option.id}
          onSelect={() => onSelectVoice(option.id)}
          onPreview={() => handlePreview(option)}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 2,
    gap: 12,
    paddingBottom: 4,
  },
})
