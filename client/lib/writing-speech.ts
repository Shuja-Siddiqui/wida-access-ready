import type { SpeechSegment } from "./session-task-speech";
import {
  buildSessionTaskSpeechSegments,
  sessionTaskSpeechPreview,
} from "./session-task-speech";

export type { SpeechSegment };

export function buildWritingSpeechSegments(data: Record<string, unknown>): SpeechSegment[] {
  return buildSessionTaskSpeechSegments("writing", data);
}

export function writingSpeechPreview(data: Record<string, unknown>): string {
  return sessionTaskSpeechPreview("writing", data);
}
