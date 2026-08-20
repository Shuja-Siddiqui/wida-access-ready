import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetBillingPlans,
  getGetBillingPlansQueryKey,
  useGetSubscription,
  getGetSubscriptionQueryKey,
  useGetBillingAdminSummary,
  getGetBillingAdminSummaryQueryKey,
  type BillingAdminSummary,
  useCreateBillingPortalSession,
  SubscriptionStatus,
} from "@/api-generated";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CreditCard, ExternalLink, Loader2, ShieldCheck,
  Users, DollarSign, Building2, User,
  AlertTriangle, Clock, TrendingUp,
} from "lucide-react";
import { PlanCard } from "@/billing/plan-card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ORGANIZATION_FEATURES = [
  "Unlimited student seats",
  "Billed per active seat",
  "Educator dashboard & roster",
  "Stall alerts & exit watch list",
  "Score tracking across your team",
  "Everything in Personal",
];

const PERSONAL_FEATURES = [
  "1 student profile",
  "WIDA now — more assessments soon",
  "Adaptive daily practice",
  "All 4 language domains",
  "Progress & streak tracking",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function EducatorBilling({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState<"portal" | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [debouncedSeatCount, setDebouncedSeatCount] = useState(1);
  const [seatCountInitialized, setSeatCountInitialized] = useState(false);
  const [showManageWarning, setShowManageWarning] = useState(false);

  const { data: plans, isLoading: plansLoading } = useGetBillingPlans({
    query: { queryKey: getGetBillingPlansQueryKey(), staleTime: 60_000 },
  });

  const subscriptionQueryKey = getGetSubscriptionQueryKey({ ownerId: teacherId, ownerType: "organization" });
  const { data: subscription, isLoading: subLoading } = useGetSubscription(
    { ownerId: teacherId, ownerType: "organization" },
    { query: { queryKey: subscriptionQueryKey, retry: false, staleTime: 30_000 } },
  );

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSeatCount(seatCount), 300);
    return () => clearTimeout(id);
  }, [seatCount]);

  const isActivePreview = subscription?.status === SubscriptionStatus.active;
  const summaryParams   = isActivePreview ? undefined : { seatCount: debouncedSeatCount };
  const summaryQueryKey = getGetBillingAdminSummaryQueryKey(teacherId, summaryParams);
  const { data: summary, isFetching: summaryFetching } = useGetBillingAdminSummary(teacherId, summaryParams, {
    query: { queryKey: summaryQueryKey, placeholderData: (prev: BillingAdminSummary | undefined) => prev },
  });

  useEffect(() => {
    if (summary && !subscription && !seatCountInitialized) {
      setSeatCount(Math.max(1, summary.seatCount));
      setDebouncedSeatCount(Math.max(1, summary.seatCount));
      setSeatCountInitialized(true);
    }
  }, [summary, subscription, seatCountInitialized]);

  const portal = useCreateBillingPortalSession();

  if (plansLoading || subLoading) return <LoadingScreen />;

  const orgPlan  = plans?.find((p) => p.planId === "organization");
  const soloPlan = plans?.find((p) => p.planId === "solo");
  const isActive = subscription?.status === SubscriptionStatus.active;
  const displayPricePerSeat  = orgPlan?.displayPrice ?? summary?.displayPricePerSeat ?? "--";
  const displayPeriodPerSeat = orgPlan?.displayPeriod ?? "/ seat / month";

  const seatsAtRisk = summary?.seatCount ?? subscription?.seatCount ?? 0;
  const effectiveDateLabel = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "the end of your current billing period";

  const handleManageBilling = async () => {
    setRedirecting("portal");
    try {
      const session = await portal.mutateAsync({ data: { ownerId: teacherId, ownerType: "organization" } });
      window.location.href = session.url;
    } catch {
      toast({ title: "Something went wrong", description: "Could not open the billing portal. Please try again.", variant: "destructive" });
      setRedirecting(null);
    }
  };

  return (
    <PageContainer className="py-10 space-y-10">
      {/* ── Page hero ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden shadow-sm"
      >
        <div
          className="px-8 py-10 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, hsl(var(--achieve-purple)) 0%, hsl(286 70% 38%) 100%)" }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Organization Plan</p>
            <h1 className="text-4xl font-black text-white tracking-tight">Billing &amp; Plans</h1>
            <p className="text-white/80 font-medium mt-2 max-w-sm">
              Manage your Organization plan and seat-based billing for your students.
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/20 items-center justify-center">
            <Building2 className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
        </div>
      </motion.div>

      {/* ── Summary stat cards ─────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Users className="w-5 h-5 text-energy-orange" strokeWidth={2} />,
              iconBg: "bg-energy-orange/15",
              label: "Roster Seats",
              value: String(summary.seatCount),
            },
            {
              icon: <DollarSign className="w-5 h-5 text-primary" strokeWidth={2} />,
              iconBg: "bg-primary/10",
              label: "Price Per Seat",
              value: summary.displayPricePerSeat,
            },
            {
              icon: <TrendingUp className="w-5 h-5 text-growth-green" strokeWidth={2} />,
              iconBg: "bg-growth-green/15",
              label: "Est. Monthly",
              value: summary.displayEstimatedMonthlyCost,
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              custom={i + 1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-card rounded-2xl border border-border/40 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</p>
              </div>
              <p className="text-4xl font-black text-foreground tabular-nums">{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* ── Current status ──────────────────────────────────────── */}
        <motion.section
          custom={summary ? 4 : 1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 1</p>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Current Status</h2>
          </div>

          <div className="rounded-2xl bg-card shadow-sm border border-border/40 overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-black text-lg text-foreground">
                  {isActive ? "Organization Plan" : "No active plan"}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-0.5 max-w-xs">
                  {isActive
                    ? "Unlimited student seats, billed monthly per active seat."
                    : "Subscribe to unlock access for your students."}
                </p>
              </div>
              {isActive ? (
                <span className="text-xs font-bold bg-growth-green/15 text-growth-green px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-growth-green" />
                  Active
                </span>
              ) : (
                <span className="text-xs font-bold bg-muted text-muted-foreground px-3 py-1.5 rounded-full flex-shrink-0">
                  Inactive
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {isActive && subscription ? (
                <>
                  <div className="flex items-end gap-2 bg-achieve-purple/8 rounded-xl p-5">
                    <span className="text-5xl font-black text-foreground tracking-tighter leading-none tabular-nums">
                      {displayPricePerSeat}
                    </span>
                    <span className="text-base font-semibold text-muted-foreground mb-1.5">
                      {displayPeriodPerSeat}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-growth-green" strokeWidth={2.5} />
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                      </div>
                      <p className="font-black text-base text-foreground">Active</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Seats</p>
                      </div>
                      <p className="font-black text-base text-foreground">{subscription.seatCount}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}
                        </p>
                      </div>
                      <p className="font-black text-base text-foreground truncate">
                        {subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowManageWarning(true)}
                    disabled={redirecting !== null}
                    className="w-full flex items-center justify-center gap-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3.5 rounded-xl border border-border/50 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
                  >
                    {redirecting === "portal"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <ExternalLink className="w-4 h-4" />}
                    Manage billing &amp; cancel
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-center gap-4 py-10">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground max-w-[240px]">
                    No active subscription yet. Pick a plan to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Plan cards ──────────────────────────────────────────── */}
        <motion.section
          custom={summary ? 5 : 2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 2</p>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Choose Plan</h2>
          </div>

          <div className="space-y-5">
            <PlanCard
              icon={Building2}
              name="Organization"
              displayPrice={displayPricePerSeat}
              displayPeriod={displayPeriodPerSeat}
              tagline="For schools and programs. Add as many members as you need."
              features={ORGANIZATION_FEATURES}
              isCurrent={isActive}
              highlightColor="bg-achieve-purple"
              footer={
                <div className="space-y-5 mt-2">
                  <div className="space-y-2">
                    <label htmlFor="seatCount" className="block text-sm font-semibold text-foreground">
                      Number of seats
                    </label>
                    <input
                      id="seatCount"
                      type="number"
                      min={1}
                      value={seatCount}
                      onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full max-w-[180px] border border-border/60 rounded-xl px-4 py-2.5 text-xl font-black focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-muted/60 rounded-xl p-4">
                    <span className="text-sm font-semibold text-muted-foreground">Estimated monthly cost:</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xl font-black text-foreground transition-opacity", summaryFetching ? "opacity-40" : "opacity-100")}>
                        {summary?.displayEstimatedMonthlyCost ?? "--"}
                      </span>
                      {summaryFetching && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                  </div>

                  <button
                    onClick={() => setLocation(`/billing/checkout?plan=organization&seats=${seatCount}`)}
                    disabled={redirecting !== null}
                    className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-br from-primary to-[#c2185b] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:shadow-[0_6px_22px_rgba(255,77,141,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    Subscribe Now
                  </button>
                </div>
              }
            />
            <PlanCard
              icon={User}
              name="Personal"
              displayPrice={soloPlan?.displayPrice ?? "--"}
              displayPeriod={soloPlan?.displayPeriod ?? "/ month"}
              tagline="For an individual learner working toward their exit test."
              features={PERSONAL_FEATURES}
              isCurrent={false}
              locked
              lockedMessage="Available for student accounts"
            />
          </div>
        </motion.section>
      </div>

      {/* ── Manage warning dialog ───────────────────────────────────── */}
      <AlertDialog open={showManageWarning} onOpenChange={setShowManageWarning}>
        <AlertDialogContent className="rounded-2xl border border-border/40 shadow-lg bg-card p-0 overflow-hidden sm:max-w-md">
          <AlertDialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              </div>
              <AlertDialogTitle className="text-xl font-black text-foreground">
                Important warning
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm font-medium text-foreground/80 leading-relaxed">
                <p>
                  You currently have{" "}
                  <span className="font-black text-foreground">{seatsAtRisk}</span>{" "}
                  active student{seatsAtRisk === 1 ? "" : "s"} on your Organization plan.
                </p>
                <p>
                  If you cancel or reduce seats in the billing portal, those students lose
                  access on{" "}
                  <span className="font-bold text-foreground underline underline-offset-2 decoration-primary">
                    {effectiveDateLabel}
                  </span>.
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  You'll be taken to Stripe's secure billing portal to make changes.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-4 flex gap-3">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl font-semibold bg-muted border border-border/50 hover:bg-muted/80 transition-all">
              Go back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowManageWarning(false); void handleManageBilling(); }}
              className="flex-1 h-11 rounded-xl font-bold bg-gradient-to-br from-primary to-[#c2185b] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:shadow-[0_6px_22px_rgba(255,77,141,0.5)] hover:-translate-y-0.5 transition-all border-none"
            >
              Continue to portal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
