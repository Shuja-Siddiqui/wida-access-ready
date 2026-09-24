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
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, User } from "lucide-react";
import { PlanCard } from "@/billing/plan-card";
import {
  BillingPageHeader,
  BillingTrustFooter,
  ORGANIZATION_FEATURES,
  PERSONAL_FEATURES,
  PlansSectionHeader,
  SubscriptionOverview,
} from "@/billing/billing-shared";

export function StudentBilling({ studentId }: { studentId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState(false);

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

  const soloPlan = plans?.find((p) => p.planId === "solo");
  const orgPlan = plans?.find((p) => p.planId === "organization");
  const isActive = subscription?.status === SubscriptionStatus.active;

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
      const session = await portal.mutateAsync({ data: { ownerId: studentId, ownerType: "solo" } });
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
        eyebrow="Account"
        title="Billing and subscription"
        description="View your plan, update payment details, or switch coverage for your practice sessions."
      />

      <SubscriptionOverview
        planLabel={isActive ? "Personal plan" : "No active plan"}
        planDescription={
          isActive
            ? "Full access to adaptive practice across all four language domains."
            : "Subscribe to unlock daily practice, progress tracking, and coaching feedback."
        }
        isActive={isActive}
        price={isActive ? soloPlan?.displayPrice : undefined}
        period={isActive ? soloPlan?.displayPeriod : undefined}
        cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd}
        stats={
          isActive
            ? [
                { label: "Status", value: "Active", icon: ShieldCheck },
                { label: renewalLabel, value: renewalValue, icon: Clock },
                { label: "Profiles", value: "1 student", icon: User },
              ]
            : undefined
        }
        onManage={isActive ? handleManageBilling : undefined}
        manageLoading={redirecting}
      />

      <section className="space-y-5">
        <PlansSectionHeader
          title="Available plans"
          description={
            isActive
              ? "Compare options or manage your subscription through the portal above."
              : "Select the plan that fits how you practice."
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          <PlanCard
            name="Personal"
            displayPrice={soloPlan?.displayPrice ?? "—"}
            displayPeriod={soloPlan?.displayPeriod ?? "/ month"}
            tagline="For one learner preparing for their state exit assessment."
            features={PERSONAL_FEATURES}
            isCurrent={isActive}
            recommended={!isActive}
            footer={
              <Button
                className="w-full h-11 rounded-xl font-semibold btn-brand border-0"
                onClick={() => setLocation("/billing/checkout?plan=solo")}
                disabled={redirecting}
              >
                Subscribe
              </Button>
            }
          />
          <PlanCard
            name="Organization"
            displayPrice={orgPlan?.displayPrice ?? "—"}
            displayPeriod={orgPlan?.displayPeriod ?? "/ seat / month"}
            tagline="For schools and programs managing multiple students."
            features={ORGANIZATION_FEATURES}
            isCurrent={false}
            locked
            lockedMessage="Sign in with an educator account to use this plan"
          />
        </div>
      </section>

      <BillingTrustFooter />
    </PageContainer>
  );
}
