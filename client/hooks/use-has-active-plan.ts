import { useGetSubscription, getGetSubscriptionQueryKey } from "@/api-generated";

/**
 * Returns whether the given guardian (teacher/parent/principal/district_admin)
 * has an active paid subscription. Used to gate student creation/import.
 *
 * Tries both ownerType values ("organization" and "solo") so the hook works
 * regardless of which plan type was purchased. Polls every 3 s until the plan
 * becomes active (to handle Stripe webhook lag after checkout), then backs off
 * to a 60 s refresh interval.
 */
export function useHasActivePlan(guardianId: string | null | undefined) {
  const orgParams = { ownerId: guardianId ?? "", ownerType: "organization" } as const;
  const soloParams = { ownerId: guardianId ?? "", ownerType: "solo" } as const;

  const { data: orgSub, isLoading: orgLoading } = useGetSubscription(orgParams, {
    query: {
      queryKey: getGetSubscriptionQueryKey(orgParams),
      enabled: !!guardianId,
      retry: false,
      staleTime: 10_000,
      // Poll every 3 s until active, then slow down to 60 s.
      refetchInterval: (query) =>
        query.state.data?.status === "active" ? 60_000 : 3_000,
    },
  });

  const { data: soloSub, isLoading: soloLoading } = useGetSubscription(soloParams, {
    query: {
      queryKey: getGetSubscriptionQueryKey(soloParams),
      enabled: !!guardianId,
      retry: false,
      staleTime: 10_000,
      refetchInterval: (query) =>
        query.state.data?.status === "active" ? 60_000 : 3_000,
    },
  });

  const hasPlan =
    orgSub?.status === "active" || soloSub?.status === "active";

  const isLoading = orgLoading && soloLoading;

  return { hasPlan, isLoading };
}
