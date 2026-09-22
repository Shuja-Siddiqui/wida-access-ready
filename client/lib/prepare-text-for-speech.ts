/**
 * Normalizes on-screen text before TTS so scaffolds like "___ because ___."
 * are heard as natural language, not "underscore underscore".
 */
export function prepareTextForSpeech(text: string): string {
  return text
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_{1,}/g, " fill in the blank ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sentence frames only — one short "blank" per gap (never repeat "fill in the blank"). */
export function prepareFrameForSpeech(text: string): string {
  return text
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_{2,}/g, " blank ")
    .replace(/_/g, " blank ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}
