import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  useGetBillingConfig,
  getGetBillingConfigQueryKey,
  useGetBillingPlans,
  getGetBillingPlansQueryKey,
  useCreateCheckoutIntent,
  useListPaymentMethods,
  getListPaymentMethodsQueryKey,
  useCheckoutWithSavedCard,
  getSubscription,
  getGetSubscriptionQueryKey,
  getGetBillingAdminSummaryQueryKey,
  SubscriptionStatus,
  type SavedPaymentMethod,
} from "@/api-generated";
import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen, PageLoader } from "@/components/loading-screen";
import { Loader2, Lock, Plus, Check, Building2, User } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BillingTrustFooter } from "@/billing/billing-shared";

// Maps the app's hot-pink theme tokens into Stripe Elements' `appearance` API.
function hsl(triple: string): string {
  const [h, s, l] = triple.trim().split(/\s+/);
  return `hsl(${h}, ${s}, ${l})`;
}

function useStripeAppearance(): Appearance {
  const [appearance, setAppearance] = useState<Appearance>({ theme: "stripe" });

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const get = (name: string) => styles.getPropertyValue(name).trim();

    setAppearance({
      theme: document.documentElement.getAttribute("data-theme") === "dark" ? "night" : "stripe",
      variables: {
        colorPrimary: hsl(get("--primary")),
        colorBackground: hsl(get("--background")),
        colorText: hsl(get("--foreground")),
        colorDanger: hsl(get("--destructive")),
        colorTextSecondary: hsl(get("--muted-foreground")),
        borderRadius: "12px",
        fontFamily: "'Nunito', sans-serif",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          border: `1px solid ${hsl(get("--border"))}`,
          boxShadow: "none",
        },
        ".Input:focus": {
          border: `1px solid ${hsl(get("--primary"))}`,
          boxShadow: `0 0 0 3px ${hsl(get("--primary"))} / 0.15`,
        },
        ".Label": {
          fontWeight: "700",
          fontSize: "0.875rem",
        },
        ".Tab": {
          border: `1px solid ${hsl(get("--border"))}`,
          boxShadow: "none",
        },
        ".Tab--selected": {
          border: `1px solid ${hsl(get("--primary"))}`,
          boxShadow: "none",
        },
      },
    });
  }, []);

  return appearance;
}

// ── Card brand icon (simple text badge) ──────────────────────────────────────
function brandLabel(brand: string) {
  const map: Record<string, string> = {
    visa: "VISA",
    mastercard: "MC",
    amex: "AMEX",
    discover: "DISC",
    jcb: "JCB",
    diners: "DC",
    unionpay: "UP",
  };
  return map[brand.toLowerCase()] ?? brand.toUpperCase();
}

// ── Saved card selector ───────────────────────────────────────────────────────
function SavedCardSelector({
  cards,
  selectedId,
  onSelect,
}: {
  cards: SavedPaymentMethod[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      {cards.map((card, i) => {
        const active = selectedId === card.id;
        return (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left group",
              active
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/50 bg-card hover:border-border hover:bg-muted/20",
            )}
          >
            <div className="w-12 h-8 rounded-md border border-border/50 bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0">
              {brandLabel(card.brand)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground tracking-tight">
                Ending in {card.last4}
              </p>
              <p className="text-sm text-muted-foreground">
                Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                {card.isDefault && (
                  <span className="ml-2 text-xs font-semibold text-primary">Default</span>
                )}
              </p>
            </div>
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                active ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background",
              )}
            >
              {active && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
            </div>
          </motion.button>
        );
      })}

      {/* "Use a new card" option */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: cards.length * 0.06, ease: [0.22, 1, 0.36, 1] }}
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left group",
          selectedId === null
            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
            : "border-border/50 bg-card hover:border-border hover:bg-muted/20",
        )}
      >
        <div className="w-12 h-8 rounded-md border border-border/50 bg-muted flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4 text-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Use a different card</p>
        </div>
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            selectedId === null ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background",
          )}
        >
          {selectedId === null && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
        </div>
      </motion.button>
    </div>
  );
}

