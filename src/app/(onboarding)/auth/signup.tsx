import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthForm } from '@hooks/useAuthForm'
import { colors, spacing, radii, typography } from '@constants/theme'
import { MaxWidthContainer } from '@components/ui/MaxWidthContainer'
import { BackButton } from '@components/ui/BackButton'
import { Button } from '@components/ui/Button'

export default function SignupScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    confirmPassword,
    setConfirmPassword,
    error,
    clearError,
    isLoading,
    handleSignup,
    handleOAuth,
  } = useAuthForm()

  return (
    <MaxWidthContainer>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton onPress={() => router.back()} />

          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Save your progress and learn across devices
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => { setName(v); clearError() }}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); clearError() }}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); clearError() }}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); clearError() }}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>
          </View>

          <Button
            label="Create Account"
            onPress={handleSignup}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            icon={{ library: 'Ionicons', name: 'arrow-forward', position: 'right' }}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.oauthRow}>
            <Button
              label="Google"
              onPress={() => handleOAuth('google')}
              variant="google"
              size="lg"
              fullWidth
              icon={{ source: require('../../../../assets/images/google-icon.png'), position: 'left' }}
            />
            <Button
              label="Apple"
              onPress={() => handleOAuth('apple')}
              variant="apple"
              size="lg"
              fullWidth
              icon={{ library: 'Ionicons', name: 'logo-apple', position: 'left' }}
            />
          </View>

          <Pressable onPress={() => router.replace('/(onboarding)/auth/login')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchHighlight}>Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </MaxWidthContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing[6],
    gap: spacing[6],
    paddingBottom: spacing[12],
  },
  header: { gap: spacing[2] },
  title: { ...typography.heading2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: radii.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { ...typography.small, color: colors.error },
  form: { gap: spacing[4] },
  inputGroup: { gap: spacing[1] },
  label: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    ...typography.body,
    color: colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted },
  oauthRow: { gap: spacing[3] },
  switchLink: { alignSelf: 'center', paddingVertical: spacing[2] },
  switchText: { ...typography.small, color: colors.textSecondary },
  switchHighlight: { color: colors.primaryGreen, fontWeight: '600' },
})
