import { BookOpen, ChevronRight, Flame, Lock, PenLine, Sparkles, Star, Zap, Trophy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { domainTierToKey } from "../home-types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DomainCharts, ListeningTracksPanel, type DomainProgress, type SessionPoint } from "./domain-charts";
import { DOMAIN_CONFIG, domainLabel } from "../home-types";

// ─── Mobile domain card ───────────────────────────────────────────────────────

function MobileDomainCard({
  d, cfg, index, onStart,
}: {
  d:       DomainProgress;
  cfg:     { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string };
  index:   number;
  onStart: (domain: string) => void;
}) {
  const pct       = Math.min(100, Math.max(0, (d.currentLevel / d.exitThreshold) * 100));
  const colorName = cfg.color.replace("text-", "");
  const stroke    = `hsl(var(--color-${colorName}))`; // Changed to hsl to work with theme tokens if needed, but colorName is like 'trust-blue' so var(--color-trust-blue)

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.3 }}
      onClick={() => onStart(d.domain)}
      className="group w-full bg-card rounded-2xl border border-border/40 overflow-hidden text-left relative transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(to right, var(--color-${colorName}), transparent)` }} />
      <div className="p-5 flex-1">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-2xl tracking-tight text-foreground leading-none">{domainLabel(d.domain)}</h3>
            <div className="text-xs font-semibold uppercase tracking-widest mt-1.5 opacity-80" style={{ color: `var(--color-${colorName})` }}>{d.levelLabel || "Level"}</div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-4xl font-black tabular-nums leading-none" style={{ color: `var(--color-${colorName})` }}>
              {d.currentLevel.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1.5 bg-muted px-2 py-0.5 rounded-md">/ {d.exitThreshold} EXIT</span>
          </div>
        </div>
        
        <div className="h-4 bg-muted rounded-full overflow-hidden relative">
          <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${pct}%`, backgroundColor: `var(--color-${colorName})` }}>
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="px-5 py-4 bg-transparent border-t border-border/40 flex justify-between items-center mt-auto">
         <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Practice Now
         </span>
         <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform group-hover:text-foreground" />
      </div>
    </motion.button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeDashboardViewProps {
  studentName:      string;
  avatarUrl?:       string | null;
  totalXp:          number;
  currentStreak:    number;
  rank:             string;
  nextRankXp:       number;
  domains:          DomainProgress[];
  nudgeMessage?:    string;
  canPractice:      boolean;
  accessReason?:    string;
  showCapsule:      boolean;
  onStartSession:   (domain: string) => void;
  onNavigateBilling: () => void;
  onDemoJump?:      (domain: string, level: number) => Promise<void>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function HomeDashboardView({
  studentName,
  avatarUrl,
  totalXp,
  currentStreak,
  rank,
  nextRankXp,
  domains,
  nudgeMessage,
  canPractice,
  accessReason,
  showCapsule,
  onStartSession,
  onNavigateBilling,
  onDemoJump,
}: HomeDashboardViewProps) {
  const xpProgress = nextRankXp > 0 ? Math.min(100, (totalXp / nextRankXp) * 100) : 0;

  return (
    <>
      <div
        className={cn(
          "min-h-[calc(100vh-5rem)] bg-background px-4 sm:px-6 lg:pr-10 py-6 sm:py-10 pb-32",
          showCapsule ? "md:pl-24 lg:pl-24" : "lg:pl-10",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[1440px] mx-auto space-y-10"
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Welcome Back</h2>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-none">
                {studentName || "Student"}
              </h1>
            </div>
            <Avatar className="hidden sm:flex w-16 h-16 shadow-lg border-2 border-border/40">
              {avatarUrl && (
                <AvatarImage src={`/api/storage${avatarUrl}`} alt={studentName} className="object-cover" />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                {(studentName || "S").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* ── Left column — stats ──────────────────────────────────────── */}
            <div className="space-y-8 lg:col-span-1">

              {/* XP + Streak cards */}
              <div className="grid grid-cols-2 gap-4">

                {/* XP */}
                <div className="bg-card rounded-2xl relative overflow-hidden shadow-sm border border-border/30 p-6 flex flex-col justify-between" style={{ background: "linear-gradient(135deg, hsl(var(--color-achieve-purple) / 0.15), transparent)" }}>
                  <Zap className="w-32 h-32 absolute -bottom-8 -right-8 opacity-[0.07] rotate-12 text-foreground pointer-events-none" />
                  <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-achieve-purple/20 flex items-center justify-center">
                         <Zap className="w-4 h-4 text-achieve-purple" />
                      </div>
                      <span className="font-semibold uppercase tracking-widest text-xs text-muted-foreground">Total XP</span>
                    </div>
                    <div className="text-4xl xl:text-5xl font-black tracking-tight tabular-nums leading-none">
                      {totalXp.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-card rounded-2xl relative overflow-hidden shadow-sm border border-border/30 p-6 flex flex-col justify-between" style={{ background: "linear-gradient(135deg, hsl(var(--color-streak-gold) / 0.15), transparent)" }}>
                  <Flame className="w-32 h-32 absolute -bottom-8 -right-8 opacity-[0.07] -rotate-12 text-foreground pointer-events-none" />
                  <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-streak-gold/20 flex items-center justify-center">
                         <Flame className="w-4 h-4 text-streak-gold" />
                      </div>
                      <span className="font-semibold uppercase tracking-widest text-xs text-muted-foreground">Day Streak</span>
                    </div>
                    <div className="text-4xl xl:text-5xl font-black tracking-tight tabular-nums leading-none">
                      {currentStreak}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rank card */}
              <div className="bg-card border border-border/30 p-6 sm:p-8 rounded-2xl relative shadow-sm" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent)" }}>
                <div className="absolute top-6 right-6 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Current Rank</div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-8 pr-16 leading-none">
                  {rank}
                </div>
                
                <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-full" />
                  </motion.div>
                </div>
                
                <div className="flex justify-between mt-3 text-xs font-semibold text-muted-foreground">
                  <span>{totalXp.toLocaleString()} XP</span>
                  <span>{nextRankXp.toLocaleString()} to next</span>
                </div>
              </div>

              {/* Nudge */}
              {nudgeMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-card rounded-2xl shadow-sm border border-primary/30 p-6 flex items-start gap-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="relative z-10">
                     <div className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-1.5">New Message</div>
                     <div className="font-medium text-lg leading-tight text-foreground">
                        {nudgeMessage}
                     </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Right column — practice ──────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <h2 className="font-black text-3xl sm:text-4xl tracking-tight text-foreground leading-none">Practice Today</h2>
                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border border-primary/20 self-start sm:self-auto">
                  {domains.length} Domain{domains.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Access paused banner */}
              {!canPractice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 bg-destructive/10 text-destructive p-6 sm:p-8 rounded-2xl shadow-sm border border-destructive/20 flex flex-col sm:flex-row items-start gap-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-2xl tracking-tight mb-2">Practice is Paused</div>
                    <div className="font-medium text-sm opacity-90 leading-relaxed max-w-lg">
                      {accessReason === "plan_inactive"
                        ? "Your teacher's subscription has expired. Ask them to renew to keep practicing."
                        : accessReason === "no_plan"
                          ? "An active plan is required to start sessions."
                          : "Your account access is currently inactive."}
                    </div>
                    {accessReason === "no_plan" && (
                      <button
                        onClick={onNavigateBilling}
                        className="mt-6 bg-destructive text-white font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-sm transition-all hover:bg-destructive/90 active:scale-95 text-xs"
                      >
                        Get a Plan
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Demo jump controls */}
              {onDemoJump && domains.some((d) => d.domain === "listening") && (
                <div className="mb-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl flex flex-wrap items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold uppercase tracking-widest text-xs mr-2">
                    Demo Jump
                  </div>
                  <button
                    onClick={() => onDemoJump("listening", 1.0)}
                    className="bg-card border border-border text-foreground font-semibold text-xs px-4 py-2 rounded-lg hover:bg-muted/60 transition-all shadow-sm"
                  >
                    L1–2 (Image)
                  </button>
                  <button
                    onClick={() => onDemoJump("listening", 3.0)}
                    className="bg-card border border-border text-foreground font-semibold text-xs px-4 py-2 rounded-lg hover:bg-muted/60 transition-all shadow-sm"
                  >
                    L3+ (Text)
                  </button>
                </div>
              )}

              {/* Desktop chart grid */}
              <div className="hidden lg:block">
                <DomainCharts
                  domains={domains as Parameters<typeof DomainCharts>[0]["domains"]}
                  config={DOMAIN_CONFIG}
                  fallbackCfg={DOMAIN_CONFIG.listening}
                  onSelect={canPractice ? onStartSession : () => {}}
                />
              </div>

              {/* Mobile card list */}
              <div className={`flex flex-col gap-6 lg:hidden ${!canPractice ? "opacity-50 grayscale pointer-events-none" : ""}`}>
                {(() => {
                  const genL  = domains.find((d) => d.domain === "listening");
                  const acL   = domains.find((d) => d.domain === "listening_academic");
                  const rest  = domains.filter((d) => d.domain !== "listening" && d.domain !== "listening_academic");
                  const genCfg = DOMAIN_CONFIG.listening;
                  const acCfg  = DOMAIN_CONFIG.listening_academic ?? DOMAIN_CONFIG.listening;

                  return (
                    <>
                      {/* Merged listening card */}
                      {genL && acL && (
                        <motion.div
                          key="listening-merged"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="w-full rounded-3xl bg-card border border-border/40 overflow-hidden shadow-sm"
                        >
                          <div className="relative px-5 py-5 text-white overflow-hidden bg-brand-spectrum">
                            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
                            <div>
                              <h3 className="font-black text-2xl tracking-tight leading-none">Listening</h3>
                              <p className="text-xs text-white/80 mt-1.5">Everyday talk or classroom English</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <ListeningTracksPanel
                              general={genL}
                              academic={acL}
                              compact
                              onSelectEveryday={() => onStartSession(domainTierToKey("listening", "general"))}
                              onSelectAcademic={() => onStartSession(domainTierToKey("listening", "academic"))}
                            />
                          </div>
                        </motion.div>
                      )}

                      {genL && !acL && (
                        <MobileDomainCard key="listening" d={genL} cfg={genCfg} index={0} onStart={onStartSession} />
                      )}
                      {acL && !genL && (
                        <MobileDomainCard key="listening_academic" d={acL} cfg={acCfg} index={0} onStart={onStartSession} />
                      )}

                      {rest.map((d, i) => {
                        const cfg = DOMAIN_CONFIG[d.domain] ?? DOMAIN_CONFIG.listening;
                        return (
                          <MobileDomainCard
                            key={d.domain}
                            d={d}
                            cfg={cfg}
                            index={(genL && acL ? 1 : 0) + i + 1}
                            onStart={onStartSession}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
