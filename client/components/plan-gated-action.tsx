import { useLocation } from "wouter";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlanGatedActionProps {
  /** Whether the user has an active plan. When false the button shows a lock. */
  hasPlan: boolean;
  /** Show a skeleton/disabled state while subscription is loading. */
  isLoading?: boolean;
  /** The actual button to render when the plan is active. */
  children: React.ReactNode;
  /** Label shown in the lock tooltip and on the locked button. */
  label: string;
  /** Icon to show on the locked button (same as the unlocked one). */
  icon?: React.ReactNode;
  /** Variant forwarded to the locked button. @default "outline" */
  variant?: "outline" | "default" | "ghost" | "secondary";
  /** Extra className for the locked button. */
  className?: string;
}

export function PlanGatedAction({
  hasPlan,
  isLoading,
  children,
  label,
  icon,
  variant = "outline",
  className = "",
}: PlanGatedActionProps) {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Button variant={variant} disabled className={`font-bold rounded-lg opacity-40 ${className}`}>
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </Button>
    );
  }

  if (hasPlan) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            onClick={() => setLocation("/billing")}
            className={`font-bold rounded-lg border-border opacity-70 ${className}`}
          >
            <Lock className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-bold text-xs">
          Purchase a plan to unlock
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
