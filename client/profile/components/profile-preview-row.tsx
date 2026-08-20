interface ProfilePreviewRowProps {
  label: string;
  value: string;
}

export function ProfilePreviewRow({ label, value }: ProfilePreviewRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-b-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex-shrink-0">
        {label}
      </span>
      <span className="font-bold text-foreground text-sm text-right truncate">{value || "—"}</span>
    </div>
  );
}
