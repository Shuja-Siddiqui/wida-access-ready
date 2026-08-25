import { GraduationCap, Menu } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useShowCapsule, useShowNav } from "@/components/app-shell";
import { useNavConfig } from "@/components/nav-config";
import { Breadcrumbs, useOptionalTrail, type Crumb } from "@/components/breadcrumbs";
import { ThemeToggle } from "@/components/theme-toggle";
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
          <Link href={homePath as string} className="flex items-center gap-3 flex-shrink-0 group outline-none">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trust-blue to-[#e91e8c] flex items-center justify-center shadow-[0_4px_14px_rgba(255,77,141,0.4)] group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] transition-all duration-300">
              <GraduationCap className="w-7 h-7 text-white stroke-[2]" />
            </div>
            <span className="font-black text-foreground text-2xl tracking-tight hidden sm:inline">Access Ready</span>
          </Link>

          <div className="h-8 w-px bg-border flex-shrink-0 hidden sm:block" aria-hidden="true" />

          <div className="min-w-0 font-semibold text-muted-foreground">
            <Breadcrumbs userType={userType} items={crumbs} />
          </div>
        </div>

        {!showNav && <ThemeToggle />}

        {showNav && !showCapsule && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="w-12 h-12 rounded-xl border border-border/40 bg-card shadow-sm hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md data-[state=open]:bg-muted/60 transition-all duration-300 flex-shrink-0"
              >
                <Menu className="h-6 w-6 stroke-[2]" />
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
