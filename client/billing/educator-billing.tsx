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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/stat-card";
import {
  AlertTriangle,
  Building2,
  Clock,
  DollarSign,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PlanCard } from "@/billing/plan-card";
import { cn } from "@/lib/utils";
import {
  BillingPageHeader,
  BillingTrustFooter,
  ORGANIZATION_FEATURES,
  PERSONAL_FEATURES,
  PlansSectionHeader,
  SubscriptionOverview,
} from "@/billing/billing-shared";

export function EducatorBilling({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState(false);
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
  const summaryParams = isActivePreview ? undefined : { seatCount: debouncedSeatCount };
  const summaryQueryKey = getGetBillingAdminSummaryQueryKey(teacherId, summaryParams);
  const { data: summary, isFetching: summaryFetching } = useGetBillingAdminSummary(teacherId, summaryParams, {
    query: { queryKey: summaryQueryKey, placeholderData: (prev: BillingAdminSummary | undefined) => prev },
  });

  useEffect(() => {
    if (summary && !subscription && !seatCountInitialized) {
      const seats = Math.max(1, summary.seatCount);
      setSeatCount(seats);
      setDebouncedSeatCount(seats);
      setSeatCountInitialized(true);
    }
  }, [summary, subscription, seatCountInitialized]);

  const portal = useCreateBillingPortalSession();

  if (plansLoading || subLoading) return <LoadingScreen />;

  const orgPlan = plans?.find((p) => p.planId === "organization");
  const soloPlan = plans?.find((p) => p.planId === "solo");
  const isActive = subscription?.status === SubscriptionStatus.active;
  const displayPricePerSeat = orgPlan?.displayPrice ?? summary?.displayPricePerSeat ?? "—";
  const displayPeriodPerSeat = orgPlan?.displayPeriod ?? "/ seat / month";

  const seatsAtRisk = summary?.seatCount ?? subscription?.seatCount ?? 0;
  const effectiveDateLabel = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "the end of your current billing period";

  const renewalLabel = subscription?.cancelAtPeriodEnd ? "Access ends" : "Renews";
  const renewalValue = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const handleManageBilling = async () => {
    setRedirecting(true);
    try {
      const session = await portal.mutateAsync({ data: { ownerId: teacherId, ownerType: "organization" } });
      window.location.href = session.url;
    } catch {
      toast({
        title: "Could not open billing portal",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setRedirecting(false);
    }
  };

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-10">
      <BillingPageHeader
        eyebrow="Organization account"
        title="Billing and seats"
        description="Manage your organization subscription, seat count, and payment details for your student roster."
      />

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Roster seats" value={summary.seatCount} tone="warning" />
          <StatCard icon={DollarSign} label="Price per seat" value={summary.displayPricePerSeat} tone="default" />
          <StatCard
            icon={Building2}
            label="Estimated monthly"
            value={summary.displayEstimatedMonthlyCost}
            tone="success"
          />
        </div>
      )}

      <SubscriptionOverview
        planLabel={isActive ? "Organization plan" : "No active plan"}
        planDescription={
          isActive
            ? "Seat-based billing for your full student roster and educator tools."
            : "Subscribe to give your students access and unlock roster management."
        }
        isActive={isActive}
        price={isActive ? displayPricePerSeat : undefined}
        period={isActive ? displayPeriodPerSeat : undefined}
        cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd}
        stats={
          isActive
            ? [
                { label: "Status", value: "Active", icon: ShieldCheck },
                { label: "Active seats", value: String(subscription?.seatCount ?? "—"), icon: Users },
                { label: renewalLabel, value: renewalValue, icon: Clock },
              ]
            : undefined
        }
        onManage={isActive ? () => setShowManageWarning(true) : undefined}
        manageLoading={redirecting}
      />

      <section className="space-y-5">
        <PlansSectionHeader
          title="Available plans"
          description={
            isActive
              ? "Need more seats or a different setup? Adjust billing in the Stripe portal."
              : "Estimate your monthly cost, then subscribe when you are ready."
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          <PlanCard
            name="Organization"
            displayPrice={displayPricePerSeat}
            displayPeriod={displayPeriodPerSeat}
            tagline="Per-seat billing for schools, teams, and programs."
            features={ORGANIZATION_FEATURES}
            isCurrent={isActive}
            recommended={!isActive}
            accentClass="from-achieve-purple to-[hsl(286_70%_38%)]"
            footer={
              <div className="space-y-4">
                {!isActive && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="seatCount" className="text-sm font-semibold">
                        Seats to purchase
                      </Label>
                      <Input
                        id="seatCount"
                        type="number"
                        min={1}
                        value={seatCount}
                        onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="max-w-[140px] h-11 text-lg font-bold tabular-nums rounded-xl"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Estimated monthly</span>
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums text-foreground inline-flex items-center gap-2",
                          summaryFetching && "opacity-50",
                        )}
                      >
                        {summary?.displayEstimatedMonthlyCost ?? "—"}
                        {summaryFetching && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      </span>
                    </div>
                  </>
                )}

                <Button
                  className="w-full h-11 rounded-xl font-semibold btn-brand border-0"
                  onClick={() => setLocation(`/billing/checkout?plan=organization&seats=${seatCount}`)}
                  disabled={redirecting}
                >
                  {isActive ? "Update via checkout" : "Subscribe"}
                </Button>
              </div>
            }
          />
          <PlanCard
            name="Personal"
            displayPrice={soloPlan?.displayPrice ?? "—"}
            displayPeriod={soloPlan?.displayPeriod ?? "/ month"}
            tagline="For a single student account without roster management."
            features={PERSONAL_FEATURES}
            isCurrent={false}
            locked
            lockedMessage="Available on student accounts only"
          />
        </div>
      </section>

      <BillingTrustFooter />

      <AlertDialog open={showManageWarning} onOpenChange={setShowManageWarning}>
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-energy-orange/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-energy-orange" strokeWidth={2.25} />
              </div>
              <div className="space-y-2 text-left">
                <AlertDialogTitle className="text-lg font-bold">Before you change billing</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      You currently have{" "}
                      <span className="font-semibold text-foreground">{seatsAtRisk}</span>{" "}
                      active student{seatsAtRisk === 1 ? "" : "s"} on this plan.
                    </p>
                    <p>
                      Canceling or reducing seats in the Stripe portal removes access on{" "}
                      <span className="font-semibold text-foreground">{effectiveDateLabel}</span>.
                    </p>
                  </div>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl h-11 font-semibold">Stay on this page</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-11 font-semibold btn-brand border-0"
              onClick={() => {
                setShowManageWarning(false);
                void handleManageBilling();
              }}
            >
              Continue to Stripe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
