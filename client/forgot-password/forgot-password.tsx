import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InputField } from "@/components/input-field";
import { useApi } from "@/hooks/use-api";

type Step = "form" | "sent";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { request } = useApi();
  const role = new URLSearchParams(window.location.search).get("role") ?? "student";

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role }),
      });
      // Always show success — never reveal whether email exists.
      setStep("sent");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={() => setLocation("/login")}
          className="gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to log in
        </Button>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <AppLogo href="/" imageClassName="h-14" />
        </div>

        <div className="bg-card border border-border/40 shadow-sm rounded-2xl  p-8">
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
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Forgot password?</h1>
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
                    Enter your email to reset
                  </p>
                </div>

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
                    autoFocus
                  />

                  {errorMsg && (
                    <div className="bg-destructive/10 border border-destructive p-3 rounded-xl mt-4">
                      <p className="text-sm font-bold text-destructive text-center">{errorMsg}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!email.trim() || submitting}
                    className="btn-brand w-full h-14 text-lg rounded-xl mt-6"
                  >
                    {submitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--growth-green))] border border-border/40  flex items-center justify-center transform ">
                    <CheckCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">Check your email</h2>
                  <div className="bg-muted border border-border/40 p-4 rounded-xl ">
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">We sent a link to</p>
                    <p className="text-foreground text-base font-bold tracking-wide mt-1">{email}</p>
                  </div>
                  <p className="text-muted-foreground text-sm font-bold mt-4">
                    Don't see it? Check your spam folder.
                  </p>
                </div>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full h-14 text-lg font-bold bg-card text-foreground border border-border shadow-sm hover:bg-muted/60 transition-all rounded-xl mt-4"
                >
                  Back to log in
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
