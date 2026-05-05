import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useUserStore } from "@store/userStore";
import { useProgressStore } from "@store/progressStore";
import {
  signUp,
  login,
  getCurrentSession,
  getAccount,
  createUserDocument,
  getUserDocument,
  migrateProgressToServer,
  isAppwriteConfigured,
} from "@services/appwriteService";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { OAuthProvider } from "react-native-appwrite";
import type { Level, Field } from "@/types";

WebBrowser.maybeCompleteAuthSession();

function mapAppwriteError(error: unknown): string {
  if (!error || typeof error !== "object")
    return "Something went wrong. Please try again.";

  const e = error as { code?: number; type?: string; message?: string };

  if (
    typeof e.message === "string" &&
    (e.message.includes("<!DOCTYPE html") ||
      e.message.includes("<html") ||
      e.message.includes("503 error"))
  ) {
    return "Server is temporarily unavailable. Please try again later.";
  }

  if (e.type === "user_session_already_exists") {
    return "session_exists"; // Special marker
  }

  // Developer visibility: Return the exact message Appwrite is sending if available
  if (e.message) return e.message;

  switch (e.code) {
    case 401:
      return "Incorrect email or password.";
    case 409:
      return "An account with this email already exists.";
    case 429:
      return "Too many attempts. Please wait a moment.";
    default:
      break;
  }
  if (
    e.type === "general_argument_invalid" ||
    e.message?.includes("password")
  ) {
    return "Password must be at least 8 characters.";
  }
  if (e.message?.includes("network") || e.message?.includes("fetch")) {
    return "Connection failed. Check your internet and try again.";
  }
  return e.message || "Something went wrong. Please try again.";
}

export function useAuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, clearPendingOnboardingData } = useUserStore();

  const clearError = useCallback(() => setError(null), []);

  const migrateGuestData = async (userId: string) => {
    const { userWords } = useProgressStore.getState();
    const { user } = useUserStore.getState();

    if (!user?.isGuest || Object.keys(userWords).length === 0) return;

    try {
      await migrateProgressToServer(
        userId,
        userWords as unknown as Record<string, Record<string, unknown>>,
      );
    } catch (e) {
      console.warn("[Auth] Guest migration partial failure:", e);
    }
  };

  const completeAuth = async () => {
    const appwriteUser = await getCurrentSession();
    if (!appwriteUser)
      throw new Error("Failed to get user after authentication.");

    let dbUser: {
      level?: string;
      voiceStyleId?: string;
      name?: string;
      streak?: number;
      lastActiveDate?: string | null;
      avatarFileId?: string | null;
    } | null = null;
    try {
      dbUser = (await getUserDocument(appwriteUser.$id)) as any;
    } catch {
      // Document might not exist yet
    }

    const wasGuest = useUserStore.getState().user?.isGuest ?? false;
    if (wasGuest) {
      await migrateGuestData(appwriteUser.$id);
    }

    const onboardingData = useUserStore.getState().pendingOnboardingData;
    const level = (dbUser?.level ??
      onboardingData?.level ??
      useUserStore.getState().user?.level ??
      "A1") as Level;

    setUser({
      id: appwriteUser.$id,
      name: appwriteUser.name || name,
      email: appwriteUser.email,
      level,
      voiceStyleId: "",
      isGuest: false,
      avatarFileId: dbUser?.avatarFileId ?? null,
    });

    clearPendingOnboardingData();

    try {
      const { fetchUserWords } = require("@services/vocabularyService");
      const { useProgressStore } = require("@store/progressStore");
      const existingWords = await fetchUserWords(appwriteUser.$id);

      if (existingWords && existingWords.length > 0) {
        existingWords.forEach((uw: any) =>
          useProgressStore.getState().updateUserWord(uw),
        );
      }

      // Hydrate streak from remote so multi-device users stay in sync
      if (dbUser?.streak != null || dbUser?.lastActiveDate != null) {
        useProgressStore
          .getState()
          .hydrateFromRemote(
            (dbUser as any).streak ?? 0,
            (dbUser as any).lastActiveDate ?? null,
          );
      }

      router.replace("/(tabs)/home");
    } catch (err) {
      console.error("Failed to load existing user words", err);
      router.replace("/(tabs)/home");
    }
  };

  const handleSignup = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isAppwriteConfigured) {
      setError("Backend is not configured. Please try guest mode.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      // Create user document in DB
      const session = await getCurrentSession();
      if (session) {
        const pendingOnboardingData =
          useUserStore.getState().pendingOnboardingData;
        try {
          await createUserDocument(session.$id, {
            name: name.trim(),
            email: email.trim(),
            level: pendingOnboardingData?.level ?? "A1",
            voiceStyleId: "",
          });
        } catch (err) {
          console.error(
            "[Auth] Failed to create user document after email signup:",
            err,
          );
          // Non-blocking — user doc creation can be retried later
        }
      }
      await completeAuth();
    } catch (e) {
      setError(mapAppwriteError(e));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, confirmPassword]);

  const handleLogin = useCallback(
    async (emailOverride?: string) => {
      setError(null);

      const loginEmail = (emailOverride ?? email).trim();

      if (!loginEmail) {
        setError("Please enter your email.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }
      if (!isAppwriteConfigured) {
        setError("Backend is not configured. Please try guest mode.");
        return;
      }

      setIsLoading(true);
      try {
        await login(loginEmail, password);
        await completeAuth();
      } catch (e) {
        const mappedError = mapAppwriteError(e);
        if (mappedError === "session_exists") {
          await completeAuth();
        } else {
          setError(mappedError);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [email, password],
  );

  const handleOAuth = useCallback(
    async (provider: "google") => {
      if (!isAppwriteConfigured) {
        setError("Backend is not configured.");
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        const redirectUri = makeRedirectUri({
          path: "/(tabs)/home",
        });

        const providerEnum = OAuthProvider.Google;
        const acc = getAccount();

        const loginUrl = await acc.createOAuth2Token(
          providerEnum,
          redirectUri,
          redirectUri,
        );

        if (!loginUrl) throw new Error("Could not generate OAuth URL");

        const result = await WebBrowser.openAuthSessionAsync(
          loginUrl.toString(),
          redirectUri,
        );

        if (result.type === "success" && result.url) {
          // Extract userId and secret from the OAuth redirect URL
          const url = new URL(result.url);
          const userId = url.searchParams.get("userId");
          const secret = url.searchParams.get("secret");

          if (!userId || !secret) {
            throw new Error("OAuth callback missing credentials.");
          }

          // Exchange the OAuth token for a session
          await acc.createSession(userId, secret);

          // Create user document for new OAuth users (non-blocking)
          const session = await getCurrentSession();
          if (session) {
            const pendingOnboardingData =
              useUserStore.getState().pendingOnboardingData;
            try {
              // Check if document exists and needs data
              const existingDoc = await getUserDocument(session.$id);
              if (!existingDoc) {
                await createUserDocument(session.$id, {
                  name: session.name || "",
                  email: session.email,
                  level: pendingOnboardingData?.level ?? "A1",
                  voiceStyleId: "",
                });
              }
            } catch (err) {
              console.error(
                "[Auth] Failed to create user document after OAuth signup:",
                err,
              );
              // Document may already exist for returning OAuth users
            }
          }

          await completeAuth();
        }
        // result.type !== "success" → user cancelled, do nothing
      } catch (e: any) {
        setError(mapAppwriteError(e));
      } finally {
        setIsLoading(false);
      }
    },
    [completeAuth],
  );

  return {
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
    handleLogin,
    handleSignup,
    handleOAuth,
  };
}
