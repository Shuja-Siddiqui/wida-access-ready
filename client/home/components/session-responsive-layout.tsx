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

  return (
    <div
      className={cn(
        "w-full grid grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)]",
        "gap-5 sm:gap-6 lg:gap-8 items-start",
        className,
      )}
    >
      <aside className={cn(SESSION_REFERENCE_COLUMN, sessionScrollArea(domain))}>
        {hasMedia && (
          <SessionReferenceImage
            url={mediaUrl}
            visual={visual}
            domain={domain}
            label={referenceLabel}
            compact={domain === "writing"}
          />
        )}
        {referencePanel}
      </aside>

      <div className={SESSION_WORK_COLUMN}>{children}</div>
    </div>
  );
}
