import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/api-generated";
import { getAzureSpeechAvailable } from "@/lib/speech-status";
import { azureVoiceForDelivery, type SpeechDelivery } from "@/lib/speech-voices";

export interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
}

export type { SpeechDelivery } from "@/lib/speech-voices";

export interface UseTextToSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  /** True while the server-generated audio is being fetched, before playback starts. */
  isLoading: boolean;
  speak: (text: string, delivery?: SpeechDelivery) => void;
  stop: () => void;
}

/**
 * Reads AI-generated text (listening passages, prompts, feedback) aloud.
 * Azure neural TTS only — never the browser SpeechSynthesis voice.
 */
export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { onEnd } = options;

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

  const speak = useCallback(
    (text: string, delivery: SpeechDelivery = "passage") => {
      if (!text) return;
      if (azureAvailable === false) return;

      const myRequestId = ++requestIdRef.current;
      cleanupSrc();

      setIsLoading(true);
      synthesizeSpeech({ text, delivery, voice: azureVoiceForDelivery(delivery) })
        .then((blob) => {
          if (requestIdRef.current !== myRequestId) return;

          setIsLoading(false);
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          const audio = getAudio();
          audio.onended = () => {
            setIsSpeaking(false);
            cleanupSrc();
            onEndRef.current?.();
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            cleanupSrc();
          };
          audio.src = url;
          setIsSpeaking(true);
          void audio.play().catch(() => {
            if (requestIdRef.current !== myRequestId) return;
            setIsSpeaking(false);
            cleanupSrc();
          });
        })
        .catch(() => {
          if (requestIdRef.current !== myRequestId) return;
          setIsLoading(false);
          setIsSpeaking(false);
        });
    },
    [azureAvailable, cleanupSrc, getAudio],
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
    stop,
  };
}
