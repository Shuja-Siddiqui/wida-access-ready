import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { domainLabel } from "../home-types";
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {domains.map((d, index) => (
        <SingleDomainCard
          key={d.domain}
          d={d}
          cfg={config[d.domain] || fallbackCfg}
          onSelect={onSelect}
          index={index}
        />
      ))}
    </div>
  );
}
