import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Mic, Square, Volume2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OptionVisual, StemVisual } from "@/components/shape-glyph";
import { LoadingScreen } from "@/components/loading-screen";

type SessionState = "loading" | "error" | "active" | "finishing";

export default function Session() {
  const { domain } = useParams<{ domain: string }>();
  const { studentId } = useAuth();
  const { request } = useApi();
  const [, setLocation] = useLocation();

  const [state, setState] = useState<SessionState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [session, setSession] = useState<any>(null);

  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const [writingText, setWritingText] = useState("");
  const [recording, setRecording] = useState(false);

  // State for non-MC reading question types
  const [seqSelection, setSeqSelection] = useState<number[]>([]);       // sequence_order: tap-to-order
  const [matchLeft, setMatchLeft]       = useState<number | null>(null); // match_columns: selected left idx
  const [matchPairs, setMatchPairs]     = useState<[number,number][]>([]);
  const [classifyMap, setClassifyMap]   = useState<Record<number,number>>({}); // classify: item→category

  // Reset interactive state when question changes
  const prevQIdx = useRef(qIdx);
  if (prevQIdx.current !== qIdx) {
    prevQIdx.current = qIdx;
    // resets happen in the handlers below via key prop on motion.div
  }

  const fetchedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (!studentId || !domain) return;

    setState("loading");
    try {
      const data = await request(`/api/students/${studentId}/sessions/start`, {
        method: "POST",
        body: JSON.stringify({ domain, sessionType: "single" }),
      });
      setSession(data);
      setState("active");
    } catch (err) {
      console.error("Failed to start session:", err);
      setErrorMsg(extractErrorMessage(err, "Failed to load session. Please try again."));
      setState("error");
    }
  }, [studentId, domain, request]);

  useEffect(() => {
    if (!studentId) {
      setLocation("/home");
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    startSession();
  }, [studentId, domain, startSession, setLocation]);

  const completeSession = async () => {
    if (!session) return;
    setState("finishing");

    const correctCount = answers.filter(a => a.correct).length;
    const total = session.content?.data?.questions?.length || 1;
    const scorePct = total > 0 ? (correctCount / total) * 100 : 80;

    try {
      const questions = session.content?.data?.questions || [];
      const payloadAnswers = (questions.length > 0 ? questions : [session.content?.data]).map(
        (q: Record<string, unknown> | undefined, i: number) => ({
          question: String(q?.question ?? q?.prompt ?? ""),
          content: q && typeof q === "object" ? q : undefined,
          submittedAnswer: answers[i],
          correct: Boolean(answers[i]?.correct),
        }),
      );
      const result = await request(
        `/api/students/${studentId}/sessions/${session.sessionId}/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            scorePct,
            durationSeconds: 600,
            weakTypes: [],
            answers: payloadAnswers,
          }),
        },
      );
      localStorage.setItem("lastSessionResult", JSON.stringify(result));
      setLocation("/session/complete");
    } catch (err) {
      console.error("Failed to complete session:", err);
      setLocation("/session/complete");
    }
  };

  if (state === "loading") {
    return <LoadingScreen message={`Preparing ${domain}`} />;
  }

  if (state === "error") {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-background gap-6 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-bold text-lg max-w-sm">{errorMsg}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setLocation("/home")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => { fetchedRef.current = false; startSession(); }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (state === "finishing") {
    return <LoadingScreen message="Reviewing your answers" />;
  }

  const content = session?.content;
  const type = content?.type;
  const data = content?.data;
  const questions = data?.questions || [];
  const currentQ = questions[qIdx];
  const progressPct = questions.length > 0 ? (qIdx / questions.length) * 100 : 0;


  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedIdx(idx);

    const correct = currentQ.correct === idx;
    setLastCorrect(correct);
    setShowFeedback(true);
    setAnswers(prev => [...prev, { correct }]);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedIdx(-1);
    setSeqSelection([]);
    setMatchLeft(null);
    setMatchPairs([]);
    setClassifyMap({});
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      completeSession();
    }
  };

  // Evaluate non-MC reading answers on submit
  const handleReadingNonMCSubmit = () => {
    if (showFeedback) return;
    const q = currentQ as any;
    let correct = false;

    if (q.type === "sequence_order") {
      // seqSelection[pos] = item index student placed at that position
      // correct_order[itemIdx] = correct position for that item
      // derive correct seqSelection: for each position 0..n-1, find which item goes there
      const n = (q.items || []).length;
      const correctSeq: number[] = Array(n);
      (q.correct_order as number[]).forEach((pos: number, itemIdx: number) => {
        correctSeq[pos] = itemIdx;
      });
      correct = seqSelection.length === n && seqSelection.every((itemIdx, pos) => correctSeq[pos] === itemIdx);
    } else if (q.type === "match_columns") {
      const cp: [number,number][] = q.correct_pairs || [];
      correct = matchPairs.length === cp.length &&
        cp.every(([l, r]: [number, number]) => matchPairs.some(([pl, pr]) => pl === l && pr === r));
    } else if (q.type === "classify") {
      const items: string[] = q.items || [];
      correct = items.every((_: string, i: number) => classifyMap[i] === (q.correct as number[])[i]);
    }

    setLastCorrect(correct);
    setShowFeedback(true);
    setAnswers(prev => [...prev, { correct }]);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background flex flex-col">
      <div className="p-4 bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <span className="uppercase tracking-widest text-xs font-black text-muted-foreground">{domain}</span>
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="text-xs font-bold text-muted-foreground">{qIdx + 1}/{questions.length || 1}</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`q-${qIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Illustration image — shown when the API found a matching library image for this topic */}
            {(data?.illustrationUrl || data?.visual) && (
              <div className="space-y-3">
                {data.illustrationUrl && (
                  <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm">
                    <img
                      src={data.illustrationUrl}
                      alt="Story illustration"
                      className="w-full block"
                    />
                  </div>
                )}
                {!data.illustrationUrl && <StemVisual visual={data.visual} />}
              </div>
            )}
            {type === "reading" && data?.passage && (
              <div className="bg-energy-orange/5 border border-energy-orange/20 rounded-2xl p-5">
                <p className="text-foreground leading-relaxed text-[15px]">{data.passage}</p>
              </div>
            )}

            {type === "listening" && data?.audioScript && (
              <div className="bg-trust-blue/5 border border-trust-blue/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-trust-blue font-bold text-sm">
                  <Volume2 className="w-5 h-5" />
                  <span>Listen to this passage:</span>
                </div>
                <p className="text-foreground leading-relaxed text-[15px] italic">"{data.audioScript}"</p>
              </div>
            )}

            {/* Image grid for listening image_grid questions */}
            {type === "listening" && currentQ?.type === "image_grid" && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-foreground">{currentQ.question}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(currentQ.options || []).map((opt: string, i: number) => {
                    const imgSrc: string = (currentQ as { imageUrls?: string[] }).imageUrls?.[i] ?? "";
                    const PLACEHOLDER_COLORS = ["bg-sky-100","bg-rose-100","bg-amber-100","bg-emerald-100"];
                    let ring = "border-border hover:border-primary/60";
                    if (showFeedback) {
                      if (i === currentQ.correct) ring = "border-growth-green ring-4 ring-growth-green";
                      else if (i === selectedIdx) ring = "border-destructive ring-4 ring-destructive opacity-60";
                      else ring = "border-border opacity-40";
                    } else if (selectedIdx === i) {
                      ring = "border-primary ring-4 ring-primary";
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={showFeedback}
                        className={`relative rounded-2xl border-2 overflow-hidden transition-all ${ring}`}
                      >
                        {/* Placeholder so the cell always has visible height */}
                        <div className={`w-full aspect-square ${PLACEHOLDER_COLORS[i]} flex items-center justify-center`}>
                          <span className="text-sm font-black opacity-40">{["A","B","C"][i]}</span>
                        </div>
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt={opt}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-black">
                          {["A","B","C"][i]}
                        </div>
                        {showFeedback && (i === currentQ.correct || i === selectedIdx) && (
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black ${i === currentQ.correct ? "bg-growth-green" : "bg-destructive"}`}>
                            {i === currentQ.correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[11px] font-bold py-1.5 text-center leading-tight px-1">
                          {opt}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Reading questions — dispatched by question type ── */}
            {type === "reading" && currentQ && (() => {
              const q = currentQ as any;

              // ── multiple_choice (default) ──────────────────────────────────
              if (!q.type || q.type === "multiple_choice") {
                return (
                  <div className="space-y-4">
                    <StemVisual visual={q.visual} />
                    <h3 className="text-xl font-black text-foreground">{q.question}</h3>
                    <div className="space-y-2.5">
                      {(q.options || []).map((opt: string, i: number) => {
                        let style = "border-border hover:border-primary bg-card";
                        if (showFeedback) {
                          if (i === q.correct) style = "border-growth-green bg-growth-green/10 text-growth-green";
                          else if (i === selectedIdx && !lastCorrect) style = "border-destructive bg-destructive/10 text-destructive";
                        }
                        return (
                          <button key={i} onClick={() => handleAnswer(i)} disabled={showFeedback}
                            className={`w-full text-left px-5 py-3.5 rounded-xl border-2 font-bold transition-all ${style}`}>
                            <span className="text-sm"><OptionVisual label={opt} diagram={q.optionDiagrams?.[i]} /></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // ── sequence_order ─────────────────────────────────────────────
              if (q.type === "sequence_order") {
                const items: string[] = q.items || [];
                const unselected = items.filter((_: string, i: number) => !seqSelection.includes(i));
                return (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-foreground">{q.question}</h3>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Tap items in order — first to last</p>
                    {/* Student's ordered sequence so far */}
                    {seqSelection.length > 0 && (
                      <div className="space-y-2">
                        {seqSelection.map((itemIdx: number, pos: number) => {
                          const n = items.length;
                          const correctSeq: number[] = Array(n);
                          (q.correct_order as number[]).forEach((p: number, ii: number) => { correctSeq[p] = ii; });
                          const itemCorrect = showFeedback && correctSeq[pos] === itemIdx;
                          const itemWrong   = showFeedback && correctSeq[pos] !== itemIdx;
                          return (
                            <div key={pos} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all
                              ${itemCorrect ? "border-growth-green bg-growth-green/10 text-growth-green"
                              : itemWrong   ? "border-destructive bg-destructive/10 text-destructive"
                              :               "border-primary/40 bg-primary/5"}`}>
                              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shrink-0">{pos + 1}</span>
                              {items[itemIdx]}
                              {!showFeedback && (
                                <button onClick={() => setSeqSelection(prev => prev.filter((_, pi) => pi !== pos))}
                                  className="ml-auto text-muted-foreground hover:text-destructive text-xs">Remove</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Remaining unselected items */}
                    {!showFeedback && unselected.length > 0 && (
                      <div className="space-y-2">
                        {items.map((item: string, i: number) => seqSelection.includes(i) ? null : (
                          <button key={i} onClick={() => setSeqSelection(prev => [...prev, i])}
                            className="w-full text-left px-4 py-2.5 rounded-xl border-2 border-border hover:border-primary bg-card font-semibold text-sm transition-all">
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                    {!showFeedback && seqSelection.length === items.length && (
                      <Button onClick={handleReadingNonMCSubmit} className="w-full h-12 font-bold bg-energy-orange hover:bg-energy-orange/90 text-white rounded-xl">
                        Check Order
                      </Button>
                    )}
                  </div>
                );
              }

              // ── match_columns ──────────────────────────────────────────────
              if (q.type === "match_columns") {
                const left: string[]  = q.left  || [];
                const right: string[] = q.right || [];
                const cp: [number,number][] = q.correct_pairs || [];
                return (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-foreground">{q.question}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-wide text-muted-foreground text-center">Left</p>
                        {left.map((item: string, i: number) => {
                          const paired = matchPairs.find(([l]) => l === i);
                          const isSelected = matchLeft === i;
                          const pairCorrect = showFeedback && paired && cp.some(([cl, cr]) => cl === i && cr === paired[1]);
                          const pairWrong   = showFeedback && paired && !cp.some(([cl, cr]) => cl === i && cr === paired[1]);
                          return (
                            <button key={i} disabled={showFeedback || !!paired}
                              onClick={() => setMatchLeft(isSelected ? null : i)}
                              className={`w-full text-center px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                                ${pairCorrect ? "border-growth-green bg-growth-green/10 text-growth-green"
                                : pairWrong   ? "border-destructive bg-destructive/10 text-destructive"
                                : isSelected  ? "border-primary bg-primary/10 ring-2 ring-primary"
                                : paired      ? "border-achieve-purple/40 bg-achieve-purple/5 opacity-60"
                                :               "border-border hover:border-primary bg-card"}`}>
                              {item}
                              {paired && !showFeedback && <span className="ml-1 text-xs text-achieve-purple">→ {right[paired[1]]}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-wide text-muted-foreground text-center">Right</p>
                        {right.map((item: string, i: number) => {
                          const paired = matchPairs.find(([, r]) => r === i);
                          const pairCorrect = showFeedback && paired && cp.some(([cl, cr]) => cl === paired[0] && cr === i);
                          const pairWrong   = showFeedback && paired && !cp.some(([cl, cr]) => cl === paired[0] && cr === i);
                          return (
                            <button key={i} disabled={showFeedback || !!paired || matchLeft === null}
                              onClick={() => {
                                if (matchLeft === null || paired) return;
                                setMatchPairs(prev => [...prev, [matchLeft, i]]);
                                setMatchLeft(null);
                              }}
                              className={`w-full text-center px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                                ${pairCorrect ? "border-growth-green bg-growth-green/10 text-growth-green"
                                : pairWrong   ? "border-destructive bg-destructive/10 text-destructive"
                                : paired      ? "border-achieve-purple/40 bg-achieve-purple/5 opacity-60"
                                : matchLeft !== null ? "border-dashed border-primary/60 hover:border-primary hover:bg-primary/5 bg-card"
                                :               "border-border bg-card opacity-50"}`}>
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {!showFeedback && matchPairs.length === left.length && (
                      <Button onClick={handleReadingNonMCSubmit} className="w-full h-12 font-bold bg-energy-orange hover:bg-energy-orange/90 text-white rounded-xl">
                        Check Matches
                      </Button>
                    )}
                  </div>
                );
              }

              // ── classify ───────────────────────────────────────────────────
              if (q.type === "classify") {
                const categories: string[] = q.categories || [];
                const items: string[]      = q.items      || [];
                const correct: number[]    = q.correct    || [];
                const allAssigned = items.every((_: string, i: number) => classifyMap[i] !== undefined);
                return (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-foreground">{q.question}</h3>
                    <div className="space-y-3">
                      {items.map((item: string, i: number) => {
                        const assigned = classifyMap[i];
                        const isCorrect = showFeedback && assigned === correct[i];
                        const isWrong   = showFeedback && assigned !== undefined && assigned !== correct[i];
                        return (
                          <div key={i} className={`rounded-xl border-2 p-3 transition-all
                            ${isCorrect ? "border-growth-green bg-growth-green/5"
                            : isWrong   ? "border-destructive bg-destructive/5"
                            :             "border-border bg-card"}`}>
                            <p className="text-sm font-semibold text-foreground mb-2">{item}</p>
                            <div className="flex gap-2 flex-wrap">
                              {categories.map((cat: string, ci: number) => (
                                <button key={ci} disabled={showFeedback}
                                  onClick={() => setClassifyMap(prev => ({ ...prev, [i]: ci }))}
                                  className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all
                                    ${showFeedback && ci === correct[i]             ? "border-growth-green bg-growth-green text-white"
                                    : showFeedback && assigned === ci && ci !== correct[i] ? "border-destructive bg-destructive text-white"
                                    : assigned === ci ? "border-primary bg-primary text-primary-foreground"
                                    :                   "border-border hover:border-primary bg-background"}`}>
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!showFeedback && allAssigned && (
                      <Button onClick={handleReadingNonMCSubmit} className="w-full h-12 font-bold bg-energy-orange hover:bg-energy-orange/90 text-white rounded-xl">
                        Check Answers
                      </Button>
                    )}
                  </div>
                );
              }

              return null;
            })()}

            {/* ── Listening questions — always multiple choice ── */}
            {type === "listening" && currentQ && currentQ.type !== "image_grid" && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-foreground">{currentQ.question}</h3>
                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt: string, i: number) => {
                    let style = "border-border hover:border-primary bg-card";
                    if (showFeedback) {
                      if (i === currentQ.correct) style = "border-growth-green bg-growth-green/10 text-growth-green";
                      else if (i === selectedIdx && !lastCorrect) style = "border-destructive bg-destructive/10 text-destructive";
                    }
                    return (
                      <button key={i} onClick={() => handleAnswer(i)} disabled={showFeedback}
                        className={`w-full text-left px-5 py-3.5 rounded-xl border-2 font-bold transition-all ${style}`}>
                        <span className="text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {type === "speaking" && (
              <div className="space-y-8 text-center py-8">
                <StemVisual visual={data?.visual} />
                <h3 className="text-2xl font-black text-foreground">{data?.prompt}</h3>
                {data?.scaffold && (
                  <p className="text-muted-foreground text-lg italic">Try starting with: "{data.scaffold}"</p>
                )}
                <div className="flex flex-col items-center gap-4">
                  <button
                    className={`rounded-full h-24 w-24 flex items-center justify-center text-white shadow-lg transition-all ${recording ? "bg-destructive animate-pulse scale-110" : "bg-growth-green hover:scale-105"}`}
                    onClick={() => {
                      if (recording) {
                        setRecording(false);
                        setAnswers([{ correct: true }]);
                        completeSession();
                      } else {
                        setRecording(true);
                      }
                    }}
                  >
                    {recording ? <Square className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                  </button>
                  <p className="text-muted-foreground font-bold text-sm">{recording ? "Tap to stop" : "Tap to start speaking"}</p>
                </div>
              </div>
            )}

            {type === "writing" && (
              <div className="space-y-5">
                <StemVisual visual={data?.visual} />
                {/* Task prompt */}
                <div className="bg-achieve-purple/5 border border-achieve-purple/20 rounded-2xl p-5">
                  <p className="text-foreground font-bold text-[15px] leading-relaxed">{data?.prompt}</p>
                </div>

                {/* Word bank — rendered as tappable chips */}
                {Array.isArray(data?.wordBank ?? data?.word_bank) && ((data?.wordBank ?? data?.word_bank) as string[]).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Word Bank</p>
                    <div className="flex flex-wrap gap-2">
                      {((data?.wordBank ?? data?.word_bank) as string[]).map((word: string, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setWritingText((prev) =>
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
                {(data?.sentenceFrame ?? data?.sentence_frame) && (
                  <div className="rounded-xl border-2 border-dashed border-achieve-purple/30 bg-achieve-purple/5 px-4 py-3 flex items-start gap-3">
                    <span className="text-achieve-purple font-black text-xs uppercase tracking-widest mt-0.5 shrink-0">Start here</span>
                    <button
                      type="button"
                      className="text-achieve-purple font-semibold text-sm text-left hover:underline"
                      onClick={() =>
                        setWritingText((prev) =>
                          prev ? prev : ((data?.sentenceFrame ?? data?.sentence_frame) as string)
                        )
                      }
                    >
                      {(data?.sentenceFrame ?? data?.sentence_frame) as string}
                    </button>
                  </div>
                )}

                {/* Writing textarea */}
                <Textarea
                  value={writingText}
                  onChange={(e) => setWritingText(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-[180px] text-base p-4 resize-none rounded-xl"
                />

                <Button
                  className="w-full h-14 text-lg font-bold bg-achieve-purple hover:bg-achieve-purple/90 text-white rounded-xl"
                  onClick={() => {
                    setAnswers([{ correct: true }]);
                    completeSession();
                  }}
                  disabled={writingText.length < 5}
                >
                  Submit Writing
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className={`fixed bottom-0 left-0 right-0 p-5 border-t-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 ${lastCorrect ? "bg-growth-green/10 border-growth-green" : "bg-destructive/5 border-destructive"}`}
          >
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {lastCorrect ? (
                  <CheckCircle2 className="w-7 h-7 text-growth-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-7 h-7 text-destructive flex-shrink-0" />
                )}
                <div>
                  <p className={`text-lg font-black ${lastCorrect ? "text-growth-green" : "text-destructive"}`}>
                    {lastCorrect ? "Correct!" : "Not quite"}
                  </p>
                  {!lastCorrect && currentQ?.explanation && (
                    <p className="text-foreground text-sm font-medium mt-0.5">{currentQ.explanation}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleNext}
                className={`h-12 px-6 rounded-xl font-bold text-white ${lastCorrect ? "bg-growth-green hover:bg-growth-green/90" : "bg-destructive hover:bg-destructive/90"}`}
              >
                {qIdx < questions.length - 1 ? "Next" : "Finish"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
