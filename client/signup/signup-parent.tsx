import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { AppInput } from "@/components/app-input";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackButton } from "@/components/back-button";
import { GoogleButton } from "@/components/google-button";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Lock, Eye, EyeOff, Check, Loader2, CheckCircle2 } from "lucide-react";
import { loadPendingGoogleAuth, clearPendingGoogleAuth } from "@/auth-callback/auth-callback";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -30 },
};

const FEATURES = [
  "See your child's progress any time",
  "Know when practice is happening",
  "Celebrate every level gained",
];

const BTN_CLS = "w-full h-12 rounded-xl font-bold text-white bg-gradient-to-br from-energy-orange to-[hsl(14_86%_45%)] shadow-[0_4px_14px_rgba(240,100,50,0.35)] hover:shadow-[0_6px_22px_rgba(240,100,50,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

export default function SignupParent() {
  const search       = useSearch();
  const isGoogleMode = new URLSearchParams(search).get("source") === "google";

  const [step, setStep]                       = useState(1);
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [isPending, setIsPending]             = useState(false);

  const [, setLocation]    = useLocation();
  const { loginWithToken } = useAuth();
  const { googleEnabled }  = useAuthConfig();
  const { request }        = useApi();

  const totalSteps = isGoogleMode ? 1 : 2;

  const completeGoogleProfile = async () => {
    const pending = loadPendingGoogleAuth();
    if (!pending) { setError("Session expired. Please try again."); return; }
    setError(""); setIsPending(true);
    try {
      await request("/api/auth/google/complete-profile/parent", {
        method: "POST",
        headers: { Authorization: `Bearer ${pending.token}` },
        body: JSON.stringify({}),
      });
      clearPendingGoogleAuth();
      loginWithToken(pending.token, { teacherId: pending.userId });
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err, "Something went wrong."));
      setIsPending(false);
    }
  };

  const createAccount = async () => {
    setError(""); setIsPending(true);
    try {
      await request("/api/auth/register/parent", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err, "Something went wrong."));
    } finally { setIsPending(false); }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (isGoogleMode) { await completeGoogleProfile(); return; }
      if (!name.trim()) return;
      setStep(2);
    } else if (step === 2) {
      if (!email.trim() || password.length < 8 || password !== confirmPassword) return;
      await createAccount();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setLocation("/signup");
  };

  const eyeToggle = (
    <button type="button" onClick={() => setShowPassword((v) => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors">
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(145deg, hsl(var(--energy-orange)) 0%, hsl(14 86% 45%) 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          <AppLogo href="/" imageClassName="h-12" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Stay connected to your child's progress.
            </h2>
            <p className="text-white/75 font-medium leading-relaxed">
              Know exactly where your child stands on their path to English proficiency.
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

        <p className="text-white/50 text-sm font-medium relative z-10">Built by Fugees Family, Inc.</p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <AppLogo href="/" imageClassName="h-8 lg:hidden" className="lg:hidden" />
            {step < 3 && <BackButton onClick={handleBack} />}
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            {step < 3 && (
              <div className="flex gap-2 mb-8">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-400"
                    style={{ background: step >= i ? "hsl(var(--energy-orange))" : "hsl(var(--muted))" }} />
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" {...slide} transition={{ duration: 0.22 }} className="space-y-6">
                  <div>
                    <h1 className="heading-page text-3xl">
                      {isGoogleMode ? "Almost there" : "About you"}
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1.5">
                      {isGoogleMode ? "Confirm your account details." : "Let's set up your parent account."}
                    </p>
                  </div>

                  {!isGoogleMode && (
                    <AppInput
                      label="Your name"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="First and last name"
                    />
                  )}

                  {googleEnabled && !isGoogleMode && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">or sign up with</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <GoogleButton role="parent" label="Continue with Google" />
                    </>
                  )}

                  {error && (
                    <div className="rounded-xl bg-destructive/8 border border-destructive/30 px-4 py-3">
                      <p className="text-sm font-semibold text-destructive">{error}</p>
                    </div>
                  )}

                  <button className={BTN_CLS} onClick={handleNext}
                    disabled={isGoogleMode ? isPending : !name.trim()}>
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isGoogleMode ? "Complete sign-up" : "Continue")}
                  </button>
                </motion.div>
              )}

              {step === 2 && !isGoogleMode && (
                <motion.div key="step2" {...slide} transition={{ duration: 0.22 }} className="space-y-6">
                  <div>
                    <h1 className="heading-page text-3xl">Create your login</h1>
                    <p className="text-muted-foreground font-medium mt-1.5">Choose an email and password.</p>
                  </div>

                  <div className="space-y-4">
                    <AppInput
                      label="Email address"
                      autoFocus
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                    <AppInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      rightAddon={eyeToggle}
                    />
                    <AppInput
                      label="Confirm password"
                      type={showPassword ? "text" : "password"}
                      icon={Lock}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      error={confirmPassword && confirmPassword !== password ? "Passwords don't match" : undefined}
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl bg-destructive/8 border border-destructive/30 px-4 py-3">
                      <p className="text-sm font-semibold text-destructive">{error}</p>
                    </div>
                  )}

                  <button className={BTN_CLS} onClick={handleNext}
                    disabled={!email.trim() || password.length < 8 || password !== confirmPassword || isPending}>
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create account"}
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" {...slide} transition={{ duration: 0.22 }} className="space-y-8 text-center">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, hsl(var(--energy-orange)), hsl(14 86% 45%))" }}>
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-foreground">
                      {isGoogleMode ? "You're all set" : "Check your inbox"}
                    </h2>
                    {isGoogleMode ? (
                      <p className="text-muted-foreground font-medium">
                        Your parent account is ready. We'll notify you when your child links their account.
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground font-medium">We sent a verification link to</p>
                        <p className="text-foreground font-bold text-lg">{email}</p>
                        <p className="text-muted-foreground text-sm font-medium">Click the link to activate your account.</p>
                      </>
                    )}
                  </div>
                  <button
                    className="w-full h-12 rounded-xl font-bold bg-card border border-border shadow-sm hover:bg-muted/60 transition-all"
                    onClick={() => setLocation("/login")}
                  >
                    Back to log in
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
