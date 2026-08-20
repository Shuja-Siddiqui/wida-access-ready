import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useGoBack } from "@/hooks/use-go-back";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function BackButton({
  to,
  label = "Back",
  onClick,
  className,
}: {
  to?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}) {
  const [, setLocation] = useLocation();
  const goBack = useGoBack();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      setLocation(to);
    } else {
      goBack();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      className={cn("gap-2 text-muted-foreground hover:text-foreground text-sm font-bold px-2", className)}
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </Button>
  );
}
