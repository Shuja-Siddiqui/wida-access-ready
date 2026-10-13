import type { SessionQuestion } from "@/home/session-context";

/** Student-facing text for coaching / item-feedback — never raw JSON maps. */
export function formatStudentAnswerForFeedback(
  value: unknown,
  question?: SessionQuestion,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    if (question?.options?.[value] != null) return question.options[value]!;
    if (question?.items?.[value] != null) return question.items[value]!;
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const isPairList = value.every(
      (p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number"),
    );
    if (isPairList && question?.left && question?.right) {
      return value
        .map(([l, r]) => `${question.left![l]} → ${question.right![r]}`)
        .join("; ");
    }
    const isOrder = value.every((n) => typeof n === "number");
    if (isOrder && question?.items) {
      return value.map((idx) => question.items![idx as number]).join(" → ");
    }
    return value.map(String).join(", ");
  }

  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const keys = Object.keys(rec);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      if (question?.items && question?.categories) {
        return keys
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => {
            const itemIdx = Number(k);
            const catIdx = rec[k];
            const item = question.items![itemIdx] ?? `item ${itemIdx + 1}`;
            const cat =
              typeof catIdx === "number"
                ? (question.categories![catIdx] ?? `category ${catIdx + 1}`)
                : String(catIdx);
            return `${item}: ${cat}`;
          })
          .join("; ");
      }
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
