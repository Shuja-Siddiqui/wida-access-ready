import { prepareFrameForSpeech, prepareTextForSpeech } from "@/lib/prepare-text-for-speech";
import type { SpeechDelivery } from "@/lib/speech-voices";

export type SpeechSegment = {
  text: string;
  delivery: SpeechDelivery;
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeForOverlap(text: string): string {
  return text
    .replace(/fill in the blank/gi, "")
    .replace(/\bblank\b/gi, "")
    .replace(/_{1,}/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function substantiallyOverlaps(a: string, b: string, minChars = 16): boolean {
  const sa = normalizeForOverlap(a);
  const sb = normalizeForOverlap(b);
  if (!sa || !sb) return false;
  const [shorter, longer] = sa.length <= sb.length ? [sa, sb] : [sb, sa];
  if (shorter.length < minChars) return false;
  return longer.includes(shorter);
}

/** True when most of the frame is already spoken inside the prompt. */
function frameAlreadyInPrompt(frame: string, prompt: string): boolean {
  if (!frame || !prompt) return false;
  if (substantiallyOverlaps(frame, prompt, 12)) return true;

  const clauses = frame
    .split(/[.!?]+/)
    .map((s) => normalizeForOverlap(s))
    .filter((s) => s.length >= 10);
  if (clauses.length === 0) return substantiallyOverlaps(frame, prompt, 12);

  const promptNorm = normalizeForOverlap(prompt);
  const hits = clauses.filter((c) => promptNorm.includes(c));
  return hits.length >= Math.max(1, Math.ceil(clauses.length * 0.5));
}

function wordBankWords(data: Record<string, unknown>): string[] {
  const raw = (data.wordBank ?? data.word_bank) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.filter((w): w is string => typeof w === "string" && w.trim().length > 0);
}

function writingFrame(data: Record<string, unknown>): string {
  return str(data.sentenceFrame) || str(data.sentence_frame) || str(data.scaffold);
}

function wordsAlreadySpoken(words: string[], spokenContext: string): boolean {
  if (words.length === 0) return true;
  const ctx = normalizeForOverlap(spokenContext);
  return words.every((w) => ctx.includes(normalizeForOverlap(w)));
}

function hasImageContext(data: Record<string, unknown>): boolean {
  return Boolean(
    str(data.imageDescription)
    || (Array.isArray(data.imageTags) && data.imageTags.length > 0)
    || (Array.isArray(data.tags) && data.tags.length > 0),
  );
}

/**
 * Ordered TTS for a writing task.
 * Each block = one teacher intro (Jenny) + content (Guy), except sentence frame = one Jenny line only.
 */
export function buildWritingSpeechSegments(data: Record<string, unknown>): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  const passage = str(data.passage);
  const prompt = str(data.prompt);
  const frame = writingFrame(data);
  const words = wordBankWords(data);
  const hasImage = hasImageContext(data);

  const spokenBodies: string[] = [];

  const pushTeacherThenContent = (intro: string, body: string) => {
    const prepared = prepareTextForSpeech(body);
    if (!prepared) return;
    for (const prev of spokenBodies) {
      if (substantiallyOverlaps(prepared, prev)) return;
    }
    segments.push({ text: intro, delivery: "coaching" });
    segments.push({ text: prepared, delivery: "passage" });
    spokenBodies.push(prepared);
  };

  /** Sentence starter — single voice, no "fill in the blank" spam, no second read. */
  const pushFrameOnce = (frameText: string) => {
    const spoken = prepareFrameForSpeech(frameText);
    if (!spoken) return;
    for (const prev of spokenBodies) {
      if (substantiallyOverlaps(spoken, prev)) return;
    }
    const hasGap = /_{1,}/.test(frameText) || /\bblank\b/i.test(spoken);
    const intro = hasGap
      ? "Here is your sentence starter. Leave a word in each blank."
      : "Here is your sentence starter.";
    segments.push({
      text: `${intro} ${spoken}`,
      delivery: "coaching",
    });
    spokenBodies.push(spoken);
  };

  if (passage) {
    pushTeacherThenContent(
      hasImage
        ? "First, listen and read about the picture."
        : "First, listen and read this short passage.",
      passage,
    );
  }

  const skipSeparateFrame = frame && frameAlreadyInPrompt(frame, prompt);

  if (prompt) {
    pushTeacherThenContent(
      passage ? "Next, here is your writing task." : "Here is your writing task.",
      prompt,
    );
  }

  if (words.length > 0 && !wordsAlreadySpoken(words, spokenBodies.join(" "))) {
    pushTeacherThenContent("These words may help you.", words.join(", "));
  }

  if (frame && !skipSeparateFrame) {
    pushFrameOnce(frame);
  }

  return segments;
}

/** Flat preview for aria-labels — coaching lines only. */
export function writingSpeechPreview(data: Record<string, unknown>): string {
  return buildWritingSpeechSegments(data).map((s) => s.text).join(" ");
}
