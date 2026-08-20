import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpeakingPromptQuestion } from "../types";

interface Props {
  question: SpeakingPromptQuestion;
  onSubmit: (audioBlob: Blob | null) => void;
}

type RecordState = "idle" | "recording" | "recorded";

export function SpeakingPrompt({ question, onSubmit }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimit = question.timeLimit ?? 60;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= timeLimit) {
            stopRecording();
            return e + 1;
          }
          return e + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access is required for speaking activities.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
  };

  const retry = () => {
    setState("idle");
    setElapsed(0);
    setAudioUrl(null);
    blobRef.current = null;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(blobRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Speaking prompt visual"
          className="w-full max-h-52 object-cover rounded-xl border border-border"
        />
      )}

      <div className="rounded-xl bg-muted/60 border border-border p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Speaking Prompt</p>
        <p className="text-base font-semibold text-foreground leading-relaxed">{question.prompt}</p>
      </div>

      {question.cues && question.cues.length > 0 && (
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">You can talk about…</p>
          <ul className="flex flex-col gap-1.5">
            {question.cues.map((cue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 py-4">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.button
              key="record"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              type="button"
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <Mic className="w-8 h-8 text-primary-foreground" />
            </motion.button>
          )}

          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 rounded-full bg-destructive/30"
                />
                <button
                  type="button"
                  onClick={stopRecording}
                  className="relative w-20 h-20 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                >
                  <Square className="w-7 h-7 text-white" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-bold text-destructive tabular-nums">
                  {formatTime(elapsed)} / {formatTime(timeLimit)}
                </span>
              </div>
            </motion.div>
          )}

          {state === "recorded" && (
            <motion.div
              key="recorded"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              {audioUrl && (
                <audio src={audioUrl} controls className="w-full h-10 rounded-lg" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                Recording complete — {formatTime(elapsed)} recorded
              </p>
              <button
                type="button"
                onClick={retry}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Record again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {state === "idle" && (
          <p className="text-xs text-muted-foreground font-medium">Tap the mic to start speaking</p>
        )}
      </div>

      {state === "recorded" && !submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" /> Submit Recording
        </button>
      )}

      {submitted && (
        <p className="text-center text-sm font-semibold text-green-600">Recording submitted!</p>
      )}
    </motion.div>
  );
}
