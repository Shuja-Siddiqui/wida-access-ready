import { ChevronRight, Flame, Lock, Star, Zap } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DomainCharts, type DomainProgress } from "./domain-charts";
import { DOMAIN_CONFIG, domainLabel } from "../home-types";
import { DashboardSuggestions, type PracticeSuggestion } from "./dashboard-suggestions";
import {
  DASHBOARD_MICRO,
  DASHBOARD_PANEL,
  DASHBOARD_STAT_RANK,
  DASHBOARD_STAT_STREAK,
  DASHBOARD_STAT_XP,
} from "./dashboard-ui-styles";
import { domainBrand, domainBrandStroke, domainDashboardCardShell } from "./domain-brand-colors";

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
      className={cn(domainDashboardCardShell(d.domain), "group w-full text-left flex flex-col")}
    >
      <div
        aria-hidden
        className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-45 pointer-events-none", brand.glow)}
      />
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-90" style={{ background: stroke }} />

      <div className="relative p-5 flex-1 space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-white/20 dark:ring-white/10 shadow-sm",
              brand.bgSoft,
            )}
          >
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

        <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden ring-1 ring-border/10">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${stroke}, hsl(var(--primary) / 0.85))`,
            }}
          />
        </div>
      </div>

      <div
        className={cn(
          "relative px-5 py-3.5 border-t flex justify-between items-center",
          brand.footerWash,
          "border-t",
          brand.panelBorder,
        )}
      >
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
  showCoachSuggestions?: boolean;
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
  shellClass,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  iconWrapClass: string;
  shellClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(shellClass, "p-5 flex flex-col gap-4 min-h-[8.5rem] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md")}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-white/15 shadow-inner",
            iconWrapClass,
          )}
        >
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
  showCoachSuggestions = true,
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
    <PageContainer themeWash>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative space-y-10 sm:space-y-12"
      >
        <PageHeader
          size="hero"
          eyebrow="Welcome back"
          title={studentName || "Student"}
          description="Pick a domain and keep your streak going with today's practice."
          actions={
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
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="space-y-6 lg:col-span-4 xl:col-span-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatTile
                label="Total XP"
                value={totalXp.toLocaleString()}
                icon={Zap}
                iconClass="text-primary"
                iconWrapClass="bg-gradient-to-br from-primary/30 to-trust-blue/15"
                shellClass={DASHBOARD_STAT_XP}
                delay={0.05}
              />
              <StatTile
                label="Day Streak"
                value={currentStreak}
                icon={Flame}
                iconClass="text-logo-gold"
                iconWrapClass="bg-gradient-to-br from-logo-gold/35 to-primary/10"
                shellClass={DASHBOARD_STAT_STREAK}
                delay={0.1}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className={cn(DASHBOARD_STAT_RANK, "p-6 sm:p-7 space-y-6")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={cn(DASHBOARD_MICRO, "mb-2")}>Current Rank</div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none">
                    {rank}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-trust-blue/15 flex items-center justify-center shrink-0 ring-1 ring-white/15 shadow-inner">
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden ring-1 ring-border/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-trust-blue"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>{totalXp.toLocaleString()} XP</span>
                  <span>{nextRankXp.toLocaleString()} to next</span>
                </div>
              </div>
            </motion.div>

            {showCoachSuggestions && (suggestions.length > 0 || nudgeMessage) && onSpeakSuggestion && onStopSpeaking && (
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
              <span className={cn(DASHBOARD_MICRO, "self-start sm:self-auto px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary")}>
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
