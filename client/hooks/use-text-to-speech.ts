import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/api-generated";
import { getAzureSpeechAvailable } from "@/lib/speech-status";

export interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
}

export interface UseTextToSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  /** True while the server-generated audio is being fetched, before playback starts. */
  isLoading: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

const browserTtsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Reads AI-generated text (listening passages, prompts, feedback) aloud.
 * Prefers server-side Azure neural TTS (consistent, natural voice across every
 * browser); falls back to the browser's built-in SpeechSynthesis if Azure is
 * not configured or the request fails.
 */
export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { rate = 0.85, pitch = 1.0, lang = "en-US", onEnd } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [azureAvailable, setAzureAvailable] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  // Tracks whether an Azure TTS request is currently in-flight so a second
  // speak() call can invalidate it before the response arrives.
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    getAzureSpeechAvailable().then((available) => {
      if (mounted) setAzureAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (browserTtsSupported) window.speechSynthesis.cancel();
    };
  }, [cleanupAudio]);

  const speakWithBrowser = useCallback(
    (text: string) => {
      if (!browserTtsSupported) {
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEndRef.current?.();
      };
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [rate, pitch, lang],
  );

  const speak = useCallback(
    (text: string) => {
      if (!text) return;

      // Invalidate any in-flight Azure request by bumping the generation counter.
      // The .then() handler below checks whether its request ID is still current
      // before touching any state or creating an audio element — this prevents a
      // stale response from a previous speak() call racing with the current one.
      const myRequestId = ++requestIdRef.current;

      cleanupAudio();
      if (browserTtsSupported) window.speechSynthesis.cancel();

      if (azureAvailable === false) {
        speakWithBrowser(text);
        return;
      }

      setIsLoading(true);
      synthesizeSpeech({ text })
        .then((blob) => {
          // Drop this response if speak() was called again while we were waiting.
          if (requestIdRef.current !== myRequestId) return;

          setIsLoading(false);
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            cleanupAudio();
            onEndRef.current?.();
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            cleanupAudio();
          };

          setIsSpeaking(true);
          audio.play().catch(() => {
            // play() can reject for two reasons:
            //   1. Autoplay policy — audio never started → fall back to browser TTS.
            //   2. The element was interrupted/paused by cleanup — audio is already
            //      stopped, so browser TTS fallback is also wrong; just clean up.
            // We distinguish them by checking whether the audio actually started.
            const didStart = !audio.paused || audio.currentTime > 0;
            if (!didStart) {
              setIsSpeaking(false);
              cleanupAudio();
              speakWithBrowser(text);
            }
            // If audio did start (paused mid-play), isSpeaking was already set true
            // and the onended/onerror handlers will clean up when it finishes.
          });
        })
        .catch(() => {
          if (requestIdRef.current !== myRequestId) return;
          setIsLoading(false);
          speakWithBrowser(text);
        });
    },
    [azureAvailable, cleanupAudio, speakWithBrowser],
  );

  const stop = useCallback(() => {
    cleanupAudio();
    if (browserTtsSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanupAudio]);

  const isSupported = azureAvailable !== false || browserTtsSupported;

  return { isSupported, isSpeaking, isLoading, speak, stop };
}
