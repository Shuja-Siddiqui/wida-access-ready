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
import { Loader2, Lock, ArrowLeft, CreditCard, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
          border: `3px solid ${hsl(get("--foreground"))}`, 
          boxShadow: `3px 3px 0 0 ${hsl(get("--foreground"))}`,
        },
        ".Input:focus": {
          border: `3px solid ${hsl(get("--primary"))}`,
          boxShadow: `3px 3px 0 0 ${hsl(get("--primary"))}`,
        },
        ".Label": { 
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.85rem",
        },
        ".Tab": { 
          border: `3px solid ${hsl(get("--foreground"))}`,
          boxShadow: `3px 3px 0 0 ${hsl(get("--foreground"))}`,
        },
        ".Tab--selected": {
          border: `3px solid ${hsl(get("--primary"))}`,
          boxShadow: `3px 3px 0 0 ${hsl(get("--primary"))}`,
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
              "w-full flex items-center gap-4 px-5 py-4 rounded-xl border-4 transition-all text-left group",
              active
                ? "border-primary bg-primary/10 shadow-[4px_4px_0_0_hsl(var(--primary))]  -translate-y-1"
                : "border-border/40 bg-card shadow-sm hover: hover:-translate-y-1 hover:shadow-sm"
            )}
          >
            <div className="w-14 h-10 rounded-lg border border-border/40 bg-foreground text-background flex items-center justify-center text-xs font-black flex-shrink-0">
              {brandLabel(card.brand)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg text-foreground tracking-tight">
                •••• •••• •••• {card.last4}
              </p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                {card.isDefault && (
                  <span className="ml-3 text-primary font-black px-2 py-0.5 border border-primary rounded bg-primary/10">DEFAULT</span>
                )}
              </p>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-full border-4 flex items-center justify-center transition-colors",
              active ? "border-primary bg-primary" : "border-muted-foreground bg-card group-hover:border-border/40"
            )}>
              {active && <Check className="w-4 h-4 text-primary-foreground" strokeWidth={4} />}
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
          "w-full flex items-center gap-4 px-5 py-4 rounded-xl border-4 transition-all text-left group",
          selectedId === null
            ? "border-primary bg-primary/10 shadow-[4px_4px_0_0_hsl(var(--primary))]  -translate-y-1"
            : "border-border/40 bg-card shadow-sm hover: hover:-translate-y-1 hover:shadow-sm"
        )}
      >
        <div className="w-14 h-10 rounded-lg border border-border/40 bg-muted flex items-center justify-center flex-shrink-0">
          <Plus className="w-6 h-6 text-foreground" strokeWidth={3} />
        </div>
        <div className="flex-1">
          <p className="font-black text-lg text-foreground tracking-tight uppercase">Use a new card</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full border-4 flex items-center justify-center transition-colors",
          selectedId === null ? "border-primary bg-primary" : "border-muted-foreground bg-card group-hover:border-border/40"
        )}>
          {selectedId === null && <Check className="w-4 h-4 text-primary-foreground" strokeWidth={4} />}
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
      className="space-y-8 bg-card border border-border/40 p-6 rounded-2xl shadow-sm mt-6"
    >
      <PaymentElement className="min-h-[250px]" />
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground bg-muted p-3 rounded-xl border border-border/40">
        <Lock className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
        Secure checkout via Stripe
      </div>
      <div className="flex gap-4">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={submitting} 
          className="flex-1 font-black uppercase tracking-wider bg-card border border-border/40 py-4 rounded-xl shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          className="flex-1 flex items-center justify-center bg-primary text-primary-foreground font-black uppercase tracking-wider border border-border/40 py-4 rounded-xl shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={3} /> : null}
          Subscribe Now
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

  if (!ready || (!studentId && !teacherId) || savedLoading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer maxWidth="max-w-2xl" className="space-y-10 py-12">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setLocation("/billing")}
        className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground hover:text-primary transition-colors group w-fit"
      >
        <div className="w-8 h-8 rounded-full border border-border/40 bg-card group-hover:border-primary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
        </div>
        Back to Billing
      </motion.button>

      {/* Checkout header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3 bg-energy-orange/10 border border-border/40 p-8 rounded-2xl shadow-sm"
      >
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase">Complete Checkout</h1>
        {savedCards.length > 0 ? (
          <p className="text-lg font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5" strokeWidth={3} />
            You have {savedCards.length} saved card{savedCards.length > 1 ? "s" : ""}.
          </p>
        ) : (
          <p className="text-lg font-bold text-foreground">
            Enter your payment details below to get started.
          </p>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {finalizing ? (
          <motion.div
            key="finalizing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center gap-6 py-24 bg-card border border-border/40 rounded-2xl shadow-sm"
          >
            <PageLoader />
            <p className="text-xl font-black uppercase tracking-wider text-foreground">Finalizing your subscription</p>
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
                <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
                  Payment Method
                </h2>
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
                className="space-y-6 bg-card border border-border/40 p-6 rounded-2xl shadow-sm mt-6"
              >
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground bg-muted p-3 rounded-xl border border-border/40">
                  <Lock className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
                  Secure checkout via Stripe
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setLocation("/billing")} 
                    disabled={savedCardSubmitting} 
                    className="flex-1 font-black uppercase tracking-wider bg-card border border-border/40 py-4 rounded-xl shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savedCardSubmitting}
                    className="flex-1 flex items-center justify-center bg-primary text-primary-foreground font-black uppercase tracking-wider border border-border/40 py-4 rounded-xl shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {savedCardSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={3} /> : null}
                    Subscribe Now
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
                  className="flex items-center justify-center py-24 bg-card border border-border/40 rounded-2xl shadow-sm"
                >
                  <PageLoader />
                </motion.div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
