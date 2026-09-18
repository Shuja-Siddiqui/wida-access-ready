import { cn } from "@/lib/utils";
import { useShowBar } from "@/components/app-shell";

/** Theme-aware loader — uses `primary` / `border` tokens (goELprep or Blossom). */
export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative h-14 w-14", className)}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="h-full w-full animate-spin motion-reduce:animate-none"
        style={{ animationDuration: "0.85s" }}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-border/80"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="32 96"
          className="text-primary"
        />
      </svg>
      <div
        className="absolute inset-[13px] rounded-full bg-primary/12 ring-1 ring-primary/20"
        aria-hidden
      />
      <div
        className="absolute inset-[19px] rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary)/0.4)] motion-safe:animate-pulse"
        aria-hidden
      />
    </div>
  );
}

export function LoadingScreen({
  fullHeight,
  message = "Loading…",
}: {
  fullHeight?: boolean;
  message?: string;
}) {
  const showBar = useShowBar();
  const fillViewport = fullHeight ?? !showBar;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background px-6",
        fillViewport ? "min-h-screen" : "min-h-[calc(100vh-5rem)]",
      )}
    >
      <div className="relative flex flex-col items-center gap-5">
        <div
          className="pointer-events-none absolute -inset-10 rounded-full bg-primary/[0.06] blur-2xl"
          aria-hidden
        />
        <PageLoader />
        {message ? (
          <p className="text-sm font-medium text-muted-foreground text-center max-w-xs leading-relaxed">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
