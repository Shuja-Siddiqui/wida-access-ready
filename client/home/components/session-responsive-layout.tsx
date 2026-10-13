import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SessionReferenceImage } from "./session-reference-image";
import {
  SESSION_REFERENCE_COLUMN,
  SESSION_WORK_COLUMN,
  sessionScrollArea,
  type SessionDomainKey,
} from "./session-ui-styles";

/**
 * Responsive session shell used by every domain.
 *
 * Mobile (stacked):  reference image → reference panel (passage / audio / prompt) → work area
 * Desktop (split):   reference column (sticky left)  |  work column (right)
 */
export function SessionResponsiveLayout({
  domain,
  mediaUrl,
  visual,
  referenceLabel = "Reference",
  referencePanel,
  children,
  className,
}: {
  domain: SessionDomainKey;
  mediaUrl?: string | null;
  visual?: string | null;
  referenceLabel?: string;
  referencePanel?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasMedia = Boolean(mediaUrl || visual);
  const hasReference = hasMedia || referencePanel != null;

  if (!hasReference) {
    return <div className={cn("w-full min-w-0 space-y-5", className)}>{children}</div>;
  }

  const fillViewport = domain === "writing" || domain === "speaking";

  return (
    <div
      className={cn(
        "w-full grid grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)]",
        "gap-5 sm:gap-6 lg:gap-8",
        fillViewport
          ? "flex-1 min-h-0 items-stretch max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:themed-scroll lg:h-full lg:min-h-0 lg:overflow-hidden"
          : "items-start",
        className,
      )}
    >
      <aside
        className={cn(
          fillViewport
            ? cn(
                "min-w-0 flex flex-col gap-3 sm:gap-4 min-h-0",
                "max-lg:shrink-0 lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1",
                sessionScrollArea(domain),
              )
            : cn(SESSION_REFERENCE_COLUMN, sessionScrollArea(domain)),
        )}
      >
        {hasMedia && (
          <SessionReferenceImage
            url={mediaUrl}
            visual={visual}
            domain={domain}
            label={referenceLabel}
            compact={domain === "writing"}
            className="shrink-0"
          />
        )}
        {referencePanel}
      </aside>

      <div
        className={cn(
          SESSION_WORK_COLUMN,
          fillViewport && "max-lg:shrink-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain",
          fillViewport && sessionScrollArea(domain),
        )}
      >
        {children}
      </div>
    </div>
  );
}
