/** Azure neural voices used across listening, reading prompts, and coaching. */
export const PASSAGE_AZURE_VOICE = "en-US-GuyNeural";
export const FEEDBACK_AZURE_VOICE = "en-US-JennyNeural";

/** Slightly slower than normal — easier for ELL listening without sounding sluggish. */
export const PASSAGE_PLAYBACK_RATE = 0.88;
export const COACHING_PLAYBACK_RATE = 1;

export type SpeechDelivery = "passage" | "coaching";

export function azureVoiceForDelivery(delivery: SpeechDelivery): string {
  return delivery === "coaching" ? FEEDBACK_AZURE_VOICE : PASSAGE_AZURE_VOICE;
}
