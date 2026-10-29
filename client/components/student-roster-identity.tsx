import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function formatStudentEmail(email?: string | null): string {
  const trimmed = email?.trim();
  return trimmed || "No email on file";
}

/** Name + email block for roster rows and cards. */
export function StudentRosterIdentity({
  name,
  email,
  secondary,
  nameClassName,
  className,
}: {
  name: string;
  email?: string | null;
  /** e.g. assessment · grade */
  secondary?: ReactNode;
  nameClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <p className={cn("font-bold truncate text-foreground", nameClassName ?? "text-sm sm:text-base")}>
        {name}
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground truncate">{formatStudentEmail(email)}</p>
      {secondary ? (
        <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{secondary}</div>
      ) : null}
    </div>
  );
}

/** Compact clickable pill (exit watch, chips) — name + email, navigates on click. */
export function StudentNavPill({
  name,
  email,
  onClick,
  className,
}: {
  name: string;
  email?: string | null;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-col items-start text-left max-w-[min(100%,240px)] rounded-xl border border-border/40",
        "bg-gradient-to-br from-card via-card to-primary/[0.06] px-3 py-2 shadow-sm",
        "hover:bg-streak-gold/15 hover:-translate-y-0.5 hover:shadow-md transition-all active:translate-y-0",
        className,
      )}
    >
      <span className="text-sm font-bold text-foreground truncate w-full">{name}</span>
      <span className="text-[11px] font-medium text-muted-foreground truncate w-full">
        {formatStudentEmail(email)}
      </span>
    </button>
  );
}
