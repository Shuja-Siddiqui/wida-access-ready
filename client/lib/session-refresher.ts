/**
 * session-refresher.ts
 *
 * Plain module (no React) that handles transparent session refresh.
 * Lives outside React so customFetch — which is not inside the component
 * tree — can call it directly.
 *
 * Flow:
 *  1. customFetch receives a 401 "Invalid or expired session" response.
 *  2. It calls attemptRefresh().
 *  3. attemptRefresh reads the refresh token from localStorage and hits
 *     POST /api/auth/refresh.
 *  4a. Success → new access + refresh tokens written to storage; the
 *      registered onRefreshed callback updates React context; returns true.
 *  4b. Failure → the registered onLogout callback fires, clearing the
 *      session; returns false. customFetch then throws the original 401.
 *
 * Concurrent refresh deduplication: if multiple requests fail simultaneously,
 * only one refresh call is made; all callers await the same promise.
 */

export const REFRESH_TOKEN_KEY = "refreshToken";
export const ACCESS_TOKEN_KEY  = "authToken";

type RefreshCallbacks = {
  onRefreshed: (accessToken: string, refreshToken: string) => void;
  onLogout: () => void;
};

let _callbacks: RefreshCallbacks | null = null;
let _inflight: Promise<boolean> | null = null;

/** Called once from UserContext to wire in the React-side callbacks. */
export function configureSessionRefresher(callbacks: RefreshCallbacks): void {
  _callbacks = callbacks;
}

function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); }
  catch { return null; }
}

function writeTokens(accessToken: string, refreshToken: string): void {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch { /* storage unavailable (e.g. SSR, private mode) */ }
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const body = await res.json() as { success?: boolean; data?: { token: string; refreshToken: string } };
    const data = body.data;
    if (!data?.token || !data?.refreshToken) return false;

    writeTokens(data.token, data.refreshToken);
    _callbacks?.onRefreshed(data.token, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Call this when a request fails with "Invalid or expired session".
 * Deduplicates concurrent attempts — safe to call from many parallel fetches.
 * Returns true if a new session was obtained, false if the user must log in.
 */
export function attemptRefresh(): Promise<boolean> {
  if (_inflight) return _inflight;
  _inflight = doRefresh().then((ok) => {
    _inflight = null;
    if (!ok) _callbacks?.onLogout();
    return ok;
  });
  return _inflight;
}

/** True when the error body from the API looks like an expired-session error. */
export function isSessionExpiredError(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const err = (data as Record<string, unknown>).error;
  if (typeof err !== "string") return false;
  return err.toLowerCase().includes("expired") || err.toLowerCase().includes("invalid or expired session");
}
