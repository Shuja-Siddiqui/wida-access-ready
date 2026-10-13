import { ChevronRight, Flame, Lock, Star, Zap } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageContainer } from "@/components/page-container";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DomainCharts, type DomainProgress } from "./domain-charts";
import { DOMAIN_CONFIG, domainLabel } from "../home-types";
import { DashboardSuggestions, type PracticeSuggestion } from "./dashboard-suggestions";
import { DASHBOARD_MICRO, DASHBOARD_PANEL, DASHBOARD_PANEL_HOVER } from "./dashboard-ui-styles";
import { domainBrand, domainBrandStroke } from "./domain-brand-colors";

function MobileDomainCard({
  d, cfg, index, onStart,
}: {
  d:       DomainProgress;
  cfg:     { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string };
  index:   number;
  onStart: (domain: string) => void;
}) {
  const brand = domainBrand(d.domain);
  const stroke = domainBrandStroke(d.domain);
  const pct = Math.min(100, Math.max(0, (d.currentLevel / d.exitThreshold) * 100));
  const Icon = cfg.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.28 }}
      onClick={() => onStart(d.domain)}
      className={cn(
        DASHBOARD_PANEL_HOVER,
        "group w-full overflow-hidden text-left relative flex flex-col",
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: stroke }} />

      <div className="p-5 flex-1 space-y-5">
        <div className="flex items-start gap-4">
          <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", brand.bgSoft)}>
            <Icon className={cn("w-5 h-5", brand.text)} />
          </div>
          <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-2xl tracking-tight text-foreground leading-none">
                {domainLabel(d.domain)}
              </h3>
              <div
                className="text-xs font-semibold uppercase tracking-widest mt-1.5 opacity-80"
                style={{ color: stroke }}
              >
                {d.levelLabel || "Level"}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className="text-3xl font-black tabular-nums leading-none"
                style={{ color: stroke }}
              >
                {d.currentLevel.toFixed(1)}
              </span>
              <span className={cn(DASHBOARD_MICRO, "block mt-1")}>
                / {d.exitThreshold} exit
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 bg-muted/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: stroke }}
          />
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-border/10 flex justify-between items-center">
        <span className={DASHBOARD_MICRO}>Practice now</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
      </div>
    </motion.button>
  );
}

interface HomeDashboardViewProps {
  studentName:      string;
  avatarUrl?:       string | null;
  totalXp:          number;
  currentStreak:    number;
  rank:             string;
  nextRankXp:       number;
  domains:          DomainProgress[];
  nudgeMessage?:    string;
  suggestions?:     PracticeSuggestion[];
  speaking?:        boolean;
  onSpeakSuggestion?: (text: string) => void;
  onStopSpeaking?:  () => void;
  canPractice:      boolean;
  accessReason?:    string;
  onStartSession:   (domain: string) => void;
  onNavigateBilling: () => void;
}

function StatTile({
  label,
  value,
  icon: Icon,
  iconClass,
  iconWrapClass,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  iconWrapClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(DASHBOARD_PANEL, "p-5 flex flex-col gap-4 min-h-[8.5rem]")}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconWrapClass)}>
          <Icon className={cn("w-4 h-4", iconClass)} />
        </div>
        <span className={DASHBOARD_MICRO}>{label}</span>
      </div>
      <div className="text-4xl xl:text-[2.75rem] font-black tracking-tight tabular-nums leading-none text-foreground mt-auto">
        {value}
      </div>
    </motion.div>
  );
}

