import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  displayPrice: string;
  displayPeriod: string;
  tagline: string;
  features: string[];
  isCurrent: boolean;
  recommended?: boolean;
  locked?: boolean;
  lockedMessage?: string;
  footer?: ReactNode;
  accentClass?: string;
}

export function PlanCard({
  name,
  displayPrice,
  displayPeriod,
  tagline,
  features,
  isCurrent,
  recommended = false,
  locked = false,
  lockedMessage,
  footer,
  accentClass = "from-primary to-primary-hover",
}: PlanCardProps) {
  const highlighted = !locked && (isCurrent || recommended);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300",
        locked && "border-border/40 bg-card/80 opacity-80",
        highlighted && !locked && "border-primary/40 bg-card shadow-lg shadow-primary/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15",
        !locked && !highlighted && "border-border/50 bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {/* Header band */}
      <div
        className={cn(
          "relative px-6 pt-6 pb-5 border-b border-border/30",
          highlighted && !locked
            ? cn("bg-gradient-to-br text-primary-foreground", accentClass)
            : "bg-muted/25",
        )}
      >
        {(recommended || isCurrent) && !locked && (
          <div className="absolute top-4 right-4">
            {isCurrent ? (
              <Badge className="bg-white/20 text-white border-white/25 hover:bg-white/20 backdrop-blur-sm">
                Current plan
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white border-white/25 hover:bg-white/20 backdrop-blur-sm">
                Recommended
              </Badge>
            )}
          </div>
        )}

        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-widest mb-2",
            highlighted && !locked ? "text-white/75" : "text-primary/80",
          )}
        >
          {locked ? "Unavailable" : highlighted ? "Best fit" : "Plan option"}
        </p>
        <h3
          className={cn(
            "text-2xl font-black tracking-tight pr-28",
            highlighted && !locked ? "text-white" : "heading-section",
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            "text-sm mt-2 leading-relaxed max-w-[95%]",
            highlighted && !locked ? "text-white/85" : "text-muted-foreground",
          )}
        >
          {tagline}
        </p>
      </div>

      <div className="flex flex-col flex-1 p-6">
        {/* Price block */}
        <div
          className={cn(
            "rounded-xl px-4 py-4 mb-6",
            highlighted && !locked ? "bg-primary/8 border border-primary/15" : "bg-muted/35 border border-border/40",
          )}
        >
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-black text-primary tabular-nums tracking-tight leading-none">
              {displayPrice}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{displayPeriod}</span>
          </div>
        </div>

        {/* Features — text only */}
        <div className="flex-1 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            What is included
          </p>
          <ul className="space-y-2.5">
            {features.map((feature) => (
              <li
                key={feature}
                className="text-sm text-foreground/90 leading-snug pl-3 border-l-2 border-primary/25"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          {locked ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3.5 text-sm font-medium text-muted-foreground text-center leading-relaxed">
              {lockedMessage}
            </p>
          ) : isCurrent ? (
            <p className="rounded-xl bg-muted/45 px-4 py-3.5 text-center text-sm font-medium text-muted-foreground">
              Included in your subscription
            </p>
          ) : (
            footer
          )}
        </div>
      </div>
    </article>
  );
}
