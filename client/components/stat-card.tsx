import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatTone = "default" | "success" | "warning" | "danger";

const TONES: Record<
  StatTone,
  {
    shell: string;
    iconWrap: string;
    iconColor: string;
    value: string;
    label: string;
  }
> = {
  default: {
    shell:
      "border-primary/15 bg-gradient-to-br from-primary/[0.12] via-card to-trust-blue/[0.1]",
    iconWrap: "bg-gradient-to-br from-primary/25 to-trust-blue/20 shadow-inner",
    iconColor: "text-primary",
    value: "text-foreground",
    label: "text-muted-foreground",
  },
  success: {
    shell:
      "border-growth-green/20 bg-gradient-to-br from-growth-green/[0.14] via-card to-primary/[0.05]",
    iconWrap: "bg-gradient-to-br from-growth-green/30 to-growth-green/10 shadow-inner",
    iconColor: "text-growth-green",
    value: "text-foreground",
    label: "text-muted-foreground",
  },
  warning: {
    shell:
      "border-logo-gold/25 bg-gradient-to-br from-logo-gold/[0.16] via-card to-primary/[0.05]",
    iconWrap: "bg-gradient-to-br from-logo-gold/35 to-logo-gold/10 shadow-inner",
    iconColor: "text-logo-gold",
    value: "text-foreground",
    label: "text-muted-foreground",
  },
  danger: {
    shell:
      "border-energy-orange/25 bg-gradient-to-br from-energy-orange/[0.14] via-card to-destructive/[0.06]",
    iconWrap: "bg-gradient-to-br from-energy-orange/30 to-energy-orange/10 shadow-inner",
    iconColor: "text-energy-orange",
    value: "text-foreground",
    label: "text-muted-foreground",
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
    <div
      className={cn(
        "rounded-2xl border p-6 flex flex-col gap-5 shadow-sm",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
        styles.shell,
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/10 dark:ring-white/5",
          styles.iconWrap,
        )}
      >
        <Icon className={cn("w-6 h-6 stroke-[2]", styles.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-4xl sm:text-5xl font-black leading-none tabular-nums tracking-tight", styles.value)}>
          {value}
        </p>
        <p className={cn("text-xs font-semibold uppercase tracking-widest mt-3 truncate", styles.label)}>
          {label}
        </p>
      </div>
    </div>
  );
}
