import { Navbar } from "@/components/navbar";
import { useShowCapsule } from "@/components/app-shell";
import type { Crumb } from "@/components/breadcrumbs";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  trail,
  maxWidth = "max-w-[1440px]",
  className,
}: {
  children: React.ReactNode;
  trail?: Crumb[];
  maxWidth?: string;
  className?: string;
}) {
  const showCapsule = useShowCapsule();

  return (
    <>
      <Navbar trail={trail} />
      <main
        className={cn(
          "min-h-[calc(100vh-5rem)] bg-background px-4 sm:px-6 lg:pr-10 py-8 sm:py-12 relative",
          showCapsule ? "md:pl-28 lg:pl-28" : "lg:pl-10",
        )}
      >
        <div className={cn(maxWidth, "mx-auto", className)}>{children}</div>
      </main>
    </>
  );
}
