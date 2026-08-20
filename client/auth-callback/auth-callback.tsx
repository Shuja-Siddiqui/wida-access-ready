import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const PENDING_GOOGLE_AUTH_KEY = "pendingGoogleAuth";

export type PendingGoogleAuth = {
  token: string;
  role: string;
  studentId?: string;
  teacherId?: string;
  userId?: string;
};

export function storePendingGoogleAuth(data: PendingGoogleAuth) {
  sessionStorage.setItem(PENDING_GOOGLE_AUTH_KEY, JSON.stringify(data));
}

export function loadPendingGoogleAuth(): PendingGoogleAuth | null {
  const raw = sessionStorage.getItem(PENDING_GOOGLE_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingGoogleAuth;
  } catch {
    return null;
  }
}

export function clearPendingGoogleAuth() {
  sessionStorage.removeItem(PENDING_GOOGLE_AUTH_KEY);
}

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);

    const studentId = params.get("studentId");
    const teacherId = params.get("teacherId");
    const userId = params.get("userId");
    const token = params.get("token");
    const isNewUser = params.get("isNewUser") === "true";
    const role = params.get("role") ?? "student";

    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      setLocation("/login?authError=google");
      return;
    }

    if (studentId) {
      // ── Student ──────────────────────────────────────────
      if (isNewUser) {
        storePendingGoogleAuth({ token, role: "student", studentId, teacherId: teacherId ?? undefined });
        setLocation("/onboarding?source=google");
      } else {
        loginWithToken(token, { studentId, teacherId: teacherId ?? undefined });
        setLocation("/home");
      }
    } else if (teacherId) {
      // ── Educator / District Admin ─────────────────────────
      if (isNewUser) {
        storePendingGoogleAuth({ token, role, teacherId });
        // role is "educator" or "district"
        setLocation(`/signup/${role}?source=google`);
      } else {
        loginWithToken(token, { teacherId });
        setLocation("/teacher");
      }
    } else if (userId) {
      // ── Parent ────────────────────────────────────────────
      if (isNewUser) {
        storePendingGoogleAuth({ token, role: "parent", userId });
        setLocation("/signup/parent?source=google");
      } else {
        // Use teacherId slot for parents (non-student routing)
        loginWithToken(token, { teacherId: userId });
        setLocation("/home");
      }
    } else {
      setLocation("/login?authError=google");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="bg-card border-4 border-foreground rounded-2xl shadow-[8px_8px_0_0_hsl(var(--foreground))] p-10 flex flex-col items-center gap-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <p className="text-foreground font-black text-xl uppercase tracking-widest">Signing you in…</p>
      </div>
    </div>
  );
}
