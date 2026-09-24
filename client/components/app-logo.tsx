import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
}

export function AppLogo({ href = "/home", className, imageClassName }: AppLogoProps) {
  const img = (
    <span
      className={cn(
        "inline-flex items-center rounded-lg",
        /* Logo PNG uses dark navy “go/prep” — lift it off dark UI surfaces. */
        "dark:bg-white dark:px-2.5 dark:py-1 dark:shadow-sm dark:ring-1 dark:ring-white/15",
      )}
    >
      <img
        src="/goelprep-logo.png"
        alt="goELprep"
        className={cn("h-10 w-auto object-contain object-left", imageClassName)}
      />
    </span>
  );

  if (!href) {
    return <div className={cn("inline-flex items-center", className)}>{img}</div>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center outline-none group", className)}>
      <span className="transition-transform duration-200 group-hover:-translate-y-0.5">{img}</span>
    </Link>
  );
}
