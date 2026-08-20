/**
 * Shared orbit-ring components used across all progress surfaces.
 * LevelRing  — animated SVG arc showing current level vs exit threshold.
 * SessionBars — animated bar strip from session score history.
 *
 * SSR-safe: the SVG arc uses a CSS transition triggered after mount via
 * useEffect, avoiding hydration mismatches that framer-motion/motion.circle
 * causes inside SVG contexts.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type SessionPoint = {
  date: string;
  level: number;
  score: number;
};

// ─── Level Ring ───────────────────────────────────────────────────────────────

export function LevelRing({
  pct,
  level,
  exitThreshold,
  color,
  size = 148,
  strokeWidth = 10,
}: {
  pct: number;
  level: number;
  exitThreshold: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r    = (size - strokeWidth * 2) / 2;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(1, pct / 100) * circ;
  const fid  = `ring-glow-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Start fully hidden; animate to target offset after mount (SSR-safe).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // rAF ensures the initial offset renders first, then transitions.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const circleRef = useRef<SVGCircleElement>(null);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
        aria-hidden
        suppressHydrationWarning
      >
        <defs>
          <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/15"
          suppressHydrationWarning
        />

        {/* Progress arc — CSS transition, SSR-safe */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={mounted ? offset : circ}
          filter={`url(#${fid})`}
          style={{
            transition: mounted
              ? "stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              : "none",
          }}
          suppressHydrationWarning
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.span
          className="text-[2.1rem] font-black tabular-nums leading-none"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        >
          {level.toFixed(1)}
        </motion.span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
          / {exitThreshold}
        </span>
      </div>
    </div>
  );
}

// ─── Session Bars ─────────────────────────────────────────────────────────────

export function SessionBars({
  history,
  color,
  height = 36,
}: {
  history: SessionPoint[];
  color: string;
  height?: number;
}) {
  const bars     = history.slice(-12);
  const maxScore = bars.length > 0 ? Math.max(...bars.map((b) => b.score), 1) : 100;

  if (bars.length === 0) {
    return (
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-muted/25"
            style={{ height: `${20 + i * 5}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {bars.map((s, i) => {
        const heightPct = Math.max(15, (s.score / maxScore) * 100);
        const opacity   = 0.3 + (i / bars.length) * 0.7;
        return (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height:          `${heightPct}%`,
              backgroundColor: color,
              opacity,
              originY:         1,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.8 + i * 0.05, duration: 0.35, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
