/**
 * SessionContext
 *
 * Holds all state and callbacks that are shared across the active session view
 * and its child components. home.tsx is still the state owner — it computes
 * this value from its existing state and provides it via <SessionProvider>.
 *
 * Components that only live inside a session can read directly from
 * useSessionContext() instead of receiving the same values as props.
 */

import { createContext, useContext } from "react";

// ── Question shape ─────────────────────────────────────────────────────────────

export interface SessionQuestion {
  id?: string;
  type: string;
  question: string;
  explanation?: string;
  imageUrls?: string[];
  /** Scene image for object_detect questions — base64 data URI provided by the teacher */
  imageSrc?: string;

  // ── Multiple-choice / image_grid ──────────────────────────────────────────
  options?: string[];
  optionDiagrams?: (string | null)[];
  visual?: string;

  // ── sequence_order (reading) / sequence_ordering (listening) ─────────────
  items?: string[];
  correct_order?: number[];

  // ── match_columns (reading) / pair_matching (listening) ──────────────────
  left?: string[];
  right?: string[];
  left_items?: string[];
  right_items?: string[];
  correct_pairs?: [number, number][];

  // ── classify (reading) / category_sorting (listening) ────────────────────
  categories?: string[];
  correct?: number | number[];           // number for MC, number[] for classify
  correct_categories?: number[];

  // ── agree_disagree (listening) ────────────────────────────────────────────
  answer?: "agree" | "disagree";
}

// ── Session data shape ─────────────────────────────────────────────────────────

export interface SessionData {
  sessionId: string;
  content: {
    type: string;
    data: {
      audioScript?: string;
      passage?: string;
      prompt?: string;
      scaffold?: string;
      /** Writing: camelCase (from API) */
      wordBank?: string[];
      sentenceFrame?: string;
      /** legacy snake_case fallbacks */
      word_bank?: string[];
      sentence_frame?: string;
      topic?: string;
      visual?: string;
      illustrationUrl?: string;
      questions?: SessionQuestion[];
    };
  };
}

// ── Context value ──────────────────────────────────────────────────────────────

export interface SessionContextValue {
  // ── Session data ──────────────────────────────────────────────────────────
  session: SessionData;
  activeDomain: string;
  qIdx: number;
  questions: SessionQuestion[];
  currentQ: SessionQuestion | undefined;

  // ── Question / answer state ───────────────────────────────────────────────
  showFeedback: boolean;
  lastCorrect: boolean;
  selectedIdx: number;
  listenedOnce: boolean;

  // ── Question handlers ─────────────────────────────────────────────────────
  onAnswer: (idx: number) => void;
  /** For non-MC question types (sequence, match, classify, agree_disagree) */
  onAnswerNonMC: (submittedAnswer: unknown, isCorrect: boolean) => void;
  onNext: () => void;

  // ── TTS ───────────────────────────────────────────────────────────────────
  speaking: boolean;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;

  // ── STT ───────────────────────────────────────────────────────────────────
  sttSupported: boolean;
  sttTranscript: string;
  sttInterim: string;
  sttError: string;

  // ── Recording (speaking domain) ───────────────────────────────────────────
  recording: boolean;
  finalizingSpeaking: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;

  // ── Writing domain ────────────────────────────────────────────────────────
  writingText: string;
  setWritingText: (s: string | ((prev: string) => string)) => void;
  onSubmitWriting: (text: string) => void;
}

// ── Context + hook ─────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: SessionContextValue;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext must be used inside <SessionProvider>");
  return ctx;
}
