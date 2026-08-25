const SHAPE_ALIASES: Record<string, string> = {
  circle: "circle",
  round: "circle",
  oval: "oval",
  ellipse: "oval",
  square: "square",
  triangle: "triangle",
  rectangle: "rectangle",
  rect: "rectangle",
  diamond: "diamond",
  rhombus: "diamond",
  pentagon: "pentagon",
  hexagon: "hexagon",
  star: "star",
};

export function shapeKindFromLabel(label: string): string | null {
  const key = label.trim().toLowerCase().replace(/^(a|an|the)\s+/, "");
  return SHAPE_ALIASES[key] ?? null;
}

export function ShapeGlyph({
  kind,
  className = "w-10 h-10",
}: {
  kind: string;
  className?: string;
}) {
  const stroke = "currentColor";
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth="2.2"
      strokeLinejoin="round"
      aria-hidden
    >
      {kind === "circle" && <circle cx="20" cy="20" r="13" />}
      {kind === "oval" && <ellipse cx="20" cy="20" rx="15" ry="10" />}
      {kind === "square" && <rect x="9" y="9" width="22" height="22" />}
      {kind === "rectangle" && <rect x="6" y="12" width="28" height="16" />}
      {kind === "triangle" && <polygon points="20,7 33,32 7,32" />}
      {kind === "diamond" && <polygon points="20,6 34,20 20,34 6,20" />}
      {kind === "pentagon" && <polygon points="20,6 34,16 28,33 12,33 6,16" />}
      {kind === "hexagon" && <polygon points="12,8 28,8 35,20 28,32 12,32 5,20" />}
      {kind === "star" && (
        <polygon points="20,6 24,16 34,16 26,22 29,33 20,26 11,33 14,22 6,16 16,16" />
      )}
    </svg>
  );
}

export function looksLikeLineDiagram(text: string): boolean {
  const t = text.trim();
  if (t.length < 1 || t.length > 28) return false;
  return /^[IVXivx|/\\+\-=?\s]+$/.test(t) && /[IVXivx|]/.test(t);
}

export function OptionVisual({
  label,
  diagram,
}: {
  label: string;
  diagram?: string | null;
}) {
  const marks = diagram?.trim() || (looksLikeLineDiagram(label) ? label.trim() : "");
  const kind = !marks ? shapeKindFromLabel(label) : null;

  if (!marks && !kind) return <>{label}</>;

  return (
    <span className="inline-flex items-center gap-3 min-w-0">
      {marks ? (
        <span className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-background/40 px-2 font-mono text-lg tracking-[0.2em]">
          {marks}
        </span>
      ) : kind ? (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-background/40">
          <ShapeGlyph kind={kind} />
        </span>
      ) : null}
      {!looksLikeLineDiagram(label) && <span className="capitalize">{label}</span>}
    </span>
  );
}

export function OptionShapeLabel({ label }: { label: string }) {
  return <OptionVisual label={label} />;
}

export function StemVisual({ visual }: { visual?: string | null }) {
  const marks = visual?.trim();
  if (!marks) return null;
  const kind = shapeKindFromLabel(marks);
  return (
    <div className="flex justify-center">
      <div className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-xl border border-current/20 bg-background/50 px-4 py-3">
        {kind && !looksLikeLineDiagram(marks) ? (
          <ShapeGlyph kind={kind} className="w-12 h-12" />
        ) : (
          <span className="font-mono text-2xl tracking-[0.18em] text-foreground">{marks}</span>
        )}
      </div>
    </div>
  );
}
