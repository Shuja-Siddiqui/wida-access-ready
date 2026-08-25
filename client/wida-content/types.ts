export type QuestionType =
  | "multiple_choice"
  | "image_hotspot"
  | "fill_in_blank"
  | "short_answer"
  | "word_bank"
  | "sentence_frame"
  | "listening_mc"
  | "listening_tf"
  | "listening_image_grid"
  | "listening_sequence"
  | "listening_match"
  | "listening_classify"
  | "image_object_tap"
  | "image_yes_no"
  | "speaking_prompt"
  | "image_describe"
  | "sequence_order"
  | "match_columns";

export interface MultipleChoiceQuestion {
  type: "multiple_choice";
  passage?: string;
  imageUrl?: string;
  visual?: string;
  question: string;
  options: string[];
  optionDiagrams?: (string | null)[];
  correctIndex: number;
}

export interface ImageHotspotQuestion {
  type: "image_hotspot";
  imageUrl: string;
  caption?: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface FillInBlankQuestion {
  type: "fill_in_blank";
  instruction?: string;
  sentence: string;
  correctAnswer: string;
  hint?: string;
}

export interface ShortAnswerQuestion {
  type: "short_answer";
  passage?: string;
  imageUrl?: string;
  prompt: string;
  minWords?: number;
  sampleAnswer?: string;
}

export interface WordBankQuestion {
  type: "word_bank";
  instruction?: string;
  sentences: string[];
  wordBank: string[];
  correctAnswers: string[];
}

export interface SentenceFrameQuestion {
  type: "sentence_frame";
  prompt: string;
  frame: string;
  imageUrl?: string;
  cues?: string[];
  minWords?: number;
}

// ── Listening family ──────────────────────────────────────────

export interface ListeningMCQuestion {
  type: "listening_mc";
  audioScript: string;
  audioUrl?: string;
  visual?: string;
  question: string;
  options: string[];
  optionDiagrams?: (string | null)[];
  correctIndex: number;
}

/** Agree / Disagree  or  True / False  (Level 1–2) */
export interface ListeningTrueFalseQuestion {
  type: "listening_tf";
  audioScript: string;
  audioUrl?: string;
  /** The statement the student reacts to */
  statement: string;
  /** Which button is the correct answer */
  answer: "true" | "false" | "agree" | "disagree";
  /** Controls which button labels appear; defaults to "true_false" */
  mode?: "true_false" | "agree_disagree";
}

/** Point to the correct picture from a 2×2 image grid (Level 1–2) */
export interface ListeningImageGridQuestion {
  type: "listening_image_grid";
  audioScript: string;
  audioUrl?: string;
  /** "Show me your schedule"  /  "Point to the animal that eats plants" */
  instruction: string;
  /** Exactly 4 images */
  images: { url: string; label: string; altText?: string }[];
  correctIndex: number;
}

/** Hear a passage then re-order events / steps (Level 2, 3, 5) */
export interface ListeningSequenceQuestion {
  type: "listening_sequence";
  audioScript: string;
  audioUrl?: string;
  instruction?: string;
  /** Items can be text strings or image URLs */
  items: string[];
  /** correctOrder[itemIndex] = correct position (0-based) */
  correctOrder: number[];
}

/** Hear a passage then match left ↔ right (cause/effect, claim/evidence) (Level 2, 4, 5) */
export interface ListeningMatchQuestion {
  type: "listening_match";
  audioScript: string;
  audioUrl?: string;
  instruction?: string;
  /** Items can be text strings or image URLs */
  leftItems: string[];
  rightItems: string[];
  /** correctPairs[leftIndex] = index into rightItems */
  correctPairs: number[];
}

/** Hear a passage then sort items into 2 categories (Level 2) */
export interface ListeningClassifyQuestion {
  type: "listening_classify";
  audioScript: string;
  audioUrl?: string;
  instruction?: string;
  /** Exactly 2 category labels */
  categories: [string, string];
  items: string[];
  /** correctCategories[itemIndex] = 0 or 1 */
  correctCategories: number[];
}

// ── Image-library object tap (levels 0–2) ────────────────────

/** Tap the correct DINO-detected bounding box in a library image (levels 0–2) */
export interface ImageObjectTapQuestion {
  type: "image_object_tap";
  /** The scene image URL (presigned S3 medium key) */
  imageUrl: string;
  /** 2-3 sentence passage telling a story about the image */
  passage: string;
  /** The question the student must answer by tapping */
  question: string;
  /** Exact DINO label of the object the student must tap */
  targetLabel: string;
  /** All DINO label options (same as the detections returned alongside) */
  options: string[];
  /** 0-indexed index of targetLabel in options */
  correct: number;
  /** Short explanation shown after answering */
  explanation: string;
}

// ── Speaking family ───────────────────────────────────────────

export interface SpeakingPromptQuestion {
  type: "speaking_prompt";
  prompt: string;
  imageUrl?: string;
  timeLimit?: number;
  cues?: string[];
}

export interface ImageDescribeQuestion {
  type: "image_describe";
  imageUrl: string;
  prompt: string;
  mode: "speaking" | "writing";
  cues?: string[];
}

// ── General ───────────────────────────────────────────────────

export interface SequenceOrderQuestion {
  type: "sequence_order";
  instruction?: string;
  items: string[];
  correctOrder: number[];
}

export interface MatchColumnsQuestion {
  type: "match_columns";
  instruction?: string;
  leftItems: string[];
  rightItems: string[];
  correctPairs: number[];
}

export type AnyQuestion =
  | MultipleChoiceQuestion
  | ImageHotspotQuestion
  | FillInBlankQuestion
  | ShortAnswerQuestion
  | WordBankQuestion
  | SentenceFrameQuestion
  | ListeningMCQuestion
  | ListeningTrueFalseQuestion
  | ListeningImageGridQuestion
  | ListeningSequenceQuestion
  | ListeningMatchQuestion
  | ListeningClassifyQuestion
  | ImageObjectTapQuestion
  | SpeakingPromptQuestion
  | ImageDescribeQuestion
  | SequenceOrderQuestion
  | MatchColumnsQuestion;

export type QuestionAnswer = number | string | number[] | string[];

export interface QuestionResult {
  question: AnyQuestion;
  answer: QuestionAnswer;
  isCorrect?: boolean;
  timestamp: number;
}
