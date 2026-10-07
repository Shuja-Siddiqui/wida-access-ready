import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SESSION_ERROR,
  SESSION_LABEL,
  SESSION_OPTION_BASE,
  SESSION_QUESTION,
  SESSION_SUCCESS,
  type SessionTheme,
} from "./session-ui-styles";
import { evalClassify, evalMatch, evalSequence } from "./session-question-eval";

interface InteractiveBase {
  question?: string;
  theme: SessionTheme;
  showFeedback: boolean;
  lastCorrect: boolean;
  onAnswerNonMC: (submittedAnswer: unknown, isCorrect: boolean) => void;
}

export function SessionSequenceQuestion({
  question,
  items,
  correctOrder,
  theme,
  showFeedback,
  lastCorrect,
  onAnswerNonMC,
  resetKey,
}: InteractiveBase & {
  items: string[];
  correctOrder: number[];
  resetKey: number;
}) {
  const [seqSel, setSeqSel] = useState<number[]>([]);

  useEffect(() => {
    setSeqSel([]);
  }, [resetKey]);

  const available = items.map((_, i) => i).filter((i) => !seqSel.includes(i));
  const allDone = seqSel.length === items.length;
  const correctSeq = showFeedback
    ? items.map((_, i) => i).sort((a, b) => correctOrder[a] - correctOrder[b])
    : null;

  return (
    <div className="space-y-5">
      {question && <h3 className={SESSION_QUESTION}>{question}</h3>}

      {seqSel.length > 0 && (
        <div className="space-y-2">
          <p className={SESSION_LABEL}>Your order</p>
          {seqSel.map((itemIdx, pos) => {
            const isCorrectPos = showFeedback && correctSeq?.[pos] === itemIdx;
            const isWrongPos = showFeedback && correctSeq?.[pos] !== itemIdx;
            return (
              <div
                key={pos}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                  !showFeedback && theme.selected,
                  isCorrectPos && SESSION_SUCCESS,
                  isWrongPos && SESSION_ERROR,
                )}
              >
                <span className="w-5 h-5 rounded-full bg-muted/60 flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0 tabular-nums">
                  {pos + 1}
                </span>
                {items[itemIdx]}
              </div>
            );
          })}
        </div>
      )}

      {!showFeedback && available.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {available.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSeqSel((prev) => [...prev, i])}
              className={cn("px-3 py-1.5 rounded-full text-sm bg-muted/50 transition-colors", theme.chipHover)}
            >
              {items[i]}
            </button>
          ))}
        </div>
      )}

      {showFeedback && !lastCorrect && correctSeq && (
        <div className={cn("space-y-2 p-3 rounded-lg", SESSION_SUCCESS)}>
          <p className={SESSION_LABEL}>Correct order</p>
          {correctSeq.map((itemIdx, pos) => (
            <div key={pos} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center text-[11px] font-medium shrink-0 tabular-nums">
                {pos + 1}
              </span>
              {items[itemIdx]}
            </div>
          ))}
        </div>
      )}

      {!showFeedback && (
        <div className="flex gap-2 pt-1">
          {seqSel.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSeqSel((prev) => prev.slice(0, -1))} className="rounded-lg">
              Undo
            </Button>
          )}
          {allDone && (
            <Button
              onClick={() => onAnswerNonMC(seqSel.map((i) => items[i]), evalSequence(items, correctOrder, seqSel))}
              className={cn("flex-1 h-10 rounded-lg font-medium", theme.primaryBtn)}
            >
              Check order
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionMatchQuestion({
  question,
  left,
  right,
  correctPairs,
  theme,
  showFeedback,
  lastCorrect,
  onAnswerNonMC,
  resetKey,
}: InteractiveBase & {
  left: string[];
  right: string[];
  correctPairs: [number, number][];
  resetKey: number;
}) {
  const [matchLeft, setMatchLeft] = useState<number | null>(null);
  const [matchPairs, setMatchPairs] = useState<[number, number][]>([]);

  useEffect(() => {
    setMatchLeft(null);
    setMatchPairs([]);
  }, [resetKey]);

  const pairedLeft = matchPairs.map(([l]) => l);
  const pairedRight = matchPairs.map(([, r]) => r);
  const allDone = pairedLeft.length === left.length;

  const handleRight = (ri: number) => {
    if (matchLeft === null || pairedRight.includes(ri)) return;
    const next: [number, number][] = [...matchPairs, [matchLeft, ri]];
    setMatchPairs(next);
    setMatchLeft(null);
    if (next.length === left.length) {
      onAnswerNonMC(next, evalMatch(next, correctPairs));
    }
  };

  const pairForLeft = (li: number) => matchPairs.find(([l]) => l === li);
  const pairForRight = (ri: number) => matchPairs.find(([, r]) => r === ri);
  const leftCorrect = (li: number) => {
    const p = pairForLeft(li);
    return p ? correctPairs.some(([cl, cr]) => cl === li && cr === p[1]) : null;
  };
  const rightCorrect = (ri: number) => {
    const p = pairForRight(ri);
    return p ? correctPairs.some(([cl, cr]) => cr === ri && cl === p[0]) : null;
  };

  return (
    <div className="space-y-5">
      {question && <h3 className={SESSION_QUESTION}>{question}</h3>}
      {!showFeedback && matchLeft === null && !allDone && (
        <p className="text-sm text-muted-foreground">Select an item on the left, then its match on the right.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((item, li) => {
            const paired = pairedLeft.includes(li);
            const isSelected = matchLeft === li;
            const ok = showFeedback ? leftCorrect(li) : null;
            return (
              <button
                key={li}
                type="button"
                disabled={showFeedback || (paired && !isSelected)}
                onClick={() => setMatchLeft(isSelected ? null : li)}
                className={cn(
                  SESSION_OPTION_BASE,
                  "text-sm",
                  !showFeedback && !paired && !isSelected && cn(theme.chip, theme.chipHover),
                  isSelected && theme.selected,
                  paired && !showFeedback && theme.paired,
                  ok === true && SESSION_SUCCESS,
                  ok === false && SESSION_ERROR,
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {right.map((item, ri) => {
            const paired = pairedRight.includes(ri);
            const ok = showFeedback ? rightCorrect(ri) : null;
            return (
              <button
                key={ri}
                type="button"
                disabled={showFeedback || paired}
                onClick={() => handleRight(ri)}
                className={cn(
                  SESSION_OPTION_BASE,
                  "text-sm",
                  !showFeedback && !paired && matchLeft !== null && "border-dashed " + theme.selected,
                  !showFeedback && !paired && matchLeft === null && cn(theme.chip),
                  paired && !showFeedback && theme.paired,
                  ok === true && SESSION_SUCCESS,
                  ok === false && SESSION_ERROR,
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {showFeedback && !lastCorrect && (
        <div className={cn("rounded-lg px-3 py-2.5 space-y-1.5", SESSION_SUCCESS)}>
          <p className={SESSION_LABEL}>Correct pairs</p>
          {correctPairs.map(([li, ri]) => (
            <p key={li} className="text-sm">{left[li]} → {right[ri]}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function classifyInstruction(categories: string[]): string {
  if (categories.length === 2) {
    return `Tap ${categories[0]} or ${categories[1]} for each statement.`;
  }
  return "Choose one category for each statement.";
}

function ClassifyOptionButton({
  label,
  isChosen,
  isCorrect,
  isWrong,
  showFeedback,
  theme,
  binary,
  rowAnswered,
  onClick,
}: {
  label: string;
  isChosen: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  showFeedback: boolean;
  theme: SessionTheme;
  binary: boolean;
  rowAnswered: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={showFeedback}
      onClick={onClick}
      aria-pressed={isChosen}
      className={cn(
        binary
          ? "flex-1 py-2.5 px-4 rounded-lg text-sm transition-all duration-150"
          : "px-3 py-1.5 rounded-full text-xs transition-all duration-150",
        !showFeedback && !isChosen && "bg-muted/50 hover:bg-muted/70 ring-1 ring-border/30 font-medium",
        !showFeedback && !isChosen && rowAnswered && "opacity-45 scale-[0.98]",
        !showFeedback && isChosen && cn(theme.selected, theme.accent),
        isCorrect && SESSION_SUCCESS,
        isWrong && SESSION_ERROR,
      )}
    >
      {label}
    </button>
  );
}

/** Shared statement + category layout for classify / true-false (interactive + read-only preview). */
export function SessionClassifyStatements({
  categories,
  items,
  theme,
  showFeedback,
  classifyMap = {},
  correct = [],
  onChoose,
  readOnly = false,
}: {
  categories: string[];
  items: string[];
  theme: SessionTheme;
  showFeedback: boolean;
  classifyMap?: Record<number, number>;
  correct?: number[];
  onChoose?: (itemIdx: number, categoryIdx: number) => void;
  readOnly?: boolean;
}) {
  const binary = categories.length === 2;

  return (
    <div className="space-y-1">
      {items.map((item, ii) => {
        const chosen = classifyMap[ii];
        const correctCat = correct[ii];
        const answered = chosen !== undefined;

        return (
          <div
            key={ii}
            className={cn(
              "py-3.5 space-y-3 border-b border-border/15 last:border-0",
              readOnly && "opacity-80",
            )}
          >
            <p className="text-sm sm:text-[15px] text-foreground leading-relaxed">
              <span className="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-full bg-muted/60 text-[11px] font-medium text-muted-foreground tabular-nums shrink-0 align-middle">
                {ii + 1}
              </span>
              {item}
            </p>

            <div
              className={cn("flex gap-2 pl-7", !binary && "flex-wrap")}
              role={readOnly ? undefined : "group"}
              aria-label={readOnly ? undefined : `Statement ${ii + 1}`}
            >
              {categories.map((cat, ci) => {
                const isChosen = chosen === ci;
                const isCorrect = showFeedback && correctCat === ci;
                const isWrong = showFeedback && isChosen && correctCat !== ci;

                if (readOnly) {
                  return (
                    <span
                      key={ci}
                      className={cn(
                        binary
                          ? "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-center bg-muted/35 text-muted-foreground ring-1 ring-border/20"
                          : "px-3 py-1.5 rounded-full text-xs font-medium bg-muted/35 text-muted-foreground",
                      )}
                    >
                      {cat}
                    </span>
                  );
                }

                return (
                  <ClassifyOptionButton
                    key={ci}
                    label={cat}
                    isChosen={isChosen}
                    isCorrect={isCorrect}
                    isWrong={isWrong}
                    showFeedback={showFeedback}
                    theme={theme}
                    binary={binary}
                    rowAnswered={answered}
                    onClick={() => onChoose?.(ii, ci)}
                  />
                );
              })}
            </div>

            {!readOnly && !showFeedback && answered && (
              <p className={cn("pl-7 text-[11px] font-medium", theme.accent)}>
                {categories[chosen!]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SessionClassifyQuestion({
  question,
  categories,
  items,
  correct,
  theme,
  showFeedback,
  onAnswerNonMC,
  resetKey,
}: InteractiveBase & {
  categories: string[];
  items: string[];
  correct: number[];
  resetKey: number;
}) {
  const [classifyMap, setClassifyMap] = useState<Record<number, number>>({});

  useEffect(() => {
    setClassifyMap({});
  }, [resetKey]);

  const answeredCount = Object.keys(classifyMap).length;
  const allDone = answeredCount === items.length;

  return (
    <div className="space-y-4">
      {question && <h3 className={SESSION_QUESTION}>{question}</h3>}

      <p className="text-sm text-muted-foreground">{classifyInstruction(categories)}</p>

      {!showFeedback && items.length > 1 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {answeredCount} of {items.length} answered
        </p>
      )}

      <SessionClassifyStatements
        categories={categories}
        items={items}
        theme={theme}
        showFeedback={showFeedback}
        classifyMap={classifyMap}
        correct={correct}
        onChoose={(ii, ci) => setClassifyMap((prev) => ({ ...prev, [ii]: ci }))}
      />

      {!showFeedback && allDone && (
        <Button
          onClick={() => onAnswerNonMC(classifyMap, evalClassify(classifyMap, correct, items.length))}
          className={cn("w-full h-10 rounded-lg font-medium", theme.primaryBtn)}
        >
          Check answers
        </Button>
      )}
    </div>
  );
}

export function SessionAgreeDisagreeQuestion({
  question,
  answer,
  theme,
  showFeedback,
  onAnswerNonMC,
  resetKey,
}: InteractiveBase & {
  answer?: "agree" | "disagree";
  resetKey: number;
}) {
  const [chosen, setChosen] = useState<"agree" | "disagree" | null>(null);

  useEffect(() => {
    setChosen(null);
  }, [resetKey]);

  return (
    <div className="space-y-5">
      {question && <h3 className={SESSION_QUESTION}>{question}</h3>}
      <div className="flex gap-2 max-w-sm">
        {(["agree", "disagree"] as const).map((val) => {
          const isCorrect = showFeedback && val === answer;
          const isWrong = showFeedback && val === chosen && val !== answer;
          return (
            <button
              key={val}
              type="button"
              disabled={showFeedback}
              onClick={() => {
                setChosen(val);
                onAnswerNonMC(val, val === answer);
              }}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors",
                !showFeedback && cn(theme.chip, theme.chipHover),
                isCorrect && SESSION_SUCCESS,
                isWrong && SESSION_ERROR,
              )}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
}
