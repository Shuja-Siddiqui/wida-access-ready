import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppInput } from "@/components/app-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useApi, ApiError } from "@/hooks/use-api";

type Step = "form" | "success" | "invalid";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { request } = useApi();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [step, setStep] = useState<Step>(token ? "form" : "invalid");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passwordsMatch = newPassword === confirmPassword;
  const passwordLongEnough = newPassword.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordLongEnough || !passwordsMatch || submitting) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      await request("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setStep("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setStep("invalid");
      } else {
        setErrorMsg(
          err instanceof ApiError
            ? (err.data as { error?: string } | null)?.error ?? "Something went wrong. Please try again."
            : "Something went wrong. Please try again.",
        );
      }
      setSubmitting(false);
    }
  };

  const eyeToggle = (
    <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
      className="text-muted-foreground hover:text-foreground transition-colors">
      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 right-0 p-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary border border-border/40 flex items-center justify-center mb-6">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <div className="bg-card border border-border/40 shadow-sm rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-6">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Set a new password</h1>
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
                    Choose a strong password
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <AppInput
                    label="New password"
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    icon={Lock}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    rightAddon={eyeToggle}
                    autoComplete="new-password"
                    autoFocus
                  />

                  <AppInput
                    label="Confirm password"
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
                    autoComplete="new-password"
                  />

                  {errorMsg && (
                    <div className="bg-destructive/10 border border-destructive p-3 rounded-xl">
                      <p className="text-sm font-bold text-destructive text-center">{errorMsg}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!passwordLongEnough || !passwordsMatch || !confirmPassword || submitting}
                    className="btn-brand w-full h-14 text-lg rounded-xl mt-6"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Reset password"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--growth-green))] border border-border/40 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">Password updated!</h2>
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">
                    Log in with your new password
                  </p>
                </div>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full h-14 text-lg font-bold bg-card text-foreground border border-border shadow-sm hover:bg-muted/60 transition-all rounded-xl mt-4"
                >
                  Go to log in
                </Button>
              </motion.div>
            )}

            {step === "invalid" && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--energy-orange))] border border-border/40 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">Link expired</h2>
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">
                    Request a new link
                  </p>
                </div>
                <Button
                  onClick={() => setLocation("/forgot-password")}
                  className="btn-brand w-full h-14 text-lg rounded-xl mt-6"
                >
                  Request a new link
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
