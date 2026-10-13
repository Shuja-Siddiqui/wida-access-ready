import { useCallback, useEffect, useRef, useState } from "react";
import { getAzureSpeechAvailable } from "@/lib/speech-status";
import { getAzureSpeechToken } from "@/lib/azure-speech-token";
import { AzureStreamingSttSession } from "@/lib/azure-streaming-stt";

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

const mediaRecordingSupported =
  typeof window !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  !!(window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

function sttLog(event: string, extra?: Record<string, unknown>) {
  if (extra) console.info(`[stt] ${event}`, extra);
  else console.info(`[stt] ${event}`);
}

export interface UseSpeechToTextOptions {
  onTranscriptChange?: (transcript: string) => void;
  continuous?: boolean;
  lang?: string;
}

export interface UseSpeechToTextReturn {
  isSupported: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  transcript: string;
  interimTranscript: string;
  /** 0–1 live mic level while recording. */
  inputLevel: number;
  error: string | null;
  uncertainWords: string[];
  lastConfidence?: number;
  startListening: (opts?: { referenceText?: string }) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { onTranscriptChange, continuous = true, lang = "en-US" } = options;

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [azureAvailable, setAzureAvailable] = useState<boolean | null>(null);
  const [uncertainWords, setUncertainWords] = useState<string[]>([]);
  const [lastConfidence, setLastConfidence] = useState<number | undefined>(undefined);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const azureSessionRef = useRef<AzureStreamingSttSession | null>(null);
  const finalTranscriptRef = useRef("");
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  onTranscriptChangeRef.current = onTranscriptChange;

  useEffect(() => {
    let mounted = true;
    getAzureSpeechAvailable().then((available) => {
      sttLog("azure status", { available });
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

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      void azureSessionRef.current?.stop();
      azureSessionRef.current = null;
    };
  }, []);

  const pushLiveText = useCallback((finalText: string, interim: string) => {
    setTranscript(finalText);
    setInterimTranscript(interim);
    onTranscriptChangeRef.current?.(finalText);
  }, []);

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
      pushLiveText(finalTranscriptRef.current.trim(), interim);
    };

    recognition.onerror = (event) => {
      sttLog("browser-only error", { error: event.error });
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error || "Speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      sttLog("browser-only recognition started");
    } catch {
      setError("Could not start the microphone.");
    }
  }, [SpeechRecognitionCtor, continuous, lang, pushLiveText]);

  const startAzureStreaming = useCallback(async () => {
    sttLog("azure streaming start");
    try {
      const { token, region } = await getAzureSpeechToken();
      const session = new AzureStreamingSttSession();
      azureSessionRef.current = session;

      await session.start(token, region, {
        onInterim: (text) => setInterimTranscript(text),
        onFinalSegment: (segment, meta) => {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${segment}`.trim();
          pushLiveText(finalTranscriptRef.current, "");
          if (meta.confidence != null) setLastConfidence(meta.confidence);
          if (meta.uncertainWords.length > 0) {
            setUncertainWords((prev) => [...new Set([...prev, ...meta.uncertainWords])]);
          }
          sttLog("azure segment", {
            segment: segment.slice(0, 80),
            confidence: meta.confidence,
          });
        },
        onLevel: setInputLevel,
        onError: (message) => {
          sttLog("azure streaming error", { message });
          if (!message.toLowerCase().includes("canceled")) {
            setError(message);
          }
        },
      });

      setIsListening(true);
      sttLog("azure streaming ready", { region });
    } catch (err) {
      sttLog("azure streaming start failed", { err: String(err) });
      azureSessionRef.current = null;
      if (browserSupported) {
        sttLog("falling back to browser STT");
        startBrowserRecognition();
        return;
      }
      setError("Could not start speech recognition.");
    }
  }, [browserSupported, pushLiveText, startBrowserRecognition]);

  const startListening = useCallback((_opts?: { referenceText?: string }) => {
    setError(null);
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setUncertainWords([]);
    setLastConfidence(undefined);
    setInputLevel(0);
    sttLog("startListening", { useAzure, browserSupported, azureAvailable });

    if (useAzure) {
      void startAzureStreaming();
    } else {
      startBrowserRecognition();
    }
  }, [useAzure, azureAvailable, browserSupported, startAzureStreaming, startBrowserRecognition]);

  const stopListening = useCallback(() => {
    sttLog("stopListening", {
      azureSession: !!azureSessionRef.current,
      browserSession: !!recognitionRef.current,
    });

    if (azureSessionRef.current) {
      setIsListening(false);
      setIsTranscribing(true);
      setInputLevel(0);
      const session = azureSessionRef.current;
      azureSessionRef.current = null;

      void session.stop().finally(() => {
        setInterimTranscript("");
        const text = finalTranscriptRef.current.trim();
        setTranscript(text);
        onTranscriptChangeRef.current?.(text);
        if (!text) {
          setError("We could not hear that. Tap to speak again.");
        }
        sttLog("azure streaming stop", { chars: text.length, preview: text.slice(0, 80) });
        setIsTranscribing(false);
      });
      return;
    }

    if (recognitionRef.current) {
      setIsListening(false);
      setIsTranscribing(true);
      recognitionRef.current.stop();
      return;
    }

    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setUncertainWords([]);
    setLastConfidence(undefined);
    setError(null);
    setInputLevel(0);
  }, []);

  return {
    isSupported,
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    inputLevel,
    error,
    uncertainWords,
    lastConfidence,
    startListening,
    stopListening,
    resetTranscript,
  };
}
