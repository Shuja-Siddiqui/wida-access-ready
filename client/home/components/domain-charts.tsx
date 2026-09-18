import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { domainLabel, domainTierToKey } from "../home-types";
import { LevelRing, SessionBars } from "@/components/level-ring";

export type SessionPoint = {
  date: string;
  level: number;
  score: number;
};

export type DomainProgress = {
  domain: string;
  currentLevel: number;
  exitThreshold: number;
  levelLabel: string;
  scaleMin: number;
  scaleMax: number;
  sessionHistory: SessionPoint[];
};

type DomainCfg = {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  btnBg: string;
  label?: string;
};

function ListeningTrackTile({
  title,
  subtitle,
  level,
  exitThreshold,
  history,
  accent,
  accentSoft,
  onStart,
}: {
  title: string;
  subtitle: string;
  level: number;
  exitThreshold: number;
  history: SessionPoint[];
  accent: string;
  accentSoft: string;
  onStart: () => void;
}) {
  const pct = Math.min(100, Math.max(0, (level / exitThreshold) * 100));
  return (
    <div
      className="relative flex flex-col rounded-2xl border border-white/10 p-5 overflow-hidden"
      style={{ background: accentSoft }}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25" style={{ background: accent }} />
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-black text-lg leading-tight text-foreground">{title}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-black tabular-nums leading-none" style={{ color: accent }}>
            {level.toFixed(1)}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">
            / {exitThreshold} exit
          </p>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <SessionBars history={history} color={accent} />

      <button
        onClick={onStart}
        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
        style={{ background: accent, boxShadow: `0 8px 20px ${accent}40` }}
      >
        Start {title}
      </button>
    </div>
  );
}

export function ListeningTracksPanel({
  general,
  academic,
  onSelectEveryday,
  onSelectAcademic,
  compact = false,
}: {
  general: Pick<DomainProgress, "currentLevel" | "exitThreshold" | "sessionHistory">;
  academic: Pick<DomainProgress, "currentLevel" | "exitThreshold" | "sessionHistory">;
  onSelectEveryday: () => void;
  onSelectAcademic: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
      <ListeningTrackTile
        title="Everyday"
        subtitle="Talk, stories, and daily life"
        level={general.currentLevel}
        exitThreshold={general.exitThreshold}
        history={general.sessionHistory ?? []}
        accent="var(--color-trust-blue)"
        accentSoft="linear-gradient(160deg, color-mix(in srgb, var(--color-trust-blue) 16%, transparent), transparent 70%)"
        onStart={onSelectEveryday}
      />
      <ListeningTrackTile
        title="Academic"
        subtitle="Lessons, lectures, school talk"
        level={academic.currentLevel}
        exitThreshold={academic.exitThreshold}
        history={academic.sessionHistory ?? []}
        accent="#6366f1"
        accentSoft="linear-gradient(160deg, rgba(99,102,241,0.16), transparent 70%)"
        onStart={onSelectAcademic}
      />
    </div>
  );
}

// ─── Merged Listening Card ────────────────────────────────────────────────────

function MergedListeningCard({
  general, academic, onSelect, index,
}: {
  general:  DomainProgress;
  academic: DomainProgress;
  genCfg:   DomainCfg;
  acCfg:    DomainCfg;
  onSelect: (domain: string) => void;
  index:    number;
}) {
  const [, setLocation] = useLocation();
  const totalSessions = (general.sessionHistory?.length ?? 0) + (academic.sessionHistory?.length ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      className="col-span-2 rounded-3xl border border-border/40 overflow-hidden bg-card shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative px-6 md:px-8 py-6 text-white overflow-hidden bg-brand-spectrum">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-16 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Language domain</p>
            <h3 className="font-black text-2xl md:text-3xl tracking-tight leading-none mt-1">Listening</h3>
            <p className="text-sm text-white/80 mt-2 max-w-md">
              Pick a track — everyday talk or classroom English.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
              {totalSessions} sessions
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setLocation("/listening"); }}
              className="text-xs font-bold text-white/90 hover:text-white underline-offset-4 hover:underline"
            >
              View details →
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <ListeningTracksPanel
          general={general}
          academic={academic}
          onSelectEveryday={() => onSelect(domainTierToKey("listening", "general"))}
          onSelectAcademic={() => onSelect(domainTierToKey("listening", "academic"))}
        />
      </div>
    </motion.div>
  );
}

// ─── Single Domain Card ───────────────────────────────────────────────────────

function SingleDomainCard({
  d, cfg, onSelect, index,
}: {
  d: DomainProgress;
  cfg: DomainCfg;
  onSelect: (domain: string) => void;
  index: number;
}) {
  const colorName = cfg.color.replace("text-", "");
  const stroke    = `var(--color-${colorName})`;
  const pct       = Math.min(100, Math.max(0, (d.currentLevel / d.exitThreshold) * 100));
  const sessCount = d.sessionHistory?.length ?? 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => onSelect(d.domain)}
      className="group w-full rounded-2xl bg-card border border-border/40 text-left relative overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl flex flex-col"
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(to right, ${stroke}, transparent)` }}
      />

      <div className="p-6 flex-1 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="block font-black text-xl tracking-tight leading-none text-foreground">
              {domainLabel(d.domain)}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest mt-0.5 block opacity-80"
              style={{ color: stroke }}
            >
              {d.levelLabel || "Level"}
            </span>
          </div>
          <ChevronRight
            className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </div>

        {/* Ring — centrepiece */}
        <div className="flex justify-center py-1">
          <LevelRing
            pct={pct}
            level={d.currentLevel}
            exitThreshold={d.exitThreshold}
            color={stroke}
            size={148}
          />
        </div>

        {/* Session score bars */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {sessCount > 0 ? `Last ${Math.min(sessCount, 12)} sessions` : "No sessions yet"}
          </span>
          <SessionBars history={d.sessionHistory ?? []} color={stroke} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-transparent border-t border-border/40 flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {sessCount > 0 ? `${sessCount} sessions` : "New"}
        </span>
        <span
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors"
          style={{ color: stroke }}
        >
          Practice <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DomainCharts({
  domains,
  config,
  fallbackCfg,
  onSelect,
}: {
  domains: DomainProgress[];
  config: Record<string, DomainCfg>;
  fallbackCfg: DomainCfg;
  onSelect: (domain: string) => void;
}) {
  const generalListening  = domains.find((d) => d.domain === "listening");
  const academicListening = domains.find((d) => d.domain === "listening_academic");
  const otherDomains      = domains.filter(
    (d) => d.domain !== "listening" && d.domain !== "listening_academic",
  );

  let cardIndex = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {generalListening && academicListening && (
        <MergedListeningCard
          general={generalListening}
          academic={academicListening}
          genCfg={config["listening"] || fallbackCfg}
          acCfg={config["listening_academic"] || fallbackCfg}
          onSelect={onSelect}
          index={cardIndex++}
        />
      )}
      {generalListening && !academicListening && (
        <SingleDomainCard d={generalListening} cfg={config["listening"] || fallbackCfg} onSelect={onSelect} index={cardIndex++} />
      )}
      {academicListening && !generalListening && (
        <SingleDomainCard d={academicListening} cfg={config["listening_academic"] || fallbackCfg} onSelect={onSelect} index={cardIndex++} />
      )}
      {otherDomains.map((d) => (
        <SingleDomainCard
          key={d.domain}
          d={d}
          cfg={config[d.domain] || fallbackCfg}
          onSelect={onSelect}
          index={cardIndex++}
        />
      ))}
    </div>
  );
}
