import { useCallback } from "react";
import { prepareTextForSpeech } from "@/lib/prepare-text-for-speech";
import { buildWritingSpeechSegments } from "@/lib/writing-speech";
import {
  useTextToSpeech,
  type UseTextToSpeechOptions,
  type UseTextToSpeechReturn,
} from "./use-text-to-speech";

export type SpokenContent = {
  speakPassage: (text: string) => void;
  speakFeedback: (text: string) => void;
  /** Writing task: teacher intros (Jenny) then passage content (Guy), in order. */
  speakWritingSession: (data: Record<string, unknown>) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isLoadingTts: boolean;
  isSupported: boolean;
};

/**
 * One TTS pipeline for the whole session: Guy reads passages, Jenny reads feedback.
 * Use this when a screen needs both (home, image-library, listening L3+).
 */
export function useSpokenContent(options: UseTextToSpeechOptions = {}): SpokenContent {
  const tts = useTextToSpeech(options);
  const speakPassage = useCallback(
    (text: string) => tts.speak(prepareTextForSpeech(text), "passage"),
    [tts.speak],
  );
  const speakFeedback = useCallback(
    (text: string) => tts.speak(prepareTextForSpeech(text), "coaching"),
    [tts.speak],
  );
  const speakWritingSession = useCallback(
    (data: Record<string, unknown>) => {
      tts.speakSequence(buildWritingSpeechSegments(data));
    },
    [tts.speakSequence],
  );
  return {
    speakPassage,
    speakFeedback,
    speakWritingSession,
    stopSpeaking: tts.stop,
    isSpeaking: tts.isSpeaking,
    isLoadingTts: tts.isLoading,
    isSupported: tts.isSupported,
  };
}

/** Guy — listening/reading passages and item stems. */
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

/** Jenny — item coaching and “correct / try again” feedback. */
export function useFeedbackSpeech(options: UseTextToSpeechOptions = {}): Omit<UseTextToSpeechReturn, "speak"> & {
  speak: (text: string) => void;
} {
  const tts = useTextToSpeech(options);
  const speak = useCallback(
    (text: string) => tts.speak(prepareTextForSpeech(text), "coaching"),
    [tts.speak],
  );
  return { ...tts, speak };
}
