import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";
import { PageLoader } from "@/components/loading-screen";

type Step = "verifying" | "success" | "invalid";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();
  const { request } = useApi();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [step, setStep] = useState<Step>(token ? "verifying" : "invalid");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    const verify = async () => {
      try {
        const data = await request<{
          ok?: boolean;
          token?: string;
          userType?: string;
          studentId?: string;
          teacherId?: string;
        }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);

        // If the server issued a session, log them in automatically
        if (data.token) {
          loginWithToken(data.token, {
            studentId: data.studentId,
            teacherId: data.teacherId,
          });
        }

        setStep("success");
      } catch {
        setStep("invalid");
      }
    };

    void verify();
  // loginWithToken/request intentionally excluded — neither is memoized and
  // must not re-trigger this effect. The ref guard ensures a single call per
  // mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const slide = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

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
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--growth-green))] border border-border/40  flex items-center justify-center mb-6 transform ">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground ">Email Verification</h1>
        </div>

        <div className="bg-card border border-border/40 shadow-sm rounded-2xl  p-8">
          <AnimatePresence mode="wait">
            {step === "verifying" && (
              <motion.div key="verifying" {...slide} className="flex flex-col items-center gap-6 py-6">
                <PageLoader />
                <p className="text-muted-foreground font-bold uppercase tracking-widest">Verifying your email</p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" {...slide} className="flex flex-col items-center gap-8 py-4">
                <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--growth-green))] border border-border/40  flex items-center justify-center transform ">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-bold text-foreground tracking-tight">Email verified!</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Your account is now active.
                  </p>
                </div>
                <Button
                  className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 rounded-xl mt-6 border-none"
                  onClick={() => setLocation("/home")}
                >
                  Start practicing
                </Button>
              </motion.div>
            )}

            {step === "invalid" && (
              <motion.div key="invalid" {...slide} className="flex flex-col items-center gap-8 py-4">
                <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--energy-orange))] border border-border/40  flex items-center justify-center transform ">
                  <AlertCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-bold text-foreground tracking-tight">Link expired</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Log in to request a new one.
                  </p>
                </div>
                <Button
                  className="w-full h-14 text-lg font-bold bg-card text-foreground border border-border shadow-sm hover:bg-muted/60 transition-all rounded-xl mt-4"
                  onClick={() => setLocation("/login")}
                >
                  Go to log in
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