// ── New-card Elements form ────────────────────────────────────────────────────
function NewCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message ?? "Please check your card details and try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onSuccess();
    } else {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="space-y-6 bg-card border border-border/50 p-6 rounded-2xl shadow-sm"
    >
      <PaymentElement className="min-h-[220px]" />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="w-4 h-4 shrink-0" strokeWidth={2.25} />
        Payments are secured by Stripe. Your card details are encrypted.
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 h-11 font-semibold bg-card border border-border/50 rounded-xl hover:bg-muted/40 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          className="flex-1 h-11 flex items-center justify-center btn-brand rounded-xl font-semibold border-0 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Complete subscription
        </button>
      </div>
    </motion.form>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────
export default function Checkout() {
  const { studentId, teacherId, ready } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const appearance = useStripeAppearance();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(search);
  const planId = params.get("plan") === "organization" ? "organization" : "solo";
  const seatCount = planId === "organization" ? Math.max(1, parseInt(params.get("seats") ?? "1", 10) || 1) : undefined;

  const isEducator = !studentId && !!teacherId;
  const ownerId = isEducator ? teacherId! : studentId ?? undefined;
  const ownerType: "solo" | "organization" = planId === "organization" ? "organization" : "solo";

  useEffect(() => {
    if (ready && !studentId && !teacherId) setLocation("/login");
  }, [ready, studentId, teacherId, setLocation]);

  // ── Saved payment methods ─────────────────────────────────────────────────
  const savedPmParams = { ownerId: ownerId!, ownerType };
  const { data: savedData, isLoading: savedLoading } = useListPaymentMethods(
    savedPmParams,
    { query: { enabled: ready && !!ownerId, queryKey: getListPaymentMethodsQueryKey(savedPmParams) } },
  );
  const savedCards = savedData?.paymentMethods ?? [];

  // Default: if there's a default card, pre-select it; otherwise pre-select "new card" (null)
  const defaultCard = savedCards.find((c) => c.isDefault) ?? savedCards[0];
  const [selectedCardId, setSelectedCardId] = useState<string | null | undefined>(undefined);

  // Resolve once cards load
  const resolvedSelectedId: string | null =
    selectedCardId === undefined
      ? (defaultCard?.id ?? null)
      : selectedCardId;

  const usingNewCard = resolvedSelectedId === null;

  // ── Stripe config + Elements ──────────────────────────────────────────────
  const { data: config } = useGetBillingConfig({
    query: { queryKey: getGetBillingConfigQueryKey(), staleTime: Infinity, enabled: ready && !!ownerId && usingNewCard },
  });

  const stripePromise = useMemo(
    () => (config?.publishableKey ? loadStripe(config.publishableKey) : null),
    [config?.publishableKey],
  );

  const checkoutIntent = useCreateCheckoutIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!usingNewCard || !ready || !ownerId) return;
    setClientSecret(null);
    checkoutIntent
      .mutateAsync({ data: { ownerId, ownerType, planId, seatCount } })
      .then((result) => setClientSecret(result.clientSecret))
      .catch(() => {
        toast({ title: "Something went wrong", description: "Could not start checkout. Please try again.", variant: "destructive" });
        setLocation("/billing");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingNewCard, ready, ownerId, ownerType, planId, seatCount]);

  // ── Saved-card checkout ───────────────────────────────────────────────────
  const savedCardCheckout = useCheckoutWithSavedCard();
  const [savedCardSubmitting, setSavedCardSubmitting] = useState(false);

  // ── Shared finalizing / success handler ──────────────────────────────────
  const [finalizing, setFinalizing] = useState(false);

  const handleSuccess = async () => {
    setFinalizing(true);
    const subscriptionQueryKey = getGetSubscriptionQueryKey({ ownerId: ownerId!, ownerType });
    let becameActive = false;
    // Poll up to 30 s (20 × 1 500 ms) — Stripe webhooks in dev can take 10–20 s.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const latest = await getSubscription({ ownerId: ownerId!, ownerType });
        if (latest.status === SubscriptionStatus.active) {
          queryClient.setQueryData(subscriptionQueryKey, latest);
          becameActive = true;
          break;
        }
      } catch { /* 404 until webhook syncs — keep polling */ }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Wipe all subscription-related caches so every page gets fresh data.
    await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
    await queryClient.invalidateQueries({ queryKey: getGetSubscriptionQueryKey({ ownerId: ownerId!, ownerType: "organization" }) });
    await queryClient.invalidateQueries({ queryKey: getGetSubscriptionQueryKey({ ownerId: ownerId!, ownerType: "solo" }) });
    if (isEducator) {
      await queryClient.invalidateQueries({ queryKey: getGetBillingAdminSummaryQueryKey(ownerId!), exact: false });
    }

    toast({
      title: "Subscription active!",
      description: becameActive
        ? "Your payment went through and your plan is now active."
        : "Your payment went through. Your plan will show as active shortly.",
    });
    setLocation("/billing");
  };

  const handleSavedCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedSelectedId || !ownerId) return;
    setSavedCardSubmitting(true);
    try {
      await savedCardCheckout.mutateAsync({
        data: { ownerId, ownerType, planId, seatCount, paymentMethodId: resolvedSelectedId },
      });
      await handleSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Payment failed. Please try a different card or add a new one.";
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
      setSavedCardSubmitting(false);
    }
  };

  const { data: plans } = useGetBillingPlans({
    query: { queryKey: getGetBillingPlansQueryKey(), staleTime: 60_000, enabled: ready },
  });

  const selectedPlan = plans?.find((p) => p.planId === planId);
  const PlanIcon = planId === "organization" ? Building2 : User;

  if (!ready || (!studentId && !teacherId) || savedLoading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer maxWidth="max-w-2xl" className="space-y-8">
      <BackButton to="/billing" label="Back to billing" />

      <header className="space-y-2 border-b border-border/40 pb-6">
        <p className="heading-eyebrow">Checkout</p>
        <h1 className="heading-page text-3xl">Complete your subscription</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Review your plan, then confirm payment. You can manage billing anytime from your account.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <PlanIcon className="w-5 h-5 text-primary" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {planId === "organization" ? "Organization plan" : "Personal plan"}
            </p>
            {planId === "organization" && seatCount != null && (
              <p className="text-sm text-muted-foreground mt-0.5">{seatCount} seat{seatCount === 1 ? "" : "s"}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black tabular-nums text-primary">
              {selectedPlan?.displayPrice ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">{selectedPlan?.displayPeriod ?? ""}</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {finalizing ? (
          <motion.div
            key="finalizing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center gap-5 py-20 bg-card border border-border/50 rounded-2xl shadow-sm"
          >
            <PageLoader />
            <p className="text-base font-semibold text-foreground">Activating your subscription</p>
            <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {/* Card selector — shown when there are saved cards */}
            {savedCards.length > 0 && (
              <div className="space-y-4">
                <h2 className="heading-section text-base">Payment method</h2>
                <SavedCardSelector
                  cards={savedCards}
                  selectedId={resolvedSelectedId}
                  onSelect={(id) => setSelectedCardId(id)}
                />
              </div>
            )}

            {/* Saved-card submit button */}
            {!usingNewCard && resolvedSelectedId && (
              <motion.form
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={(e) => void handleSavedCardSubmit(e)}
                className="space-y-5 bg-card border border-border/50 p-6 rounded-2xl shadow-sm"
              >
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                  Charged securely through Stripe.
                </p>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setLocation("/billing")}
                    disabled={savedCardSubmitting}
                    className="flex-1 h-11 font-semibold bg-card border border-border/50 rounded-xl hover:bg-muted/40 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savedCardSubmitting}
                    className="flex-1 h-11 flex items-center justify-center btn-brand rounded-xl font-semibold border-0 disabled:opacity-50"
                  >
                    {savedCardSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Complete subscription
                  </button>
                </div>
              </motion.form>
            )}

            {/* New card Elements form */}
            {usingNewCard && (
              clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                  <NewCardForm onSuccess={() => void handleSuccess()} onCancel={() => setLocation("/billing")} />
                </Elements>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center py-20 bg-card border border-border/50 rounded-2xl shadow-sm"
                >
                  <PageLoader />
                </motion.div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BillingTrustFooter />
    </PageContainer>
  );
}
