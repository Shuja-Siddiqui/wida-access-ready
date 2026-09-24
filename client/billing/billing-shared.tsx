import type { LucideIcon } from "lucide-react";
import { ExternalLink, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PERSONAL_FEATURES = [
  "1 student profile",
  "WIDA now — more assessments soon",
  "Adaptive daily practice",
  "All 4 language domains",
  "Progress and streak tracking",
];

export const ORGANIZATION_FEATURES = [
  "Unlimited student seats",
  "Billed per active seat",
  "Educator dashboard and roster",
  "Stall alerts and exit watch list",
  "Score tracking across your team",
  "Everything in Personal",
];

export function BillingPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-3 border-b border-border/40 pb-6">
      <p className="heading-eyebrow">{eyebrow}</p>
      <h1 className="heading-page text-3xl sm:text-4xl">{title}</h1>
      <p className="text-base text-muted-foreground font-medium max-w-2xl leading-relaxed">{description}</p>
    </header>
  );
}

export type SubscriptionStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function SubscriptionOverview({
  planLabel,
  planDescription,
  isActive,
  price,
  period,
  stats,
  onManage,
  manageLoading,
  cancelAtPeriodEnd,
}: {
  planLabel: string;
  planDescription: string;
  isActive: boolean;
  price?: string;
  period?: string;
  stats?: SubscriptionStat[];
  onManage?: () => void;
  manageLoading?: boolean;
  cancelAtPeriodEnd?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden border-l-4 border-l-primary">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-6 py-5 border-b border-border/40 bg-primary/[0.04]">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="heading-section text-lg">{planLabel}</h2>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                isActive && "bg-growth-green/15 text-growth-green border-growth-green/25 hover:bg-growth-green/15",
              )}
            >
              {isActive ? "Active" : "No subscription"}
            </Badge>
            {isActive && cancelAtPeriodEnd && (
              <Badge variant="outline" className="border-energy-orange/40 text-energy-orange">
                Cancels at period end
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{planDescription}</p>
        </div>

        {isActive && price && (
          <div className="text-left sm:text-right shrink-0">
            <p className="text-3xl font-black tabular-nums text-primary leading-none">{price}</p>
            {period && <p className="text-sm text-muted-foreground mt-1">{period}</p>}
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        {isActive && stats && stats.length > 0 ? (
          <>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3.5">
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-primary/70" strokeWidth={2.25} />
                    {label}
                  </dt>
                  <dd className="text-base font-bold text-heading-secondary tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            {onManage && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto h-11 rounded-xl font-semibold gap-2 border-primary/25 hover:bg-primary/5 hover:text-primary"
                onClick={onManage}
                disabled={manageLoading}
              >
                {manageLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage in Stripe portal
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a plan below to unlock full practice access. You can change or cancel anytime through the secure billing portal.
          </p>
        )}
      </div>
    </section>
  );
}

export function BillingTrustFooter() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border/40 bg-primary/[0.04] px-5 py-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 font-semibold text-heading-secondary shrink-0">
        <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={2.25} />
        Secure billing
      </div>
      <p className="leading-relaxed">
        Payments are processed by Stripe. We never store your full card number on our servers.
      </p>
      <Lock className="hidden sm:block w-4 h-4 shrink-0 opacity-40 ml-auto" aria-hidden />
    </div>
  );
}

export function PlansSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="heading-section text-xl">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
