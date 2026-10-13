import { useCallback } from "react";
import type { SessionDomainKey } from "@/home/components/session-ui-styles";
import { buildCoachingSpeechSegments } from "@/lib/coaching-speech";
import { prepareTextForSpeech } from "@/lib/prepare-text-for-speech";
import {
  buildQuestionSpeechSegments,
  buildSessionTaskSpeechSegments,
  type SessionTaskSpeechOptions,
} from "@/lib/session-task-speech";
import {
  useTextToSpeech,
  type UseTextToSpeechOptions,
  type UseTextToSpeechReturn,
} from "./use-text-to-speech";

export type SpokenContent = {
  speakPassage: (text: string) => void;
  speakFeedback: (text: string) => void;
  /** Unified task narration — teacher (Jenny) then content (Guy), all domains. */
  speakTaskSession: (
    domain: SessionDomainKey,
    data: Record<string, unknown>,
    options?: SessionTaskSpeechOptions,
  ) => void;
  /** Single question stem — same teacher→narrator pattern. */
  speakQuestion: (question: string) => void;
  /** @deprecated Use speakTaskSession("writing", data) */
  speakWritingSession: (data: Record<string, unknown>) => void;
  /** @deprecated Use speakTaskSession("speaking", data) */
  speakSpeakingSession: (data: Record<string, unknown>) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isLoadingTts: boolean;
  isSupported: boolean;
};

/**
 * One TTS pipeline for the whole session: Guy reads passages, Jenny reads feedback.
 */
export function useSpokenContent(options: UseTextToSpeechOptions = {}): SpokenContent {
  const tts = useTextToSpeech(options);

  const speakPassage = useCallback(
    (text: string) => tts.speak(prepareTextForSpeech(text), "passage"),
    [tts.speak],
  );

  const speakFeedback = useCallback(
    (text: string) => {
      const segments = buildCoachingSpeechSegments(text);
      if (segments.length === 0) return;
      tts.speakSequence(segments);
    },
    [tts.speakSequence],
  );

  const speakTaskSession = useCallback(
    (
      domain: SessionDomainKey,
      data: Record<string, unknown>,
      speechOptions?: SessionTaskSpeechOptions,
    ) => {
      tts.speakSequence(buildSessionTaskSpeechSegments(domain, data, speechOptions));
    },
    [tts.speakSequence],
  );

  const speakQuestion = useCallback(
    (question: string) => {
      const segments = buildQuestionSpeechSegments(question);
      if (segments.length === 0) return;
      tts.speakSequence(segments);
    },
    [tts.speakSequence],
  );

  const speakWritingSession = useCallback(
    (data: Record<string, unknown>) => speakTaskSession("writing", data),
    [speakTaskSession],
  );

  const speakSpeakingSession = useCallback(
    (data: Record<string, unknown>) => speakTaskSession("speaking", data),
    [speakTaskSession],
  );

  return {
    speakPassage,
    speakFeedback,
    speakTaskSession,
    speakQuestion,
    speakWritingSession,
    speakSpeakingSession,
    stopSpeaking: tts.stop,
    isSpeaking: tts.isSpeaking,
    isLoadingTts: tts.isLoading,
    isSupported: tts.isSupported,
  };
}

/** Guy — legacy single-voice replay. Prefer speakTaskSession when possible. */
export function usePassageSpeech(options: UseTextToSpeechOptions = {}): Omit<UseTextToSpeechReturn, "speak"> & {
  speak: (text: string) => void;
} {
  const tts = useTextToSpeech(options);
  const speak = useCallback(
    (text: string) => tts.speak(prepareTextForSpeech(text), "passage"),
    [tts.speak],
  );
  return { ...tts, speak };
}

/** Jenny — item coaching and feedback. */
export function useFeedbackSpeech(options: UseTextToSpeechOptions = {}): Omit<UseTextToSpeechReturn, "speak"> & {
  speak: (text: string) => void;
} {
  const tts = useTextToSpeech(options);
  const speak = useCallback(
    (text: string) => {
      const segments = buildCoachingSpeechSegments(text);
      if (segments.length === 0) return;
      tts.speakSequence(segments);
    },
    [tts.speakSequence],
  );
  return { ...tts, speak };
}
