import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { THEME_GROUPS, type ThemeId } from "@/lib/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSelector({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Choose color theme"
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card",
            "text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors",
            className,
          )}
        >
          <Palette className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className="z-[200] w-56 p-2 rounded-xl border-border/60 shadow-xl"
      >
        {THEME_GROUPS.map((group) => (
          <div key={group.id} className="mb-2 last:mb-0">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground px-1">
              {group.label}
            </DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {group.themes.map((option) => {
                const active = theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id as ThemeId)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                      active
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/60 hover:border-primary/30 hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn("h-4 w-4 shrink-0 rounded-full", option.swatch)}
                      aria-hidden
                    />
                    <span className="font-medium">{option.label}</span>
                    {active && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
