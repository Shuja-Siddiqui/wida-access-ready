import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatTone = "default" | "success" | "warning" | "danger";

const TONES: Record<StatTone, { bg: string; iconBg: string; iconColor: string; text: string; label: string }> = {
  default: {
    bg: "bg-gradient-to-br from-trust-blue/10 to-trust-blue/5",
    iconBg: "bg-trust-blue/20",
    iconColor: "text-trust-blue",
    text: "text-trust-blue",
    label: "text-trust-blue/80"
  },
  success: {
    bg: "bg-gradient-to-br from-growth-green/10 to-growth-green/5",
    iconBg: "bg-growth-green/20",
    iconColor: "text-growth-green",
    text: "text-growth-green",
    label: "text-growth-green/80"
  },
  warning: {
    bg: "bg-gradient-to-br from-streak-gold/15 to-streak-gold/5",
    iconBg: "bg-streak-gold/20",
    iconColor: "text-streak-gold",
    text: "text-foreground",
    label: "text-foreground/70"
  },
  danger: {
    bg: "bg-gradient-to-br from-energy-orange/10 to-energy-orange/5",
    iconBg: "bg-energy-orange/20",
    iconColor: "text-energy-orange",
    text: "text-energy-orange",
    label: "text-energy-orange/80"
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
}) {
  const styles = TONES[tone];
  
  return (
    <div className={cn(
      "rounded-2xl border border-border/30 p-6 flex flex-col gap-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
      styles.bg
    )}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", styles.iconBg)}>
        <Icon className={cn("w-6 h-6 stroke-[2]", styles.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-4xl sm:text-5xl font-black leading-none tabular-nums tracking-tight", styles.text)}>
          {value}
        </p>
        <p className={cn("text-xs font-semibold uppercase tracking-widest mt-3 truncate", styles.label)}>
          {label}
        </p>
      </div>
    </div>
  );
}
