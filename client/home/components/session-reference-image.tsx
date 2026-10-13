import { cn } from "@/lib/utils";
import { SESSION_CARD, SESSION_LABEL, SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";
import { StemVisual } from "@/components/shape-glyph";

const IMAGE_RING: Record<SessionDomainKey, string> = {
  listening: "ring-sky-500/20 border-sky-500/15",
  reading: "ring-amber-500/20 border-amber-500/15",
  speaking: "ring-emerald-500/20 border-emerald-500/15",
  writing: "ring-violet-500/20 border-violet-500/15",
};

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
  /** Smaller frame — more room for passage / prompt (writing sessions). */
  compact?: boolean;
  className?: string;
}) {
  if (!url && !visual) return null;

  const ring = IMAGE_RING[domain];
  const theme = SESSION_THEMES[domain];

  return (
    <figure className={cn("min-w-0", compact ? "space-y-1" : "space-y-2", className)}>
      {!compact && <figcaption className={SESSION_LABEL}>{label}</figcaption>}
      {url ? (
        <div
          className={cn(
            SESSION_CARD,
            "overflow-hidden p-0 flex items-center justify-center",
            "bg-card/60 backdrop-blur-sm ring-1",
            ring,
            compact
              ? "min-h-[6.5rem] max-h-[min(20vh,10rem)] sm:max-h-[min(22vh,11rem)] lg:min-h-[7rem] lg:max-h-[min(24vh,12rem)]"
              : "min-h-[11rem] max-h-[min(42vh,20rem)] lg:min-h-[14rem] lg:max-h-[min(72vh,36rem)]",
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
        <div className={cn(SESSION_CARD, "p-5 flex items-center justify-center", theme.panel)}>
          <StemVisual visual={visual!} />
        </div>
      )}
    </figure>
  );
}
