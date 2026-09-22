import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShowCapsule, useShowNav } from "@/components/app-shell";
import { useNavConfig } from "@/components/nav-config";
import { Breadcrumbs, useOptionalTrail, type Crumb } from "@/components/breadcrumbs";
import { AppLogo } from "@/components/app-logo";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar({ trail }: { trail?: Crumb[] } = {}) {
  const { userType } = useAuth();
  const showNav = useShowNav();
  const showCapsule = useShowCapsule();
  const contextTrail = useOptionalTrail();
  const { navItems, isDark, toggleTheme, handleLogout, homePath } = useNavConfig();
  const crumbs = trail ?? contextTrail;

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border/40 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <AppLogo href={homePath as string} imageClassName="h-8 sm:h-9" className="shrink-0" />

          <div className="h-6 w-px bg-border flex-shrink-0 hidden sm:block" aria-hidden="true" />

          <div className="min-w-0 font-semibold text-muted-foreground">
            <Breadcrumbs userType={userType} items={crumbs} />
          </div>
        </div>

        <ThemeSelector className="shrink-0" />

        {showNav && !showCapsule && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="w-10 h-10 rounded-lg border border-border/40 bg-card shadow-sm hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md data-[state=open]:bg-muted/60 transition-all duration-300 flex-shrink-0"
              >
                <Menu className="h-5 w-5 stroke-[2]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border border-border/40 rounded-2xl shadow-xl p-2 bg-card mt-2">
              {navItems.map(({ key, label, icon: Icon, onClick, active }) => (
                <DropdownMenuItem 
                  key={key} 
                  onClick={onClick} 
                  className={cn(
                    "font-semibold rounded-lg cursor-pointer py-3 px-4 transition-colors text-sm",
                    active ? "bg-trust-blue/10 text-trust-blue focus:bg-trust-blue/15" : "hover:bg-muted/60 focus:bg-muted/60 text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3 stroke-[2]" />
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-border/40 my-2 h-px mx-2" />
              <DropdownMenuItem onClick={toggleTheme} className="font-semibold rounded-lg cursor-pointer py-3 px-4 hover:bg-muted/60 focus:bg-muted/60 text-sm text-foreground">
                {isDark ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40 my-2 h-px mx-2" />
              <DropdownMenuItem onClick={handleLogout} className="font-semibold rounded-lg cursor-pointer py-3 px-4 text-energy-orange focus:bg-energy-orange/10 focus:text-energy-orange text-sm">
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
