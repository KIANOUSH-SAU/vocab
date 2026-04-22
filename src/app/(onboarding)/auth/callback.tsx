import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  getCurrentSession,
  createUserDocument,
  isAppwriteConfigured,
} from "@services/appwriteService";
import { useUserStore } from "@store/userStore";
import { colors } from "@constants/theme";

/**
 * Safety-net route for OAuth deep-link redirects (vocab://auth/callback).
 *
 * In the normal flow, WebBrowser.openAuthSessionAsync intercepts the redirect
 * before Expo Router sees it. This screen only renders if the deep link
 * reaches the router directly (e.g. universal links, edge-case browser
 * behaviour). It checks for an active session and completes the auth flow.
 */
export default function AuthCallbackScreen() {
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    async function handleCallback() {
      if (!isAppwriteConfigured) {
        router.replace("/(onboarding)/");
        return;
      }

      try {
        const session = await getCurrentSession();
        if (session) {
          const state = useUserStore.getState();
          const onboardingData = state.pendingOnboardingData;

          // Create user document (non-blocking — may already exist)
          try {
            await createUserDocument(session.$id, {
              name: session.name || "",
              email: session.email,
              level: onboardingData?.level ?? state.user?.level ?? "A1",
              fields: onboardingData?.fields ?? state.user?.fields ?? [],
              voiceStyleId: state.user?.voiceStyleId ?? "",
            });
          } catch {
            /* document may already exist */
          }

          setUser({
            id: session.$id,
            name: session.name || "",
            email: session.email,
            level: onboardingData?.level ?? state.user?.level ?? "A1",
            fields: onboardingData?.fields ?? state.user?.fields ?? [],
            voiceStyleId: state.user?.voiceStyleId ?? "",
            isGuest: false,
          });

          state.clearPendingOnboardingData();
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(onboarding)/");
        }
      } catch {
        router.replace("/(onboarding)/");
      }
    }

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.iris} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
