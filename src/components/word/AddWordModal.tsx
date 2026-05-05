import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAddManualWord } from '@hooks/useAddManualWord'
import { colors, fonts, radii, shadows, spacing } from '@constants/theme'

interface AddWordModalProps {
  visible: boolean
  onClose: () => void
  onAdded?: (word: string) => void
}

export function AddWordModal({ visible, onClose, onAdded }: AddWordModalProps) {
  const [text, setText] = useState('')
  const { submit, isSubmitting, error, reset } = useAddManualWord()
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (visible) {
      setText('')
      reset()
      const t = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [visible, reset])

  const trimmed = text.trim()
  const canSubmit = trimmed.length > 0 && !isSubmitting

  async function handleSubmit() {
    if (!canSubmit) return
    const result = await submit(trimmed)
    if (result) {
      onAdded?.(result.word.word)
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Add a word</Text>
                <Text style={styles.subtitle}>
                  We'll fetch the meaning and example for you.
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.ink2} />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="book-outline" size={18} color={colors.inkLight} />
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="e.g. resilient"
                placeholderTextColor={colors.inkLight}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={colors.coralText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                !canSubmit && styles.ctaDisabled,
                pressed && canSubmit && { opacity: 0.92 },
              ]}
            >
              <LinearGradient
                colors={
                  canSubmit
                    ? [colors.ink, colors.inkMid]
                    : [colors.borderSoft, colors.borderSoft]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.ctaText,
                        !canSubmit && { color: colors.inkLight },
                      ]}
                    >
                      Add to my words
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={canSubmit ? '#fff' : colors.inkLight}
                    />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    justifyContent: 'flex-end',
  },
  kbWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[4],
    ...shadows.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink2,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing[4],
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.coralText,
    flex: 1,
  },
  cta: {
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.button,
  },
  ctaDisabled: { shadowOpacity: 0 },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    height: 52,
  },
  ctaText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
})
