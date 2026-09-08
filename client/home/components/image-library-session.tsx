/**
 * ImageLibrarySession
 *
 * Session view for image_library content (listening levels 0–2).
 * Azure TTS reads the passage aloud on mount (the passage names every target
 * object so the student hears the answer before being asked to tap it).
 * Then the student taps bounding boxes to answer each question.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, BookOpen, ImageIcon, Volume2, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { ItemCoachingCard, coachingSpeech, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";
import type { CropBox } from "./image-crop";

interface Detection {
  label: string;
  score: number;
  box: CropBox;
  points?: [number, number][];
}

interface ChoiceOption {
  label: string;
  box: CropBox;
  points?: [number, number][];
  isCorrect: boolean;
}

export interface ImageObjectTapQ {
  id: string;
  type: "image_object_tap";
  question: string;
  targetLabel: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ImageYesNoQ {
  id: string;
  type: "image_yes_no";
  question: string;
  correctAnswer: "agree" | "disagree";
  targetLabel: string;
  explanation: string;
}

export type ImageLibraryQuestion = ImageObjectTapQ | ImageYesNoQ;

export interface ImageLibraryData {
  topic: string;
  passage: string;
  imageUrl: string | null;
  tags: string[];
  imageDescription?: string | null;
  detectionResults: { detections: Detection[]; model: string } | null;
  questions: ImageLibraryQuestion[];
  /**
   * "text_choice" — academic vision sessions: 4 labelled text buttons below image,
   *                 no bounding boxes overlaid (DINO boxes don't cover concept labels).
   * "box_tap"     — general sessions: bounding boxes overlaid on image (default).
   */
  tapMode?: "text_choice" | "box_tap";
  keyUse?: string;
}

interface AnswerRecord {
  question: string;
  content: unknown;
  submittedAnswer: unknown;
  correct: boolean;
}

function pictureQuestionText(q: ImageLibraryQuestion): string {
  return (q.question ?? "").trim();
}

interface Props {
  data: ImageLibraryData;
  onComplete: (answers: AnswerRecord[]) => void;
  speakPassage: (text: string) => void;
  speakFeedback: (text: string) => void;
  isLoadingTts: boolean;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  studentId?: string;
  level?: number;
}

// ── Choices builder ───────────────────────────────────────────────────────────

