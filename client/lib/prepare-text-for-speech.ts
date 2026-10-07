/**
 * Normalizes on-screen text before TTS so scaffolds like "___ because ___."
 * are heard as natural language, not "underscore underscore".
 * Math notation (decimals, √, fractions, etc.) is spoken clearly in every domain.
 */
import { speakMathNotation } from "@/lib/math-for-speech";

function normalizeSpeechWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Shared pipeline: math symbols → domain-specific cleanup. */
function prepareSpeechText(text: string, cleanup: (s: string) => string): string {
  return normalizeSpeechWhitespace(cleanup(speakMathNotation(text)));
}

export function prepareTextForSpeech(text: string): string {
  return prepareSpeechText(text, (s) =>
    s
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_{1,}/g, " fill in the blank "),
  );
}

/** Coaching TTS — keeps *stress* markers for Azure SSML emphasis. */
export function prepareCoachingForSpeech(text: string): string {
  return prepareSpeechText(text, (s) => s.replace(/_{1,}/g, " blank "));
}

/** Sentence frames only — one short "blank" per gap (never repeat "fill in the blank"). */
export function prepareFrameForSpeech(text: string): string {
  return prepareSpeechText(text, (s) =>
    s
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_{2,}/g, " blank ")
      .replace(/_/g, " blank ")
      .replace(/\s+([,.!?])/g, "$1"),
  );
}
