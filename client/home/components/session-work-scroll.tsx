import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Work column layout: questions scroll; feedback / Next stays pinned at the bottom on desktop.
 */
export function SessionWorkScroll({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col",
        "lg:flex-1 lg:max-h-full lg:overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "min-w-0 space-y-1",
          "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:themed-scroll lg:pr-1",
        )}
      >
        {children}
      </div>
      {footer != null && (
        <div
          className={cn(
            "shrink-0 w-full pt-4 mt-2",
            "lg:z-10 lg:border-t lg:border-border/15 lg:bg-background/95 lg:backdrop-blur-sm lg:pb-2",
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
