import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Square, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageDescribeQuestion } from "../types";

interface Props {
  question: ImageDescribeQuestion;
  onSubmit: (answer: string | Blob) => void;
}

export function ImageDescribe({ question, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      blobRef.current = blob;
      setAudioUrl(URL.createObjectURL(blob));
      setRecording(false);
      setRecorded(true);
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
  };

  const retry = () => {
    setRecorded(false);
    setAudioUrl(null);
    blobRef.current = null;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (question.mode === "writing") onSubmit(text.trim());
    else onSubmit(blobRef.current!);
  };

  const canSubmit = question.mode === "writing" ? text.trim().length > 0 : recorded;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-sm">
        <img
          src={question.imageUrl}
          alt="Describe this picture"
          className="w-full max-h-64 object-cover"
        />
        <div className="absolute top-2 right-2 rounded-full bg-black/50 text-white text-xs font-bold px-2.5 py-1">
          Look carefully
        </div>
      </div>

      <div className="rounded-xl bg-muted/60 border border-border p-4">
        <p className="text-base font-bold text-foreground">{question.prompt}</p>
      </div>

      {question.cues && question.cues.length > 0 && (
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Think about…</p>
          <ul className="flex flex-col gap-1">
            {question.cues.map((cue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {question.mode === "writing" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          placeholder="Describe the picture in your own words…"
          rows={4}
          className={cn(
            "w-full rounded-xl border-2 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none transition-colors",
            submitted ? "border-border opacity-70" : "border-border focus:border-primary",
          )}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          {!recorded && (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all",
                recording ? "bg-destructive" : "bg-primary hover:scale-105",
              )}
            >
              {recording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-primary-foreground" />}
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-bold text-destructive">Recording…</span>
            </div>
          )}
          {recorded && audioUrl && (
            <div className="w-full flex flex-col items-center gap-2">
              <audio src={audioUrl} controls className="w-full h-10 rounded-lg" />
              <button
                type="button"
                onClick={retry}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Record again
              </button>
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {question.mode === "writing" ? "Submit Writing" : "Submit Recording"}
        </button>
      )}

      {submitted && (
        <p className="text-center text-sm font-semibold text-green-600">Submitted!</p>
      )}
    </motion.div>
  );
}
