import type { SpeechSegment } from "./session-task-speech";
import {
  buildSessionTaskSpeechSegments,
  sessionTaskSpeechPreview,
} from "./session-task-speech";

export type { SpeechSegment };

export function buildSpeakingSpeechSegments(data: Record<string, unknown>): SpeechSegment[] {
  return buildSessionTaskSpeechSegments("speaking", data);
}

export function speakingSpeechPreview(data: Record<string, unknown>): string {
  return sessionTaskSpeechPreview("speaking", data);
}
