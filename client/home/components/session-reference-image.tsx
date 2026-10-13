import { cn } from "@/lib/utils";
import { SESSION_LABEL, SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";
import { StemVisual } from "@/components/shape-glyph";

/** Library photo or keyboard-mark visual — shared across all practice domains. */
export function SessionReferenceImage({
  url,
  visual,
  domain = "writing",
  label = "Reference",
  compact = false,
  className,
}: {
  url?: string | null;
  visual?: string | null;
  domain?: SessionDomainKey;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  if (!url && !visual) return null;

  const theme = SESSION_THEMES[domain];

  return (
    <figure className={cn("min-w-0", compact ? "space-y-1.5" : "space-y-2", className)}>
      {!compact && <figcaption className={SESSION_LABEL}>{label}</figcaption>}
      {url ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl bg-muted/20 flex items-center justify-center",
            compact
              ? "min-h-[6.5rem] max-h-[min(20vh,10rem)] sm:max-h-[min(22vh,11rem)] lg:max-h-[min(24vh,12rem)]"
              : "min-h-[11rem] max-h-[min(42vh,20rem)] lg:max-h-[min(52vh,28rem)]",
          )}
        >
          <img
            src={url}
            alt=""
            className="w-full h-full max-h-[inherit] object-contain block"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div className={cn("rounded-xl p-5 flex items-center justify-center", theme.panel)}>
          <StemVisual visual={visual!} />
        </div>
      )}
    </figure>
  );
}
