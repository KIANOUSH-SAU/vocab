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
import { colors, fonts, radii, shadows, spacing } from '@constants/theme'

export interface EditFieldConfig {
  /** Title shown in the sheet header */
  title: string
  /** Helper copy under the title */
  subtitle?: string
  /** Current value (pre-fills the input) */
  initialValue: string
  /** Placeholder for the main input */
  placeholder?: string
  /** Keyboard / autocomplete type for the main input */
  keyboardType?: 'default' | 'email-address'
  /** When true, an extra password field is collected and passed to onSubmit */
  requiresPassword?: boolean
  /** Submit handler. Resolve with null on success, a string error to surface */
  onSubmit: (value: string, password?: string) => Promise<string | null>
}

interface EditFieldModalProps {
  visible: boolean
  config: EditFieldConfig | null
  onClose: () => void
}

export function EditFieldModal({
  visible,
  config,
  onClose,
}: EditFieldModalProps) {
  const [value, setValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (visible && config) {
      setValue(config.initialValue ?? '')
      setPassword('')
      setError(null)
      const t = setTimeout(() => inputRef.current?.focus(), 220)
      return () => clearTimeout(t)
    }
  }, [visible, config])

  if (!config) return null

  const trimmed = value.trim()
  const canSubmit =
    !isSubmitting &&
    trimmed.length > 0 &&
    trimmed !== config.initialValue.trim() &&
    (!config.requiresPassword || password.length > 0)

  async function handleSubmit() {
    if (!canSubmit || !config) return
    setIsSubmitting(true)
    setError(null)
    try {
      const errMessage = await config.onSubmit(
        trimmed,
        config.requiresPassword ? password : undefined,
      )
      if (errMessage) {
        setError(errMessage)
      } else {
        onClose()
      }
    } finally {
      setIsSubmitting(false)
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
                <Text style={styles.title}>{config.title}</Text>
                {config.subtitle ? (
                  <Text style={styles.subtitle}>{config.subtitle}</Text>
                ) : null}
              </View>
              <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.ink2} />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={setValue}
                placeholder={config.placeholder}
                placeholderTextColor={colors.inkLight}
                style={styles.input}
                autoCapitalize={
                  config.keyboardType === 'email-address' ? 'none' : 'words'
                }
                autoCorrect={false}
                keyboardType={config.keyboardType ?? 'default'}
                editable={!isSubmitting}
                returnKeyType={config.requiresPassword ? 'next' : 'done'}
                onSubmitEditing={
                  config.requiresPassword ? undefined : handleSubmit
                }
              />
            </View>

            {config.requiresPassword ? (
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Current password"
                  placeholderTextColor={colors.inkLight}
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color={colors.coralText}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
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
                      Save changes
                    </Text>
                    <Ionicons
                      name="checkmark"
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
    gap: spacing[3],
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
    marginBottom: spacing[1],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.4,
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
    marginTop: spacing[2],
    ...shadows.button,
  },
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
