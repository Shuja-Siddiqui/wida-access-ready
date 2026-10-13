/**
 * useAuthRefresh
 *
 * Wires the session-refresher plain module into UserContext so the
 * module's callbacks update React state when a refresh succeeds or fails.
 *
 * Call this hook once, inside UserProvider, after loginWithToken and logout
 * are stable references.
 */
import { useEffect } from "react";
import { configureSessionRefresher, REFRESH_TOKEN_KEY } from "@/lib/session-refresher";

interface UseAuthRefreshOptions {
  /** Called on successful refresh — update the in-memory token in context. */
  onRefreshed: (accessToken: string, refreshToken: string) => void;
  /** Called when the session cannot be renewed — toast + redirect to login. */
  onSessionExpired: () => void;
}

export function useAuthRefresh({ onRefreshed, onSessionExpired }: UseAuthRefreshOptions): void {
  useEffect(() => {
    configureSessionRefresher({ onRefreshed, onSessionExpired });
  }, [onRefreshed, onSessionExpired]);
}

/** Read the stored refresh token — used by UserContext to persist it on login. */
export function readRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); }
  catch { return null; }
}

/** Persist a refresh token — called from loginWithToken. */
export function writeRefreshToken(token: string): void {
  try { localStorage.setItem(REFRESH_TOKEN_KEY, token); }
  catch { /* storage unavailable */ }
}

/** Clear the refresh token — called from logout. */
export function clearRefreshToken(): void {
  try { localStorage.removeItem(REFRESH_TOKEN_KEY); }
  catch { /* storage unavailable */ }
}
