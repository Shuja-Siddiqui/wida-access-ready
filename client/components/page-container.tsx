import { useBreadcrumbTrail, type Crumb } from "@/components/breadcrumbs";
import { PAGE_MAX_WIDTH, PAGE_SHELL_X } from "@/components/app-layout";
import { cn } from "@/lib/utils";

export { PAGE_MAX_WIDTH, PAGE_SHELL_X };

export function PageContainer({
  children,
  trail,
  maxWidth,
  className,
  shellClassName,
  pad = true,
}: {
  children: React.ReactNode;
  trail?: Crumb[];
  /** Narrower inner width inside the global 1440px shell. */
  maxWidth?: string;
  className?: string;
  shellClassName?: string;
  /** Vertical padding for scroll pages (default). Set false for viewport-fill pages. */
  pad?: boolean;
}) {
  useBreadcrumbTrail(trail);

  return (
    <div
      className={cn(
        "relative w-full",
        pad && "py-8 sm:py-12",
        shellClassName,
      )}
    >
      <div className={cn(maxWidth, maxWidth && "mx-auto", "w-full", className)}>{children}</div>
    </div>
  );
}
