import { Loader2, RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";

interface ListenAgainButtonProps {
  onListen: () => void;
  onStop?: () => void;
  speaking?: boolean;
  loading?: boolean;
  disabled?: boolean;
  domain?: SessionDomainKey;
  fullWidth?: boolean;
  className?: string;
}

export function ListenAgainButton({
  onListen,
  onStop,
  speaking = false,
  loading = false,
  disabled = false,
  domain = "listening",
  fullWidth = false,
  className,
}: ListenAgainButtonProps) {
  const theme = SESSION_THEMES[domain];
  const busy = speaking || loading;
  const label = loading ? "Loading audio…" : speaking ? "Stop audio" : "Listen again";

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || loading}
      onClick={busy && onStop ? onStop : onListen}
      className={cn(
        "h-10 rounded-lg font-medium text-sm gap-2.5 shadow-sm transition-colors duration-150",
        fullWidth && "w-full",
        busy
          ? "border-rose-500/30 bg-rose-500/[0.06] text-rose-800 dark:text-rose-200 hover:bg-rose-500/10 hover:border-rose-500/40"
          : cn(
              "border-primary/25 bg-primary/[0.05] text-primary",
              "hover:bg-primary/10 hover:border-primary/40 hover:text-primary",
            ),
        (disabled || loading) && "opacity-60 pointer-events-none",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-md shrink-0",
          busy ? "bg-rose-500/10" : theme.iconWrap,
        )}
      >
        {loading ? (
          <Loader2 className={cn("w-3.5 h-3.5 animate-spin", busy ? "text-rose-600" : theme.icon)} />
        ) : speaking ? (
          <Square className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        ) : (
          <Volume2 className={cn("w-3.5 h-3.5", theme.icon)} />
        )}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {!busy && !loading && (
        <RotateCcw className="w-3.5 h-3.5 opacity-50 shrink-0" aria-hidden />
      )}
    </Button>
  );
}