export function HomeDashboardView({
  studentName,
  avatarUrl,
  totalXp,
  currentStreak,
  rank,
  nextRankXp,
  domains,
  nudgeMessage,
  suggestions = [],
  speaking = false,
  onSpeakSuggestion,
  onStopSpeaking,
  canPractice,
  accessReason,
  onStartSession,
  onNavigateBilling,
}: HomeDashboardViewProps) {
  const xpProgress = nextRankXp > 0 ? Math.min(100, (totalXp / nextRankXp) * 100) : 0;

  return (
    <PageContainer shellClassName="py-6 sm:py-10 relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/[0.05] to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative space-y-10 sm:space-y-12"
      >
        <header className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h2 className="heading-eyebrow mb-2">Welcome Back</h2>
            <h1 className="heading-page text-4xl sm:text-5xl leading-none truncate">
              {studentName || "Student"}
            </h1>
          </div>
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 border border-border/20 shadow-sm">
            {avatarUrl && (
              <AvatarImage
                src={`/api/storage${avatarUrl}`}
                alt={studentName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-black">
              {(studentName || "S").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="space-y-6 lg:col-span-4 xl:col-span-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatTile
                label="Total XP"
                value={totalXp.toLocaleString()}
                icon={Zap}
                iconClass="text-primary"
                iconWrapClass="bg-primary/15"
                delay={0.05}
              />
              <StatTile
                label="Day Streak"
                value={currentStreak}
                icon={Flame}
                iconClass="text-streak-gold"
                iconWrapClass="bg-streak-gold/15"
                delay={0.1}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className={cn(DASHBOARD_PANEL, "p-6 sm:p-7 space-y-6")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={cn(DASHBOARD_MICRO, "mb-2")}>Current Rank</div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none">
                    {rank}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="h-2 bg-muted/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>{totalXp.toLocaleString()} XP</span>
                  <span>{nextRankXp.toLocaleString()} to next</span>
                </div>
              </div>
            </motion.div>

            {(suggestions.length > 0 || nudgeMessage) && onSpeakSuggestion && onStopSpeaking && (
              <DashboardSuggestions
                suggestions={suggestions}
                nudgeMessage={nudgeMessage}
                speaking={speaking}
                onSpeak={onSpeakSuggestion}
                onStopSpeaking={onStopSpeaking}
              />
            )}
          </div>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div>
                <p className="heading-eyebrow mb-1.5">Today</p>
                <h2 className="font-black text-3xl sm:text-4xl tracking-tight text-foreground leading-none">
                  Practice Today
                </h2>
              </div>
              <span className={cn(DASHBOARD_MICRO, "self-start sm:self-auto px-3 py-1.5 rounded-full bg-muted/40 border border-border/10")}>
                {domains.length} domain{domains.length !== 1 ? "s" : ""}
              </span>
            </div>

            {!canPractice && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  DASHBOARD_PANEL,
                  "p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 border-destructive/20 bg-destructive/[0.06]",
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-2xl tracking-tight mb-1.5 text-destructive">
                    Practice is Paused
                  </div>
                  <div className="font-medium text-sm text-destructive/90 leading-relaxed max-w-lg">
                    {accessReason === "plan_inactive"
                      ? "Your teacher's subscription has expired. Ask them to renew to keep practicing."
                      : accessReason === "no_plan"
                        ? "An active plan is required to start sessions."
                        : "Your account access is currently inactive."}
                  </div>
                  {accessReason === "no_plan" && (
                    <button
                      onClick={onNavigateBilling}
                      className="mt-4 bg-destructive text-destructive-foreground font-bold uppercase tracking-widest px-5 py-2 rounded-xl transition-colors hover:bg-destructive/90 active:scale-[0.98] text-xs"
                    >
                      Get a Plan
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            <div className={cn(!canPractice && "opacity-50 pointer-events-none grayscale")}>
              <div className="hidden lg:block">
                <DomainCharts
                  domains={domains}
                  config={DOMAIN_CONFIG}
                  fallbackCfg={DOMAIN_CONFIG.listening}
                  onSelect={canPractice ? onStartSession : () => {}}
                />
              </div>

              <div className="flex flex-col gap-4 lg:hidden">
                {domains.map((d, i) => {
                  const cfg = DOMAIN_CONFIG[d.domain] ?? DOMAIN_CONFIG.listening;
                  return (
                    <MobileDomainCard
                      key={d.domain}
                      d={d}
                      cfg={cfg}
                      index={i}
                      onStart={onStartSession}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </PageContainer>
  );
}
