import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AppLayoutMode = "scroll" | "viewport";

export const PAGE_SHELL_X = "px-4 sm:px-6 lg:px-10";
export const PAGE_MAX_WIDTH = "max-w-[1440px]";

type AppLayoutContextValue = {
  mode: AppLayoutMode;
  setMode: (mode: AppLayoutMode) => void;
};

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

export function AppLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppLayoutMode>("scroll");
  const setMode = useCallback((next: AppLayoutMode) => setModeState(next), []);

  return (
    <AppLayoutContext.Provider value={{ mode, setMode }}>
      {children}
    </AppLayoutContext.Provider>
  );
}

export function useAppLayout() {
  const ctx = useContext(AppLayoutContext);
  if (!ctx) {
    throw new Error("useAppLayout must be used within AppLayoutProvider");
  }
  return ctx;
}

/** Lock the app shell to viewport height (no page scroll). Resets on unmount. */
export function useViewportPageLayout() {
  const { setMode } = useAppLayout();
  useEffect(() => {
    setMode("viewport");
    return () => setMode("scroll");
  }, [setMode]);
}

export function AppMain({
  mode,
  children,
}: {
  mode: AppLayoutMode;
  children: React.ReactNode;
}) {
  return (
    <main
      id="app-main"
      className={cn(
        "flex-1 min-h-0 bg-background",
        mode === "scroll"
          ? "overflow-y-auto themed-scroll overscroll-contain"
          : "overflow-hidden flex flex-col",
      )}
    >
      <div
        className={cn(
          PAGE_SHELL_X,
          PAGE_MAX_WIDTH,
          "mx-auto w-full",
          mode === "scroll" ? "min-h-full" : "flex-1 min-h-0 flex flex-col",
        )}
      >
        {children}
      </div>
    </main>
  );
}
