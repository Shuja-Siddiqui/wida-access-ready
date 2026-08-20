import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base
        "flex min-h-[96px] w-full rounded-xl border border-border/40 bg-card px-4 py-3",
        "text-base font-medium text-foreground shadow-sm",
        "transition-all duration-200 resize-none",
        // Placeholder
        "placeholder:text-muted-foreground/50 placeholder:font-normal",
        // Focus
        "focus-visible:outline-none focus-visible:border-primary",
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-md",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
