import { CreditCard, Home as HomeIcon, LogOut, Moon, Sun, User, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active: boolean;
};

export function useNavConfig() {
  const { studentId, teacherId, userType, logout } = useAuth();
  const { theme, toggleTheme, isDark, setTheme } = useTheme();
  const [location, setLocation] = useLocation();

  const homePath = studentId
    ? "/home"
    : userType === "principal"
      ? "/principal"
      : userType === "district_admin"
        ? "/district"
        : teacherId
          ? "/teacher"
          : "/home";
  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const navItems: NavItem[] = [
    { key: "home", label: "Home", icon: HomeIcon, onClick: () => setLocation(homePath), active: location === homePath },
    { key: "profile", label: "Profile", icon: User, onClick: () => setLocation("/profile"), active: location === "/profile" },
    { key: "billing", label: "Billing", icon: CreditCard, onClick: () => setLocation("/billing"), active: location === "/billing" },
  ];

  return { navItems, isDark, theme, setTheme, toggleTheme, handleLogout, homePath };
}
