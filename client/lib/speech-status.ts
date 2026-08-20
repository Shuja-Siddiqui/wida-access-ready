import { getSpeechStatus } from "@/api-generated";

// Cached across all hook instances for the lifetime of the page — avoids every
// mounted speaking/listening component re-checking server speech availability.
let cachedPromise: Promise<boolean> | null = null;

export function getAzureSpeechAvailable(): Promise<boolean> {
  if (!cachedPromise) {
    cachedPromise = getSpeechStatus()
      .then((res) => res.configured)
      .catch(() => false);
  }
  return cachedPromise;
}
