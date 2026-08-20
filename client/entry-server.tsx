import { renderToString } from "react-dom/server";
import {
  QueryClient,
  dehydrate,
  type DehydratedState,
} from "@tanstack/react-query";
import App from "./App";
import { customFetch } from "@/api-generated/custom-fetch";
import {
  getGetBillingPlansQueryKey,
  getGetSubscriptionQueryKey,
  getGetBillingAdminSummaryQueryKey,
  type Plan,
  type Subscription,
  type BillingAdminSummary,
} from "@/api-generated";
import type { InitialAuth } from "@/contexts/user-context";

export interface RenderResult {
  html: string;
  dehydratedState: DehydratedState;
  initialAuth: InitialAuth;
}

interface MeResponse {
  userType: "student" | "parent" | "teacher";
  studentId?: string;
  teacherId?: string;
  userId?: string;
}

/**
 * Renders the app for a single request on the server.
 *
 * Only called for `/`, `/billing`, and `/billing/checkout` (see
 * server/index.ts) — every other route is served as the plain SPA shell,
 * unchanged from before SSR existed.
 * `internalApiBaseUrl` points at the API server reachable from *inside* this
 * container (the shared reverse proxy), since relative fetch URLs only work
 * from a browser, not from Node.
 *
 * `cookieHeader` is the incoming browser request's raw `Cookie` header (or
 * undefined for anonymous/no-cookie requests). It's forwarded to the API
 * server so `/billing` can be rendered with the caller's *real* subscription
 * data instead of a loading screen — see `middlewares/auth.ts`'s cookie
 * fallback on the API side, and `user-context.tsx`'s `InitialAuth` prop on
 * the client side (which seeds `UserProvider` synchronously instead of
 * waiting on a `useEffect` + localStorage, so the first client render
 * matches this SSR output exactly and doesn't hydration-mismatch).
 */
export async function render(
  url: string,
  internalApiBaseUrl: string,
  cookieHeader?: string,
): Promise<RenderResult> {
  const queryClient = new QueryClient();
  const authHeaders: HeadersInit | undefined = cookieHeader
    ? { cookie: cookieHeader }
    : undefined;

  // Prefetch the live Stripe-backed plan data so both the landing page's
  // pricing section and the billing page render real prices on first paint
  // instead of a placeholder or a client-side refetch flash. This is public
  // data (no auth needed), so it's safe to fetch unconditionally here.
  //
  // Note: we deliberately do NOT use `setBaseUrl` (a module-level global)
  // here — this function can run concurrently for multiple in-flight
  // requests on the same server process, and a global mutable base URL
  // would race between them. Instead we pass a fully-qualified URL directly
  // into `customFetch` for this one call.
  const plansPromise = queryClient.prefetchQuery({
    queryKey: getGetBillingPlansQueryKey(),
    queryFn: () => customFetch<Plan[]>(`${internalApiBaseUrl}/api/billing/plans`),
  });

  let initialAuth: InitialAuth = { ready: true, studentId: null, teacherId: null, userType: null };

  const needsAuth = url === "/billing" || url === "/billing/checkout";
  const needsPlanSummary = url === "/billing";

  if (needsAuth && cookieHeader) {
    try {
      const me = await customFetch<MeResponse>(`${internalApiBaseUrl}/api/auth/me`, {
        headers: authHeaders,
      });

      const isStudent = me.userType === "student" && !!me.studentId;
      const ownerId = isStudent ? me.studentId! : (me.teacherId ?? me.userId);
      const ownerType = isStudent ? "solo" : "organization";

      initialAuth = {
        ready: true,
        studentId: isStudent ? me.studentId! : null,
        teacherId: me.teacherId ?? null,
        userType: me.userType,
      };

      let subscriptionForSummary: Subscription | null = null;

      if (needsPlanSummary && ownerId) {
        // A 404 here just means "no subscription yet" (a brand new account) —
        // a perfectly valid, common state, not an SSR failure. We must NOT
        // resolve the queryFn with `undefined`: TanStack Query treats that as
        // an error ("Query data cannot be undefined") and silently drops the
        // query from `dehydrate()`, which then leaves the client with no
        // cached data for this query key — so it re-fetches with
        // `isLoading: true` on first render, and `StudentBilling`/
        // `EducatorBilling` (which gate their whole UI behind
        // `subLoading`) fall back to a loading screen even though the
        // server already knows the real answer. Resolving with `null`
        // instead keeps the query in a real "success" state that dehydrates
        // and hydrates correctly.
        subscriptionForSummary = await queryClient.fetchQuery({
          queryKey: getGetSubscriptionQueryKey({ ownerId, ownerType }),
          queryFn: () =>
            customFetch<Subscription>(
              `${internalApiBaseUrl}/api/billing/subscription?ownerId=${encodeURIComponent(ownerId)}&ownerType=${ownerType}`,
              { headers: authHeaders },
            ).catch(() => null as unknown as Subscription),
        });
      }

      // `EducatorBilling` also gates its whole UI behind this admin-summary
      // query (seat count + estimated cost) — without prefetching it here
      // too, the client falls back to a loading screen exactly like the
      // subscription query did before the fix above, even though the plans
      // and subscription data already rendered fine. Unlike subscription,
      // this endpoint always returns 200 (never 404) for any valid teacher,
      // so no `undefined`/`null` special-casing is needed here.
      //
      // IMPORTANT: the query key/params here must exactly match what
      // `EducatorBilling` uses on its *first* render, or the hydrated cache
      // misses and the page falls back to a loading screen. The component
      // computes `summaryParams` from `subscription?.status === "active"`
      // (undefined when active, else `{ seatCount: 1 }` — its initial
      // `debouncedSeatCount` state) — mirror that exact logic here.
      if (needsPlanSummary && !isStudent && ownerId) {
        const isActive = subscriptionForSummary?.status === "active";
        const summaryParams = isActive ? undefined : { seatCount: 1 };
        await queryClient.prefetchQuery({
          queryKey: getGetBillingAdminSummaryQueryKey(ownerId, summaryParams),
          queryFn: () =>
            customFetch<BillingAdminSummary>(
              `${internalApiBaseUrl}/api/billing/admin/summary/${encodeURIComponent(ownerId)}${
                summaryParams ? `?seatCount=${summaryParams.seatCount}` : ""
              }`,
              { headers: authHeaders },
            ),
        });
      }
    } catch {
      // No valid session cookie (logged out, expired, or anonymous visitor) —
      // fall back to the normal "not logged in" render, which redirects to
      // /login client-side exactly as it did before SSR existed.
      initialAuth = { ready: true, studentId: null, teacherId: null, userType: null };
    }
  }

  await plansPromise;

  const dehydratedState = dehydrate(queryClient);

  const html = renderToString(
    <App
      queryClient={queryClient}
      ssrPath={url}
      dehydratedState={dehydratedState}
      initialAuth={initialAuth}
    />,
  );

  return { html, dehydratedState, initialAuth };
}
