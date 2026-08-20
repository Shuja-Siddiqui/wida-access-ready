import { useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { domainLabel, domainTierToKey } from "../home-types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildSeries(
  history: SessionPoint[],
  currentLevel: number,
): { label: string; level: number; score: number }[] {
  if (history.length === 0) {
    return [
      { label: "Start", level: currentLevel, score: 0 },
      { label: "Now",   level: currentLevel, score: 0 },
    ];
  }
  const slice = history.slice(-10);
  const points = slice.map((s) => ({
    label: fmtDate(s.date),
    level: s.level,
    score: s.score,
  }));
  const last = slice[slice.length - 1];
  if (last && Math.abs(last.level - currentLevel) > 0.05) {
    points.push({ label: "Now", level: currentLevel, score: 0 });
  }
  if (points.length < 2) {
    points.unshift({ label: "Start", level: currentLevel, score: 0 });
  }
  return points;
}

function buildMergedSeries(
  genHistory: SessionPoint[], genLevel: number,
  acHistory:  SessionPoint[], acLevel:  number,
): { label: string; everyday: number | null; academic: number | null }[] {
  const genPts = buildSeries(genHistory, genLevel);
  const acPts  = buildSeries(acHistory, acLevel);

  const ensureTwo = (pts: { label: string; level: number }[], startLevel: number) => {
    if (pts.length < 2) return [{ label: "Start", level: startLevel }, ...pts];
    return pts;
  };
  const gen = ensureTwo(genPts, genLevel);
  const ac  = ensureTwo(acPts,  acLevel);

  const len = Math.max(gen.length, ac.length);
  return Array.from({ length: len }, (_, i) => ({
    label:    gen[i]?.label ?? ac[i]?.label ?? String(i + 1),
    everyday: gen[i]?.level  ?? null,
    academic: ac[i]?.level   ?? null,
  }));
}

const tooltipStyle = {
  background:   "var(--color-card)",
  border:       "1px solid hsl(var(--border) / 0.4)",
  borderRadius: 8,
  fontSize:     12,
  fontWeight:   700,
  textTransform: "uppercase" as const,
  color:        "var(--color-foreground)",
  boxShadow:    "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  padding:      "12px",
};
const tooltipLabelStyle = { color: "var(--color-muted-foreground)", fontWeight: 700, marginBottom: "4px" };

// LevelRing and SessionBars are imported from @/components/level-ring

// ─── Merged Listening Card ────────────────────────────────────────────────────

function MergedListeningCard({
  general, academic, genCfg, acCfg, onSelect, index,
}: {
  general:  DomainProgress;
  academic: DomainProgress;
  genCfg:   DomainCfg;
  acCfg:    DomainCfg;
  onSelect: (domain: string) => void;
  index:    number;
}) {
  const [, setLocation] = useLocation();
  const data = useMemo(
    () => buildMergedSeries(
      general.sessionHistory  ?? [], general.currentLevel,
      academic.sessionHistory ?? [], academic.currentLevel,
    ),
    [general, academic],
  );
  const totalSessions = (general.sessionHistory?.length ?? 0) + (academic.sessionHistory?.length ?? 0);

  const evColor = "var(--color-trust-blue)";
  const acColor = "#6366f1";

  const evPct = Math.min(100, Math.max(0, (general.currentLevel  / general.exitThreshold)  * 100));
  const acPct = Math.min(100, Math.max(0, (academic.currentLevel / academic.exitThreshold) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      className="col-span-2 rounded-2xl bg-card border border-border/40 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 relative"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(to right, ${evColor}, ${acColor}, transparent)` }}
      />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-trust-blue/15 flex items-center justify-center">
              <genCfg.icon className="w-6 h-6 text-trust-blue" />
            </div>
            <div>
              <span className="block font-black text-2xl tracking-tight leading-none text-foreground">
                Listening
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {totalSessions} sessions
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setLocation("/listening"); }}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                >
                  View details →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two rings */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Everyday ring */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-trust-blue">
              Everyday
            </span>
            <LevelRing
              pct={evPct}
              level={general.currentLevel}
              exitThreshold={general.exitThreshold}
              color={evColor}
              size={136}
            />
            <SessionBars history={general.sessionHistory ?? []} color={evColor} />
          </div>

          {/* Academic ring */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
              Academic
            </span>
            <LevelRing
              pct={acPct}
              level={academic.currentLevel}
              exitThreshold={academic.exitThreshold}
              color={acColor}
              size={136}
            />
            <SessionBars history={academic.sessionHistory ?? []} color={acColor} />
          </div>
        </div>

        {/* Trend chart */}
        <div className="h-36 -mx-2 relative z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="listGradAc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="listGradEv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--color-trust-blue)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-trust-blue)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis domain={[(d: number) => d - 0.3, (d: number) => d + 0.3]} hide />
              <Tooltip
                cursor={{ stroke: "var(--color-border)", strokeWidth: 2, strokeDasharray: "4 4" }}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(value: number, name: string) =>
                  [value.toFixed(1), name === "everyday" ? "EVERYDAY" : "ACADEMIC"]
                }
              />
              <Area type="monotone" dataKey="academic"  name="academic"
                stroke="#6366f1" strokeWidth={2.5} fill="url(#listGradAc)"
                dot={false} connectNulls isAnimationActive
              />
              <Area type="monotone" dataKey="everyday" name="everyday"
                stroke="var(--color-trust-blue)" strokeWidth={2.5} fill="url(#listGradEv)"
                dot={false} connectNulls isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Start buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => onSelect(domainTierToKey("listening", "general"))}
            className="group flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-trust-blue to-[#d83c74] text-white text-xs font-bold uppercase tracking-widest shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 transition-all"
          >
            <genCfg.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Start Everyday
          </button>
          <button
            onClick={() => onSelect(domainTierToKey("listening", "academic"))}
            className="group flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xs font-bold uppercase tracking-widest shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] active:translate-y-0 transition-all"
          >
            <acCfg.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Start Academic
          </button>
        </div>
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
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `var(--color-${colorName}, hsl(var(--muted))) / 0.15`, color: stroke }}
            >
              <cfg.icon className="w-5 h-5" />
            </div>
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
