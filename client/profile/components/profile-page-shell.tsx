import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileLockedDetail {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface ProfilePageShellProps {
  displayName: string;
  roleLabel: string;
  roleTone?: "student" | "educator";
  avatar: ReactNode;
  lockedDetails: ProfileLockedDetail[];
  children: ReactNode;
  footer?: ReactNode;
}

function LockedDetailRow({ icon: Icon, label, value }: ProfileLockedDetail) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-muted/80 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export function ProfilePageShell({
  displayName,
  roleLabel,
  roleTone = "student",
  avatar,
  lockedDetails,
  children,
  footer,
}: ProfilePageShellProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Mobile: identity → form. Desktop (lg+): identity left, form right */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm lg:sticky lg:top-6"
        >
          <div
            className="h-24 lg:h-28 bg-gradient-to-br from-primary/25 via-primary/8 to-transparent"
            aria-hidden
          />

          <div className="px-6 sm:px-7 pb-7 -mt-12 lg:-mt-14">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-4">
              {avatar}
              <div className="min-w-0 w-full">
                <h1 className="heading-page text-2xl truncate">
                  {displayName}
                </h1>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                    roleTone === "educator"
                      ? "bg-accent/15 text-accent"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            {lockedDetails.length > 0 && (
              <div className="mt-7 pt-6 border-t border-border/40">
                <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Lock className="w-3.5 h-3.5" />
                  Account details
                </p>
                <div className="grid gap-4">
                  {lockedDetails.map((detail) => (
                    <LockedDetailRow key={detail.label} {...detail} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-sm space-y-6 min-w-0"
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">Personal details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes here update how you appear across the app.
            </p>
          </div>

          <div className="space-y-5">{children}</div>

          {footer && (
            <div className="flex justify-stretch sm:justify-end pt-2 border-t border-border/30">
              {footer}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
