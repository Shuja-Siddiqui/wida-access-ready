import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Log out"
      className={`flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
