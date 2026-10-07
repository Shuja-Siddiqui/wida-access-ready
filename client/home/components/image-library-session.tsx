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
import { CheckCircle2, XCircle, ImageIcon, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { useViewportPageLayout } from "@/components/app-layout";
import { ItemCoachingCard, coachingSpeech, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";
import { SessionTaskCard } from "./session-task-card";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { SessionWorkScroll } from "./session-work-scroll";
import { SessionQuestionBlock } from "./session-question-block";
import { SessionMcOptions } from "./session-mc-options";
import {
  SESSION_LABEL,
  SESSION_QUESTION,
  SESSION_THEMES,
} from "./session-ui-styles";
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
  /** When true, render tap UI (box or text choice). Set by API for L1–2 listening. */
  useTapMode?: boolean;
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
  framework?: Record<string, unknown>;
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
  speakTaskSession: (
    domain: "listening",
    data: Record<string, unknown>,
    options?: { question?: string },
  ) => void;
  speakQuestion: (question: string) => void;
  speakFeedback: (text: string) => void;
  isLoadingTts: boolean;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  studentId?: string;
  sessionId?: string;
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
  speakTaskSession,
  speakQuestion,
  speakFeedback,
  isLoadingTts,
  isSpeaking,
  stopSpeaking,
  studentId,
  sessionId,
  level = 1,
}: Props) {
  useViewportPageLayout();
  const { request } = useApi();
  const theme = SESSION_THEMES.listening;
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
  const spokenListenKeyRef = useRef<string | null>(null);
  const feedbackRef      = useRef<HTMLDivElement>(null);

  const { passage, imageUrl, detectionResults, questions, topic, tapMode = "box_tap", keyUse } = data;
  const isTextChoice = tapMode === "text_choice";
  const detections   = detectionResults?.detections ?? [];
  const currentQ     = questions[qIdx];
  const questionText = currentQ ? pictureQuestionText(currentQ) : "";
  const audioScript = (data as { audioScript?: string; audio_script?: string }).audioScript
    ?? (data as { audio_script?: string }).audio_script;
  const passageText =
    passage?.trim()
    || audioScript?.trim()
    || "Look at the picture below and listen carefully.";

  // Auto-play passage + question whenever the active question changes.
  // First question: reads the full passage then the question.
  // Subsequent questions: reads only the new question (passage already heard).
  useEffect(() => {
    const listenKey = `tap:${qIdx}`;
    if (spokenListenKeyRef.current === listenKey) return;

    // Reset the tap-gate so the student must wait for this question's audio
    setAudioPlayed(false);
    setAudioStarted(false);

    const taskPayload = {
      passage: passageText,
      keyUse,
      imageDescription: data.imageDescription,
      tags: data.tags,
    };

    spokenListenKeyRef.current = listenKey;

    if (qIdx === 0) {
      speakTaskSession("listening", taskPayload, { question: questionText });
    } else if (questionText) {
      speakQuestion(questionText);
    }
    // Small delay so isSpeaking/isLoadingTts have time to flip before the
    // unlock watcher checks them
    const t = setTimeout(() => setAudioStarted(true), 300);

    // Build fresh choices for each object-tap question (box_tap mode only)
    if (currentQ?.type === "image_object_tap" && !isTextChoice) {
      setChoices(buildLibraryChoices(detections, currentQ.targetLabel, labelsMatch));
    }

    return () => {
      clearTimeout(t);
      if (spokenListenKeyRef.current === listenKey) {
        spokenListenKeyRef.current = null;
      }
    };
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
        sessionId,
        domain: "listening",
        level,
        format: "picture",
        question: questionText,
        studentAnswer,
        correctAnswer,
        correct: itemIsCorrect,
        passage: passageText,
        framework: data.framework ?? undefined,
        keyUse: data.keyUse ?? undefined,
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
      const taskPayload = {
        passage: passageText,
        keyUse,
        imageDescription: data.imageDescription,
        tags: data.tags,
      };
      if (qIdx === 0) {
        speakTaskSession("listening", taskPayload, { question: questionText });
      } else if (questionText) {
        speakQuestion(questionText);
      }
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

  const listenHint = currentQ?.type === "image_yes_no"
    ? "Listen to the story — then agree or disagree"
    : isTextChoice
      ? "Listen to the story — then choose the correct answer"
      : "Listen to the story — then tap the correct object";

  const feedbackFooter = showFeedback ? (
    <div ref={feedbackRef} className="space-y-3">
      <ItemCoachingCard
        feedback={coach}
        loading={coachLoading}
        speakText={speakFeedback}
        stopSpeaking={stopSpeaking}
        nextAction={nextAction}
      />
      {!coachLoading && !coachingSpeech(coach) && (
        passed ? (
          <p className="text-xs text-muted-foreground">Yes. You got it. {currentQ.explanation}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {currentQ.type === "image_yes_no"
              ? `The correct answer is "${currentQ.correctAnswer}". ${currentQ.explanation}`
              : `Look at the picture again. ${currentQ.explanation}`}
          </p>
        )
      )}
      <AnswerStepButtons
        loading={coachLoading}
        passed={passed}
        isLast={qIdx >= questions.length - 1}
        onAdvance={handleNext}
        onRetry={handleTryAgain}
        domain="listening"
      />
    </div>
  ) : undefined;

  const tapImagePanel = (
    <div className="space-y-2">
      <p className={SESSION_LABEL}>Picture</p>
      <div className="relative w-full overflow-hidden rounded-xl bg-muted/20 select-none shrink-0 max-h-[min(52vh,28rem)] lg:max-h-[min(72vh,36rem)] lg:sticky lg:top-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={topic}
            className="w-full max-h-[inherit] object-contain block mx-auto"
            draggable={false}
          />
        ) : (
          <div className="w-full aspect-video flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-30" />
            <p className="text-xs">Image unavailable</p>
          </div>
        )}

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
    </div>
  );

  return (
    <div className="flex flex-1 min-h-0 w-full flex-col py-2 sm:py-3">
      <SessionResponsiveLayout
        domain="listening"
        referenceLabel="Picture"
        className="flex-1 min-h-0"
        referencePanel={tapImagePanel}
      >
        <SessionWorkScroll footer={feedbackFooter}>
          <SessionTaskCard
            domain="listening"
            data={{
              passage: passageText,
              keyUse,
              imageDescription: data.imageDescription,
              tags: data.tags,
            }}
            speakTaskSession={speakTaskSession}
            onListen={handleReplay}
            onStopSpeaking={stopSpeaking}
            speaking={isSpeaking}
          />

          {audioActive && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
              {listenHint}
            </motion.p>
          )}

          <SessionQuestionBlock index={qIdx}>
            <AnimatePresence mode="wait">
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <h3 className={SESSION_QUESTION}>{questionText}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentQ.type === "image_yes_no"
                    ? "Agree or disagree."
                    : (isTextChoice || (currentQ.type === "image_object_tap" && choices.length === 0))
                      ? "Choose the correct answer below"
                      : "Tap the correct object in the picture"}
                </p>
              </motion.div>
            </AnimatePresence>

            {(isTextChoice || (!isTextChoice && currentQ.type === "image_object_tap" && choices.length === 0))
              && currentQ.type === "image_object_tap"
              && !showFeedback && (
              <SessionMcOptions
                options={currentQ.options ?? []}
                correct={currentQ.correct}
                selectedIdx={-1}
                showFeedback={false}
                onSelect={(i) => handleTextChoiceTap((currentQ.options ?? [])[i] ?? "")}
                theme={theme}
                disabled={!canTap}
              />
            )}

            {isTextChoice && currentQ.type === "image_object_tap" && showFeedback && (
              <SessionMcOptions
                options={currentQ.options ?? []}
                correct={currentQ.correct}
                selectedIdx={
                  tappedLabel
                    ? (currentQ.options ?? []).findIndex((o) => labelsMatch(o, tappedLabel))
                    : -1
                }
                showFeedback
                onSelect={() => {}}
                theme={theme}
                disabled
              />
            )}

            {currentQ.type === "image_yes_no" && !showFeedback && (
              <div className="flex gap-2 max-w-md pt-1">
                {([
                  { choice: "agree" as const, Icon: ThumbsUp, label: "Agree" },
                  { choice: "disagree" as const, Icon: ThumbsDown, label: "Disagree" },
                ]).map(({ choice, Icon, label }) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleYesNoAnswer(choice)}
                    disabled={!canTap}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      theme.chip,
                      theme.chipHover,
                      "disabled:opacity-40",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </SessionQuestionBlock>
        </SessionWorkScroll>
      </SessionResponsiveLayout>
    </div>
  );
}
