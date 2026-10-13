import { resolveQuestionUi } from "@/lib/session-content-schema";
import type { SessionQuestion } from "../session-context";

function sessionDomainKey(domainType: string): string {
  return domainType.replace(/_academic$/i, "").toLowerCase();
}

function questionUi(q: SessionQuestion, domainType: string) {
  const domain = sessionDomainKey(domainType);
  if (domain !== "listening" && domain !== "reading") return null;
  return resolveQuestionUi(domain, q as unknown as Record<string, unknown>);
}

function classifyCorrectPerItem(q: SessionQuestion): number[] | undefined {
  if (Array.isArray(q.correct) && q.correct.length > 0 && typeof q.correct[0] === "number") {
    return q.correct as number[];
  }
  if (Array.isArray(q.correct_categories) && q.correct_categories.length > 0) {
    return q.correct_categories;
  }
  return undefined;
}

function formatSequenceAnswer(items: string[], value: unknown): string | null {
  if (!Array.isArray(value) || items.length === 0) return null;
  const parts = value.map((entry, pos) => {
    if (typeof entry === "string" && entry.trim()) return `${pos + 1}. ${entry.trim()}`;
    if (typeof entry === "number" && items[entry] != null) return `${pos + 1}. ${items[entry]}`;
    return `${pos + 1}. ${String(entry)}`;
  });
  return parts.join(" ");
}

function formatClassifyAnswer(
  items: string[],
  categories: string[],
  value: unknown,
): string | null {
  if (items.length === 0 || categories.length === 0) return null;

  const categoryLabel = (idx: unknown, itemText: string) => {
    if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= categories.length) {
      return itemText;
    }
    return `${itemText} → ${categories[idx]}`;
  };

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const map = value as Record<string, number>;
    return items
      .map((item, i) => categoryLabel(map[i] ?? map[String(i)], item))
      .join("; ");
  }

  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "number")) {
    return items.map((item, i) => categoryLabel(value[i] as number, item)).join("; ");
  }

  return null;
}

function formatMatchAnswer(
  left: string[],
  right: string[],
  value: unknown,
): string | null {
  if (!Array.isArray(value) || left.length === 0 || right.length === 0) return null;
  return value
    .map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) return String(pair);
      const li = pair[0];
      const ri = pair[1];
      if (typeof li !== "number" || typeof ri !== "number") return String(pair);
      return `${left[li] ?? li} → ${right[ri] ?? ri}`;
    })
    .join("; ");
}

/** Human-readable student answer for item-feedback TTS and coaching. */
export function formatStudentAnswerForFeedback(
  q: SessionQuestion | undefined,
  domainType: string,
  value: unknown,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (!q) {
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  const ui = questionUi(q, domainType);

  if (ui === "sequence" && q.items?.length) {
    const seq = formatSequenceAnswer(q.items, value);
    if (seq) return seq;
  }

  if (ui === "classify" && q.items?.length && q.categories?.length) {
    const classified = formatClassifyAnswer(q.items, q.categories, value);
    if (classified) return classified;
  }

  if (ui === "match") {
    const left = q.left ?? q.left_items ?? [];
    const right = q.right ?? q.right_items ?? [];
    const matched = formatMatchAnswer(left, right, value);
    if (matched) return matched;
  }

  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function resolveCorrectAnswerForFeedback(
  q: SessionQuestion | undefined,
  domainType: string,
): string | undefined {
  if (!q) return undefined;

  if (Array.isArray(q.options)) {
    const raw = q.correct;
    const idx = typeof raw === "number" ? raw : Number(raw);
    if (Number.isInteger(idx) && idx >= 0 && idx < q.options.length) {
      return q.options[idx];
    }
  }

  if (q.type === "agree_disagree" && q.answer) return q.answer;

  const ui = questionUi(q, domainType);

  if (ui === "sequence" && q.items?.length && q.correct_order?.length) {
    const order = q.correct_order;
    const sorted = q.items.map((_, i) => i).sort((a, b) => order[a] - order[b]);
    return sorted.map((itemIdx, pos) => `${pos + 1}. ${q.items![itemIdx]}`).join(" ");
  }

  if (ui === "classify" && q.items?.length && q.categories?.length) {
    const perItem = classifyCorrectPerItem(q);
    if (perItem?.length) {
      return q.items
        .map((item, i) => {
          const ci = perItem[i];
          const cat = ci != null ? q.categories![ci] : undefined;
          return cat ? `${item} → ${cat}` : item;
        })
        .join("; ");
    }
  }

  if (ui === "match" && q.correct_pairs?.length) {
    const left = q.left ?? q.left_items ?? [];
    const right = q.right ?? q.right_items ?? [];
    if (left.length && right.length) {
      return q.correct_pairs
        .map(([li, ri]) => `${left[li] ?? li} → ${right[ri] ?? ri}`)
        .join("; ");
    }
  }

  return undefined;
}
