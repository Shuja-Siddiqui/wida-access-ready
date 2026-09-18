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
