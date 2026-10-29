import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStudentEmail } from "@/components/student-roster-identity";

export function PageBackLink({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit",
        className,
      )}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
      {children}
    </button>
  );
}

export function StudentMetaLine({
  assessment,
  gradeBand,
}: {
  assessment: string;
  gradeBand?: string | number | null;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-bold text-foreground bg-muted border border-border/40 shadow-sm px-2 py-0.5 rounded-lg text-sm">
        {assessment}
      </span>
      {gradeBand != null && gradeBand !== "" && (
        <span className="text-sm font-bold text-muted-foreground">Grade {gradeBand}</span>
      )}
    </span>
  );
}

/** Detail page subtitle: email + assessment meta. */
export function StudentProfileDescription({
  email,
  assessment,
  gradeBand,
}: {
  email?: string | null;
  assessment: string;
  gradeBand?: string | number | null;
}) {
  return (
    <span className="flex flex-col gap-2">
      <span className="text-sm sm:text-base text-foreground font-semibold truncate">
        {formatStudentEmail(email)}
      </span>
      <StudentMetaLine assessment={assessment} gradeBand={gradeBand} />
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  leading,
  actions,
  size = "default",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  /** Larger title on student home only */
  size?: "default" | "hero";
  className?: string;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      {leading}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-2 min-w-0">
          {eyebrow ? <p className="heading-eyebrow">{eyebrow}</p> : null}
          <h1
            className={cn(
              "heading-page leading-none",
              size === "hero" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
            )}
          >
            {title}
          </h1>
          {description ? (
            <div className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl leading-relaxed">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
