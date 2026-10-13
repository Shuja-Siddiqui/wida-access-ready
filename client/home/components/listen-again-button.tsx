import { RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ListenAgainButtonProps {
  onListen: () => void;
  onStop?: () => void;
  speaking?: boolean;
  disabled?: boolean;
  domain?: import("./session-ui-styles").SessionDomainKey;
  fullWidth?: boolean;
  label?: string;
  className?: string;
}

export function ListenAgainButton({
  onListen,
  onStop,
  speaking = false,
  disabled = false,
  fullWidth = false,
  label,
  className,
}: ListenAgainButtonProps) {
  const listenLabel = label ?? "Listen again";
  const buttonLabel = speaking ? "Stop" : listenLabel;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={speaking && onStop ? onStop : onListen}
      className={cn(
        "h-9 gap-2 text-muted-foreground hover:text-foreground font-normal",
        fullWidth && "w-full",
        speaking && "text-rose-600 hover:text-rose-700 dark:text-rose-400",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      {speaking ? (
        <Square className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      {buttonLabel}
    </Button>
  );
}
