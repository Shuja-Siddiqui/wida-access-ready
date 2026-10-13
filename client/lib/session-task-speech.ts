/**
 * Unified teacher→narrator TTS for every practice domain.
 * Jenny introduces; Guy reads story / task content (same pattern everywhere).
 */

import { prepareFrameForSpeech, prepareTextForSpeech } from "@/lib/prepare-text-for-speech";
import type { SpeechDelivery } from "@/lib/speech-voices";
import type { SessionDomainKey } from "@/home/components/session-ui-styles";

export type SpeechSegment = {
  text: string;
  delivery: SpeechDelivery;
};

export type SessionTaskSpeechOptions = {
  /** Optional question read after the story (e.g. first listening item). */
  question?: string;
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

function frameAlreadyInPrompt(frame: string, prompt: string): boolean {
  if (!frame || !prompt) return false;
  if (substantiallyOverlaps(frame, prompt, 12)) return true;
  const clauses = frame
    .split(/[.!?]+/)
    .map((s) => normalizeForOverlap(s))
    .filter((s) => s.length >= 10);
  if (clauses.length === 0) return substantiallyOverlaps(frame, prompt, 12);
  const promptNorm = normalizeForOverlap(prompt);
  return clauses.filter((c) => promptNorm.includes(c)).length >= Math.max(1, Math.ceil(clauses.length * 0.5));
}

function wordBankWords(data: Record<string, unknown>): string[] {
  const raw = (data.wordBank ?? data.word_bank) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.filter((w): w is string => typeof w === "string" && w.trim().length > 0);
}

function sentenceFrame(data: Record<string, unknown>): string {
  return str(data.scaffold) || str(data.sentenceFrame) || str(data.sentence_frame);
}

function storyBody(data: Record<string, unknown>): string {
  return str(data.passage) || str(data.audioScript) || str(data.audio_script) || "";
}

function hasImageContext(data: Record<string, unknown>): boolean {
  return Boolean(
    str(data.imageDescription)
    || (Array.isArray(data.imageTags) && data.imageTags.length > 0)
    || (Array.isArray(data.tags) && data.tags.length > 0),
  );
}

function wordsAlreadySpoken(words: string[], spokenContext: string): boolean {
  if (words.length === 0) return true;
  const ctx = normalizeForOverlap(spokenContext);
  return words.every((w) => ctx.includes(normalizeForOverlap(w)));
}

/** Reading domain — instructions only; student reads the passage and questions on screen. */
export function buildReadingInstructionSpeechSegments(questionCount: number): SpeechSegment[] {
  const segments: SpeechSegment[] = [
    {
      text: "Read the passage on your screen carefully.",
      delivery: "coaching",
    },
    {
      text: "When you understand it, choose an answer for the first question.",
      delivery: "coaching",
    },
  ];
  if (questionCount > 1) {
    segments.push({
      text: "Use Next after you answer to see the other questions.",
      delivery: "coaching",
    });
  }
  return segments;
}

/** Single question — teacher intro + narrator reads stem (listening and similar). */
export function buildQuestionSpeechSegments(question: string): SpeechSegment[] {
  const body = prepareTextForSpeech(question);
  if (!body) return [];
  return [
    { text: "Here is your question.", delivery: "coaching" },
    { text: body, delivery: "passage" },
  ];
}

/**
 * Ordered TTS: teacher (Jenny) intros, then narrator (Guy) reads content.
 * Story/passage/audioScript use the same intro lines in every domain.
 */
export function buildSessionTaskSpeechSegments(
  domain: SessionDomainKey,
  data: Record<string, unknown>,
  options?: SessionTaskSpeechOptions,
): SpeechSegment[] {
  if (domain === "reading") {
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return buildReadingInstructionSpeechSegments(questions.length);
  }

  const segments: SpeechSegment[] = [];
  const passage = storyBody(data);
  const prompt = str(data.prompt);
  const frame = sentenceFrame(data);
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
    segments.push({ text: `${intro} ${spoken}`, delivery: "coaching" });
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
      passage ? "Next, here is your task." : "Here is your task.",
      prompt,
    );
  }

  if (words.length > 0 && !wordsAlreadySpoken(words, spokenBodies.join(" "))) {
    pushTeacherThenContent("These words may help you.", words.join(", "));
  }

  if (frame && !skipSeparateFrame) {
    pushFrameOnce(frame);
  }

  const question = str(options?.question);
  if (question) {
    pushTeacherThenContent("Now answer this question.", question);
  }

  return segments;
}

export function sessionTaskSpeechPreview(
  domain: SessionDomainKey,
  data: Record<string, unknown>,
  options?: SessionTaskSpeechOptions,
): string {
  return buildSessionTaskSpeechSegments(domain, data, options).map((s) => s.text).join(" ");
}
