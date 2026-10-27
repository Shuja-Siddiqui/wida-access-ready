import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PAGE_THEME_WASH_LAYER } from "@/components/dashboard-ui-styles";
import { cn } from "@/lib/utils";

type PageThemeWashContextValue = {
  depth: number;
  register: (active: boolean) => void;
};

const PageThemeWashContext = createContext<PageThemeWashContextValue | null>(null);

export function PageThemeWashProvider({ children }: { children: ReactNode }) {
  const [depth, setDepth] = useState(0);

  const register = useCallback((active: boolean) => {
    setDepth((d) => Math.max(0, d + (active ? 1 : -1)));
  }, []);

  const value = useMemo(() => ({ depth, register }), [depth, register]);

  return <PageThemeWashContext.Provider value={value}>{children}</PageThemeWashContext.Provider>;
}

/** Call from PageContainer when `themeWash` is enabled. */
export function useRegisterPageThemeWash(active: boolean) {
  const ctx = useContext(PageThemeWashContext);
  useEffect(() => {
    if (!ctx || !active) return;
    ctx.register(true);
    return () => ctx.register(false);
  }, [ctx, active]);
}

/** Full-width backdrop on `#app-main` (outside the 1440px content column). */
export function PageThemeWashBackdrop() {
  const ctx = useContext(PageThemeWashContext);
  if (!ctx || ctx.depth <= 0) return null;

  return (
    <div
      aria-hidden
      className={cn(PAGE_THEME_WASH_LAYER, "pointer-events-none absolute inset-0 -z-10")}
    />
  );
}
