import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DOMAIN_CONFIG } from "../home-types";
import { SessionImageGrid } from "./session-image-grid";
import { SessionAudioPlayer } from "./session-audio-player";
import { SessionFeedbackBar } from "./session-feedback-bar";
import { SessionObjectDetect } from "./session-object-detect";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { WritingSessionView } from "./writing-session-view";
import { SpeakingSessionView } from "./speaking-session-view";
import { useSessionContext } from "../session-context";
import { OptionVisual, StemVisual } from "@/components/shape-glyph";
import {
  SESSION_CARD,
  SESSION_ERROR,
  SESSION_LABEL,
  SESSION_MUTED_OPTION,
  SESSION_OPTION_BASE,
  SESSION_QUESTION,
  SESSION_SUCCESS,
  SESSION_THEMES,
  normalizeSessionDomain,
  type SessionTheme,
} from "./session-ui-styles";

interface SessionActiveViewProps {
  showCapsule: boolean;
}

// â”€â”€ Answer-evaluation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function evalSequence(items: string[], correctOrder: number[], sel: number[]): boolean {
  if (sel.length !== items.length) return false;
  // correctOrder[i] = destination position of items[i]
  // build "correct selection order": which item index should be tapped first, secondâ€¦
  const sorted = items.map((_, i) => i).sort((a, b) => correctOrder[a] - correctOrder[b]);
  return sel.every((v, i) => v === sorted[i]);
}

function evalMatch(pairs: [number, number][], correctPairs: [number, number][]): boolean {
  if (pairs.length !== correctPairs.length) return false;
  return correctPairs.every(([l, r]) => pairs.some(([pl, pr]) => pl === l && pr === r));
}

function evalClassify(map: Record<number, number>, correct: number[], itemCount: number): boolean {
  if (Object.keys(map).length < itemCount) return false;
  return correct.every((cat, i) => map[i] === cat);
}

