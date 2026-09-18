import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
}

export function AppLogo({ href = "/home", className, imageClassName }: AppLogoProps) {
  const img = (
    <img
      src="/goelprep-logo.png"
      alt="goELprep"
      className={cn("h-10 w-auto object-contain object-left", imageClassName)}
    />
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
