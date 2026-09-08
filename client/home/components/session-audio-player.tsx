import { CheckCircle2, Square, Volume2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext } from "../session-context";

const BAR_HEIGHTS = [18, 28, 38, 28, 44, 22, 36, 26, 40, 20, 34, 24];

export function SessionAudioPlayer() {
  const { session, speaking, listenedOnce, speakPassage, onStopSpeaking } =
    useSessionContext();

  const audioScript = session.content.data.audioScript ?? "";

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* gradient background */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{ background: "linear-gradient(135deg, var(--color-trust-blue) 0%, #FF85B3 100%)" }}
      />
      <div className="absolute inset-0 border border-trust-blue/15 rounded-2xl" />

      <div className="relative p-5 space-y-5">
        {/* header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-trust-blue/15 flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5 text-trust-blue" />
            </div>
            <span className="text-sm font-semibold text-trust-blue tracking-wide">Listening Passage</span>
          </div>
          <AnimatePresence>
            {listenedOnce && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-[11px] font-semibold text-growth-green bg-growth-green/10 px-2.5 py-1 rounded-full border border-growth-green/20"
              >
                <CheckCircle2 className="w-3 h-3" /> Listened
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* play button + waveform */}
        <div className="flex items-center gap-5">
          <button
            onClick={speaking ? onStopSpeaking : () => speakPassage(audioScript)}
            className={`relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
              speaking
                ? "bg-destructive hover:bg-destructive/90 scale-95"
                : "bg-trust-blue hover:bg-trust-blue/90 hover:scale-105 active:scale-95"
            }`}
          >
            {speaking && (
              <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" />
            )}
            {speaking
              ? <Square className="w-5 h-5 relative z-10" />
              : <Play   className="w-5 h-5 relative z-10 translate-x-0.5" />
            }
          </button>

          {/* waveform bars */}
          <div className="flex-1 flex items-center justify-around h-12 gap-[3px] overflow-hidden">
            {BAR_HEIGHTS.map((h, i) => (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${speaking ? "bg-trust-blue" : "bg-trust-blue/25"}`}
                animate={
                  speaking
                    ? { scaleY: [1, h / 20, 0.6, h / 26, 1], opacity: [0.7, 1, 0.8, 1, 0.7] }
                    : { scaleY: 1, opacity: 0.25 }
                }
                transition={
                  speaking
                    ? { duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }
                    : { duration: 0.3 }
                }
                style={{ height: `${h}px`, originY: "bottom" }}
              />
            ))}
          </div>

          <span className="text-xs font-medium text-muted-foreground w-16 text-right flex-shrink-0">
            {speaking ? "Playing…" : listenedOnce ? "Play again" : "Tap play"}
          </span>
        </div>

        {!listenedOnce && !speaking && (
          <p className="text-center text-muted-foreground text-xs">
            Listen to the passage, then answer the question below
          </p>
        )}
      </div>
    </div>
  );
}
