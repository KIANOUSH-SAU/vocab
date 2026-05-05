import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCurrentUser, useIsGuest } from "@store/userStore";
import { useProgressStore } from "@store/progressStore";

/**
 * Treats Appwrite as the source of truth for user progress. Triggers
 * `refreshFromAppwrite` on every authenticated tab session start and on
 * every transition to the foreground.
 *
 * The store self-throttles concurrent calls, so calling this hook alongside
 * `useTabFocusSync` (per-tab focus) is safe — overlapping triggers are
 * coalesced into one network round-trip.
 *
 * Guests are intentionally skipped (no cloud profile to sync against).
 */
export function useRemoteSync() {
  const user = useCurrentUser();
  const isGuest = useIsGuest();
  const refresh = useProgressStore((s) => s.refreshFromAppwrite);

  useEffect(() => {
    if (!user?.id || isGuest) return;

    // Initial pull when the user lands inside the authenticated tab tree.
    // Force=true so we always sync at least once when the user changes.
    refresh(user.id, { force: true });

    // Re-pull whenever the app comes back to the foreground.
    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") refresh(user.id);
      },
    );

    return () => subscription.remove();
  }, [user?.id, isGuest, refresh]);
}

/**
 * Refresh from Appwrite every time a tab screen gains focus. Throttled by
 * the store, so rapid tab switching does not cause network spam.
 */
export function useTabFocusSync() {
  const user = useCurrentUser();
  const isGuest = useIsGuest();
  const refresh = useProgressStore((s) => s.refreshFromAppwrite);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || isGuest) return;
      refresh(user.id);
    }, [user?.id, isGuest, refresh]),
  );
}
