import { cn } from "@/lib/utils";

const DOMAIN_COLORS: Record<string, string> = {
  listening: "text-trust-blue",
  speaking:  "text-growth-green",
  reading:   "text-energy-orange",
  writing:   "text-achieve-purple",
};

export function DomainLevelBadge({
  level,
  domain,
}: {
  level?: number;
  gap?: number;
  domain?: string;
}) {
  const color = domain ? (DOMAIN_COLORS[domain] ?? "text-foreground") : "text-foreground";
  return (
    <span className={cn("text-base font-black tabular-nums", color)}>
      {level != null ? level.toFixed(1) : "—"}
    </span>
  );
}
