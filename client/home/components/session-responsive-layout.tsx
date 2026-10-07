import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SessionReferenceImage } from "./session-reference-image";
import {
  SESSION_REFERENCE_COLUMN,
  sessionScrollArea,
  type SessionDomainKey,
} from "./session-ui-styles";

/**
 * Responsive session shell used by every domain.
 *
 * Mobile (stacked):  whole grid scrolls — image → passage → questions → feedback
 * Desktop (split):   reference column scrolls left  |  work column scrolls right (footer pinned in work column)
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
  const imageOnlyReference = hasMedia && referencePanel == null;

  if (!hasReference) {
    return <div className={cn("w-full min-w-0 space-y-5", className)}>{children}</div>;
  }

  const fillViewport =
    domain === "writing"
      ? true
      : domain === "speaking" || domain === "listening" || domain === "reading";

  /** Smaller reference photo — more room for passage + two questions on reading/listening. */
  const compactImage = domain === "reading" || domain === "listening";

  return (
    <div
      className={cn(
        "w-full grid grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)]",
        "gap-4 sm:gap-5 lg:gap-6",
        fillViewport
          ? cn(
              "flex-1 min-h-0 max-h-full items-stretch",
              "overflow-y-auto overscroll-contain themed-scroll",
              "lg:overflow-hidden lg:h-full",
            )
          : "items-start",
        className,
      )}
    >
      <aside
        className={cn(
          fillViewport
            ? cn(
                "min-w-0 flex flex-col gap-3 sm:gap-4 min-h-0 shrink-0",
                "lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1",
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
            compact={compactImage}
            className={cn(
              "shrink-0",
              imageOnlyReference && "lg:sticky lg:top-0",
            )}
          />
        )}
        {referencePanel}
      </aside>

      <div
        className={cn(
          "min-w-0 flex flex-col min-h-0",
          fillViewport && "lg:h-full lg:max-h-full lg:overflow-hidden lg:flex-1 lg:border-l lg:border-border/10 lg:pl-6 lg:ml-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
