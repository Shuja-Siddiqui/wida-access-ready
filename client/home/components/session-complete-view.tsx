import { ArrowRight, Flame, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewportPageLayout } from "@/components/app-layout";
import { PageContainer } from "@/components/page-container";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { DASHBOARD_PANEL_OVERFLOW } from "@/components/dashboard-ui-styles";
import { getThemeConfettiColors } from "@/lib/theme-colors";
import type { AnswerRecord } from "../home-types";

interface SessionCompleteViewProps {
  answers: AnswerRecord[];
  sessionResult: {
    message?: string;
    levelDelta?: number;
    xpEarned?: number;
    streakBonus?: number;
    newStreak?: number;
    attemptFeedback?: {
      summary: string;
      mistakes: Array<{
        question: string;
        whatHappened: string;
        howToImprove: string;
      }>;
      strengths: string[];
      nextSteps: string[];
    } | null;
  } | null;
  onContinue: () => void;
}

function ScoreRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);
  const stroke =
    pct >= 80 ? "hsl(var(--primary))"
    : pct >= 60 ? "hsl(var(--primary) / 0.7)"
    : "hsl(var(--destructive))";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="5"
        opacity={0.6}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}

function formatLevelDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}`;
}

export function SessionCompleteView({ answers, sessionResult, onContinue }: SessionCompleteViewProps) {
  useViewportPageLayout();

  const correctCount = answers.filter(a => a.correct).length;
  const total        = answers.length;
  const pct          = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const sessionStrong = pct >= 70;

  useEffect(() => {
    if (!sessionStrong) return;
    const duration = 1800;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        spread: 45,
        origin: { x: 0.1, y: 0.55 },
        colors: getThemeConfettiColors(),
      });
      confetti({
        particleCount: 3,
        spread: 45,
        origin: { x: 0.9, y: 0.55 },
        colors: getThemeConfettiColors(),
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [sessionStrong]);

  const msg        = sessionResult?.message || (pct >= 80 ? "Strong session." : pct >= 70 ? "Solid session." : pct > 0 ? "Review what was tricky and try again soon." : "Finish counts — aim for more correct answers next time.");
  const levelDelta = sessionResult?.levelDelta ?? 0;
  const xpEarned   = sessionResult?.xpEarned ?? 0;
  const streakBonus = sessionResult?.streakBonus ?? 0;
  const newStreak  = sessionResult?.newStreak ?? 0;
  const feedback   = sessionResult?.attemptFeedback;

  const completionHeadline =
    pct >= 80 ? "Great work today"
    : pct >= 70 ? "Nice effort today"
    : pct > 0 ? "Session complete"
    : "Keep practicing";

  const xpRows = [
    { label: pct >= 70 ? "Session" : "Participation", amount: pct >= 70 ? 10 : 3, show: pct > 0 && pct < 70 },
    { label: "Session", amount: 10, show: pct >= 70 },
    { label: "Accuracy", amount: 10, show: pct >= 80 },
    { label: "Excellence", amount: 5, show: pct >= 90 },
    { label: "Perfect", amount: 10, show: pct === 100 },
    { label: "Level up", amount: 15, show: levelDelta > 0 },
    { label: "Streak", amount: streakBonus, show: streakBonus > 0 },
  ].filter(r => r.show);

  return (
    <PageContainer
      pad={false}
      maxWidth="max-w-3xl"
      shellClassName="flex-1 min-h-0 flex flex-col py-4 sm:py-6"
      className="h-full min-h-0 flex flex-col"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col h-full min-h-0"
      >
        <header className="shrink-0 flex items-center justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <p className="heading-eyebrow mb-1">Session complete</p>
            <h1 className="heading-page text-2xl sm:text-3xl leading-none">{completionHeadline}</h1>
          </div>
          <Button
            onClick={onContinue}
            variant="ghost"
            className="btn-brand h-9 px-4 rounded-lg text-sm font-semibold border-0 shrink-0"
          >
            Dashboard
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className={cn(DASHBOARD_PANEL_OVERFLOW, "w-full border-border/60")}>
            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 bg-primary/[0.04] border-b border-border/50">
              <div className="relative shrink-0">
                <ScoreRing pct={pct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black tabular-nums text-primary">{pct}%</span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {correctCount}/{total} correct
                </p>
                <p className="text-sm font-semibold text-foreground mt-1 line-clamp-2">{msg}</p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {levelDelta > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      <TrendingUp className="w-3 h-3" />
                      {formatLevelDelta(levelDelta)} level
                    </span>
                  )}
                  {levelDelta < 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border/60">
                      <TrendingUp className="w-3 h-3 rotate-180" />
                      {formatLevelDelta(levelDelta)} level
                    </span>
                  )}
                  {newStreak > 1 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/25">
                      <Flame className="w-3 h-3" />
                      {newStreak} day streak
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right pl-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">XP</p>
                <p
                  className={cn(
                    "text-2xl sm:text-3xl font-black tabular-nums leading-none",
                    xpEarned > 0 ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {xpEarned > 0 ? `+${xpEarned}` : "0"}
                </p>
              </div>
            </div>

            {/* Details — content height only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-border/50">
              <section className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">Rewards</h2>
                </div>
                {xpRows.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {xpRows.map((row) => (
                      <div
                        key={`${row.label}-${row.amount}`}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 border border-border/40 px-3 py-2"
                      >
                        <span className="text-[11px] font-medium text-muted-foreground truncate">{row.label}</span>
                        <span className="text-xs font-bold tabular-nums text-primary shrink-0">+{row.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No XP bonuses this time. Hit at least 70% correct to earn the full session reward.
                  </p>
                )}
              </section>

              <section className="p-5 sm:p-6 border-t sm:border-t-0 border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">Coach insight</h2>
                </div>
                {feedback ? (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">{feedback.summary}</p>
                    {feedback.strengths[0] && (
                      <div className="border-l-2 border-accent pl-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-0.5">Strength</p>
                        <p className="text-xs text-foreground/85 line-clamp-2">{feedback.strengths[0]}</p>
                      </div>
                    )}
                    {feedback.nextSteps[0] && (
                      <div className="border-l-2 border-primary pl-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">Focus next</p>
                        <p className="text-xs text-foreground/85 line-clamp-2">{feedback.nextSteps[0]}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Session saved. Keep practicing tomorrow.</p>
                )}
              </section>
            </div>

            <div className="px-5 sm:px-6 py-3 bg-muted/25 border-t border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground">
                Listen to full coaching tips on your dashboard
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </PageContainer>
  );
}
