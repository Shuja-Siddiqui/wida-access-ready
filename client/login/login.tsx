import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { useApi, ApiError, extractErrorMessage } from "@/hooks/use-api";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputField } from "@/components/input-field";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackButton } from "@/components/back-button";
import { GoogleButton } from "@/components/google-button";

type Role = "student" | "admin";

const FEATURES = [
  "Adaptive practice sessions, every day",
  "Track your progress toward the exit threshold",
  "Daily streaks that build lasting habits",
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();
  const { googleEnabled } = useAuthConfig();
  const { request } = useApi();

  const [role, setRole]                       = useState<Role>("student");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [errorMsg, setErrorMsg]               = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSetupDone, setPasswordSetupDone] = useState(false);
  const [resendSent, setResendSent]           = useState(false);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("authError");
    if (authError === "google_not_configured") {
      setErrorMsg("Google sign-in isn't available yet. Please use your email and password.");
    } else if (authError) {
      setErrorMsg("We couldn't sign you in with Google. Please try again.");
    }
  }, []);

  const apiRole = role === "admin" ? "administrator" : "student";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || submitting) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      const data = await request<{
        token?: string; studentId?: string; teacherId?: string;
        userId?: string; userType?: string; districtId?: string; role?: string;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password, role: apiRole }),
      });

      if (!data.token) { setErrorMsg("Invalid email or password."); setSubmitting(false); return; }

      loginWithToken(data.token, {
        studentId: data.studentId,
        teacherId: data.teacherId ?? data.userId,
        userType: data.userType,
        districtId: data.districtId,
        role: data.role,
      });

      if (data.userType === "super_admin")      setLocation("/admin");
      else if (data.userType === "student")     setLocation("/home");
      else if (data.userType === "principal")   setLocation("/principal");
      else if (data.userType === "district_admin") setLocation("/district");
      else                                      setLocation("/teacher");
    } catch (err) {
      const details = (err instanceof ApiError ? err.data : null) as {
        details?: { requiresVerification?: boolean; requiresPasswordSetup?: boolean };
      } | null;

      if (err instanceof ApiError && err.status === 403 && details?.details?.requiresVerification) {
        setNeedsVerification(true);
        setNeedsPasswordSetup(false);
        setSubmitting(false);
        return;
      }
      if (err instanceof ApiError && err.status === 403 && details?.details?.requiresPasswordSetup) {
        setNeedsPasswordSetup(true);
        setNeedsVerification(false);
        setPassword("");
        setSubmitting(false);
        return;
      }
      setErrorMsg(
        err instanceof ApiError
          ? (err.data as { error?: string } | null)?.error ?? "Invalid email or password."
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const googleRole = role === "admin" ? "educator" : "student";
  const TABS: { id: Role; label: string }[] = [
    { id: "student", label: "Student" },
    { id: "admin",   label: "Administrator" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────── */}
      <div className="brand-panel-gradient hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <AppLogo href="/" imageClassName="h-12" />
        </div>

        {/* Central pitch */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              The fastest path to English proficiency.
            </h2>
            <p className="text-white/75 font-medium leading-relaxed">
              Adaptive exit prep that meets every student exactly at their level, every single day.
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white/90 font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/50 text-sm font-medium relative z-10">
          Access Ready
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <AppLogo href="/" imageClassName="h-8 lg:hidden" className="lg:hidden" />
            <BackButton to="/" />
          </div>
          <ThemeToggle />
        </div>

        {/* Form centred in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="heading-page text-3xl">Welcome back</h1>
              <p className="text-muted-foreground font-medium mt-1.5">Sign in to your account to continue.</p>
            </div>

            {/* Role switcher */}
            <div className="flex gap-1.5 bg-muted/60 p-1.5 rounded-xl mb-7">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setRole(t.id);
                    setErrorMsg("");
                    setNeedsVerification(false);
                    setNeedsPasswordSetup(false);
                    setPasswordSetupDone(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    role === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Email address"
                id="email"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setLocation(`/forgot-password?role=${apiRole}`)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <InputField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-2"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {needsVerification && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 space-y-2">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Email not verified</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Check your inbox for a verification link.{" "}
                    <button
                      type="button"
                      disabled={resendSent}
                      onClick={async () => {
                        await request("/api/auth/resend-verification", {
                          method: "POST",
                          body: JSON.stringify({ email: email.trim(), role: apiRole }),
                        }).catch(() => {});
                        setResendSent(true);
                      }}
                      className="font-bold text-primary hover:underline disabled:opacity-60"
                    >
                      {resendSent ? "Email sent" : "Resend email"}
                    </button>
                  </p>
                </div>
              )}

              {needsPasswordSetup && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Create your password</p>
                    <p className="text-sm text-muted-foreground">
                      {role === "admin"
                        ? "Your district created your account. Set a password below, or use the link in your invitation email. Then sign in again."
                        : "Set a password below, then sign in again with it."}
                    </p>
                  </div>
                  {
                    <>
                      <InputField
                        label="New password"
                        id="new-password"
                        type="password"
                        icon={Lock}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <InputField
                        label="Confirm password"
                        id="confirm-password"
                        type="password"
                        icon={Lock}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        disabled={
                          submitting ||
                          newPassword.length < 8 ||
                          newPassword !== confirmPassword
                        }
                        className="btn-brand w-full font-bold rounded-xl"
                        onClick={async () => {
                          setErrorMsg("");
                          setSubmitting(true);
                          try {
                            await request("/api/auth/set-initial-password", {
                              method: "POST",
                              body: JSON.stringify({
                                email: email.trim(),
                                password: newPassword,
                                role: apiRole,
                              }),
                            });
                            setNeedsPasswordSetup(false);
                            setNewPassword("");
                            setConfirmPassword("");
                            setErrorMsg("");
                            setPasswordSetupDone(true);
                          } catch (setupErr) {
                            setErrorMsg(extractErrorMessage(setupErr, "Could not save password."));
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save password"}
                      </Button>
                    </>
                  }
                </div>
              )}

              {passwordSetupDone && (
                <div className="rounded-xl bg-growth-green/10 border border-growth-green/30 px-4 py-3">
                  <p className="text-sm font-semibold text-growth-green">
                    Password saved. Sign in again with your email and new password.
                  </p>
                </div>
              )}

              {!needsVerification && !needsPasswordSetup && errorMsg && (
                <div className="rounded-xl bg-destructive/8 border border-destructive/30 px-4 py-3">
                  <p className="text-sm font-semibold text-destructive">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!email.trim() || !password.trim() || submitting}
                className="btn-brand w-full h-12 rounded-xl text-base disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Log in"}
              </button>
            </form>

            {googleEnabled && (
              <>
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <GoogleButton role={googleRole} />
              </>
            )}

            <p className="text-center text-sm text-muted-foreground font-medium mt-8">
              New to Access Ready?{" "}
              <button
                onClick={() => setLocation("/signup")}
                className="font-bold text-primary hover:underline"
              >
                Create an account
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
