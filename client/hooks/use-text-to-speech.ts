import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/api-generated";
import { getAzureSpeechAvailable } from "@/lib/speech-status";
import {
  azureVoiceForDelivery,
  COACHING_PLAYBACK_RATE,
  PASSAGE_PLAYBACK_RATE,
  type SpeechDelivery,
} from "@/lib/speech-voices";

export interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
}

export type { SpeechDelivery } from "@/lib/speech-voices";

export type SpeechSegment = {
  text: string;
  delivery: SpeechDelivery;
};

export interface UseTextToSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  /** True while the server-generated audio is being fetched, before playback starts. */
  isLoading: boolean;
  speak: (text: string, delivery?: SpeechDelivery) => void;
  /** Play segments in order — coaching (teacher) vs passage (content) voices. */
  speakSequence: (segments: SpeechSegment[]) => void;
  stop: () => void;
}

/**
 * Reads AI-generated text (listening passages, prompts, feedback) aloud.
 * Azure neural TTS only — never the browser SpeechSynthesis voice.
 */
export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { onEnd, rate: defaultRate } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [azureAvailable, setAzureAvailable] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const requestIdRef = useRef<number>(0);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    let mounted = true;
    getAzureSpeechAvailable().then((available) => {
      if (mounted) setAzureAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Chrome blocks Audio.play() after async work unless a player was unlocked
  // on a user gesture. SpeechSynthesis does not have that restriction, which
  // is why short coaching like "Tap Next" used to play in the system voice.
  useEffect(() => {
    const unlock = () => {
      const audio = getAudio();
      audio.muted = true;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [getAudio]);

  const cleanupSrc = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupSrc();
      audioRef.current = null;
    };
  }, [cleanupSrc]);

  const playSegment = useCallback(
    (text: string, delivery: SpeechDelivery, myRequestId: number): Promise<void> =>
      new Promise((resolve) => {
        if (!text || azureAvailable === false || requestIdRef.current !== myRequestId) {
          resolve();
          return;
        }

        synthesizeSpeech({ text, delivery, voice: azureVoiceForDelivery(delivery) })
          .then((blob) => {
            if (requestIdRef.current !== myRequestId) {
              resolve();
              return;
            }

            setIsLoading(false);
            const url = URL.createObjectURL(blob);
            audioUrlRef.current = url;
            const audio = getAudio();
            const finish = () => {
              setIsSpeaking(false);
              cleanupSrc();
              resolve();
            };
            audio.onended = finish;
            audio.onerror = finish;
            audio.playbackRate =
              delivery === "passage"
                ? (defaultRate ?? PASSAGE_PLAYBACK_RATE)
                : COACHING_PLAYBACK_RATE;
            audio.src = url;
            setIsSpeaking(true);
            void audio.play().catch(finish);
          })
          .catch(() => {
            if (requestIdRef.current !== myRequestId) return;
            setIsLoading(false);
            setIsSpeaking(false);
            resolve();
          });
      }),
    [azureAvailable, cleanupSrc, defaultRate, getAudio],
  );

  const speak = useCallback(
    (text: string, delivery: SpeechDelivery = "passage") => {
      if (!text) return;
      if (azureAvailable === false) return;

      const myRequestId = ++requestIdRef.current;
      cleanupSrc();
      setIsLoading(true);
      void playSegment(text, delivery, myRequestId).then(() => {
        if (requestIdRef.current !== myRequestId) return;
        onEndRef.current?.();
      });
    },
    [azureAvailable, cleanupSrc, playSegment],
  );

  const speakSequence = useCallback(
    (segments: SpeechSegment[]) => {
      const queue = segments.filter((s) => s.text.trim().length > 0);
      if (queue.length === 0) return;
      if (azureAvailable === false) return;

      const myRequestId = ++requestIdRef.current;
      cleanupSrc();
      setIsLoading(true);

      void (async () => {
        for (const segment of queue) {
          if (requestIdRef.current !== myRequestId) return;
          setIsLoading(true);
          await playSegment(segment.text, segment.delivery, myRequestId);
        }
        if (requestIdRef.current !== myRequestId) return;
        setIsLoading(false);
        onEndRef.current?.();
      })();
    },
    [azureAvailable, cleanupSrc, playSegment],
  );

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    cleanupSrc();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanupSrc]);

  return {
    isSupported: azureAvailable !== false,
    isSpeaking,
    isLoading,
    speak,
    speakSequence,
    stop,
  };
}
