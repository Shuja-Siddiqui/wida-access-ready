import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  icon: LucideIcon;
  name: string;
  displayPrice: string;
  displayPeriod: string;
  tagline: string;
  features: string[];
  isCurrent: boolean;
  locked?: boolean;
  lockedMessage?: string;
  footer?: ReactNode;
  highlightColor?: string;
}

export function PlanCard({
  icon: Icon,
  name,
  displayPrice,
  displayPeriod,
  tagline,
  features,
  isCurrent,
  locked = false,
  lockedMessage,
  footer,
  highlightColor = "bg-primary",
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card flex flex-col overflow-hidden transition-all duration-200",
        locked
          ? "opacity-60 shadow-sm border border-border/40"
          : isCurrent
            ? "shadow-lg border border-primary/30 ring-1 ring-primary/20"
            : "shadow-sm border border-border/40 hover:shadow-md",
      )}
    >
      {/* Accent top bar */}
      <div
        className={cn("h-1", isCurrent ? highlightColor : "bg-border/30")}
      />

      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                isCurrent ? highlightColor : "bg-muted",
              )}
            >
              <Icon
                className={cn("w-5 h-5", isCurrent ? "text-white" : "text-foreground")}
                strokeWidth={2.5}
              />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight">{name}</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{tagline}</p>
            </div>
          </div>
          {isCurrent && (
            <span className="text-xs font-bold bg-growth-green/15 text-growth-green px-2.5 py-1 rounded-full flex-shrink-0">
              Current
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-end gap-1.5 mb-6">
          <span className="text-4xl font-black text-foreground tracking-tighter tabular-nums">
            {displayPrice}
          </span>
          <span className="text-sm font-semibold text-muted-foreground mb-1.5">
            {displayPeriod}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mb-5" />

        {/* Feature list */}
        <ul className="space-y-3 flex-1 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-growth-green/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-growth-green" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium text-foreground leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto">
          {locked ? (
            <div className="flex items-center justify-center gap-2 bg-muted rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground">
              <Lock className="w-4 h-4 flex-shrink-0" />
              {lockedMessage}
            </div>
          ) : isCurrent ? (
            <div className="w-full text-center text-sm font-semibold text-muted-foreground py-3 bg-muted/60 rounded-xl">
              Your current plan
            </div>
          ) : (
            footer
          )}
        </div>
      </div>
    </div>
  );
}
