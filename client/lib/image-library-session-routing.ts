import type { ImageLibraryData } from "@/home/components/image-library-session";

const IMAGE_TAP_QUESTION_TYPES = new Set([
  "image_object_tap",
  "image_yes_no",
  "image_explain_mc",
]);

export function isImageTapQuestionType(type: unknown): boolean {
  return typeof type === "string" && IMAGE_TAP_QUESTION_TYPES.has(type);
}

export function sessionHasImageTapQuestions(data: Record<string, unknown> | null | undefined): boolean {
  const questions = data?.questions;
  if (!Array.isArray(questions)) return false;
  return questions.some((q) => q && typeof q === "object" && isImageTapQuestionType((q as { type?: string }).type));
}

function pickImageUrl(data: Record<string, unknown>): string | null {
  const url =
    (typeof data.imageUrl === "string" && data.imageUrl)
    || (typeof data.illustrationUrl === "string" && data.illustrationUrl)
    || null;
  return url?.trim() ? url.trim() : null;
}

/**
 * Route L1–2 tap sessions through ImageLibrarySession even when the API
 * returns content.type "listening" (image-library fallback path).
 */
export function shouldUseImageLibrarySession(content: {
  type?: string;
  data?: Record<string, unknown>;
} | null | undefined): boolean {
  if (!content?.data) return false;
  const data = content.data;
  if (content.type === "image_library") return true;
  if (data.useTapMode === true) return true;
  if (!sessionHasImageTapQuestions(data)) return false;
  return pickImageUrl(data) != null;
}

/** Map API listening / image_library payloads into ImageLibrarySession props. */
export function normalizeImageLibrarySessionData(
  data: Record<string, unknown>,
): ImageLibraryData {
  const imageUrl = pickImageUrl(data);
  const passage =
    (typeof data.passage === "string" && data.passage.trim())
    || (typeof data.audioScript === "string" && data.audioScript.trim())
    || (typeof data.audio_script === "string" && data.audio_script.trim())
    || "";

  const detectionResults =
    data.detectionResults && typeof data.detectionResults === "object"
      ? (data.detectionResults as ImageLibraryData["detectionResults"])
      : null;

  const hasDetections = Boolean(detectionResults?.detections?.length);
  const tapMode =
    data.tapMode === "text_choice" || data.tapMode === "box_tap"
      ? data.tapMode
      : hasDetections
        ? "box_tap"
        : "text_choice";

  const tags = Array.isArray(data.tags)
    ? (data.tags as string[])
    : Array.isArray(data.imageTags)
      ? (data.imageTags as string[])
      : [];

  return {
    topic: typeof data.topic === "string" ? data.topic : "Listening",
    passage,
    imageUrl,
    tags,
    imageDescription:
      (typeof data.imageDescription === "string" ? data.imageDescription : null)
      ?? null,
    detectionResults,
    questions: Array.isArray(data.questions)
      ? (data.questions as Record<string, unknown>[]).map((raw, i) => {
          const q = raw as Record<string, unknown>;
          const targetLabel =
            (typeof q.targetLabel === "string" && q.targetLabel)
            || (typeof q.target_label === "string" && q.target_label)
            || "";
          if (q.type === "image_yes_no") {
            return {
              ...q,
              targetLabel,
            } as ImageLibraryData["questions"][number];
          }
          if (q.type === "image_object_tap" || q.type === "image_explain_mc") {
            return {
              ...q,
              type: "image_object_tap",
              targetLabel,
            } as ImageLibraryData["questions"][number];
          }
          return q as unknown as ImageLibraryData["questions"][number];
        })
      : [],
    tapMode,
    keyUse: typeof data.keyUse === "string" ? data.keyUse : undefined,
  };
}
