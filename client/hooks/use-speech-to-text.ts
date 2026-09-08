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
  !!navigator.mediaDevices?.getUserMedia;

const TARGET_SAMPLE_RATE = 16000;
const SILENCE_RMS = 0.004;

function sttLog(event: string, extra?: Record<string, unknown>) {
  if (extra) console.info(`[stt] ${event}`, extra);
  else console.info(`[stt] ${event}`);
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = input[Math.min(input.length - 1, Math.round(i * ratio))];
  }
  return output;
}

function concatFloat32(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function rms(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function encodeMonoWav(float32: Float32Array, sampleRate: number): Blob {
  const dataSize = float32.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
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
  const referenceTextRef = useRef("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveCaptionsActiveRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const recordingActiveRef = useRef(false);
  const lastLevelAtRef = useRef(0);
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

  const stopMediaStream = useCallback(() => {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
    } catch {
      /* already disconnected */
    }
    processorRef.current = null;
    sourceRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setInputLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      liveCaptionsActiveRef.current = false;
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.stop();
      stopMediaStream();
    };
  }, [stopMediaStream]);

  const pushLiveText = useCallback((finalText: string, interim: string) => {
    setTranscript(finalText);
    setInterimTranscript(interim);
    onTranscriptChangeRef.current?.(finalText);
    sttLog("live caption", {
      finalChars: finalText.length,
      interimChars: interim.length,
      preview: `${finalText} ${interim}`.trim().slice(0, 80),
    });
  }, []);

  const startLiveCaptions = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      sttLog("live captions unavailable (no SpeechRecognition)");
      return;
    }
    liveCaptionsActiveRef.current = true;

    const begin = () => {
      if (!liveCaptionsActiveRef.current) return;
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
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
        sttLog("browser recognition error", { error: event.error });
        if (event.error === "no-speech" || event.error === "aborted") return;
        if (!liveCaptionsActiveRef.current) {
          setError(event.error || "Speech recognition error");
        }
      };
      recognition.onend = () => {
        if (liveCaptionsActiveRef.current) {
          sttLog("browser recognition ended — restarting live captions");
          try {
            begin();
          } catch (err) {
            sttLog("live caption restart failed", { err: String(err) });
          }
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      sttLog("live captions started");
    };

    try {
      begin();
    } catch (err) {
      sttLog("live captions start failed", { err: String(err) });
    }
  }, [SpeechRecognitionCtor, lang, pushLiveText]);

  const stopLiveCaptions = useCallback(() => {
    liveCaptionsActiveRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
  }, []);

  const startBrowserRecognition = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }

    liveCaptionsActiveRef.current = false;
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

  const startAzureRecording = useCallback(() => {
    audioChunksRef.current = [];
    pcmChunksRef.current = [];
    sttLog("azure recording start");
    const started = navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then(async (stream) => {
        if (!recordingActiveRef.current) {
          sttLog("mic stream arrived after stop — discarding");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const track = stream.getAudioTracks()[0];
        sttLog("mic stream", {
          label: track?.label,
          muted: track?.muted,
          enabled: track?.enabled,
          settings: track?.getSettings?.(),
        });
        mediaStreamRef.current = stream;
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          await ctx.resume();
          const source = ctx.createMediaStreamSource(stream);
          const processor = ctx.createScriptProcessor(4096, 1, 1);
          const mute = ctx.createGain();
          mute.gain.value = 0;
          processor.onaudioprocess = (event) => {
            const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
            pcmChunksRef.current.push(chunk);
            const now = Date.now();
            if (now - lastLevelAtRef.current > 80) {
              lastLevelAtRef.current = now;
              setInputLevel(Math.min(1, rms(chunk) * 8));
            }
          };
          source.connect(processor);
          processor.connect(mute);
          mute.connect(ctx.destination);
          audioContextRef.current = ctx;
          processorRef.current = processor;
          sourceRef.current = source;
          setIsListening(true);
          startLiveCaptions();
          sttLog("pcm recorder ready", { sampleRate: ctx.sampleRate });
          return;
        }

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
        recorder.start(250);
        setIsListening(true);
        startLiveCaptions();
        sttLog("mediaRecorder ready", { mimeType: recorder.mimeType });
      })
      .catch((err) => {
        sttLog("getUserMedia failed", { err: String(err) });
        setError("Microphone access was denied.");
      });
    startPromiseRef.current = started.then(() => undefined);
  }, [startLiveCaptions]);

  const startListening = useCallback((opts?: { referenceText?: string }) => {
    setError(null);
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setUncertainWords([]);
    setLastConfidence(undefined);
    setInputLevel(0);
    recordingActiveRef.current = true;
    referenceTextRef.current = opts?.referenceText ?? "";
    sttLog("startListening", { useAzure, browserSupported, azureAvailable });

    if (useAzure) {
      startAzureRecording();
    } else {
      startBrowserRecognition();
    }
  }, [useAzure, azureAvailable, browserSupported, startAzureRecording, startBrowserRecognition]);

  const transcribeBlob = useCallback(async (blob: Blob, contentType: string) => {
    const live = finalTranscriptRef.current.trim();
    sttLog("transcribeBlob", { bytes: blob.size, contentType, liveChars: live.length, livePreview: live.slice(0, 80) });
    if (blob.size < 256) {
      if (live) {
        setTranscript(live);
        onTranscriptChangeRef.current?.(live);
        setIsTranscribing(false);
        return;
      }
      setError("That clip was too short. Tap to speak again.");
      setIsTranscribing(false);
      return;
    }
    try {
      const result = await customFetch<SpeechToTextResponse>("/api/speech/speech-to-text", {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          ...(referenceTextRef.current
            ? { "X-Speech-Reference": referenceTextRef.current.slice(0, 400) }
            : {}),
        },
        body: blob,
      });
      const raw = (result.text || "").trim();
      let text = /^[.\s…]*$/.test(raw) ? "" : raw;
      sttLog("azure transcript", {
        azureChars: text.length,
        azurePreview: text.slice(0, 80),
        confidence: result.confidence,
        uncertainWords: result.uncertainWords,
      });
      if (!text && live) {
        sttLog("falling back to live captions");
        text = live;
      }
      setTranscript(text);
      setInterimTranscript("");
      setUncertainWords(result.uncertainWords ?? []);
      setLastConfidence(result.confidence);
      onTranscriptChangeRef.current?.(text);
      if (!text) setError("We could not hear that. Tap to speak again.");
    } catch (err) {
      sttLog("azure transcribe failed", { err: String(err) });
      if (live) {
        setTranscript(live);
        onTranscriptChangeRef.current?.(live);
      } else {
        setError("Could not transcribe your answer. Tap to speak again.");
      }
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    recordingActiveRef.current = false;
    const azureSession = !!(
      startPromiseRef.current ||
      audioContextRef.current ||
      mediaRecorderRef.current
    );
    sttLog("stopListening", { azureSession, liveCaptions: liveCaptionsActiveRef.current });

    if (!azureSession) {
      if (recognitionRef.current) {
        setIsTranscribing(true);
        recognitionRef.current.stop();
        return;
      }
      setIsListening(false);
      return;
    }

    setIsListening(false);
    setIsTranscribing(true);
    stopLiveCaptions();

    void (async () => {
      if (startPromiseRef.current) {
        await startPromiseRef.current;
        startPromiseRef.current = null;
      }

      if (audioContextRef.current && processorRef.current) {
        const sampleRate = audioContextRef.current.sampleRate || TARGET_SAMPLE_RATE;
        const samples = downsample(concatFloat32(pcmChunksRef.current), sampleRate, TARGET_SAMPLE_RATE);
        const level = rms(samples);
        pcmChunksRef.current = [];
        stopMediaStream();
        sttLog("pcm stop", {
          sampleRate,
          samples: samples.length,
          seconds: samples.length / TARGET_SAMPLE_RATE,
          rms: Number(level.toFixed(5)),
          liveChars: finalTranscriptRef.current.trim().length,
        });
        if (level < SILENCE_RMS) {
          const live = finalTranscriptRef.current.trim();
          if (live) {
            setTranscript(live);
            onTranscriptChangeRef.current?.(live);
            setIsTranscribing(false);
            return;
          }
          setError("The microphone stayed silent. Check the selected mic, then tap to speak again.");
          setIsTranscribing(false);
          return;
        }
        await transcribeBlob(encodeMonoWav(samples, TARGET_SAMPLE_RATE), "audio/wav; codecs=audio/pcm");
        return;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = () => {
          stopMediaStream();
          const mimeType = recorder.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
          void transcribeBlob(blob, mimeType);
        };
        recorder.stop();
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        return;
      }

      const live = finalTranscriptRef.current.trim();
      sttLog("stop with no recorder", { liveChars: live.length });
      if (live) setTranscript(live);
      setIsTranscribing(false);
    })();
  }, [stopLiveCaptions, stopMediaStream, transcribeBlob]);

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
