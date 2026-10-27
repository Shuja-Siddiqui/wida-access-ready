import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { domainLabel } from "../home-types";
import { LevelRing, SessionBars } from "@/components/level-ring";
import { DASHBOARD_MICRO } from "./dashboard-ui-styles";
import { domainBrand, domainBrandStroke, domainDashboardCardShell } from "./domain-brand-colors";

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
  const brand = domainBrand(d.domain);
  const stroke = domainBrandStroke(d.domain);
  const pct = Math.min(100, Math.max(0, (d.currentLevel / d.exitThreshold) * 100));
  const sessCount = d.sessionHistory?.length ?? 0;
  const Icon = cfg.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.28 }}
      onClick={() => onSelect(d.domain)}
      className={cn(domainDashboardCardShell(d.domain), "group w-full text-left flex flex-col")}
    >
      <div
        aria-hidden
        className={cn("absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl opacity-50 pointer-events-none", brand.glow)}
      />
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-90" style={{ background: stroke }} />

      <div className="relative p-6 flex-1 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-white/20 dark:ring-white/10 shadow-sm",
                brand.bgSoft,
              )}
            >
              <Icon className={cn("w-5 h-5", brand.text)} />
            </div>
            <div>
              <span className="block font-black text-xl tracking-tight leading-none text-foreground">
                {domainLabel(d.domain)}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest mt-1 block opacity-80"
                style={{ color: stroke }}
              >
                {d.levelLabel || "Level"}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>

        <div className="flex justify-center py-1">
          <LevelRing
            pct={pct}
            level={d.currentLevel}
            exitThreshold={d.exitThreshold}
            color={stroke}
            size={140}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={DASHBOARD_MICRO}>
            {sessCount > 0 ? `Last ${Math.min(sessCount, 12)} sessions` : "No sessions yet"}
          </span>
          <SessionBars history={d.sessionHistory ?? []} color={stroke} />
        </div>
      </div>

      <div
        className={cn(
          "relative px-6 py-3.5 border-t flex justify-between items-center",
          brand.footerWash,
          "border-t",
          brand.panelBorder,
        )}
      >
        <span className={DASHBOARD_MICRO}>
          {sessCount > 0 ? `${sessCount} sessions` : "New"}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-black uppercase tracking-widest transition-colors"
          style={{ color: stroke }}
        >
          Practice
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
