import { ArrowRight, Flame, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import type { Crumb } from "@/components/breadcrumbs";
import type { AnswerRecord } from "../home-types";

interface SessionCompleteViewProps {
  trail: Crumb[];
  answers: AnswerRecord[];
  sessionResult: {
    message?: string;
    levelDelta?: number;
    xpEarned?: number;
    streakBonus?: number;
    newStreak?: number;
  } | null;
  onContinue: () => void;
}

/** Smooth SVG arc showing score percentage */
function ScoreArc({ pct }: { pct: number }) {
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  const arcColor =
    pct === 100 ? "var(--color-streak-gold)"
    : pct >= 80  ? "var(--color-growth-green)"
    : pct >= 60  ? "var(--color-trust-blue)"
    :              "var(--color-destructive)";

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="8"
        className="text-border opacity-50" />
      {/* Arc */}
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={arcColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        className="drop-shadow-sm"
      />
    </svg>
  );
}

export function SessionCompleteView({ trail, answers, sessionResult, onContinue }: SessionCompleteViewProps) {
  const correctCount = answers.filter(a => a.correct).length;
  const total        = answers.length;
  const pct          = total > 0 ? Math.round((correctCount / total) * 100) : 100;

  useEffect(() => {
    if (pct >= 60) {
      const duration = 2500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF4D8D', '#27AA6B', '#FABB19']
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF4D8D', '#27AA6B', '#FABB19']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [pct]);

  const msg         = sessionResult?.message   || (pct >= 80 ? "Crushed it." : "Keep grinding.");
  const levelDelta  = sessionResult?.levelDelta  ?? 0;
  const xpEarned    = sessionResult?.xpEarned    ?? 10;
  const streakBonus = sessionResult?.streakBonus ?? 0;
  const newStreak   = sessionResult?.newStreak   ?? 0;

  const xpRows = [
    { label: "Session",          amount: 10,           show: true },
    { label: "Accuracy Bonus",   amount: 10,           show: pct >= 80 },
    { label: "Excellence",       amount: 5,            show: pct >= 90 },
    { label: "Perfect Score",    amount: 10,           show: pct === 100 },
    { label: "Level Up",         amount: 15,           show: levelDelta > 0 },
    { label: "Streak Milestone", amount: streakBonus,  show: streakBonus > 0 },
  ].filter(r => r.show);

  const scoreColor =
    pct === 100 ? "text-streak-gold"
    : pct >= 80  ? "text-growth-green"
    : pct >= 60  ? "text-trust-blue"
    :              "text-destructive";

  return (
    <>
      <Navbar trail={trail} />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background px-6 py-10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-trust-blue/10 rounded-full mix-blend-screen filter blur-[100px] opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-growth-green/10 rounded-full mix-blend-screen filter blur-[100px] opacity-60" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border/40 rounded-3xl p-8 shadow-xl relative z-10"
        >
          {/* ── Score ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-6 pb-8 text-center">
            {/* Arc */}
            <div className="relative flex-shrink-0">
              <ScoreArc pct={pct} />
              {/* Number centred in arc */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-4xl font-black tabular-nums ${scoreColor}`}>{pct}%</span>
              </div>
            </div>

            {/* Label block */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-trust-blue">
                Mission Complete
              </p>
              <p className="text-3xl font-black text-foreground leading-tight">
                {correctCount} / {total} <span className="text-xl text-muted-foreground font-semibold">Correct</span>
              </p>
            </div>
          </div>

          {/* ── Personalised message ──────────────────────────── */}
          <div className="bg-muted/50 rounded-xl p-4 mb-8 text-center">
            <p className="text-lg font-bold text-foreground">{msg}</p>
          </div>

          {/* ── XP breakdown ──────────────────────────────────── */}
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden mb-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-achieve-purple/5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-achieve-purple fill-achieve-purple/20" />
                <span className="text-xs font-semibold uppercase tracking-widest text-foreground">XP Earned</span>
              </div>
              <span className="text-2xl font-black text-achieve-purple tabular-nums">+{xpEarned}</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/40">
              {xpRows.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between px-5 py-3 bg-card"
                >
                  <span className="text-sm font-semibold text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-bold text-foreground tabular-nums bg-muted px-2 py-1 rounded-md">+{row.amount}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Level / streak chips ──────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {levelDelta > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.6 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-achieve-purple/10 text-achieve-purple border border-achieve-purple/20"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold text-sm">+{levelDelta} Level</span>
              </motion.div>
            )}
            {newStreak > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.7 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-streak-gold/10 text-streak-gold border border-streak-gold/20"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span className="font-bold text-sm">{newStreak} Day Streak</span>
              </motion.div>
            )}
          </div>

          {/* ── Continue ──────────────────────────────────────── */}
          <Button
            onClick={onContinue}
            className="w-full h-14 text-sm font-bold rounded-xl bg-gradient-to-br from-trust-blue to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300"
          >
            Continue to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

        </motion.div>
      </div>
    </>
  );
}
