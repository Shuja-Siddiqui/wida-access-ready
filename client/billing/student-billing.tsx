import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetBillingPlans,
  getGetBillingPlansQueryKey,
  useGetSubscription,
  getGetSubscriptionQueryKey,
  useCreateBillingPortalSession,
  SubscriptionStatus,
} from "@/api-generated";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, ExternalLink, Loader2, ShieldCheck,
  User, Building2, Zap, Clock,
} from "lucide-react";
import { PlanCard } from "@/billing/plan-card";
import { motion } from "framer-motion";

const PERSONAL_FEATURES = [
  "1 student profile",
  "WIDA now — more assessments soon",
  "Adaptive daily practice",
  "All 4 language domains",
  "Progress & streak tracking",
];

const ORGANIZATION_FEATURES = [
  "Unlimited student seats",
  "Billed per active seat",
  "Educator dashboard & roster",
  "Stall alerts & exit watch list",
  "Score tracking across your team",
  "Everything in Personal",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function StudentBilling({ studentId }: { studentId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState<"portal" | null>(null);

  const { data: plans, isLoading: plansLoading } = useGetBillingPlans({
    query: { queryKey: getGetBillingPlansQueryKey(), staleTime: 60_000 },
  });

  const subscriptionQueryKey = getGetSubscriptionQueryKey({ ownerId: studentId, ownerType: "solo" });
  const { data: subscription, isLoading: subLoading } = useGetSubscription(
    { ownerId: studentId, ownerType: "solo" },
    { query: { queryKey: subscriptionQueryKey, retry: false, staleTime: 30_000 } },
  );

  const portal = useCreateBillingPortalSession();

  if (plansLoading || subLoading) return <LoadingScreen />;

  const soloPlan  = plans?.find((p) => p.planId === "solo");
  const orgPlan   = plans?.find((p) => p.planId === "organization");
  const isActive  = subscription?.status === SubscriptionStatus.active;

  const handleManageBilling = async () => {
    setRedirecting("portal");
    try {
      const session = await portal.mutateAsync({ data: { ownerId: studentId, ownerType: "solo" } });
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
          style={{ background: "linear-gradient(135deg, #FF4D8D 0%, #c2185b 100%)" }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Personal Plan</p>
            <h1 className="text-4xl font-black text-white tracking-tight">Billing &amp; Plans</h1>
            <p className="text-white/80 font-medium mt-2 max-w-sm">
              Manage your subscription and unlock full access to practice tools.
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/20 items-center justify-center">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* ── Current status ──────────────────────────────────────── */}
        <motion.section
          custom={1}
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
            {/* Card header */}
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-black text-lg text-foreground">
                  {isActive ? "Personal Plan" : "No active plan"}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                  {isActive
                    ? "1 student profile, adaptive practice."
                    : "Subscribe to unlock access."}
                </p>
              </div>
              {isActive ? (
                <span className="text-xs font-bold bg-growth-green/15 text-growth-green px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-growth-green" />
                  Active
                </span>
              ) : (
                <span className="text-xs font-bold bg-muted text-muted-foreground px-3 py-1.5 rounded-full">
                  Inactive
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {isActive && subscription ? (
                <>
                  {/* Price display */}
                  <div className="flex items-end gap-2 bg-primary/8 rounded-xl p-5">
                    <span className="text-5xl font-black text-foreground tracking-tighter leading-none tabular-nums">
                      {soloPlan ? soloPlan.displayPrice : "--"}
                    </span>
                    <span className="text-base font-semibold text-muted-foreground mb-1.5">
                      {soloPlan ? soloPlan.displayPeriod : "/ month"}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-growth-green" strokeWidth={2.5} />
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                      </div>
                      <p className="font-black text-lg text-foreground">Active</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          {subscription.cancelAtPeriodEnd ? "Ends on" : "Renews on"}
                        </p>
                      </div>
                      <p className="font-black text-lg text-foreground">
                        {subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManageBilling}
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
          custom={2}
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
              icon={User}
              name="Personal"
              displayPrice={soloPlan?.displayPrice ?? "--"}
              displayPeriod={soloPlan?.displayPeriod ?? "/ month"}
              tagline="For an individual learner working toward their exit test."
              features={PERSONAL_FEATURES}
              isCurrent={isActive}
              highlightColor="bg-primary"
              footer={
                <button
                  onClick={() => setLocation("/billing/checkout?plan=solo")}
                  disabled={redirecting !== null}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-br from-primary to-[#c2185b] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:shadow-[0_6px_22px_rgba(255,77,141,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Subscribe Now
                </button>
              }
            />
            <PlanCard
              icon={Building2}
              name="Organization"
              displayPrice={orgPlan?.displayPrice ?? "--"}
              displayPeriod={orgPlan?.displayPeriod ?? "/ seat / month"}
              tagline="For schools and programs. Add as many members as you need."
              features={ORGANIZATION_FEATURES}
              isCurrent={false}
              locked
              lockedMessage="Available for educator accounts"
            />
          </div>
        </motion.section>
      </div>
    </PageContainer>
  );
}
