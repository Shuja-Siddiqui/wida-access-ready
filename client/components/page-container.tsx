import { useBreadcrumbTrail, type Crumb } from "@/components/breadcrumbs";
import { PAGE_MAX_WIDTH, PAGE_SHELL_X } from "@/components/app-layout";
import { cn } from "@/lib/utils";
import { useRegisterPageThemeWash } from "@/components/page-theme-wash";

export { PAGE_MAX_WIDTH, PAGE_SHELL_X };

/** Centered narrow column for checkout and similar single-column flows. */
export const PAGE_FORM_MAX_WIDTH = "max-w-2xl";

export function PageContainer({
  children,
  trail,
  maxWidth,
  className,
  shellClassName,
  pad = true,
  themeWash = false,
}: {
  children: React.ReactNode;
  trail?: Crumb[];
  /**
   * Optional inner cap inside the 1440px app shell.
   * Omit for the same width as the student home dashboard (`PAGE_MAX_WIDTH`).
   */
  maxWidth?: string;
  className?: string;
  shellClassName?: string;
  /** Vertical padding for scroll pages (default). Set false for viewport-fill pages. */
  pad?: boolean;
  /** Soft primary wash at top of page (dashboard / settings style). */
  themeWash?: boolean;
}) {
  useBreadcrumbTrail(trail);
  useRegisterPageThemeWash(themeWash);

  return (
    <div
      className={cn(
        "relative w-full",
        pad && "py-8 sm:py-12",
        shellClassName,
      )}
    >
      <div
        className={cn(
          maxWidth,
          maxWidth && "mx-auto",
          "w-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
