import { motion } from "framer-motion";
import { LevelRing } from "@/components/level-ring";

const DOMAIN_COLORS: Record<string, string> = {
  listening: "var(--color-trust-blue)",
  speaking:  "var(--color-growth-green)",
  reading:   "var(--color-energy-orange)",
  writing:   "var(--color-achieve-purple)",
};

const DOMAIN_LABELS: Record<string, string> = {
  listening: "Listening",
  speaking:  "Speaking",
  reading:   "Reading",
  writing:   "Writing",
};

export interface DomainProgressItem {
  domain: string;
  currentLevel: number;
  exitThreshold: number;
  gap: number;
}

interface StudentDomainProgressBarsProps {
  domains: DomainProgressItem[];
  columns?: "1" | "2";
}

export function StudentDomainProgressBars({ domains, columns = "2" }: StudentDomainProgressBarsProps) {
  return (
    <div className={`grid gap-4 ${columns === "2" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
      {domains.map((d, i) => {
        const color  = DOMAIN_COLORS[d.domain] ?? "var(--color-foreground)";
        const label  = DOMAIN_LABELS[d.domain] ?? d.domain;
        const pct    = Math.max(0, Math.min(100, (d.currentLevel / d.exitThreshold) * 100));
        const atExit = d.gap <= 0;

        return (
          <motion.div
            key={d.domain}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm"
          >
            {/* Domain label */}
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color }}
            >
              {label}
            </span>

            {/* Ring */}
            <LevelRing
              pct={pct}
              level={d.currentLevel}
              exitThreshold={d.exitThreshold}
              color={color}
              size={96}
              strokeWidth={8}
            />

            {/* Status badge */}
            {atExit ? (
              <span className="text-[10px] font-black text-growth-green bg-growth-green/10 border border-growth-green/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Exit ready
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-muted-foreground">
                {d.gap.toFixed(2)} to exit
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
