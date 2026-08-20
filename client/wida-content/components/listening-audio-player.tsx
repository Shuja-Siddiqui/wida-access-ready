import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  audioScript: string;
  audioUrl?: string;
  onPlayed?: () => void;
  compact?: boolean;
}

export function ListeningAudioPlayer({ audioScript, audioUrl, onPlayed, compact = false }: Props) {
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => { setPlaying(false); setPlayed(true); onPlayed?.(); };
      }
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
        setPlayed(true);
        onPlayed?.();
      }
    } else {
      setPlayed(true);
      onPlayed?.();
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 border-primary/30 bg-primary/5 flex flex-col items-center gap-3",
      compact ? "p-3" : "p-5",
    )}>
      <div className={cn(
        "rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center",
        compact ? "w-10 h-10" : "w-14 h-14",
      )}>
        <Volume2 className={cn("text-primary", compact ? "w-5 h-5" : "w-6 h-6")} />
      </div>

      {!compact && (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Listen carefully
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "flex items-center gap-2 rounded-xl font-bold transition-all text-sm",
            compact ? "px-3 py-1.5" : "px-5 py-2.5",
            playing
              ? "bg-primary text-primary-foreground"
              : "bg-card border-2 border-primary text-primary hover:bg-primary/10",
          )}
        >
          {playing
            ? <><Pause className="w-4 h-4" /> Pause</>
            : played
            ? <><RotateCcw className="w-4 h-4" /> Play Again</>
            : <><Play className="w-4 h-4" /> Play Audio</>}
        </button>

        {playing && (
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                className="w-1 bg-primary rounded-full origin-bottom"
                style={{ height: 14 }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowScript(v => !v)}
        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {showScript ? "Hide transcript" : "Show transcript"}
      </button>

      <AnimatePresence>
        {showScript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="rounded-xl bg-background border border-border p-3 text-sm text-foreground leading-relaxed italic">
              "{audioScript}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
