import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/google-icon";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  label?: string;
  role?: "student" | "educator" | "district" | "parent";
  className?: string;
}

export function GoogleButton({ label = "Continue with Google", role = "student", className }: GoogleButtonProps) {
  const handleClick = () => {
    window.location.href = `/api/auth/google/start?role=${role}`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className={cn(
        "w-full h-14 font-semibold text-base rounded-xl border border-border/40 bg-card text-foreground",
        "shadow-sm transition-all duration-300",
        "hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md",
        "active:translate-y-0 active:shadow-sm",
        className
      )}
    >
      <GoogleIcon className="w-5 h-5 mr-3" />
      {label}
    </Button>
  );
}
