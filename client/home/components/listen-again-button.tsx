import { RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";

interface ListenAgainButtonProps {
  onListen: () => void;
  onStop?: () => void;
  speaking?: boolean;
  disabled?: boolean;
  domain?: SessionDomainKey;
  fullWidth?: boolean;
  className?: string;
}

export function ListenAgainButton({
  onListen,
  onStop,
  speaking = false,
  disabled = false,
  domain = "listening",
  fullWidth = false,
  className,
}: ListenAgainButtonProps) {
  const theme = SESSION_THEMES[domain];
  const label = speaking ? "Stop audio" : "Listen again";

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={speaking && onStop ? onStop : onListen}
      className={cn(
        "h-10 rounded-lg font-medium text-sm gap-2.5 shadow-sm transition-colors duration-150",
        fullWidth && "w-full",
        speaking
          ? "border-rose-500/30 bg-rose-500/[0.06] text-rose-800 dark:text-rose-200 hover:bg-rose-500/10 hover:border-rose-500/40"
          : cn(
              "border-primary/25 bg-primary/[0.05] text-primary",
              "hover:bg-primary/10 hover:border-primary/40 hover:text-primary",
            ),
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-md shrink-0",
          speaking ? "bg-rose-500/10" : theme.iconWrap,
        )}
      >
        {speaking ? (
          <Square className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        ) : (
          <Volume2 className={cn("w-3.5 h-3.5", theme.icon)} />
        )}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {!speaking && (
        <RotateCcw className="w-3.5 h-3.5 opacity-50 shrink-0" aria-hidden />
      )}
    </Button>
  );
}
