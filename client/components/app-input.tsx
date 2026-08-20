import * as React from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AppInputProps extends React.ComponentProps<"input"> {
  label?: ReactNode;
  icon?: LucideIcon;
  rightAddon?: ReactNode;
  error?: string;
  hint?: string;
}

/**
 * AppInput — the ONE canonical input field for this app.
 *
 * Renders an optional label, an icon slot on the left, a right-addon slot
 * (e.g. password-visibility toggle), an error message, and a hint.
 * Every native <input> prop passes through untouched.
 */
export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, icon: Icon, rightAddon, error, hint, id, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <Label
            htmlFor={id}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block"
          >
            {label}
          </Label>
        )}

        <div className="relative">
          {Icon && (
            <Icon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground stroke-[2] pointer-events-none z-10" />
          )}

          <input
            ref={ref}
            id={id}
            className={cn(
              // Base
              "flex h-12 w-full rounded-xl border border-border/40 bg-card px-4 py-2",
              "text-base font-medium text-foreground shadow-sm",
              "transition-all duration-200",
              // Placeholder
              "placeholder:text-muted-foreground/50 placeholder:font-normal",
              // Focus
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md",
              // Disabled
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
              // File input reset
              "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
              // Icon / addon padding
              Icon && "pl-11",
              rightAddon && "pr-12",
              // Error state
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              className,
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground font-medium">{hint}</p>
        )}
      </div>
    );
  },
);
AppInput.displayName = "AppInput";
