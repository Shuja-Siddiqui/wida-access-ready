import { useCallback, useRef, useState } from "react";
import { customFetch, ApiError, type CustomFetchOptions } from "@/api-generated/custom-fetch";

export { ApiError };

/**
 * Pulls a human-readable message out of an error thrown by `customFetch`
 * (via `useApi`'s `request()`). Every JSON error response from the API
 * server is shaped as `{ success: false, error, details? }` — `ApiError.data`
 * holds that raw (non-enveloped) body, so `data.error` is the message.
 */
export function extractErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof ApiError) {
    const data = err.data as { error?: string } | null;
    return data?.error || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Generic hook for making API calls through the shared `customFetch` client
 * (bearer-token attachment + `{success,data}` envelope unwrapping already
 * handled there). Intended as the single entry point for ad hoc fetches in
 * components that don't use a generated react-query hook — form submits,
 * one-off GETs, etc.
 *
 * @example
 * ```tsx
 * const { request, loading, error } = useApi();
 * const data = await request<{ token: string }>("/api/auth/login", {
 *   method: "POST",
 *   body: JSON.stringify({ email, password }),
 * });
 * ```
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const request = useCallback(
    async <T = unknown>(url: string, options?: CustomFetchOptions): Promise<T> => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await customFetch<T>(url, options);
        return data;
      } catch (err) {
        if (requestIdRef.current === requestId) {
          setError(extractErrorMessage(err));
        }
        throw err;
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [],
  );

  return { request, loading, error, setError };
}
