import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SESSION_LABEL, SESSION_SECTION_DIVIDER } from "./session-ui-styles";

/** Minimal question section — label + content, separated by a soft divider. */
export function SessionQuestionBlock({
  index,
  children,
  className,
  dimmed,
}: {
  index?: number;
  children: ReactNode;
  className?: string;
  dimmed?: boolean;
}) {
  return (
    <article
      className={cn(
        SESSION_SECTION_DIVIDER,
        "space-y-4 transition-opacity",
        dimmed && "opacity-50",
        className,
      )}
    >
      {index != null && (
        <p className={SESSION_LABEL}>Question {index + 1}</p>
      )}
      <div className="space-y-4">{children}</div>
    </article>
  );
}
