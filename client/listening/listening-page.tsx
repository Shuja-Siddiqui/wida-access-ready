import { useMemo } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/user-context";
import {
  getThemeAccentColor,
  getThemeAccentGradient,
  getThemePrimaryColor,
  getThemePrimaryGradient,
} from "@/lib/theme-colors";
import {
  useGetStudentProgress, getGetStudentProgressQueryKey,
  useGetStudentStreak,   getGetStudentStreakQueryKey,
} from "@/api-generated";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import {
  Headphones, ChevronLeft, Play,
  Target, TrendingUp, Zap, BookOpen, Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { LevelRing, SessionBars } from "@/components/level-ring";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionPoint = { date: string; level: number; score: number };

type DomainProgress = {
  domain: string;
  currentLevel: number;
  exitThreshold: number;
  levelLabel: string;
  scaleMin?: number;
  scaleMax?: number;
  sessionHistory?: SessionPoint[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────


// ─── Tips ─────────────────────────────────────────────────────────────────────

const TIPS = [
  {
    icon: Headphones,
    title: "What it tests",
    body: "Listening measures your ability to understand spoken English in everyday conversations and academic contexts — a core skill for the WIDA ACCESS exit exam.",
  },
  {
    icon: TrendingUp,
    title: "How to improve",
    body: "Short daily practice sessions build the most lasting gains. Your score rises gradually as you encounter more vocabulary and sentence patterns.",
  },
  {
    icon: Lightbulb,
    title: "What to expect",
    body: "Sessions include audio passages, comprehension questions, and image-based activities. Academic sessions feature classroom and lecture scenarios.",
  },
];

// ─── Track card ───────────────────────────────────────────────────────────────

function TrackCard({
  title,
  subtitle,
  domain,
  progress,
  accentColor,
  stroke,
  onStart,
  delay,
}: {
  title: string;
  subtitle: string;
  domain: string;
  progress: DomainProgress;
  accentColor: string;
  stroke: string;
  onStart: (domain: string) => void;
  delay: number;
}) {
  const pct = Math.min(100, Math.max(0, (progress.currentLevel / progress.exitThreshold) * 100));
  const sessionCount = progress.sessionHistory?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="h-1.5" style={{ background: accentColor }} />
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-black text-xl text-foreground tracking-tight">{title}</h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black tabular-nums leading-none" style={{ color: stroke }}>
              {progress.currentLevel.toFixed(1)}
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">
              / {progress.exitThreshold} exit
            </p>
          </div>
        </div>

        <div className="flex justify-center py-2">
          <LevelRing
            pct={pct}
            level={progress.currentLevel}
            exitThreshold={progress.exitThreshold}
            color={stroke}
            size={132}
          />
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {sessionCount > 0 ? `Last ${Math.min(sessionCount, 12)} sessions` : "No sessions yet"}
          </p>
          <SessionBars history={progress.sessionHistory ?? []} color={stroke} />
        </div>

        <button
          onClick={() => onStart(domain)}
          className="mt-6 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: stroke, boxShadow: `0 8px 20px ${stroke}40` }}
        >
          <Play className="w-4 h-4 fill-white" />
          Start {title}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ListeningPage() {
  const [, setLocation] = useLocation();
  const { studentId }   = useUser();

  const { data: progressData, isLoading: progressLoading } = useGetStudentProgress(
    studentId ?? "",
    { query: { enabled: !!studentId, queryKey: getGetStudentProgressQueryKey(studentId ?? "") } },
  );
  const { data: streakData, isLoading: streakLoading } = useGetStudentStreak(
    studentId ?? "",
    { query: { enabled: !!studentId, queryKey: getGetStudentStreakQueryKey(studentId ?? "") } },
  );

  const handleStart = (domain: string) => {
    setLocation(`/home?domain=${domain}`);
  };

  const primaryGradient = useMemo(() => getThemePrimaryGradient(), []);
  const primaryColor = useMemo(() => getThemePrimaryColor(), []);
  const accentGradient = useMemo(() => getThemeAccentGradient(), []);
  const accentColor = useMemo(() => getThemeAccentColor(), []);

  if (progressLoading || streakLoading) return <LoadingScreen />;

  const allDomains    = (progressData?.domains ?? []) as DomainProgress[];
  const general       = allDomains.find((d) => d.domain === "listening");
  const academic      = allDomains.find((d) => d.domain === "listening_academic");

  // Fallback if domain data not yet available
  const fallbackProgress: DomainProgress = {
    domain: "listening",
    currentLevel: 0,
    exitThreshold: 4.7,
    levelLabel: "Newcomer",
    sessionHistory: [],
  };

  const genProgress = general   ?? fallbackProgress;
  const acProgress  = academic  ?? { ...fallbackProgress, domain: "listening_academic" };

  const totalSessions = (genProgress.sessionHistory?.length ?? 0) + (acProgress.sessionHistory?.length ?? 0);
  const avgLevel = ((genProgress.currentLevel + acProgress.currentLevel) / 2).toFixed(1);

  return (
    <PageContainer className="py-0 px-0">
      {/* ── Hero section ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-brand-gradient">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 right-1/3 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          {/* Back button */}
          <button
            onClick={() => setLocation("/home")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white font-semibold text-sm mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Practice
          </button>

          {/* Domain header */}
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1.5">Language Domain</p>
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Listening</h1>
              <p className="text-white/80 font-medium mt-2 max-w-lg">
                Train your ear for real-world and academic English through adaptive daily practice sessions.
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 mt-10 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Avg Level</p>
                <p className="text-white font-black text-lg tabular-nums leading-tight">{avgLevel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Total XP</p>
                <p className="text-white font-black text-lg tabular-nums leading-tight">{streakData?.totalXp ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Sessions</p>
                <p className="text-white font-black text-lg tabular-nums leading-tight">{totalSessions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Track cards ───────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Practice Tracks</p>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Choose a track to practice</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrackCard
            title="Everyday"
            subtitle="Talk, stories, and daily life"
            domain="listening"
            progress={genProgress}
            accentColor={primaryGradient}
            stroke={primaryColor}
            onStart={handleStart}
            delay={0.05}
          />
          <TrackCard
            title="Academic"
            subtitle="Lessons, lectures, school talk"
            domain="listening_academic"
            progress={acProgress}
            accentColor={accentGradient}
            stroke={accentColor}
            onStart={handleStart}
            delay={0.12}
          />
        </div>

        {/* ── Tips section ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">About This Domain</p>
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-6">What you should know</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIPS.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
                className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <tip.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-foreground text-base mb-2">{tip.title}</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">{tip.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Quick start CTA ───────────────────────────────────────── */}
        <div className="rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-br from-primary/8 to-accent/8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-lg">Not sure where to start?</h3>
              <p className="text-muted-foreground font-medium text-sm mt-0.5">
                Everyday Listening is the best starting point for most learners.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleStart("listening")}
            className="flex-shrink-0 flex items-center gap-2.5 btn-brand font-bold px-6 py-3.5 rounded-xl text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            Start Everyday Listening
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
