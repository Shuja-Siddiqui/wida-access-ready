import { useState, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Crumb } from "@/components/breadcrumbs";
import { DOMAIN_CONFIG } from "../home-types";
import { SessionImageGrid } from "./session-image-grid";
import { SessionAudioPlayer } from "./session-audio-player";
import { SessionFeedbackBar } from "./session-feedback-bar";
import { SessionObjectDetect } from "./session-object-detect";
import { useSessionContext } from "../session-context";

interface SessionActiveViewProps {
  trail: Crumb[];
  showCapsule: boolean;
}

// ── Answer-evaluation helpers ─────────────────────────────────────────────────

function evalSequence(items: string[], correctOrder: number[], sel: number[]): boolean {
  if (sel.length !== items.length) return false;
  // correctOrder[i] = destination position of items[i]
  // build "correct selection order": which item index should be tapped first, second…
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

// ── Shared MC option list ─────────────────────────────────────────────────────

function McOptions({
  options,
  correct,
  selectedIdx,
  showFeedback,
  onSelect,
}: {
  options: string[];
  correct: number;
  selectedIdx: number;
  showFeedback: boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const isCorrect  = i === correct;
        const isSelected = i === selectedIdx;
        let style     = "border-border/60 bg-card/60 hover:border-foreground/25 hover:bg-card";
        let textStyle = "text-foreground";
        if (showFeedback) {
          if (isCorrect)                    { style = "border-growth-green/60 bg-growth-green/8"; textStyle = "text-growth-green"; }
          else if (isSelected && !isCorrect){ style = "border-destructive/50 bg-destructive/6 opacity-70"; textStyle = "text-destructive"; }
          else                              { style = "border-border/30 bg-card/30 opacity-40"; }
        } else if (isSelected) {
          style = "border-trust-blue bg-trust-blue/8"; textStyle = "text-trust-blue";
        }
        return (
          <motion.button
            key={i}
            onClick={() => onSelect(i)}
            disabled={showFeedback}
            whileTap={{ scale: showFeedback ? 1 : 0.985 }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium transition-colors duration-150 ${style}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-border/40 flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`text-sm leading-snug ${textStyle}`}>{opt}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionActiveView({ trail, showCapsule }: SessionActiveViewProps) {
  const {
    session, activeDomain, qIdx, questions, currentQ,
    showFeedback, selectedIdx, lastCorrect,
    writingText, setWritingText,
    recording, finalizingSpeaking,
    onAnswer, onAnswerNonMC, onStartRecording, onStopRecording, onSubmitWriting,
    sttSupported, sttTranscript, sttInterim, sttError,
  } = useSessionContext();

  // ── Non-MC interaction state ───────────────────────────────────────────────
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
  const progressPct = questions.length > 0 ? (qIdx / questions.length) * 100 : 0;
  const cfg         = DOMAIN_CONFIG[activeDomain] ?? DOMAIN_CONFIG.listening;
  const DomainIcon  = cfg.icon;

  // ── Sequence renderer (reading: sequence_order / listening: sequence_ordering) ──
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
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-foreground leading-snug">{currentQ?.question}</h3>

        {/* Selected order */}
        {seqSel.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Order</p>
            {seqSel.map((itemIdx, pos) => {
              const isCorrectPos = showFeedback && correctSeq?.[pos] === itemIdx;
              const isWrongPos   = showFeedback && correctSeq?.[pos] !== itemIdx;
              return (
                <div key={pos} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold",
                  !showFeedback && "border-trust-blue/40 bg-trust-blue/5 text-trust-blue",
                  isCorrectPos && "border-growth-green/50 bg-growth-green/8 text-growth-green",
                  isWrongPos   && "border-destructive/40 bg-destructive/5 text-destructive",
                )}>
                  <span className="w-5 h-5 rounded-full bg-border/40 flex items-center justify-center text-[11px] font-bold text-muted-foreground flex-shrink-0">{pos + 1}</span>
                  {items[itemIdx]}
                </div>
              );
            })}
          </div>
        )}

        {/* Available chips */}
        {!showFeedback && available.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {available.map(i => (
              <button
                key={i}
                onClick={() => setSeqSel(prev => [...prev, i])}
                className="px-3 py-1.5 rounded-full border-2 border-border/60 bg-card/60 text-foreground text-sm font-semibold hover:border-trust-blue/50 hover:bg-trust-blue/5 transition-all active:scale-95"
              >
                {items[i]}
              </button>
            ))}
          </div>
        )}

        {/* Correct order hint after wrong */}
        {showFeedback && !lastCorrect && correctSeq && (
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-growth-green">Correct Order</p>
            {correctSeq.map((itemIdx, pos) => (
              <div key={pos} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-growth-green/8 text-growth-green text-sm font-semibold">
                <span className="w-5 h-5 rounded-full bg-growth-green/20 flex items-center justify-center text-[11px] font-bold flex-shrink-0">{pos + 1}</span>
                {items[itemIdx]}
              </div>
            ))}
          </div>
        )}

        {/* Undo + submit */}
        {!showFeedback && (
          <div className="flex gap-2">
            {seqSel.length > 0 && (
              <button
                onClick={() => setSeqSel(prev => prev.slice(0, -1))}
                className="px-4 py-2 rounded-xl border-2 border-border/60 text-sm font-semibold text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-all"
              >
                Undo
              </button>
            )}
            {allDone && (
              <Button onClick={submitSeq} className="flex-1 h-10 font-semibold bg-trust-blue hover:bg-trust-blue/90 text-white rounded-xl">
                Check Order
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Match renderer (reading: match_columns / listening: pair_matching) ──────
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
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-foreground leading-snug">{currentQ?.question}</h3>
        {!showFeedback && matchLeft === null && !allDone && (
          <p className="text-xs text-muted-foreground">Tap a word on the left, then tap its match on the right.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Left column */}
          <div className="space-y-2">
            {left.map((item, li) => {
              const paired     = pairedLeft.includes(li);
              const isSelected = matchLeft === li;
              const ok         = showFeedback ? leftCorrect(li) : null;
              return (
                <button
                  key={li}
                  disabled={showFeedback || (paired && !isSelected)}
                  onClick={() => setMatchLeft(isSelected ? null : li)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                    !showFeedback && !paired && !isSelected && "border-border/60 bg-card/60 hover:border-trust-blue/50",
                    isSelected  && "border-trust-blue bg-trust-blue/10 text-trust-blue scale-[1.02]",
                    paired && !showFeedback && "border-achieve-purple/40 bg-achieve-purple/5 text-achieve-purple opacity-60",
                    ok === true  && "border-growth-green/60 bg-growth-green/8 text-growth-green",
                    ok === false && "border-destructive/50 bg-destructive/5 text-destructive",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-2">
            {right.map((item, ri) => {
              const paired = pairedRight.includes(ri);
              const ok     = showFeedback ? rightCorrect(ri) : null;
              return (
                <button
                  key={ri}
                  disabled={showFeedback || paired}
                  onClick={() => handleRight(ri)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                    !showFeedback && !paired && matchLeft !== null && "border-dashed border-trust-blue/50 hover:bg-trust-blue/10",
                    !showFeedback && !paired && matchLeft === null && "border-border/60 bg-card/60",
                    paired && !showFeedback && "border-achieve-purple/40 bg-achieve-purple/5 text-achieve-purple opacity-60",
                    ok === true  && "border-growth-green/60 bg-growth-green/8 text-growth-green",
                    ok === false && "border-destructive/50 bg-destructive/5 text-destructive",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Correct pairs hint after wrong */}
        {showFeedback && !lastCorrect && (
          <div className="rounded-xl border border-growth-green/30 bg-growth-green/5 px-4 py-3 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-growth-green mb-2">Correct Pairs</p>
            {correctPairs.map(([li, ri]) => (
              <p key={li} className="text-sm text-growth-green font-medium">{left[li]} → {right[ri]}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Classify renderer (reading: classify / listening: category_sorting) ───
  const ClassifyRenderer = ({ categories, items, correct }: { categories: string[]; items: string[]; correct: number[] }) => {
    const allDone  = Object.keys(classifyMap).length === items.length;
    const submitCl = () => {
      const ok = evalClassify(classifyMap, correct, items.length);
      onAnswerNonMC(classifyMap, ok);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-foreground leading-snug">{currentQ?.question}</h3>

        {/* Category legend */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, ci) => (
            <span key={ci} className="px-3 py-1 rounded-full bg-achieve-purple/10 text-achieve-purple text-xs font-bold border border-achieve-purple/30">
              {cat}
            </span>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2.5">
          {items.map((item, ii) => {
            const chosen   = classifyMap[ii];
            const correctCat = correct[ii];
            return (
              <div key={ii} className="rounded-xl border border-border/50 bg-card/50 px-4 py-3">
                <p className="text-sm font-semibold text-foreground mb-2">{item}</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat, ci) => {
                    const isChosen  = chosen === ci;
                    const isCorrect = showFeedback && correctCat === ci;
                    const isWrong   = showFeedback && isChosen && correctCat !== ci;
                    return (
                      <button
                        key={ci}
                        disabled={showFeedback}
                        onClick={() => setClassifyMap(prev => ({ ...prev, [ii]: ci }))}
                        className={cn(
                          "px-2.5 py-1 rounded-lg border text-xs font-bold transition-all",
                          !showFeedback && !isChosen && "border-border/60 bg-muted/30 text-muted-foreground hover:border-achieve-purple/40",
                          !showFeedback && isChosen  && "border-achieve-purple bg-achieve-purple/10 text-achieve-purple",
                          isCorrect  && "border-growth-green bg-growth-green/10 text-growth-green",
                          isWrong    && "border-destructive bg-destructive/10 text-destructive",
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
          <Button onClick={submitCl} className="w-full h-10 font-semibold bg-achieve-purple hover:bg-achieve-purple/90 text-white rounded-xl">
            Check Answers
          </Button>
        )}
      </div>
    );
  };

  // ── Agree/Disagree renderer (listening only) ──────────────────────────────
  const AgreeRenderer = ({ answer }: { answer?: "agree" | "disagree" }) => {
    const [chosen, setChosen] = useState<"agree" | "disagree" | null>(null);
    const submit = (val: "agree" | "disagree") => {
      setChosen(val);
      onAnswerNonMC(val, val === answer);
    };
    return (
      <div className="space-y-5 text-center py-4">
        <h3 className="text-[18px] font-bold text-foreground leading-snug">{currentQ?.question}</h3>
        <div className="flex gap-3 justify-center">
          {(["agree", "disagree"] as const).map(val => {
            const isCorrect = showFeedback && val === answer;
            const isWrong   = showFeedback && val === chosen && val !== answer;
            return (
              <button
                key={val}
                disabled={showFeedback}
                onClick={() => submit(val)}
                className={cn(
                  "px-8 py-3 rounded-xl border-2 text-sm font-bold capitalize transition-all",
                  !showFeedback && "border-border/60 bg-card/60 hover:border-trust-blue/50 hover:bg-trust-blue/5",
                  isCorrect && "border-growth-green bg-growth-green/10 text-growth-green",
                  isWrong   && "border-destructive bg-destructive/10 text-destructive opacity-70",
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

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar trail={trail} />
      <div
        className={cn(
          "min-h-screen bg-background flex flex-col",
          showCapsule && "md:pl-14 lg:pl-14",
        )}
      >
        {/* ── Progress header ─────────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <DomainIcon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold capitalize tracking-wide ${cfg.color}`}>{activeDomain}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {qIdx + 1}<span className="opacity-40"> / </span>{questions.length || 1}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${cfg.bg.replace("/10", "").replace("/15", "")}`}
                  style={{ backgroundColor: "var(--color-trust-blue)" }}
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Question area ────────────────────────────────────────────────── */}
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${qIdx}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-5"
            >
              {/* Reading passage */}
              {type === "reading" && data.passage && (
                <div className="rounded-2xl border border-energy-orange/20 bg-energy-orange/[0.04] p-5">
                  <p className="text-foreground leading-relaxed text-[15px]">{data.passage}</p>
                </div>
              )}

              {/* Listening: audio player */}
              {type === "listening" && data.audioScript && <SessionAudioPlayer />}

              {/* Object-detect question */}
              {currentQ?.type === "object_detect" && (currentQ as any).imageSrc && (
                <SessionObjectDetect
                  showLabels={false}
                  currentQ={{
                    question:     currentQ.question,
                    imageSrc:     (currentQ as any).imageSrc,
                    labels:       currentQ.options ?? [],
                    correctLabel: (currentQ.options ?? [])[currentQ.correct ?? 0] ?? "",
                  }}
                  showFeedback={showFeedback}
                  selectedLabel={selectedIdx >= 0 ? (currentQ.options ?? [])[selectedIdx] ?? "" : ""}
                  onAnswer={(label) => {
                    const idx = (currentQ.options ?? []).indexOf(label);
                    if (idx !== -1) onAnswer(idx);
                  }}
                />
              )}

              {/* ── READING questions ─────────────────────────────────────── */}
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
                      <h3 className="text-[18px] font-bold text-foreground leading-snug">{currentQ.question}</h3>
                      <McOptions
                        options={currentQ.options}
                        correct={typeof currentQ.correct === "number" ? currentQ.correct : 0}
                        selectedIdx={selectedIdx}
                        showFeedback={showFeedback}
                        onSelect={onAnswer}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ── LISTENING questions ───────────────────────────────────── */}
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
                      <h3 className="text-[18px] font-bold text-foreground leading-snug">{currentQ.question}</h3>
                      <McOptions
                        options={currentQ.options}
                        correct={typeof currentQ.correct === "number" ? currentQ.correct : 0}
                        selectedIdx={selectedIdx}
                        showFeedback={showFeedback}
                        onSelect={onAnswer}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ── SPEAKING question ─────────────────────────────────────── */}
              {type === "speaking" && (
                <div className="space-y-8 text-center py-8">
                  <h3 className="text-xl font-bold text-foreground">{data.prompt}</h3>
                  {data.scaffold && (
                    <p className="text-muted-foreground text-base italic">Try: "{data.scaffold}"</p>
                  )}
                  <div className="flex flex-col items-center gap-4">
                    <button
                      disabled={finalizingSpeaking}
                      className={`relative rounded-full h-24 w-24 flex items-center justify-center text-white shadow-xl transition-all disabled:opacity-60 ${
                        recording
                          ? "bg-destructive scale-110"
                          : "bg-growth-green hover:scale-105 active:scale-95"
                      }`}
                      onClick={recording ? onStopRecording : onStartRecording}
                    >
                      {recording && (
                        <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" />
                      )}
                      {finalizingSpeaking ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : recording ? (
                        <Square className="w-9 h-9 relative z-10" />
                      ) : (
                        <Mic className="w-9 h-9 relative z-10" />
                      )}
                    </button>
                    <p className="text-muted-foreground text-sm font-medium">
                      {finalizingSpeaking ? "Transcribing…" : recording ? "Tap to stop" : "Tap to speak"}
                    </p>
                    {recording && sttSupported && (
                      <p className="max-w-sm mx-auto text-sm text-foreground/70 italic min-h-[1.5rem]">
                        {sttTranscript}
                        {sttInterim && <span className="text-muted-foreground"> {sttInterim}</span>}
                        {!sttTranscript && !sttInterim && "Listening…"}
                      </p>
                    )}
                    {recording && !sttSupported && (
                      <p className="max-w-sm mx-auto text-xs text-muted-foreground">
                        Your browser can't transcribe speech, but your response will still be recorded.
                      </p>
                    )}
                    {sttError && <p className="text-xs text-destructive">{sttError}</p>}
                  </div>
                </div>
              )}

              {/* ── WRITING question ──────────────────────────────────────── */}
              {type === "writing" && (
                <div className="space-y-5">
                  <h3 className="text-[18px] font-bold text-foreground leading-snug">{data.prompt}</h3>

                  {/* Word bank — tappable chips that insert into the textarea */}
                  {Array.isArray(data.wordBank ?? data.word_bank) && (data.wordBank ?? data.word_bank)!.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Word Bank</p>
                      <div className="flex flex-wrap gap-2">
                        {(data.wordBank ?? data.word_bank)!.map((word: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setWritingText((prev: string) =>
                                prev ? `${prev.trimEnd()} ${word}` : word
                              )
                            }
                            className="px-3 py-1.5 rounded-full border-2 border-achieve-purple/40 bg-achieve-purple/5 text-achieve-purple text-sm font-bold hover:bg-achieve-purple/15 hover:border-achieve-purple transition-all active:scale-95"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentence frame starter */}
                  {(data.sentenceFrame ?? data.sentence_frame) && (
                    <div className="rounded-xl border-2 border-dashed border-achieve-purple/30 bg-achieve-purple/5 px-4 py-3 flex items-start gap-3">
                      <span className="text-achieve-purple font-black text-xs uppercase tracking-widest mt-0.5 shrink-0">Start here</span>
                      <button
                        type="button"
                        className="text-achieve-purple font-semibold text-sm text-left hover:underline"
                        onClick={() =>
                          setWritingText((prev: string) =>
                            prev ? prev : (data.sentenceFrame ?? data.sentence_frame ?? "")
                          )
                        }
                      >
                        {data.sentenceFrame ?? data.sentence_frame}
                      </button>
                    </div>
                  )}

                  <Textarea
                    value={writingText}
                    onChange={e => setWritingText(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[180px] text-base p-4 resize-none rounded-xl border-border/60 focus:border-achieve-purple/60 bg-card/60"
                  />
                  <Button
                    className="w-full h-12 text-base font-semibold bg-achieve-purple hover:bg-achieve-purple/90 text-white rounded-xl shadow-sm"
                    onClick={() => onSubmitWriting(writingText)}
                    disabled={writingText.length < 5}
                  >
                    Submit Writing
                  </Button>
                </div>
              )}

              {/* Feedback — slides in below question */}
              <SessionFeedbackBar />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
