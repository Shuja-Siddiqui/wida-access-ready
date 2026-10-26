import type { ReactNode } from "react";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackButton } from "@/components/back-button";
import { Check } from "lucide-react";

export interface AuthSplitLayoutProps {
  children: ReactNode;
  /** Left panel headline (desktop). */
  panelTitle: string;
  panelSubtitle?: string;
  panelFeatures?: string[];
  panelIcon?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  backTo?: string;
  footerLabel?: string;
}

export function AuthSplitLayout({
  children,
  panelTitle,
  panelSubtitle,
  panelFeatures = [],
  panelIcon,
  onBack,
  showBack = true,
  backTo,
  footerLabel = "Access Ready",
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="brand-panel-gradient hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <AppLogo href="/" imageClassName="h-12" />
        </div>

        <div className="relative z-10 space-y-8">
          {panelIcon ? (
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              {panelIcon}
            </div>
          ) : null}
          <div>
            <h2 className="auth-panel-title mb-3">{panelTitle}</h2>
            {panelSubtitle ? (
              <p className="auth-panel-subtitle">{panelSubtitle}</p>
            ) : null}
          </div>
          {panelFeatures.length > 0 ? (
            <ul className="space-y-4">
              {panelFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white/85 text-[15px] leading-snug">{f}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="text-white/50 text-sm font-medium relative z-10">{footerLabel}</p>
      </div>

      <div className="flex-1 flex flex-col min-h-screen bg-background bg-[radial-gradient(120%_80%_at_50%_-20%,hsl(var(--primary)/0.06)_0%,transparent_50%)]">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-2">
            <AppLogo href="/" imageClassName="h-8 lg:hidden" className="lg:hidden" />
            {showBack ? (
              onBack ? <BackButton onClick={onBack} /> : <BackButton to={backTo ?? "/login"} />
            ) : null}
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 lg:px-10 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
