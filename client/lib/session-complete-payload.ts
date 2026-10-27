import type { AnswerRecord } from "@/home/home-types";

export function sanitizeAnswerForApi(answer: AnswerRecord): {
  question: string;
  correct: boolean;
  content?: Record<string, unknown>;
  submittedAnswer?: unknown;
} {
  const row: {
    question: string;
    correct: boolean;
    content?: Record<string, unknown>;
    submittedAnswer?: unknown;
  } = {
    question: typeof answer.question === "string" ? answer.question : String(answer.question ?? ""),
    correct: answer.correct === true,
  };

  const content = answer.content;
  if (content !== null && content !== undefined && typeof content === "object" && !Array.isArray(content)) {
    row.content = content as Record<string, unknown>;
  }

  if (answer.submittedAnswer !== undefined) {
    row.submittedAnswer = answer.submittedAnswer;
  }

  return row;
}

export function buildCompleteSessionPayload(input: {
  finalAnswers: AnswerRecord[];
  questionsLength: number;
  durationSeconds: number;
  weakTypes?: string[];
  topic?: string;
}): {
  scorePct: number;
  durationSeconds: number;
  weakTypes: string[];
  answers: ReturnType<typeof sanitizeAnswerForApi>[];
  topic?: string;
} {
  const total = Math.max(input.questionsLength, input.finalAnswers.length, 1);
  const correctCount = input.finalAnswers.filter((a) => a.correct).length;
  const scorePct = Math.round((correctCount / total) * 100);
  const durationSeconds = Math.round(input.durationSeconds) || 1;

  return {
    scorePct,
    durationSeconds,
    weakTypes: input.weakTypes ?? [],
    answers: input.finalAnswers.map(sanitizeAnswerForApi),
    ...(input.topic ? { topic: input.topic } : {}),
  };
}
