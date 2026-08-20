import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-12 w-full rounded-xl border border-border/40 bg-card px-4 py-2",
          "text-base font-medium text-foreground shadow-sm",
          "transition-all duration-200",
          // Placeholder
          "placeholder:text-muted-foreground/50 placeholder:font-normal",
          // Focus
          "focus-visible:outline-none focus-visible:border-primary",
          "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-md",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
          // File input reset
          "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
