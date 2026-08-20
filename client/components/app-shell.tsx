import { createContext, useContext, useEffect, useState } from "react";
import { LogOut as LogOutIcon, Moon as MoonIcon, Sun as SunIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useNavConfig } from "@/components/nav-config";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = new Set([
  "/",
  "/login",
  "/onboarding",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invite",
  "/signup",
  "/signup/educator",
  "/signup/district",
  "/signup/parent",
]);

const CAPSULE_MIN_VIEWPORT = 768;

/**
 * The floating capsule is shown from 768px up; below that the hamburger
 * menu (rendered in the navbar) takes over.
 */
function useCanShowCapsule() {
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${CAPSULE_MIN_VIEWPORT}px)`);
    const onChange = () => setCanShow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return canShow;
}

type NavContextValue = { showNav: boolean; showCapsule: boolean };

const NavContext = createContext<NavContextValue>({ showNav: false, showCapsule: false });

export function useShowNav() {
  return useContext(NavContext).showNav;
}

export function useShowCapsule() {
  return useContext(NavContext).showCapsule;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { studentId, teacherId, ready } = useAuth();
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const canShowCapsule = useCanShowCapsule();
  const { navItems, isDark, toggleTheme, handleLogout } = useNavConfig();

  const isAuthed = !!studentId || !!teacherId;
  const showNav = ready && isAuthed && !HIDDEN_PATHS.has(location);
  const showCapsule = showNav && canShowCapsule;

  const itemClass = (active: boolean) =>
    cn(
      "flex h-11 w-full items-center rounded-2xl transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const iconSlotClass = "flex h-11 w-11 flex-shrink-0 items-center justify-center";
  const labelClass = cn(
    "whitespace-nowrap text-sm font-bold pr-3 transition-opacity duration-150",
    expanded ? "opacity-100 delay-100" : "opacity-0",
  );

  return (
    <>
      {showCapsule && (
        <nav
          aria-label="Primary"
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className={cn(
            "fixed left-4 top-1/2 z-[100] -translate-y-1/2 overflow-hidden rounded-[28px] border border-border bg-card/95 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md transition-[width] duration-300 ease-out",
            expanded ? "w-52" : "w-14",
          )}
        >
          <div className="flex flex-col gap-1">
            {navItems.map(({ key, label, icon: Icon, onClick, active }) => (
              <button key={key} type="button" onClick={onClick} aria-label={label} className={itemClass(active)}>
                <span className={iconSlotClass}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={labelClass}>{label}</span>
              </button>
            ))}

            <div className="mx-2.5 my-1 h-px bg-border" aria-hidden="true" />

            <button type="button" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className={itemClass(false)}>
              <span className={iconSlotClass}>
                {isDark ? <SunIcon /> : <MoonIcon />}
              </span>
              <span className={labelClass}>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-11 w-full items-center rounded-2xl text-destructive transition-colors hover:bg-destructive/10"
            >
              <span className={iconSlotClass}>
                <LogOutIcon />
              </span>
              <span className={labelClass}>Log out</span>
            </button>
          </div>
        </nav>
      )}
      <NavContext.Provider value={{ showNav, showCapsule }}>{children}</NavContext.Provider>
    </>
  );
}
