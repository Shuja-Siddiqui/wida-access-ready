import { CheckCircle2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext } from "../session-context";
import { ListenAgainButton } from "./listen-again-button";
import { SESSION_CARD, SESSION_LABEL } from "./session-ui-styles";
import { cn } from "@/lib/utils";

const BAR_HEIGHTS = [12, 18, 24, 16, 28, 14, 22, 16, 26, 12, 20, 14];

export function SessionAudioPlayer() {
  const {
    session,
    speaking,
    listenedOnce,
    speakPassage,
    onStopSpeaking,
  } = useSessionContext();

  const audioScript = session.content?.data?.audioScript ?? "";
  const handleListen = () => speakPassage(audioScript);
  const audioActive = speaking;

  return (
    <div className={cn(SESSION_CARD, "p-4 sm:p-5 border-l-2 border-l-sky-500/40")}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 ring-1 ring-sky-500/15 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Audio passage</p>
            <p className="text-xs text-muted-foreground truncate">
              {audioActive ? "Playing…" : listenedOnce ? "You can replay anytime" : "Listen before you answer"}
            </p>
          </div>
        </div>
        <AnimatePresence>
          {listenedOnce && !audioActive && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/15 shrink-0"
            >
              <CheckCircle2 className="w-3 h-3" /> Heard
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "flex items-end justify-center gap-0.5 h-10 mb-4 px-2 rounded-lg transition-colors",
          audioActive ? "bg-sky-500/[0.06]" : "bg-muted/30",
        )}
      >
        {BAR_HEIGHTS.map((h, i) => (
          <motion.div
            key={i}
            className={cn("w-0.5 rounded-full", audioActive ? "bg-primary/70" : "bg-primary/20")}
            animate={
              audioActive
                ? { scaleY: [0.4, h / 24, 0.5, h / 28, 0.4], opacity: [0.5, 1, 0.7, 1, 0.5] }
                : { scaleY: 0.35, opacity: 0.35 }
            }
            transition={
              audioActive
                ? { duration: 0.85 + (i % 3) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }
                : { duration: 0.3 }
            }
            style={{ height: `${h}px`, originY: "bottom" }}
          />
        ))}
      </div>

      {!listenedOnce && !audioActive && (
        <p className={cn(SESSION_LABEL, "mb-3 text-center sm:text-left")}>
          Use headphones if you can — then answer below
        </p>
      )}

      <ListenAgainButton
        onListen={handleListen}
        onStop={onStopSpeaking}
        speaking={speaking}
        domain="listening"
        fullWidth
      />
    </div>
  );
}
