import { customFetch } from "@/api-generated/custom-fetch";

export interface AzureSpeechToken {
  token: string;
  region: string;
  expiresIn: number;
}

let cached: (AzureSpeechToken & { fetchedAt: number }) | null = null;

/** Cached Azure Speech SDK token (~10 min lifetime). */
export async function getAzureSpeechToken(): Promise<{ token: string; region: string }> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < (cached.expiresIn - 60) * 1000) {
    return { token: cached.token, region: cached.region };
  }
  const result = await customFetch<AzureSpeechToken>("/api/speech/token");
  cached = { ...result, fetchedAt: now };
  return { token: result.token, region: result.region };
}

export function clearAzureSpeechTokenCache(): void {
  cached = null;
}
