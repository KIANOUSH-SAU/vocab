import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthForm } from "@hooks/useAuthForm";
import { useUserStore } from "@store/userStore";
import { colors, spacing, radii, shadows, fonts } from "@constants/theme";
import { MaxWidthContainer } from "@components/ui/MaxWidthContainer";
import { BackButton } from "@components/ui/BackButton";
import { Button } from "@components/ui/Button";

export default function LoginScreen() {
  const lastLoggedInEmail = useUserStore((s) => s.lastLoggedInEmail);
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    clearError,
    isLoading,
    handleLogin,
    handleOAuth,
  } = useAuthForm();

  // Use last email as default if user hasn't typed anything
  const [hasEditedEmail, setHasEditedEmail] = useState(false);
  const displayEmail = hasEditedEmail
    ? email
    : email || lastLoggedInEmail || "";

  const onEmailChange = (v: string) => {
    setHasEditedEmail(true);
    setEmail(v);
    clearError();
  };

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
            <Text style={styles.title}>Welcome{"\n"}back</Text>
            <Text style={styles.subtitle}>
              Log in to continue your learning journey
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle"
                size={16}
                color={colors.coralText}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={displayEmail}
                onChangeText={onEmailChange}
                placeholder="you@example.com"
                placeholderTextColor={colors.inkLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  clearError();
                }}
                placeholder="Your password"
                placeholderTextColor={colors.inkLight}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>
          </View>

          <Pressable
            onPress={() => handleLogin(displayEmail)}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.ink, "#27272A"]}
              style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
            >
              <Text style={styles.primaryLabel}>
                {isLoading ? "Logging in..." : "Log In"}
              </Text>
              {!isLoading && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.oauthRow}>
            <Button
              label="Continue with Google"
              onPress={() => handleOAuth("google")}
              variant="google"
              size="lg"
              fullWidth
              icon={{
                source: require("../../../../assets/images/google-icon.png"),
                position: "left",
              }}
            />
          </View>

          <Pressable
            onPress={() => router.replace("/(onboarding)/auth/signup")}
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              Don't have an account?{" "}
              <Text style={styles.switchHighlight}>Sign up</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </MaxWidthContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: 24,
    gap: 24,
    paddingBottom: 48,
  },
  header: { gap: 8 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 23,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.coralSoft,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.coral}40`,
  },
  errorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.coralText,
    flex: 1,
  },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.inkLight,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  primaryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.inkLight,
  },
  oauthRow: { gap: 12 },
  switchLink: { alignSelf: "center", paddingVertical: 8 },
  switchText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
  },
  switchHighlight: {
    fontFamily: fonts.sansSemiBold,
    color: colors.iris,
  },
});
