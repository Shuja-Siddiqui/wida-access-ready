/**
 * SessionObjectDetect — 3-box picker
 *
 * Runs Grounding DINO on the scene image, then draws three coloured bounding
 * boxes (one correct, two distractors) directly on the image.  The student
 * taps a box to answer.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Detection {
  label: string;
  score: number;
  box: { x: number; y: number; width: number; height: number };
}

interface ChoiceOption {
  label: string;
  box: Detection["box"];
  isCorrect: boolean;
}

export interface ObjectDetectQuestion {
  question: string;
  /** base64 data URI of the scene image */
  imageSrc: string;
  /** Labels to detect — derived from the AI question's options */
  labels: string[];
  /** The label the student must select */
  correctLabel: string;
}

interface SessionObjectDetectProps {
  currentQ: ObjectDetectQuestion;
  showFeedback: boolean;
  /** Which label the student selected ("" = nothing yet) */
  selectedLabel: string;
  onAnswer: (label: string) => void;
  /** Show label text on each box (debug mode) */
  showLabels?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildChoices(detections: Detection[], correctLabel: string): ChoiceOption[] {
  // Best detection per label (highest confidence)
  const byLabel = new Map<string, Detection>();
  for (const d of detections) {
    const cur = byLabel.get(d.label);
    if (!cur || d.score > cur.score) byLabel.set(d.label, d);
  }

  const correctDet = byLabel.get(correctLabel);
  if (!correctDet) return [];

  // Up to 2 distractors from other labels
  const wrong: Detection[] = [];
  for (const [lbl, det] of byLabel) {
    if (lbl !== correctLabel) {
      wrong.push(det);
      if (wrong.length === 2) break;
    }
  }
  // Fill from all detections if still short
  if (wrong.length < 2) {
    for (const d of detections) {
      if (d.label !== correctLabel && wrong.length < 2 && !wrong.includes(d)) {
        wrong.push(d);
      }
    }
  }

  if (wrong.length < 2) return [];

  const choices: ChoiceOption[] = [
    { label: correctLabel,   box: correctDet.box, isCorrect: true  },
    { label: wrong[0].label, box: wrong[0].box,   isCorrect: false },
    { label: wrong[1].label, box: wrong[1].box,   isCorrect: false },
  ];

  // Fisher-Yates shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

// Distinct pre-answer colours for the three boxes
const PALETTE = [
  { border: "#3B82F6", fill: "rgba(59,130,246,0.15)"  },
  { border: "#F59E0B", fill: "rgba(245,158,11,0.15)"  },
  { border: "#8B5CF6", fill: "rgba(139,92,246,0.15)"  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionObjectDetect({
  currentQ,
  showFeedback,
  selectedLabel,
  onAnswer,
  showLabels = false,
}: SessionObjectDetectProps) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [choices, setChoices] = useState<ChoiceOption[]>([]);

  const { imageSrc, labels, question, correctLabel } = currentQ;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setChoices([]);

    fetch("/api/images/detect", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ image: imageSrc, labels }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const dets: Detection[] = data.detections ?? [];
        if (dets.length === 0) {
          setError("Couldn't locate objects in this image.");
        } else {
          const built = buildChoices(dets, correctLabel);
          if (built.length === 0) {
            setError("Not enough objects found to build choices.");
          } else {
            setChoices(built);
          }
        }
      })
      .catch(() => { if (!cancelled) setError("Detection failed. Try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, labels.join(",")]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground leading-snug">{question}</h3>

      {/* Scene image with overlay boxes */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border/40 bg-muted/20 select-none">
        <img src={imageSrc} alt="Scene" className="w-full block" draggable={false} />

        {/* 3 choice boxes drawn on the image */}
        {!loading && !error && choices.map((choice, i) => {
          const { x, y, width, height } = choice.box;
          const isSelected = choice.label === selectedLabel;
          const isCorrect  = choice.isCorrect;

          let { border, fill } = PALETTE[i % PALETTE.length];
          let boxOpacity = 1;

          if (showFeedback) {
            if (isCorrect)       { border = "#16A34A"; fill = "rgba(22,163,74,0.22)"; }
            else if (isSelected) { border = "#EF4444"; fill = "rgba(239,68,68,0.22)"; }
            else                 { boxOpacity = 0.2; }
          }

          const interactive = !showFeedback;

          return (
            <motion.button
              key={i}
              disabled={!interactive}
              onClick={() => onAnswer(choice.label)}
              animate={{ opacity: boxOpacity }}
              whileTap={{ scale: interactive ? 0.97 : 1 }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{
                left:            `${x      * 100}%`,
                top:             `${y      * 100}%`,
                width:           `${width  * 100}%`,
                height:          `${height * 100}%`,
                border:          `3px solid ${border}`,
                borderRadius:    8,
                backgroundColor: fill,
                cursor:          interactive ? "pointer" : "default",
                boxShadow:       `0 0 0 1px ${border}44`,
              }}
            >
              {/* Debug label */}
              {showLabels && (
                <span className="absolute bottom-0.5 left-0.5 text-[10px] font-bold text-white bg-black/60 rounded px-1 truncate max-w-full">
                  {choice.label}
                </span>
              )}

              {/* Feedback icon */}
              <AnimatePresence>
                {showFeedback && (isCorrect || isSelected) && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute top-1 right-1"
                  >
                    {isCorrect
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 bg-white rounded-full drop-shadow" />
                      : <XCircle      className="w-5 h-5 text-red-500   bg-white rounded-full drop-shadow" />}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Finding objects…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-center text-sm text-destructive font-medium">{error}</p>
      )}

      {/* Tap hint shown below image when ready */}
      {!loading && !error && choices.length > 0 && !showFeedback && (
        <p className="text-xs font-semibold text-muted-foreground text-center">
          Tap the correct object in the image above
        </p>
      )}
    </div>
  );
}
