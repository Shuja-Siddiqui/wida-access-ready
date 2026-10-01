import { prepareCoachingForSpeech } from "@/lib/prepare-text-for-speech";
import type { SpeechDelivery } from "@/lib/speech-voices";

export type CoachingTone = "default" | "praise" | "mistake" | "teach" | "action";

export type CoachingSpeechSegment = {
  text: string;
  delivery: SpeechDelivery;
  tone: CoachingTone;
};

/** Visible + spoken blocks separated by ` || ` (see writing coach prompts). */
export const COACHING_SEGMENT_DELIMITER = " || ";

export function splitCoachingSegments(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.includes(COACHING_SEGMENT_DELIMITER)) {
    return trimmed
      .split(COACHING_SEGMENT_DELIMITER)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return heuristicSplitCoachingBlocks(trimmed);
}

/** Legacy single-paragraph coach text → separate praise / mistake / rule / try. */
function heuristicSplitCoachingBlocks(text: string): string[] {
  const markers: { index: number; tone: CoachingTone }[] = [];
  const add = (re: RegExp, tone: CoachingTone) => {
    const m = re.exec(text);
    if (m && m.index != null) markers.push({ index: m.index, tone });
  };
  add(/\bBut (?:look at|listen)/i, "mistake");
  add(/\bYou wrote\b/i, "mistake");
  add(/\bWhen you (?:have|use|write)/i, "teach");
  add(/\bTry (?:fixing|changing|again|that)/i, "action");
  add(/\bChange (?:that|the|one)/i, "action");
  add(/\bNow (?:fix|change|try)/i, "action");

  if (markers.length === 0) return [text];

  markers.sort((a, b) => a.index - b.index);
  const unique: typeof markers = [];
  for (const m of markers) {
    if (unique.length === 0 || m.index > unique[unique.length - 1].index) {
      unique.push(m);
    }
  }

  const parts: string[] = [];
  let cursor = 0;
  for (const m of unique) {
    if (m.index > cursor) {
      parts.push(text.slice(cursor, m.index).trim());
    }
    const next = unique.find((x) => x.index > m.index);
    const end = next ? next.index : text.length;
    parts.push(text.slice(m.index, end).trim());
    cursor = end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor).trim());
  }
  return parts.filter(Boolean);
}

export function inferToneFromPart(part: string, index: number, total: number): CoachingTone {
  const p = part.toLowerCase();
  if (/^listen[\s.:!]/i.test(part) || /\byou wrote\b/i.test(p)) return "mistake";
  if (/^(when |if you have|two or more|remember\b|use \*)/i.test(part)) return "teach";
  if (/^(try |change |fix |now |reread)/i.test(part)) return "action";
  if (index === 0 && total > 1 && /(good|well done|that's good|nice|right idea|you answered)/i.test(p)) {
    return "praise";
  }
  if (index === 0 && total === 1) return "default";
  if (index === total - 1 && /(try|change|fix|reread)/i.test(p)) return "action";
  if (index === 1 && total >= 3) return "mistake";
  return index === 0 ? "praise" : "teach";
}

function stripTrailingNavCue(text: string): { body: string; nav: string } {
  const navRe = /\s*(Tap (?:Next|Try again)(?:[^.!?]*[.!?]?)?)\s*$/i;
  const m = navRe.exec(text);
  if (!m || m.index == null) return { body: text.trim(), nav: "" };
  return {
    body: text.slice(0, m.index).trim(),
    nav: m[1].trim(),
  };
}

export function buildCoachingSpeechSegments(fullText: string): CoachingSpeechSegment[] {
  const { body, nav } = stripTrailingNavCue(fullText);
  const parts = splitCoachingSegments(body);
  if (parts.length === 0) return [];

  const segments: CoachingSpeechSegment[] = parts.map((part, i) => ({
    text: prepareCoachingForSpeech(part),
    delivery: "coaching" as const,
    tone: inferToneFromPart(part, i, parts.length),
  }));

  if (nav) {
    segments.push({
      text: prepareCoachingForSpeech(nav),
      delivery: "coaching",
      tone: "action",
    });
  }
  return segments.filter((s) => s.text.length > 0);
}

export function coachingSegmentLabel(tone: CoachingTone): string | null {
  switch (tone) {
    case "mistake":
      return "Fix this";
    case "teach":
      return "Remember";
    case "action":
      return "Your turn";
    default:
      return null;
  }
}