function buildLibraryChoices(
  detections: Detection[],
  targetLabel: string,
  labelsMatch: (a: string, b: string) => boolean,
): ChoiceOption[] {
  if (!detections.length) return [];

  // Best detection per label (highest score)
  const byLabel = new Map<string, Detection>();
  for (const d of detections) {
    const cur = byLabel.get(d.label);
    if (!cur || d.score > cur.score) byLabel.set(d.label, d);
  }

  // Correct detection — fuzzy match to targetLabel.
  // IMPORTANT: never fall back to a random detection when the target isn't found.
  // A wrong box marked isCorrect:true (e.g. osprey highlighted for "tap the plant")
  // is far worse than showing no boxes at all — the caller degrades to text-choice.
  let correctDet: Detection | undefined;
  for (const [lbl, det] of byLabel) {
    if (labelsMatch(lbl, targetLabel)) { correctDet = det; break; }
  }
  if (!correctDet) return []; // signal: no matching box — caller will use text-choice

  // Up to 2 wrong choices from other labels
  const wrong: Detection[] = [];
  for (const [lbl, det] of byLabel) {
    if (!labelsMatch(lbl, targetLabel) && wrong.length < 2) wrong.push(det);
  }
  // If still short, pull any non-target detection (different instances)
  if (wrong.length < 2) {
    for (const d of detections) {
      if (!labelsMatch(d.label, targetLabel) && wrong.length < 2 && !wrong.includes(d)) {
        wrong.push(d);
      }
    }
  }
  // Pad with the same wrong detection if only one available
  while (wrong.length < 2 && wrong.length > 0) wrong.push(wrong[0]);

  if (wrong.length < 2) return []; // can't build 3 distinct choices

  const choices: ChoiceOption[] = [
    { label: correctDet.label, box: correctDet.box, points: correctDet.points, isCorrect: true  },
    { label: wrong[0].label,   box: wrong[0].box,   points: wrong[0].points,   isCorrect: false },
    { label: wrong[1].label,   box: wrong[1].box,   points: wrong[1].points,   isCorrect: false },
  ];

  // Fisher-Yates shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

export function ImageLibrarySession({
  data,
  onComplete,
  speakPassage,
  speakFeedback,
  isLoadingTts,
  isSpeaking,
  stopSpeaking,
  studentId,
  level = 1,
}: Props) {
  const { request } = useApi();
  const [qIdx, setQIdx]                 = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [tappedLabel, setTappedLabel]   = useState<string | null>(null);
  const [yesNoAnswer, setYesNoAnswer]   = useState<"agree" | "disagree" | null>(null);
  const [answers, setAnswers]           = useState<AnswerRecord[]>([]);
  const [audioPlayed, setAudioPlayed]     = useState(false);
  const [audioStarted, setAudioStarted]   = useState(false);
  const [questionRecorded, setQuestionRecorded] = useState(false);
  const [isRetrying, setIsRetrying]       = useState(false);
  const [choices, setChoices]             = useState<ChoiceOption[]>([]);
  const [coach, setCoach]                 = useState<ItemFeedbackPayload | null>(null);
  const [coachLoading, setCoachLoading]   = useState(false);
  const spokenForQIdxRef = useRef(-1);
  const feedbackRef      = useRef<HTMLDivElement>(null);

  const { passage, imageUrl, detectionResults, questions, topic, tapMode = "box_tap", keyUse } = data;
  const isTextChoice = tapMode === "text_choice";
  const detections   = detectionResults?.detections ?? [];
  const currentQ     = questions[qIdx];
  const questionText = currentQ ? pictureQuestionText(currentQ) : "";
  const passageText = passage?.trim() || "Look at the picture below and listen carefully.";

  // Auto-play passage + question whenever the active question changes.
  // First question: reads the full passage then the question.
  // Subsequent questions: reads only the new question (passage already heard).
  useEffect(() => {
    if (spokenForQIdxRef.current === qIdx) return;
    spokenForQIdxRef.current = qIdx;

    // Reset the tap-gate so the student must wait for this question's audio
    setAudioPlayed(false);
    setAudioStarted(false);

    const narration = qIdx === 0
      ? `${passageText}... ${questionText}`
      : questionText;

    speakPassage(narration);
    // Small delay so isSpeaking/isLoadingTts have time to flip before the
    // unlock watcher checks them
    const t = setTimeout(() => setAudioStarted(true), 300);

    // Build fresh choices for each object-tap question (box_tap mode only)
    if (currentQ.type === "image_object_tap" && !isTextChoice) {
      setChoices(buildLibraryChoices(detections, currentQ.targetLabel, labelsMatch));
    }

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx]);

  // Hard timeout — unlock after 5 s regardless of TTS state (covers network / no-audio)
  useEffect(() => {
    const t = setTimeout(() => setAudioPlayed(true), 5000);
    return () => clearTimeout(t);
  }, [qIdx]);

  // Unlock as soon as audio actually finishes (only after it started loading)
  useEffect(() => {
    if (audioStarted && !isSpeaking && !isLoadingTts) {
      setAudioPlayed(true);
    }
  }, [audioStarted, isSpeaking, isLoadingTts]);

  // Scroll the feedback + action buttons into view when they appear so the
  // student always sees "Try Again" on mobile without having to scroll.
  useEffect(() => {
    if (showFeedback && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [showFeedback]);

  // Students can only tap once they've heard (or the 5s fallback elapsed).
  // isRetrying bypasses the gate — on retry the student can tap immediately.
  const audioActive = isLoadingTts || isSpeaking;
  const canTap      = isRetrying || (audioPlayed && !audioActive);

  /**
   * Normalize a label so that punctuation/spacing differences don't break
   * comparison.  Hyphens with surrounding spaces ("snow - capped mountain")
   * and bare hyphens ("snow-capped mountain") are treated identically;
   * runs of whitespace are collapsed.
   */
  function normLabel(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s*[-–—]\s*/g, " ") // "snow - capped" → "snow capped"
      .replace(/\s+/g, " ")          // collapse multiple spaces
      .trim();
  }

  /**
   * Fuzzy label match — "black umbrella" ↔ "umbrella" both count.
   * Handles cases where DINO emits a more-specific or differently-punctuated
   * label than what Claude chose as the target (or vice-versa).
   */
  function labelsMatch(a: string, b: string): boolean {
    const na = normLabel(a);
    const nb = normLabel(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  }

  const itemIsCorrect = currentQ
    ? currentQ.type === "image_yes_no"
      ? yesNoAnswer === currentQ.correctAnswer
      : tappedLabel !== null && labelsMatch(tappedLabel, currentQ.targetLabel)
    : false;

  const tagKey = (data.tags ?? []).join("|");
  const currentQuestionKey = currentQ
    ? `${currentQ.type}:${questionText}:${"targetLabel" in currentQ ? currentQ.targetLabel : ""}`
    : "";

  useEffect(() => {
    if (!showFeedback || !studentId || !currentQ) {
      setCoachLoading(false);
      return;
    }
    const studentAnswer =
      currentQ.type === "image_yes_no" ? (yesNoAnswer ?? "") : (tappedLabel ?? "");
    const correctAnswer =
      currentQ.type === "image_yes_no" ? currentQ.correctAnswer : currentQ.targetLabel;
    let cancelled = false;
    setCoach(null);
    setCoachLoading(true);
    request<ItemFeedbackPayload>(`/api/students/${studentId}/item-feedback`, {
      method: "POST",
      body: JSON.stringify({
        domain: "listening",
        level,
        format: "picture",
        question: questionText,
        studentAnswer,
        correctAnswer,
        correct: itemIsCorrect,
        passage: passageText,
        imageDescription: data.imageDescription || undefined,
        imageTags: data.tags,
        targetObject: currentQ.targetLabel || undefined,
        options: currentQ.type === "image_object_tap" ? currentQ.options : undefined,
      }),
    })
      .then((payload) => {
        if (!cancelled) setCoach(payload);
      })
      .catch(() => {
        if (!cancelled) setCoach(null);
      })
      .finally(() => {
        if (!cancelled) setCoachLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showFeedback, itemIsCorrect, studentId, currentQuestionKey, questionText, yesNoAnswer, tappedLabel, level, passageText, request, data.imageDescription, tagKey]);

  function handleReplay() {
    stopSpeaking();
    setAudioStarted(false);
    setAudioPlayed(false);
    setTimeout(() => {
      // Replay: always read passage + current question together
      speakPassage(`${passageText}... ${questionText}`);
      setTimeout(() => setAudioStarted(true), 300);
    }, 100);
  }

  function handleBoxTap(label: string) {
    if (showFeedback || !currentQ || !canTap) return;
    const correct = labelsMatch(label, currentQ.targetLabel);
    setTappedLabel(label);
    setShowFeedback(true);
    setCoachLoading(true);
    setIsRetrying(false);
    if (!questionRecorded) {
      setQuestionRecorded(true);
      setAnswers((prev) => [
        ...prev,
        { question: questionText, content: currentQ, submittedAnswer: label, correct },
      ]);
    }
  }

  /** Text-choice mode: student taps one of the four labelled option buttons. */
  function handleTextChoiceTap(option: string) {
    if (showFeedback || !currentQ || !canTap) return;
    if (currentQ.type !== "image_object_tap") return;
    const correct = labelsMatch(option, currentQ.targetLabel);
    setTappedLabel(option);
    setShowFeedback(true);
    setCoachLoading(true);
    setIsRetrying(false);
    if (!questionRecorded) {
      setQuestionRecorded(true);
      setAnswers((prev) => [
        ...prev,
        { question: questionText, content: currentQ, submittedAnswer: option, correct },
      ]);
    }
  }

  function handleYesNoAnswer(choice: "agree" | "disagree") {
    if (showFeedback || !currentQ || !canTap) return;
    if (currentQ.type !== "image_yes_no") return;
    const correct = choice === currentQ.correctAnswer;
    setYesNoAnswer(choice);
    setShowFeedback(true);
    setCoachLoading(true);
    setIsRetrying(false);
    if (!questionRecorded) {
      setQuestionRecorded(true);
      setAnswers((prev) => [
        ...prev,
        { question: questionText, content: currentQ, submittedAnswer: choice, correct },
      ]);
    }
  }

  function handleNext() {
    stopSpeaking();                 // stop current audio before advancing
    setQuestionRecorded(false);
    setIsRetrying(false);
    setCoach(null);
    setCoachLoading(false);
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
      setShowFeedback(false);
      setTappedLabel(null);
      setYesNoAnswer(null);
    } else {
      onComplete(answers);
    }
  }

  function handleTryAgain() {
    // Remove the recorded wrong answer so the retry can overwrite it.
    setAnswers((prev) => prev.slice(0, -1));
    setQuestionRecorded(false);
    setShowFeedback(false);
    setTappedLabel(null);
    setYesNoAnswer(null);
    setCoach(null);
    setCoachLoading(false);
    // Bypass the audio gate entirely — no auto-replay, tap immediately.
    // The passage is still visible; the Replay button lets them re-listen manually.
    stopSpeaking();
    setIsRetrying(true);
  }

  if (!currentQ) return null;

  const isCorrect = showFeedback && (
    currentQ.type === "image_yes_no"
      ? yesNoAnswer === currentQ.correctAnswer
      : tappedLabel !== null && labelsMatch(tappedLabel, currentQ.targetLabel)
  );
  const passed = aiItemPassed(coach, isCorrect);
  const waitingCoach = showFeedback && coachLoading;
  const nextAction = waitingCoach ? undefined : passed ? "next" as const : "retry" as const;

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto px-4 sm:px-6 py-6 pb-8">

      {/* Domain badge + progress */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ color: "hsl(338 100% 65%)", background: "hsl(338 100% 65% / .12)" }}
        >
          Listening{keyUse ? ` · ${keyUse}` : ""}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {qIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Passage card — shows TTS state; passage names every answer */}
      <div className={`rounded-2xl border bg-card px-4 py-3 flex gap-3 items-start transition-colors duration-300 ${
        audioActive ? "border-rose-400/60 bg-rose-50/60 dark:bg-rose-950/20" : "border-border"
      }`}>
        <BookOpen className={`w-4 h-4 mt-0.5 shrink-0 ${audioActive ? "text-rose-400" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{passageText}</p>
          <div className="flex items-center gap-2 mt-2">
            {audioActive ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                {isLoadingTts
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading audio…</>
                  : <><Volume2 className="w-3.5 h-3.5 animate-pulse" /> Listening…</>}
              </span>
            ) : (
              <button
                onClick={handleReplay}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* "Listen first" hint while audio is playing */}
      {audioActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs font-semibold text-muted-foreground"
        >
          {currentQ?.type === "image_yes_no"
            ? "Listen to the story — then agree or disagree"
            : isTextChoice
              ? "Listen to the story — then choose the correct answer"
              : "Listen to the story — then tap the correct object"}
        </motion.p>
      )}

      {/* Scene image — boxes overlaid only in box_tap mode */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border/40 bg-muted/20 select-none">
        {imageUrl ? (
          <img src={imageUrl} alt={topic} className="w-full block" draggable={false} />
        ) : (
          <div className="w-full aspect-video flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-30" />
            <p className="text-xs">Image unavailable</p>
          </div>
        )}

        {/* Bounding-box choices — only in box_tap mode */}
        {!isTextChoice && currentQ.type === "image_object_tap" && imageUrl && (() => {
          // Sort largest → smallest so smaller boxes render last (on top) and
          // always win pointer events when boxes overlap.
          const PALETTE = [
            { border: "#3B82F6", fill: "rgba(59,130,246,0.18)", badge: "#1D4ED8" },
            { border: "#F59E0B", fill: "rgba(245,158,11,0.18)",  badge: "#92400E" },
            { border: "#8B5CF6", fill: "rgba(139,92,246,0.18)", badge: "#5B21B6" },
          ];
          // Annotate each choice with its original palette index before sorting
          const annotated = choices.map((choice, i) => ({ choice, paletteIdx: i }));
          annotated.sort(
            (a, b) =>
              b.choice.box.width * b.choice.box.height -
              a.choice.box.width * a.choice.box.height,
          );

          return annotated.map(({ choice, paletteIdx: i }, renderOrder) => {
          const isTapped = tappedLabel !== null && labelsMatch(choice.label, tappedLabel);
          const isTarget = choice.isCorrect;

          let { border, fill, badge } = PALETTE[i % PALETTE.length];

          // Boxes are always visible — students need to see them WHILE listening.
          // During audio: slightly dimmed but fully visible. After audio: full brightness.
          let boxOpacity = audioActive ? 0.75 : 1;

          if (showFeedback) {
            if (isTarget)      { border = "#16A34A"; fill = "rgba(22,163,74,0.25)";  badge = "#14532D"; }
            else if (isTapped) { border = "#EF4444"; fill = "rgba(239,68,68,0.25)";  badge = "#7F1D1D"; }
            else               { boxOpacity = 0.35; }
          }

          const interactive = canTap && !showFeedback;

          // Enforce minimum tap size: grow boxes smaller than 18% wide or 14% tall
          // so they're always finger-tappable (DINO can return tiny person-sized boxes).
          const raw = choice.box;
          const minW = 0.18, minH = 0.14;
          const w = Math.max(raw.width,  minW);
          const h = Math.max(raw.height, minH);
          // Centre-expand: keep the centre point, grow outward, clamp to [0,1]
          const cx = raw.x + raw.width  / 2;
          const cy = raw.y + raw.height / 2;
          const x  = Math.max(0, Math.min(1 - w, cx - w / 2));
          const y  = Math.max(0, Math.min(1 - h, cy - h / 2));

          // Polygon clip-path: express each vertex as a percentage of the button bounds
          const clipPath = choice.points && choice.points.length >= 3
            ? "polygon(" + choice.points.map(([px, py]) =>
                `${((px - x) / w * 100).toFixed(1)}% ${((py - y) / h * 100).toFixed(1)}%`
              ).join(", ") + ")"
            : undefined;

          return (
            <motion.button
              key={i}
              disabled={!interactive}
              onClick={() => handleBoxTap(choice.label)}
              animate={{ opacity: boxOpacity }}
              whileTap={{ scale: interactive ? 0.96 : 1 }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{
                left:            `${x * 100}%`,
                top:             `${y * 100}%`,
                width:           `${w * 100}%`,
                height:          `${h * 100}%`,
                border:          clipPath ? "none" : `3px solid ${border}`,
                borderRadius:    clipPath ? 0 : 10,
                backgroundColor: fill,
                cursor:          interactive ? "pointer" : "default",
                boxShadow:       clipPath ? undefined : `0 0 0 2px ${border}55, 0 2px 8px ${border}33`,
                // drop-shadow follows the clip-path outline for polygon shapes
                filter:          clipPath ? `drop-shadow(0 0 4px ${border}) drop-shadow(0 0 8px ${border}55)` : undefined,
                clipPath,
                // Smaller boxes (rendered later) get a higher z-index so they
                // always intercept taps even when partially covered by a larger box.
                zIndex:          renderOrder + 1,
              }}
            >
              <AnimatePresence>
                {showFeedback && (isTarget || isTapped) && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute top-1 right-1"
                  >
                    {isTarget
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 bg-white rounded-full drop-shadow" />
                      : <XCircle      className="w-5 h-5 text-red-500   bg-white rounded-full drop-shadow" />}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        });
        })()}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div key={qIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-muted/60 px-4 py-3"
        >
          <p className="text-base font-bold text-foreground leading-snug">{questionText}</p>
          {currentQ.type === "image_yes_no" && (
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Agree or disagree.
            </p>
          )}
          {currentQ.type !== "image_yes_no" && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {(isTextChoice || (currentQ.type === "image_object_tap" && choices.length === 0))
                ? "Choose the correct answer below"
                : "Tap the correct object in the image above"}
          </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Text-choice option buttons — shown when:
           a) academic vision sessions explicitly set tapMode="text_choice", OR
           b) box_tap mode but no DINO box matched the target label (safe degradation
              instead of silently marking a random wrong box as correct) */}
      {(isTextChoice || (!isTextChoice && currentQ.type === "image_object_tap" && choices.length === 0)) && currentQ.type === "image_object_tap" && !showFeedback && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-2.5"
        >
          {(currentQ.options ?? []).map((option, i) => {
            const interactive = canTap;
            return (
              <button
                key={i}
                onClick={() => handleTextChoiceTap(option)}
                disabled={!interactive}
                className="rounded-xl border-2 border-border bg-card px-3 py-3 text-sm font-semibold text-foreground text-left leading-snug transition-all hover:border-primary/60 hover:bg-primary/5 active:scale-[0.97] disabled:opacity-40"
              >
                {option}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Text-choice feedback state — show all options with correct/wrong highlights */}
      {isTextChoice && currentQ.type === "image_object_tap" && showFeedback && (
        <div className="grid grid-cols-2 gap-2.5">
          {(currentQ.options ?? []).map((option, i) => {
            const isTarget  = labelsMatch(option, currentQ.targetLabel);
            const wasTapped = tappedLabel !== null && labelsMatch(option, tappedLabel);
            const style = isTarget
              ? "border-green-500 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
              : wasTapped
                ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                : "border-border bg-muted/40 text-muted-foreground opacity-50";
            return (
              <div
                key={i}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold text-left leading-snug flex items-start gap-2 ${style}`}
              >
                {isTarget && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />}
                {!isTarget && wasTapped && <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
                <span>{option}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Agree / Disagree buttons — Argue key use */}
      {currentQ.type === "image_yes_no" && !showFeedback && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          {([
            { choice: "agree",    Icon: ThumbsUp,   label: "Agree",    style: "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/50" },
            { choice: "disagree", Icon: ThumbsDown,  label: "Disagree", style: "border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-900/50" },
          ] as const).map(({ choice, Icon, label, style }) => (
            <button
              key={choice}
              onClick={() => handleYesNoAnswer(choice)}
              disabled={!canTap}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 py-6 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-40 ${style}`}
            >
              <Icon className="w-8 h-8" />
              {label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Feedback banner — ref used to scroll into view on mobile */}
      {showFeedback && (
        <motion.div ref={feedbackRef} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 border text-sm font-medium ${
            coachLoading
              ? "bg-muted/40 border-border text-foreground"
              : passed
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
          }`}
        >
          <div className="space-y-2">
            <ItemCoachingCard
              feedback={coach}
              loading={coachLoading}
              speakText={speakFeedback}
              stopSpeaking={stopSpeaking}
              nextAction={nextAction}
            />
            {!coachLoading && !coachingSpeech(coach) && (
              passed ? (
                <p>Yes. You got it. {currentQ.explanation}</p>
              ) : (
                <p>
                  {currentQ.type === "image_yes_no"
                    ? `Not quite — the correct answer is "${currentQ.correctAnswer}". ${currentQ.explanation}`
                    : `Not quite — look at the picture again. ${currentQ.explanation}`}
                </p>
              )
            )}
          </div>
        </motion.div>
      )}

      {showFeedback && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <AnswerStepButtons
            loading={coachLoading}
            passed={passed}
            isLast={qIdx >= questions.length - 1}
            onAdvance={handleNext}
            onRetry={handleTryAgain}
          />
        </motion.div>
      )}
    </div>
  );
}
