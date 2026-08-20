export function LoadingScreen({ fullHeight = true }: { fullHeight?: boolean }) {
  return (
    <div
      className={`${fullHeight ? "min-h-screen" : "min-h-[calc(100vh-5rem)]"} flex flex-col items-center justify-center bg-background gap-8`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-trust-blue to-[#e91e8c] shadow-[0_4px_14px_rgba(255,77,141,0.4)] animate-[spin_2s_cubic-bezier(0.4,0,0.2,1)_infinite] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm" />
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
        Loading Data
      </div>
    </div>
  );
}