// â”€â”€ Shared MC option list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function McOptions({
  options,
  diagrams,
  correct,
  selectedIdx,
  showFeedback,
  onSelect,
  theme,
}: {
  options: string[];
  diagrams?: (string | null)[];
  correct: number;
  selectedIdx: number;
  showFeedback: boolean;
  onSelect: (i: number) => void;
  theme: SessionTheme;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const isCorrect  = i === correct;
        const isSelected = i === selectedIdx;
        let style = `${SESSION_OPTION_BASE} ${theme.chip} ${theme.chipHover}`;
        if (showFeedback) {
          if (isCorrect) style = `${SESSION_OPTION_BASE} ${SESSION_SUCCESS}`;
          else if (isSelected && !isCorrect) style = `${SESSION_OPTION_BASE} ${SESSION_ERROR}`;
          else style = `${SESSION_OPTION_BASE} ${SESSION_MUTED_OPTION}`;
        } else if (isSelected) {
          style = `${SESSION_OPTION_BASE} ${theme.selected}`;
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            disabled={showFeedback}
            className={style}
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center text-[11px] font-medium text-muted-foreground tabular-nums">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm leading-relaxed text-inherit">
                <OptionVisual label={opt} diagram={diagrams?.[i]} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function SessionActiveView({ showCapsule }: SessionActiveViewProps) {
  const {
    session, activeDomain, qIdx, questions, currentQ,
    showFeedback, selectedIdx, lastCorrect,
    writingText, setWritingText,
    recording, finalizingSpeaking,
    onAnswer, onAnswerNonMC, onStartRecording, onStopRecording, onSubmitWriting,
    sttSupported, sttTranscript, sttInterim, sttLevel, sttError,
    productionReview, onContinueProduction, onRetryProduction,
    speakPassage, speakFeedback, speakWritingSession, onStopSpeaking, speaking, ttsLoading,
  } = useSessionContext();

  // â”€â”€ Non-MC interaction state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [seqSel,      setSeqSel]      = useState<number[]>([]);
  const [matchLeft,   setMatchLeft]   = useState<number | null>(null);
  const [matchPairs,  setMatchPairs]  = useState<[number, number][]>([]);
  const [classifyMap, setClassifyMap] = useState<Record<number, number>>({});

  // Reset local state whenever the question advances
  useEffect(() => {
    setSeqSel([]);
    setMatchLeft(null);
    setMatchPairs([]);
    setClassifyMap({});
  }, [qIdx]);

  const content     = session.content;
  const type        = content.type;
  const data        = content.data;
  if (!data) return null;
  const progressPct = questions.length > 0 ? (qIdx / questions.length) * 100 : 0;
  const cfg         = DOMAIN_CONFIG[activeDomain] ?? DOMAIN_CONFIG.listening;
  const DomainIcon  = cfg.icon;
  const theme       = SESSION_THEMES[normalizeSessionDomain(type ?? activeDomain)];
  const domainLabel = cfg.label ?? normalizeSessionDomain(type ?? activeDomain);
  const mediaUrl      = data.illustrationUrl ?? session.anchorImage?.url ?? null;
  const hasVisual     = Boolean(mediaUrl || data.visual);
  const hasPassage     = type === "reading" && Boolean(data.passage);
  const hasAudio       = type === "listening" && Boolean(data.audioScript);
  const isWriting      = type === "writing";
  const isSpeaking     = type === "speaking";
  const domainKey      = normalizeSessionDomain(type ?? activeDomain);
  const useWideLayout  = isWriting || isSpeaking || hasVisual || hasPassage || hasAudio;
  const layoutClass    = "w-full";

  // â”€â”€ Sequence renderer (reading: sequence_order / listening: sequence_ordering) â”€â”€
  const SequenceRenderer = ({ items, correctOrder }: { items: string[]; correctOrder: number[] }) => {
    const available = items.map((_, i) => i).filter(i => !seqSel.includes(i));
    const allDone   = seqSel.length === items.length;
    const submitSeq = () => {
      const ok = evalSequence(items, correctOrder, seqSel);
      onAnswerNonMC(seqSel.map(i => items[i]), ok);
    };

    // After feedback, compute correct ordering for display
    const correctSeq = showFeedback
      ? items.map((_, i) => i).sort((a, b) => correctOrder[a] - correctOrder[b])
      : null;

    return (
      <div className="space-y-5">
        <h3 className={SESSION_QUESTION}>{currentQ?.question}</h3>

        {seqSel.length > 0 && (
          <div className="space-y-2">
            <p className={SESSION_LABEL}>Your order</p>
            {seqSel.map((itemIdx, pos) => {
              const isCorrectPos = showFeedback && correctSeq?.[pos] === itemIdx;
              const isWrongPos   = showFeedback && correctSeq?.[pos] !== itemIdx;
              return (
                <div key={pos} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm",
                  !showFeedback && theme.selected,
                  isCorrectPos && SESSION_SUCCESS,
                  isWrongPos && SESSION_ERROR,
                )}>
                  <span className="w-5 h-5 rounded-md bg-muted/60 flex items-center justify-center text-[11px] font-medium text-muted-foreground flex-shrink-0 tabular-nums">{pos + 1}</span>
                  {items[itemIdx]}
                </div>
              );
            })}
          </div>
        )}

        {!showFeedback && available.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {available.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setSeqSel(prev => [...prev, i])}
                className={cn("px-3 py-1.5 rounded-lg border text-sm transition-colors", theme.chip, theme.chipHover)}
              >
                {items[i]}
              </button>
            ))}
          </div>
        )}

        {showFeedback && !lastCorrect && correctSeq && (
          <div className={cn("space-y-2 p-3 rounded-lg border", SESSION_SUCCESS)}>
            <p className={SESSION_LABEL}>Correct order</p>
            {correctSeq.map((itemIdx, pos) => (
              <div key={pos} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center text-[11px] font-medium flex-shrink-0 tabular-nums">{pos + 1}</span>
                {items[itemIdx]}
              </div>
            ))}
          </div>
        )}

        {!showFeedback && (
          <div className="flex gap-2 pt-1">
            {seqSel.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setSeqSel(prev => prev.slice(0, -1))} className="rounded-lg">
                Undo
              </Button>
            )}
            {allDone && (
              <Button onClick={submitSeq} className={cn("flex-1 h-10 rounded-lg font-medium", theme.primaryBtn)}>
                Check order
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // â”€â”€ Match renderer (reading: match_columns / listening: pair_matching) â”€â”€â”€â”€â”€â”€
  const MatchRenderer = ({ left, right, correctPairs }: { left: string[]; right: string[]; correctPairs: [number, number][] }) => {
    const pairedLeft  = matchPairs.map(([l]) => l);
    const pairedRight = matchPairs.map(([, r]) => r);
    const allDone     = pairedLeft.length === left.length;

    const handleRight = (ri: number) => {
      if (matchLeft === null || pairedRight.includes(ri)) return;
      const next: [number, number][] = [...matchPairs, [matchLeft, ri]];
      setMatchPairs(next);
      setMatchLeft(null);
      if (next.length === left.length) {
        const ok = evalMatch(next, correctPairs);
        onAnswerNonMC(next, ok);
      }
    };

    const pairForLeft  = (li: number) => matchPairs.find(([l]) => l === li);
    const pairForRight = (ri: number) => matchPairs.find(([, r]) => r === ri);

    const leftCorrect  = (li: number) => {
      const p = pairForLeft(li);
      return p ? correctPairs.some(([cl, cr]) => cl === li && cr === p[1]) : null;
    };
    const rightCorrect = (ri: number) => {
      const p = pairForRight(ri);
      return p ? correctPairs.some(([cl, cr]) => cr === ri && cl === p[0]) : null;
    };

    return (
      <div className="space-y-5">
        <h3 className={SESSION_QUESTION}>{currentQ?.question}</h3>
        {!showFeedback && matchLeft === null && !allDone && (
          <p className="text-sm text-muted-foreground">Select an item on the left, then its match on the right.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {left.map((item, li) => {
              const paired     = pairedLeft.includes(li);
              const isSelected = matchLeft === li;
              const ok         = showFeedback ? leftCorrect(li) : null;
              return (
                <button
                  key={li}
                  type="button"
                  disabled={showFeedback || (paired && !isSelected)}
                  onClick={() => setMatchLeft(isSelected ? null : li)}
                  className={cn(
                    SESSION_OPTION_BASE, "text-sm",
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
              const ok     = showFeedback ? rightCorrect(ri) : null;
              return (
                <button
                  key={ri}
                  type="button"
                  disabled={showFeedback || paired}
                  onClick={() => handleRight(ri)}
                  className={cn(
                    SESSION_OPTION_BASE, "text-sm",
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
          <div className={cn("rounded-lg border px-4 py-3 space-y-1.5", SESSION_SUCCESS)}>
            <p className={SESSION_LABEL}>Correct pairs</p>
            {correctPairs.map(([li, ri]) => (
              <p key={li} className="text-sm">{left[li]} â†’ {right[ri]}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // â”€â”€ Classify renderer (reading: classify / listening: category_sorting) â”€â”€â”€
  const ClassifyRenderer = ({ categories, items, correct }: { categories: string[]; items: string[]; correct: number[] }) => {
    const allDone  = Object.keys(classifyMap).length === items.length;
    const submitCl = () => {
      const ok = evalClassify(classifyMap, correct, items.length);
      onAnswerNonMC(classifyMap, ok);
    };

    return (
      <div className="space-y-5">
        <h3 className={SESSION_QUESTION}>{currentQ?.question}</h3>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat, ci) => (
            <span key={ci} className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", theme.panel)}>
              {cat}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item, ii) => {
            const chosen   = classifyMap[ii];
            const correctCat = correct[ii];
            return (
              <div key={ii} className={cn(SESSION_CARD, "px-4 py-3")}>
                <p className="text-sm font-medium text-foreground mb-2.5">{item}</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat, ci) => {
                    const isChosen  = chosen === ci;
                    const isCorrect = showFeedback && correctCat === ci;
                    const isWrong   = showFeedback && isChosen && correctCat !== ci;
                    return (
                      <button
                        key={ci}
                        type="button"
                        disabled={showFeedback}
                        onClick={() => setClassifyMap(prev => ({ ...prev, [ii]: ci }))}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                          !showFeedback && !isChosen && cn(theme.chip, theme.chipHover),
                          !showFeedback && isChosen && theme.selected,
                          isCorrect && SESSION_SUCCESS,
                          isWrong && SESSION_ERROR,
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!showFeedback && allDone && (
          <Button onClick={submitCl} className={cn("w-full h-10 rounded-lg font-medium", theme.primaryBtn)}>
            Check answers
          </Button>
        )}
      </div>
    );
  };

  // â”€â”€ Agree/Disagree renderer (listening only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const AgreeRenderer = ({ answer }: { answer?: "agree" | "disagree" }) => {
    const [chosen, setChosen] = useState<"agree" | "disagree" | null>(null);
    const submit = (val: "agree" | "disagree") => {
      setChosen(val);
      onAnswerNonMC(val, val === answer);
    };
    return (
      <div className="space-y-5 py-2">
        <h3 className={SESSION_QUESTION}>{currentQ?.question}</h3>
        <div className="flex gap-2 max-w-sm">
          {(["agree", "disagree"] as const).map(val => {
            const isCorrect = showFeedback && val === answer;
            const isWrong   = showFeedback && val === chosen && val !== answer;
            return (
              <button
                key={val}
                type="button"
                disabled={showFeedback}
                onClick={() => submit(val)}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors",
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
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <>
      <div
        className={cn(
          "min-h-[calc(100vh-var(--nav-height))] bg-background flex flex-col",
          showCapsule && "md:pl-14 lg:pl-14",
        )}
      >
        {!isWriting && (
          <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50">
            <div
              className={cn(
                "mx-auto py-3 flex items-center gap-2.5 sm:gap-3",
                useWideLayout
                  ? "max-w-[1680px] px-4 sm:px-8 lg:px-12"
                  : "max-w-[1440px] px-4 sm:px-6 lg:px-10",
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", theme.iconWrap)}>
                <DomainIcon className={cn("w-4 h-4", theme.icon)} />
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <span className={cn("text-sm font-medium capitalize", theme.title)}>{domainLabel}</span>
                <span className="text-xs text-muted-foreground tabular-nums font-medium shrink-0">
                  {qIdx + 1} / {questions.length || 1}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "mx-auto pb-3",
                useWideLayout
                  ? "max-w-[1680px] px-4 sm:px-8 lg:px-12"
                  : "max-w-[1440px] px-4 sm:px-6 lg:px-10",
              )}
            >
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", theme.progress)}
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Question area: full-width writing workspace; split grid for other domains â”€â”€ */}
        <div
          className={cn(
            "flex-1 w-full mx-auto",
            isWriting ? "py-1 sm:py-2" : "py-6",
            useWideLayout
              ? "max-w-[1680px] px-4 sm:px-8 lg:px-12"
              : "max-w-[1440px] px-4 sm:px-6 lg:px-10",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${qIdx}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={layoutClass}
            >
              {isWriting ? (
                <WritingSessionView
                  data={data}
                  theme={theme}
                  writingText={writingText}
                  setWritingText={setWritingText}
                  onSubmitWriting={onSubmitWriting}
                  productionReview={
                    productionReview?.kind === "writing"
                      ? {
                          kind: "writing" as const,
                          text: productionReview.text,
                          feedback: productionReview.feedback,
                          loading: productionReview.loading,
                          tryCount: productionReview.tryCount,
                        }
                      : null
                  }
                  speakWritingSession={speakWritingSession}
                  speakFeedback={speakFeedback}
                  onStopSpeaking={onStopSpeaking}
                  speaking={speaking}
                  ttsLoading={ttsLoading}
                  onContinueProduction={onContinueProduction}
                  onRetryProduction={onRetryProduction}
                  qIdx={qIdx}
                  questionCount={questions.length || 1}
                  mediaUrl={mediaUrl}
                  visual={data.visual}
                />
              ) : isSpeaking ? (
                <SpeakingSessionView
                  data={data}
                  theme={theme}
                  mediaUrl={mediaUrl}
                  visual={data.visual}
                  productionReview={
                    productionReview?.kind === "speaking"
                      ? {
                          kind: "speaking" as const,
                          text: productionReview.text,
                          feedback: productionReview.feedback,
                          loading: productionReview.loading,
                        }
                      : null
                  }
                  recording={recording}
                  finalizingSpeaking={finalizingSpeaking}
                  sttSupported={sttSupported}
                  sttTranscript={sttTranscript}
                  sttInterim={sttInterim}
                  sttLevel={sttLevel}
                  sttError={sttError}
                  onStartRecording={onStartRecording}
                  onStopRecording={onStopRecording}
                  speakPassage={speakPassage}
                  speakFeedback={speakFeedback}
                  onStopSpeaking={onStopSpeaking}
                  speaking={speaking}
                  ttsLoading={ttsLoading}
                  onContinueProduction={onContinueProduction}
                  onRetryProduction={onRetryProduction}
                  qIdx={qIdx}
                  questionCount={questions.length || 1}
                />
              ) : (
              <SessionResponsiveLayout
                domain={domainKey}
                mediaUrl={mediaUrl}
                visual={data.visual}
                referenceLabel={type === "reading" ? "Illustration" : "Reference"}
                referencePanel={
                  hasPassage || hasAudio ? (
                    <>
                      {hasPassage && (
                        <div className={cn("p-5 sm:p-6 border-l-2 border-l-amber-600/50", SESSION_CARD)}>
                          <p className={SESSION_LABEL}>Passage</p>
                          <p className="text-foreground leading-[1.7] text-[15px] mt-2">{data.passage}</p>
                        </div>
                      )}
                      {hasAudio && <SessionAudioPlayer />}
                    </>
                  ) : undefined
                }
              >
              {/* Object-detect question */}
              {currentQ?.type === "object_detect" && (currentQ as any).imageSrc && (
                <SessionObjectDetect
                  showLabels={false}
                  currentQ={{
                    question:     currentQ.question,
                    imageSrc:     (currentQ as any).imageSrc,
                    labels:       currentQ.options ?? [],
                    correctLabel: (currentQ.options ?? [])[typeof currentQ.correct === "number" ? currentQ.correct : 0] ?? "",
                  }}
                  showFeedback={showFeedback}
                  selectedLabel={selectedIdx >= 0 ? (currentQ.options ?? [])[selectedIdx] ?? "" : ""}
                  onAnswer={(label) => {
                    const idx = (currentQ.options ?? []).indexOf(label);
                    if (idx !== -1) onAnswer(idx);
                  }}
                />
              )}

              {/* â”€â”€ READING questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              {type === "reading" && currentQ && currentQ.type !== "object_detect" && (
                <>
                  {currentQ.type === "sequence_order" && currentQ.items && currentQ.correct_order && (
                    <SequenceRenderer items={currentQ.items} correctOrder={currentQ.correct_order} />
                  )}
                  {currentQ.type === "match_columns" && currentQ.left && currentQ.right && currentQ.correct_pairs && (
                    <MatchRenderer left={currentQ.left} right={currentQ.right} correctPairs={currentQ.correct_pairs} />
                  )}
                  {currentQ.type === "classify" && currentQ.categories && currentQ.items && Array.isArray(currentQ.correct) && (
                    <ClassifyRenderer
                      categories={currentQ.categories}
                      items={currentQ.items}
                      correct={currentQ.correct as number[]}
                    />
                  )}
                  {(currentQ.type === "multiple_choice" ||
                    !["sequence_order", "match_columns", "classify", "object_detect"].includes(currentQ.type)) &&
                    Array.isArray(currentQ.options) && (
                    <div className="space-y-4">
                      <StemVisual visual={currentQ.visual} />
                      <h3 className={SESSION_QUESTION}>{currentQ.question}</h3>
                      <McOptions
                        options={currentQ.options}
                        diagrams={currentQ.optionDiagrams}
                        correct={typeof currentQ.correct === "number" ? currentQ.correct : 0}
                        selectedIdx={selectedIdx}
                        showFeedback={showFeedback}
                        onSelect={onAnswer}
                        theme={theme}
                      />
                    </div>
                  )}
                </>
              )}

              {/* â”€â”€ LISTENING questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              {type === "listening" && currentQ && (
                <>
                  {currentQ.type === "image_grid" && <SessionImageGrid />}

                  {currentQ.type === "sequence_ordering" && currentQ.items && currentQ.correct_order && (
                    <SequenceRenderer items={currentQ.items} correctOrder={currentQ.correct_order} />
                  )}

                  {currentQ.type === "pair_matching" && currentQ.left_items && currentQ.right_items && currentQ.correct_pairs && (
                    <MatchRenderer
                      left={currentQ.left_items}
                      right={currentQ.right_items}
                      correctPairs={currentQ.correct_pairs}
                    />
                  )}

                  {currentQ.type === "agree_disagree" && (
                    <AgreeRenderer answer={currentQ.answer} />
                  )}

                  {currentQ.type === "category_sorting" && currentQ.categories && currentQ.items && currentQ.correct_categories && (
                    <ClassifyRenderer
                      categories={currentQ.categories}
                      items={currentQ.items}
                      correct={currentQ.correct_categories}
                    />
                  )}

                  {/* Default MC for multiple_choice / unknown listening types */}
                  {!["image_grid", "sequence_ordering", "pair_matching", "agree_disagree", "category_sorting"].includes(currentQ.type) &&
                    Array.isArray(currentQ.options) && (
                    <div className="space-y-4">
                      <StemVisual visual={currentQ.visual} />
                      <h3 className={SESSION_QUESTION}>{currentQ.question}</h3>
                      <McOptions
                        options={currentQ.options}
                        diagrams={currentQ.optionDiagrams}
                        correct={typeof currentQ.correct === "number" ? currentQ.correct : 0}
                        selectedIdx={selectedIdx}
                        showFeedback={showFeedback}
                        onSelect={onAnswer}
                        theme={theme}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Feedback â€” slides in below question */}
              <SessionFeedbackBar />
              </SessionResponsiveLayout>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
