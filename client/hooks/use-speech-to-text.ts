import { useCallback, useEffect, useRef, useState } from "react";
import { customFetch } from "@/api-generated/custom-fetch";
import type { SpeechToTextResponse } from "@/api-generated";
import { getAzureSpeechAvailable } from "@/lib/speech-status";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

// Preferred formats first — Azure's speech-to-text REST API accepts all of these directly.
const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

const mediaRecordingSupported =
  typeof window !== "undefined" &&
  typeof MediaRecorder !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia;

export interface UseSpeechToTextOptions {
  /** Called every time the accumulated final transcript changes. */
  onTranscriptChange?: (transcript: string) => void;
  /** Keep listening across pauses instead of stopping after the first phrase. Default true. Only applies to the browser fallback. */
  continuous?: boolean;
  lang?: string;
}

export interface UseSpeechToTextReturn {
  /** False only when neither server-side (Azure) nor browser speech recognition is available. */
  isSupported: boolean;
  isListening: boolean;
  /** True after recording stops while the server transcribes the clip (Azure path only). */
  isTranscribing: boolean;
  /** Finalized transcript text captured so far. */
  transcript: string;
  /** Live, not-yet-finalized text (browser fallback only — Azure path has no interim results). */
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Captures spoken answers as text for the Speaking domain, storage, and AI feedback.
 * Prefers recording audio and transcribing it via the server's Azure Speech
 * integration (works in every browser, including Safari/Firefox); falls back
 * to the browser's built-in Web Speech API (SpeechRecognition) when Azure
 * isn't configured, and reports unsupported when neither is available.
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { onTranscriptChange, continuous = true, lang = "en-US" } = options;

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [azureAvailable, setAzureAvailable] = useState<boolean | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const finalTranscriptRef = useRef("");
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  onTranscriptChangeRef.current = onTranscriptChange;

  useEffect(() => {
    let mounted = true;
    getAzureSpeechAvailable().then((available) => {
      if (mounted) setAzureAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
  const browserSupported = !!SpeechRecognitionCtor;
  const useAzure = azureAvailable === true && mediaRecordingSupported;
  const isSupported = useAzure || browserSupported;

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.stop();
      stopMediaStream();
    };
  }, [stopMediaStream]);

  const startBrowserRecognition = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }
      const finalText = finalTranscriptRef.current.trim();
      setTranscript(finalText);
      setInterimTranscript(interim);
      onTranscriptChangeRef.current?.(finalText);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error || "Speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Could not start the microphone.");
    }
  }, [SpeechRecognitionCtor, continuous, lang]);

  const startAzureRecording = useCallback(() => {
    audioChunksRef.current = [];
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        const mimeType = pickSupportedMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          setError("Recording error — please try again.");
          setIsListening(false);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsListening(true);
      })
      .catch(() => {
        setError("Microphone access was denied.");
      });
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");

    if (useAzure) {
      startAzureRecording();
    } else {
      startBrowserRecognition();
    }
  }, [useAzure, startAzureRecording, startBrowserRecognition]);

  const stopListening = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      setIsListening(false);
      setIsTranscribing(true);

      recorder.onstop = async () => {
        stopMediaStream();
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        try {
          const result = await customFetch<SpeechToTextResponse>("/api/speech/speech-to-text", {
            method: "POST",
            headers: { "Content-Type": mimeType },
            body: blob,
          });
          const text = (result.text || "").trim();
          setTranscript(text);
          onTranscriptChangeRef.current?.(text);
        } catch {
          setError("Could not transcribe your answer, but it will still be submitted.");
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.stop();
      return;
    }

    recognitionRef.current?.stop();
    setIsListening(false);
  }, [stopMediaStream]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
