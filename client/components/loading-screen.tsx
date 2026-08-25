import { cn } from "@/lib/utils";
import { useShowBar } from "@/components/app-shell";

/** Shared page loader mark — use this everywhere a screen is waiting. */
export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-16 h-16 rounded-2xl bg-gradient-to-br from-trust-blue to-[#e91e8c] shadow-[0_4px_14px_rgba(255,77,141,0.4)] animate-[spin_2s_cubic-bezier(0.4,0,0.2,1)_infinite] flex items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <div className="w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm" />
    </div>
  );
}

export function LoadingScreen({
  fullHeight,
  message = "Loading",
}: {
  fullHeight?: boolean;
  message?: string;
}) {
  const showBar = useShowBar();
  const fillViewport = fullHeight ?? !showBar;

  return (
    <div
      className={`${fillViewport ? "min-h-screen" : "min-h-[calc(100vh-5rem)]"} flex flex-col items-center justify-center bg-background gap-8`}
    >
      <PageLoader />
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
        {message}
      </div>
    </div>
  );
}
